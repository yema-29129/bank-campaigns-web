#!/usr/bin/env node

const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const chatId = process.env.TELEGRAM_CHAT_ID || '';

if (!botToken || !chatId) {
  throw new Error('缺少 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID。');
}

const text = [
  '<b>✅ 羊毛助手Pro 活动更新通知已连接</b>',
  '',
  '这是一条配置测试消息。后续网站活动新增、实质更新或下线时，将自动发布通知。',
  '',
  '<a href="https://bank.vooqqqm.com/">打开羊毛助手·羊毛线报活动站</a>'
].join('\n');

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
  throw new Error(`Telegram 测试消息发送失败：${payload.description || `HTTP ${response.status}`}`);
}

console.log(`Telegram 测试消息发送成功，message_id=${payload.result.message_id}`);
