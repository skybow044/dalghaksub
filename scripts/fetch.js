import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { load } from 'cheerio';

const DEFAULT_CHANNEL_URL = 'https://t.me/s/v2ray_dalghak';
const DEFAULT_MESSAGE_COUNT = 100;
const DEFAULT_NORMAL_OUTPUT_PATH = path.join(process.cwd(), 'normal.txt');
const DEFAULT_SUB_OUTPUT_PATH = path.join(process.cwd(), 'sub.txt');
const SHARE_LINK_REGEX = /^\s*(vmess|vless|trojan|ss|ssr):\/\/\S+/gim;
const VMESS_BASE64_REGEX = /^[A-Za-z0-9+/=_-]+$/;

const isValidVmessLegacyLink = (link) => {
  const payload = link.slice('vmess://'.length).split(/[?#]/, 1)[0].trim();

  if (!payload) {
    return false;
  }

  return VMESS_BASE64_REGEX.test(payload);
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

const isValidHostPortLink = (link) => {
  const atIndex = link.indexOf('@');

  if (atIndex === -1) {
    return false;
  }

  const afterAt = link.slice(atIndex + 1);
  const stopIndex = afterAt.search(/[?#]/);
  const hostPort = stopIndex === -1 ? afterAt : afterAt.slice(0, stopIndex);
  const colonIndex = hostPort.lastIndexOf(':');

  if (colonIndex <= 0 || colonIndex >= hostPort.length - 1) {
    return false;
  }

  return true;
};

const isValidShareLink = (link) => {
  const protocol = link.slice(0, link.indexOf('://')).toLowerCase();

  if (protocol === 'ss' || protocol === 'ssr') {
    return true;
  }

  if (protocol === 'vmess') {
    return isValidHostPortLink(link) || isValidVmessLegacyLink(link);
  }

  return isValidHostPortLink(link);
};

const extractShareLinks = (messages) => {
  const text = messages.join('\n');
  const matches = [...text.matchAll(SHARE_LINK_REGEX)].map((match) => match[0].trim());

  if (!matches.length) {
    return [];
  }

  const seen = new Set();
  const deduped = [];

  for (const link of matches) {
    if (!isValidShareLink(link)) {
      continue;
    }

    if (seen.has(link)) {
      continue;
    }

    seen.add(link);
    deduped.push(link);
  }

  return deduped;
};

const appendUniqueNames = (links) =>
  links.map((link, index) => {
    const hashIndex = link.indexOf('#');
    const base = hashIndex === -1 ? link : link.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : link.slice(hashIndex + 1);

    let baseName = 'node';

    if (hash) {
      try {
        baseName = decodeURIComponent(hash);
      } catch {
        baseName = hash;
      }
    }

    const suffix = String(index + 1).padStart(2, '0');
    const name = `${baseName}-${suffix}`;
    return `${base}#${encodeURIComponent(name)}`;
  });

const buildOutputs = (links) => {
  const normalContent = `${links.join('\n')}\n`;
  const subContent = Buffer.from(normalContent, 'utf8').toString('base64');
  return { normalContent, subContent };
};

const sanityCheck = (normalContent, subContent) => {
  const decoded = Buffer.from(subContent, 'base64').toString('utf8');
  return decoded === normalContent;
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

const writeOutputs = async (normalContent, subContent) => {
  await fs.writeFile(DEFAULT_NORMAL_OUTPUT_PATH, normalContent, 'utf8');
  await fs.writeFile(DEFAULT_SUB_OUTPUT_PATH, subContent, 'utf8');
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
  const envCount = process.env.MESSAGE_COUNT?.trim();

  const channelUrl = cliArgs.channel ?? envChannel ?? DEFAULT_CHANNEL_URL;
  const countRaw = cliArgs.count ?? envCount ?? DEFAULT_MESSAGE_COUNT;
  const messageCount =
    typeof countRaw === 'number' ? countRaw : Number.parseInt(String(countRaw), 10);

  if (!channelUrl || typeof channelUrl !== 'string') {
    throw new Error('Invalid CHANNEL_URL: provide a non-empty string.');
  }

  if (!Number.isInteger(messageCount) || messageCount <= 0) {
    throw new Error('Invalid MESSAGE_COUNT: provide a positive integer.');
  }

  return {
    channelUrl,
    messageCount,
  };
};

const main = async () => {
  try {
    const { channelUrl, messageCount } = resolveOptions();
    const html = await fetchHtml(channelUrl);
    const messages = extractMessages(html, messageCount);
    const links = appendUniqueNames(extractShareLinks(messages));

    if (!links.length) {
      console.error('No valid share links found in extracted messages.');
      process.exit(1);
    }

    const { normalContent, subContent } = buildOutputs(links);

    if (!sanityCheck(normalContent, subContent)) {
      console.error('Sanity check failed: Base64 content does not decode to normal.txt payload.');
      process.exit(1);
    }

    await writeOutputs(normalContent, subContent);
    console.log(`Wrote ${links.length} links to normal.txt and sub.txt.`);
  } catch (error) {
    console.error('Failed to generate subscription outputs.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

await main();
