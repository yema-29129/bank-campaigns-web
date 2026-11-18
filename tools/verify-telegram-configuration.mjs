#!/usr/bin/env node

const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const chatId = process.env.TELEGRAM_CHAT_ID || '';

if (!botToken || !chatId) {
  throw new Error('缺少 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID。');
}

async function callTelegram(method, body = {}) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(`${method} 失败：${payload.description || `HTTP ${response.status}`}`);
  }
  return payload.result;
}

const bot = await callTelegram('getMe');
const chat = await callTelegram('getChat', { chat_id: chatId });
const membership = await callTelegram('getChatMember', {
  chat_id: chatId,
  user_id: bot.id
});

if (['left', 'kicked'].includes(membership.status)) {
  throw new Error(`机器人 @${bot.username || bot.id} 尚未加入目标群。`);
}

if (chat.type === 'channel' && membership.status !== 'administrator') {
  throw new Error(`目标是频道，但机器人 @${bot.username || bot.id} 不是管理员，无法发布活动更新。`);
}

if (membership.status === 'restricted' && membership.can_send_messages === false) {
  throw new Error(`机器人 @${bot.username || bot.id} 已被限制发消息。`);
}

console.log([
  `Telegram 配置验证通过：@${bot.username || bot.id}`,
  `目标：${chat.title || chat.username || chat.id}`,
  `类型：${chat.type}`,
  `机器人状态：${membership.status}`
].join('；'));
