import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { load } from 'cheerio';

const CHANNEL_URL = 'https://t.me/s/v2ray_dalghak';
const OUTPUT_PATH = path.join(process.cwd(), 'sub.txt');
const MESSAGE_SEPARATOR = '\n\n-----\n\n';
const GEOIP_ENDPOINT = 'http://ip-api.com/json';
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const CONFIG_LINE_REGEX = /^(?:vless|vmess|trojan|ss):\/\//i;
const FLAG_TAG_SUFFIX = 't.me/ConfigsHub';
const DEFAULT_FLAG = '🏁';

const isValidIp = (value) => {
  const parts = value.split('.').map((part) => Number(part));
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);
};

const ipCache = new Map();

const countryCodeToFlag = (code) => {
  if (!code || code.length !== 2) {
    return null;
  }

  const base = 0x1f1e6;
  const chars = code.toUpperCase().split('');
  return String.fromCodePoint(base + chars[0].charCodeAt(0) - 65, base + chars[1].charCodeAt(0) - 65);
};

const fetchCountryCode = async (ip) => {
  if (ipCache.has(ip)) {
    return ipCache.get(ip);
  }

  try {
    const response = await fetch(`${GEOIP_ENDPOINT}/${ip}?fields=status,countryCode`);

    if (!response.ok) {
      ipCache.set(ip, null);
      return null;
    }

    const data = await response.json();
    const code = data?.status === 'success' ? data.countryCode : null;
    ipCache.set(ip, code);
    return code;
  } catch (error) {
    ipCache.set(ip, null);
    return null;
  }
};

const extractIps = (line) => {
  const matches = line.match(IP_REGEX) ?? [];
  return matches.filter(isValidIp);
};

const appendFlag = async (line) => {
  if (!CONFIG_LINE_REGEX.test(line)) {
    return line;
  }

  const [ip] = extractIps(line);

  let flag = DEFAULT_FLAG;

  if (ip) {
    try {
      const code = await fetchCountryCode(ip);
      flag = countryCodeToFlag(code) ?? DEFAULT_FLAG;
    } catch (error) {
      flag = DEFAULT_FLAG;
    }
  }

  if (line.includes('#[') && line.includes(FLAG_TAG_SUFFIX)) {
    return line;
  }

  return `${line}#[${flag}]${FLAG_TAG_SUFFIX}`;
};

const normalizeMessage = (html) => {
  const withBreaks = html.replace(/<br\s*\/?\s*>/gi, '\n');
  const $fragment = load(`<div>${withBreaks}</div>`);
  return $fragment('div').text().replace(/\r\n/g, '\n').trim();
};

const extractMessages = (html) => {
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

  return messages.slice(-10);
};

const annotateMessages = async (messages) => {
  const annotated = [];

  for (const message of messages) {
    const lines = message.split('\n');
    const updatedLines = [];

    for (const line of lines) {
      updatedLines.push(await appendFlag(line));
    }

    annotated.push(updatedLines.join('\n'));
  }

  return annotated;
};

const splitByProtocol = (messages) => {
  const groups = {
    vless: [],
    vmess: [],
    trojan: [],
    ss: [],
  };

  for (const message of messages) {
    const lines = message.split('\n').map((line) => line.trim()).filter(Boolean);

    for (const line of lines) {
      if (!CONFIG_LINE_REGEX.test(line)) {
        continue;
      }

      const match = line.match(/^(vless|vmess|trojan|ss):\/\//i);
      const protocol = match?.[1]?.toLowerCase();

      if (protocol && groups[protocol]) {
        groups[protocol].push(line);
      }
    }
  }

  return groups;
};

const buildProtocolOutput = (groups) => {
  const order = ['vless', 'vmess', 'trojan', 'ss'];
  const sections = [];

  for (const protocol of order) {
    const lines = groups[protocol];
    if (!lines || !lines.length) {
      continue;
    }

    sections.push(`# ${protocol}`);
    sections.push(...lines);
  }

  return sections.join('\n');
};

const fetchHtml = async () => {
  const response = await fetch(CHANNEL_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${CHANNEL_URL}. Status: ${response.status}`);
  }

  return response.text();
};

const writeOutput = async (messages) => {
  const content = `${messages.join(MESSAGE_SEPARATOR)}\n`;
  await fs.writeFile(OUTPUT_PATH, content, 'utf8');
};

const main = async () => {
  try {
    const html = await fetchHtml();
    const messages = extractMessages(html);
    const annotatedMessages = await annotateMessages(messages);
    const grouped = splitByProtocol(annotatedMessages);
    const output = buildProtocolOutput(grouped);
    await writeOutput(output ? [output] : []);
    console.log(`Wrote ${messages.length} messages to ${OUTPUT_PATH}.`);
  } catch (error) {
    console.error('Failed to generate sub.txt.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

await main();
