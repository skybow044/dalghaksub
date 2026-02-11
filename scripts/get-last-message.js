import fs from 'node:fs/promises';
import process from 'node:process';
import { load } from 'cheerio';

const DEFAULT_CHANNEL = 'v2ray_dalghak';

const parseArgs = (argv) => {
  const options = { channel: DEFAULT_CHANNEL };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--channel' && argv[i + 1]) {
      options.channel = argv[i + 1].replace(/^@/, '');
      i += 1;
    } else if (arg.startsWith('--channel=')) {
      options.channel = arg.slice('--channel='.length).replace(/^@/, '');
    }
  }

  return options;
};

const fetchLastMessage = async (channel) => {
  const url = `https://t.me/s/${channel}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}. status=${response.status}`);
  }

  const html = await response.text();
  const $ = load(html);
  const wrap = $('.tgme_widget_message_wrap').first();

  if (!wrap.length) {
    throw new Error('No messages found in channel page.');
  }

  const messageText = wrap.find('.tgme_widget_message_text').first().text().trim();
  const messageLink = wrap.find('.tgme_widget_message_date').attr('href') ?? null;

  if (!messageText) {
    throw new Error('Latest message has no text content.');
  }

  return {
    channel,
    messageText,
    messageLink,
  };
};

const fallbackFromLocal = async () => {
  const normal = await fs.readFile('normal.txt', 'utf8');
  const firstLine = normal.split(/\r?\n/).find((line) => line.trim());

  if (!firstLine) {
    throw new Error('normal.txt is empty; no local fallback available.');
  }

  return {
    from: 'local-normal.txt',
    latestKnownLine: firstLine,
  };
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));

  try {
    const result = await fetchLastMessage(options.channel);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Live fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    const fallback = await fallbackFromLocal();
    console.log(JSON.stringify(fallback, null, 2));
    process.exitCode = 2;
  }
};

await main();
