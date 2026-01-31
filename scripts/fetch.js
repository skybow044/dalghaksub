import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { load } from 'cheerio';

const CHANNEL_URL = 'https://t.me/s/v2ray_dalghak';
const OUTPUT_PATH = path.join(process.cwd(), 'sub.txt');
const MESSAGE_SEPARATOR = '\n\n-----\n\n';

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
    await writeOutput(messages);
    console.log(`Wrote ${messages.length} messages to ${OUTPUT_PATH}.`);
  } catch (error) {
    console.error('Failed to generate sub.txt.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

await main();
