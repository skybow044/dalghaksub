import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { load } from 'cheerio';
import maxmind from 'maxmind';

const DEFAULT_CHANNEL_URL = 'https://t.me/s/v2ray_dalghak';
const DEFAULT_OUTPUT_PATH = path.join(process.cwd(), 'sub.txt');
const DEFAULT_MESSAGE_COUNT = 100;
const MESSAGE_SEPARATOR = '\n\n-----\n\n';
const DEFAULT_MAXMIND_DB_URL =
  'https://github.com/P3TERX/GeoLite.mmdb/releases/download/2026.01.31/GeoLite2-Country.mmdb';
const DEFAULT_MAXMIND_DB_PATH = path.join(process.cwd(), 'data', 'GeoLite2-Country.mmdb');
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const CONFIG_LINE_REGEX = /^(?:vless|vmess|trojan|ss):\/\//i;
const FLAG_TAG_SUFFIX = 't.me/v2ray_dalghak';
const DEFAULT_FLAG = '🏁';

const isValidIp = (value) => {
  const parts = value.split('.').map((part) => Number(part));
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);
};

const ipCache = new Map();
let maxmindReader;
let maxmindFailed = false;

const countryCodeToFlag = (code) => {
  if (!code || code.length !== 2) {
    return null;
  }

  const base = 0x1f1e6;
  const chars = code.toUpperCase().split('');
  return String.fromCodePoint(base + chars[0].charCodeAt(0) - 65, base + chars[1].charCodeAt(0) - 65);
};

