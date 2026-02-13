import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { load } from 'cheerio';

const DEFAULT_CHANNEL_URL = 'https://t.me/s/v2ray_dalghak';
const DEFAULT_MESSAGE_COUNT = 100;
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const DEFAULT_NORMAL_OUTPUT_PATH = path.join(process.cwd(), 'normal.txt');
const DEFAULT_SUB_OUTPUT_PATH = path.join(process.cwd(), 'sub.txt');
const SPLIT_PROTOCOLS = ['vless', 'vmess', 'trojan'];
const MAX_PAGE_FETCHES = 20;
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

const parseMessageId = (post) => {
  if (!post) {
    return null;
  }

  const [messageId] = post.split('/').slice(-1);
  const numericId = Number.parseInt(messageId, 10);
  return Number.isInteger(numericId) ? numericId : null;
};

const extractMessagesFromPage = (html) => {
  const $ = load(html);
  const messageNodes = $('.tgme_widget_message_wrap');

  if (!messageNodes.length) {
    return { messages: [], oldestMessageId: null };
  }

  const messages = [];
  let oldestMessageId = null;

  for (const node of messageNodes.toArray()) {
    const messageNode = $(node).find('.tgme_widget_message').first();
    const textNode = $(node).find('.tgme_widget_message_text').first();

    if (textNode.length) {
      const normalized = normalizeMessage(textNode.html() ?? '');

      if (normalized) {
        messages.push(normalized);
      }
    }

    const post = messageNode.attr('data-post') ?? $(node).attr('data-post');
    const messageId = parseMessageId(post);

    if (messageId !== null && (oldestMessageId === null || messageId < oldestMessageId)) {
      oldestMessageId = messageId;
    }
  }

  return { messages, oldestMessageId };
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

const getProtocolFromLink = (link) => {
  const separatorIndex = link.indexOf('://');

  if (separatorIndex === -1) {
    return null;
  }

  return link.slice(0, separatorIndex).toLowerCase();
};

const sanityCheck = (normalContent, subContent) => {
  const decoded = Buffer.from(subContent, 'base64').toString('utf8');
  return decoded === normalContent;
};

const fetchHtml = async (channelUrl) => {
  const response = await fetch(channelUrl, {
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
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

const writeSplitByProtocolOutputs = async (links) => {
  const splitDirPath = path.join(process.cwd(), 'splitted-by-protocol');
  await fs.mkdir(splitDirPath, { recursive: true });

  for (const protocol of SPLIT_PROTOCOLS) {
    const protocolLinks = links.filter((link) => getProtocolFromLink(link) === protocol);
    const { normalContent, subContent } = buildOutputs(protocolLinks);

    await fs.writeFile(path.join(splitDirPath, `${protocol}.txt`), normalContent, 'utf8');
    await fs.writeFile(path.join(splitDirPath, `sub-${protocol}.txt`), subContent, 'utf8');
  }
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

const fetchMessages = async (channelUrl, messageCount) => {
  const collected = [];
  const seenMessages = new Set();
  let beforeId = null;

  for (let page = 0; page < MAX_PAGE_FETCHES && collected.length < messageCount; page += 1) {
    const pageUrl = beforeId === null ? channelUrl : `${channelUrl}?before=${beforeId}`;
    const html = await fetchHtml(pageUrl);
    const { messages, oldestMessageId } = extractMessagesFromPage(html);

    if (!messages.length) {
      break;
    }

    let newItemsCount = 0;

    for (const message of messages) {
      if (seenMessages.has(message)) {
        continue;
      }

      seenMessages.add(message);
      collected.push(message);
      newItemsCount += 1;

      if (collected.length >= messageCount) {
        break;
      }
    }

    if (oldestMessageId === null || beforeId === oldestMessageId || newItemsCount === 0) {
      break;
    }

    beforeId = oldestMessageId;
  }

  if (!collected.length) {
    throw new Error('No non-empty messages extracted.');
  }

  return collected.slice(0, messageCount);
};

const main = async () => {
  try {
    const { channelUrl, messageCount } = resolveOptions();
    const messages = await fetchMessages(channelUrl, messageCount);
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
    await writeSplitByProtocolOutputs(links);
    console.log(`Wrote ${links.length} links to normal.txt, sub.txt, and protocol-split outputs.`);
  } catch (error) {
    console.error('Failed to generate subscription outputs.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

await main();
