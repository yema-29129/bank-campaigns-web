#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const FEED_PATH = 'activities/feed.json';
const BLACK_FRIDAY_PATH = 'activities/topics/black-friday-2026.html';
const beforeSha = process.env.BEFORE_SHA || 'HEAD^';
const afterSha = process.env.AFTER_SHA || 'HEAD';
const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN || '');
const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const chatId = process.env.TELEGRAM_CHAT_ID || '';

const semanticFeedFields = [
  'title', 'summary', 'discount', 'institution', 'region', 'channel', 'cardType',
  'validFrom', 'validTo', 'status', 'offer', 'participation', 'url'
];

function readGitFile(revision, path) {
  if (!revision || /^0+$/.test(revision)) return '';
  try {
    return execFileSync('git', ['show', `${revision}:${path}`], {
      encoding: 'utf8',
      maxBuffer: 100 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch {
    return '';
  }
}

function parseFeed(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed.activities || []);
  } catch (error) {
    throw new Error(`无法解析 ${FEED_PATH}: ${error.message}`);
  }
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function plainText(html) {
  return decodeHtml(String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

function parseBlackFriday(raw) {
  const offers = [];
  const itemPattern = /<li\b([^>]*\bdata-campaign\b[^>]*\bdata-website-only\b[^>]*)>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = itemPattern.exec(raw || ''))) {
    const attrs = match[1];
    const body = match[2];
    const paragraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((entry) => plainText(entry[1]));
    const firstLink = body.match(/<a\b[^>]*href=["']([^"']+)["']/i);
    offers.push({
      id: `black-friday:${attrValue(attrs, 'id')}`,
      title: plainText(body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1]),
      summary: paragraphs[1] || '',
      institution: attrValue(attrs, 'data-merchant'),
      region: attrValue(attrs, 'data-market'),
      validFrom: attrValue(attrs, 'data-valid-from'),
      validTo: attrValue(attrs, 'data-valid-to'),
      status: 'current',
      url: firstLink?.[1] || '',
      siteUrl: `https://bank.vooqqqm.com/${BLACK_FRIDAY_PATH}#${attrValue(attrs, 'id')}`
    });
  }
  return offers.filter((offer) => offer.id !== 'black-friday:' && offer.title);
}

function normalizedRecord(item, fields = semanticFeedFields) {
  return JSON.stringify(Object.fromEntries(fields.map((field) => [field, item?.[field] ?? ''])));
}

function diffRecords(beforeItems, afterItems, source) {
  const before = new Map(beforeItems.map((item) => [String(item.id), item]));
  const after = new Map(afterItems.map((item) => [String(item.id), item]));
  const changes = [];

  for (const [id, item] of after) {
    if (!before.has(id)) {
      changes.push({ type: '新增', source, item });
    } else if (normalizedRecord(before.get(id)) !== normalizedRecord(item)) {
      changes.push({ type: '更新', source, item });
    }
  }
  for (const [id, item] of before) {
    if (!after.has(id)) changes.push({ type: '下线', source, item });
  }
  return changes;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function compact(value, max = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatChange(change) {
  const item = change.item;
  const metadata = [
    item.institution,
    (item.validFrom || item.validTo) ? `${item.validFrom || '--'} 至 ${item.validTo || '--'}` : '',
    item.region
  ].filter(Boolean).join(' · ');
  const description = compact(item.summary || item.discount || item.offer || '活动信息已更新');
  const url = item.siteUrl || item.url || (item.id ? `https://bank.vooqqqm.com/activities/${item.id}.html` : '');
  return [
    `<b>${escapeHtml(change.type)}活动</b>｜${escapeHtml(item.title || '未命名活动')}`,
    metadata ? escapeHtml(metadata) : '',
    description ? escapeHtml(description) : '',
    url ? `<a href="${escapeHtml(url)}">查看活动详情</a>` : ''
  ].filter(Boolean).join('\n');
}

function splitMessages(changes, maxLength = 3900) {
  const blocks = changes.map(formatChange);
  const messages = [];
  let current = '<b>羊毛助手 · 活动更新</b>\n\n';
  for (const block of blocks) {
    const candidate = `${current}${current.endsWith('\n\n') ? '' : '\n\n'}${block}`;
    if (candidate.length > maxLength && current.trim()) {
      messages.push(current.trim());
      current = `<b>羊毛助手 · 活动更新（续）</b>\n\n${block}`;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) messages.push(current.trim());
  return messages;
}

async function sendTelegram(text) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(`Telegram 发送失败：${payload.description || `HTTP ${response.status}`}`);
  }
}

const beforeFeed = parseFeed(readGitFile(beforeSha, FEED_PATH));
const afterFeed = parseFeed(readGitFile(afterSha, FEED_PATH));
const beforeBlackFriday = parseBlackFriday(readGitFile(beforeSha, BLACK_FRIDAY_PATH));
const afterBlackFriday = parseBlackFriday(readGitFile(afterSha, BLACK_FRIDAY_PATH));

const changes = [
  ...diffRecords(beforeFeed, afterFeed, '公开活动目录'),
  ...diffRecords(beforeBlackFriday, afterBlackFriday, '黑五专题')
];

if (!changes.length) {
  console.log('没有检测到活动新增、实质更新或下线，无需发送 Telegram 通知。');
  process.exit(0);
}

const messages = splitMessages(changes);
console.log(`检测到 ${changes.length} 项活动变化，将生成 ${messages.length} 条 Telegram 消息。`);

if (dryRun) {
  messages.forEach((message, index) => console.log(`\n--- DRY RUN ${index + 1}/${messages.length} ---\n${message}`));
  process.exit(0);
}

if (!botToken || !chatId) {
  throw new Error('缺少 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID，未发送任何消息。');
}

for (const message of messages) {
  await sendTelegram(message);
}
console.log(`已向 Telegram 发送 ${messages.length} 条消息，覆盖 ${changes.length} 项活动变化。`);
