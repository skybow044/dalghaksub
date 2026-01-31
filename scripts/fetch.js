import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { load } from 'cheerio';

const CHANNEL_URL = 'https://t.me/s/v2ray_dalghak';
const OUTPUT_PATH = path.join(process.cwd(), 'sub.txt');
const MESSAGE_SEPARATOR = '\n\n-----\n\n';
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;

const countryCodeToFlag = (code) => {
  if (!code || code.length !== 2) return '';
  const chars = code.toUpperCase().split('');
  const points = chars.map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
};

const fetchCountryCode = async (ip, cache) => {
  if (cache.has(ip)) return cache.get(ip);
  const response = await fetch(`https://ipapi.co/${ip}/country_code/`, {
    headers: { 'User-Agent': 'dalghaksub/1.0' },
  });
  if (!response.ok) {
    console.warn(`Failed to resolve country for ${ip}: ${response.status}`);
    cache.set(ip, null);
    return null;
  }
  const code = (await response.text()).trim();
  if (!code || code.length !== 2) {
    cache.set(ip, null);
    return null;
  }
  cache.set(ip, code);
  return code;
};

const normalizeMessage = (html) => {
  const withBreaks = html.replace(/<br\s*\/?\s*>/gi, '\n');
  const $fragment = load(`<div>${withBreaks}</div>`);
  return $fragment('div').text().replace(/\r\n/g, '\n').trim();
};

const extractMessages = async (html) => {
  const $ = load(html);
  const messageNodes = $('.tgme_widget_message_text');

  if (!messageNodes.length) {
    throw new Error('No message nodes found in Telegram HTML.');
  }

  const cache = new Map();
  const messages = [];

  for (const node of messageNodes.toArray()) {
    const message = normalizeMessage($(node).html() ?? '');
    if (!message) continue;

    const ips = message.match(IP_REGEX) ?? [];
    let updated = message;

    for (const ip of new Set(ips)) {
      const countryCode = await fetchCountryCode(ip, cache);
      const flag = countryCodeToFlag(countryCode);
      if (flag) {
        updated = updated.replaceAll(ip, `${ip} ${flag}`);
      }
    }

    messages.push(updated);
  }

  if (!messages.length) {
    throw new Error('No non-empty messages extracted.');
  }

  return messages.slice(-10);
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
    const messages = await extractMessages(html);
    await writeOutput(messages);
    console.log(`Wrote ${messages.length} messages to ${OUTPUT_PATH}.`);
  } catch (error) {
    console.error('Failed to generate sub.txt.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

await main();