const ensureDatabase = async (dbPath, dbUrl) => {
  try {
    await fs.access(dbPath);
    return;
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  const response = await fetch(dbUrl);

  if (!response.ok) {
    throw new Error(`Failed to download MaxMind database. Status: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(dbPath, buffer);
};

const getMaxMindReader = async (dbPath, dbUrl) => {
  if (maxmindReader || maxmindFailed) {
    return maxmindReader;
  }

  try {
    await ensureDatabase(dbPath, dbUrl);
    maxmindReader = await maxmind.open(dbPath);
    return maxmindReader;
  } catch (error) {
    maxmindFailed = true;
    console.warn('MaxMind database unavailable; continuing without flags.');
    return null;
  }
};

const fetchCountryCode = async (ip, reader) => {
  if (ipCache.has(ip)) {
    return ipCache.get(ip);
  }

  if (!reader) {
    ipCache.set(ip, null);
    return null;
  }

  const record = reader.get(ip);
  const code = record?.country?.iso_code ?? record?.registered_country?.iso_code ?? null;
  ipCache.set(ip, code);
  return code;
};

const extractIps = (line) => {
  const matches = line.match(IP_REGEX) ?? [];
  return matches.filter(isValidIp);
};

const appendFlag = async (line, readerResolver) => {
  if (!CONFIG_LINE_REGEX.test(line)) {
    return line;
  }

  const [ip] = extractIps(line);

  if (!ip) {
    return line;
  }

  const reader = await readerResolver();
  const code = await fetchCountryCode(ip, reader);
  const flag = countryCodeToFlag(code);

  if (!flag || line.includes(`#[${flag}]`)) {
    return line;
  }

  return `${line}#[${flag}]${FLAG_TAG_SUFFIX}`;
};

const normalizeMessage = (html) => {
  const withBreaks = html.replace(/<br\s*\/?\s*>/gi, '\n');
  const $fragment = load(`<div>${withBreaks}</div>`);
  return $fragment('div').text().replace(/\r\n/g, '\n').trim();
};

const extractMessages = (html, messageCount) => {
  const $ = load(html);
  const messageNodes = $('.tgme_widget_message_text');

  if (!messageNodes.length) {
    throw new Error('No message nodes found in Telegram HTML.');
  }

  const messages = messageNodes
    .toArray()
    .map((node) => normalizeMessage($(node).html() ?? ''))
    .filter(Boolean);

  if (!messages.length) {
    throw new Error('No non-empty messages extracted.');
  }

  return messages.slice(-messageCount);
};

const annotateMessages = async (messages, readerResolver) => {
  const annotated = [];

  for (const message of messages) {
    const lines = message.split('\n');
    const updatedLines = [];

    for (const line of lines) {
      updatedLines.push(await appendFlag(line, readerResolver));
    }

    annotated.push(updatedLines.join('\n'));
  }

  return annotated;
};

const fetchHtml = async (channelUrl) => {
  const response = await fetch(channelUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${channelUrl}. Status: ${response.status}`);
  }

  return response.text();
};

const writeOutput = async (messages, outputPath) => {
  const content = `${messages.join(MESSAGE_SEPARATOR)}\n`;
  await fs.writeFile(outputPath, content, 'utf8');
};

const parseArgs = (args) => {
  const parsed = {};

  const readValue = (argName, value) => {
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argName}.`);
    }

    return value;
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg.startsWith('--channel=')) {
      parsed.channel = arg.slice('--channel='.length);
      continue;
    }

    if (arg === '--channel') {
      parsed.channel = readValue('--channel', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      parsed.output = arg.slice('--output='.length);
      continue;
    }

    if (arg === '--output') {
      parsed.output = readValue('--output', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith('--count=')) {
      parsed.count = arg.slice('--count='.length);
      continue;
    }

    if (arg === '--count') {
      parsed.count = readValue('--count', args[index + 1]);
      index += 1;
      continue;
    }
  }

  return parsed;
};

const resolveOptions = () => {
  const cliArgs = parseArgs(process.argv.slice(2));
  const envChannel = process.env.CHANNEL_URL?.trim();
  const envOutput = process.env.OUTPUT_PATH?.trim();
  const envCount = process.env.MESSAGE_COUNT?.trim();
  const envDbPath = process.env.MAXMIND_DB_PATH?.trim();
  const envDbUrl = process.env.MAXMIND_DB_URL?.trim();

  const channelUrl = cliArgs.channel ?? envChannel ?? DEFAULT_CHANNEL_URL;
  const outputPath = cliArgs.output ?? envOutput ?? DEFAULT_OUTPUT_PATH;
  const dbPath = envDbPath ?? DEFAULT_MAXMIND_DB_PATH;
  const dbUrl = envDbUrl ?? DEFAULT_MAXMIND_DB_URL;
  const countRaw = cliArgs.count ?? envCount ?? DEFAULT_MESSAGE_COUNT;
  const messageCount =
    typeof countRaw === 'number' ? countRaw : Number.parseInt(String(countRaw), 10);

  if (!channelUrl || typeof channelUrl !== 'string') {
    throw new Error('Invalid CHANNEL_URL: provide a non-empty string.');
  }

  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('Invalid OUTPUT_PATH: provide a non-empty string.');
  }

  if (!Number.isInteger(messageCount) || messageCount <= 0) {
    throw new Error('Invalid MESSAGE_COUNT: provide a positive integer.');
  }

  return {
    channelUrl,
    outputPath: path.isAbsolute(outputPath)
      ? outputPath
      : path.join(process.cwd(), outputPath),
    dbPath: path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath),
    dbUrl,
    messageCount,
  };
};

const main = async () => {
  try {
    const { channelUrl, outputPath, messageCount, dbPath, dbUrl } = resolveOptions();
    const readerResolver = () => getMaxMindReader(dbPath, dbUrl);
    const html = await fetchHtml(channelUrl);
    const messages = extractMessages(html, messageCount);
    const annotatedMessages = await annotateMessages(messages, readerResolver);
    await writeOutput(annotatedMessages, outputPath);
    console.log(`Wrote ${messages.length} messages to ${outputPath}.`);
  } catch (error) {
    console.error('Failed to generate sub.txt.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

await main();
