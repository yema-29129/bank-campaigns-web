'use strict';

const el = Object.fromEntries([
  'login-panel', 'login-form', 'username', 'password', 'logout', 'catalogue', 'search',
  'refresh', 'count', 'offers', 'status', 'retry', 'confirm-dialog', 'confirm-offer'
].map(id => [id, document.getElementById(id)]));

let csrf = '';
let offers = [];
let selected = null;
let busy = false;
let writesEnabled = false;

function status(message, error = false) {
  el.status.textContent = message;
  el.status.dataset.error = String(error);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }
  const result = await fetch(path, { ...options, headers, cache: 'no-store', credentials: 'same-origin' });
  const data = await result.json().catch(() => ({}));
  if (!result.ok) {
    const error = new Error(data.message || '请求失败，请稍后重试。');
    error.status = result.status;
    throw error;
  }
  return data;
}

function showLogin(message = '') {
  csrf = '';
  offers = [];
  writesEnabled = false;
  el.offers.replaceChildren();
  el['login-panel'].hidden = false;
  el.catalogue.hidden = true;
  el.logout.hidden = true;
  el.retry.hidden = true;
  status(message);
}

function render() {
  const query = el.search.value.trim().toLocaleLowerCase();
  const items = offers.filter(item =>
    [item.title, item.merchant, item.market, item.id].join(' ').toLocaleLowerCase().includes(query));
  el.count.textContent = query ? `显示 ${items.length} / ${offers.length} 条` : `共 ${offers.length} 条网页专属黑五活动`;
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const row = document.createElement('li');
    const details = document.createElement('div');
    const link = document.createElement('a');
    link.href = 'https://bank.vooqqqm.com/detail.html?web=' + encodeURIComponent(item.id);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.title;
    const meta = document.createElement('p');
    meta.className = 'muted';
    meta.textContent = [item.merchant, item.market, item.until ? `至 ${item.until}` : ''].filter(Boolean).join(' · ');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'remove';
    button.textContent = '删除';
    button.setAttribute('aria-label', `删除 ${item.title}`);
    button.disabled = busy || !writesEnabled;
    button.addEventListener('click', () => {
      selected = item;
      el['confirm-offer'].textContent = item.title;
      el['confirm-dialog'].returnValue = '';
      el['confirm-dialog'].showModal();
    });
    details.append(link, meta);
    row.append(details, button);
    fragment.append(row);
  }
  el.offers.replaceChildren(fragment);
}

async function load() {
  el.retry.hidden = true;
  el.refresh.disabled = true;
  try {
    const data = await request('api/offers');
    offers = data.offers;
    writesEnabled = data.writesEnabled;
    render();
    return true;
  } catch (error) {
    if (error.status === 401) showLogin(error.message);
    else {
      status(error.message, true);
      el.retry.hidden = false;
    }
    return false;
  } finally {
    el.refresh.disabled = false;
  }
}

async function start() {
  try {
    const session = await request('/api/auth/session');
    csrf = session.csrfToken;
    el['login-panel'].hidden = true;
    el.catalogue.hidden = false;
    el.logout.hidden = false;
    status('正在读取最新网页目录…');
    if (await load()) status(writesEnabled ? '' : '当前为只读，网页提交权限尚未启用。');
  } catch (error) {
    if (error.status === 401) showLogin();
    else {
      status(error.message, true);
      el.retry.hidden = false;
    }
  }
}

el['login-form'].addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  try {
    await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: el.username.value, password: el.password.value })
    });
    await start();
  } catch (error) {
    status(error.message, true);
  } finally {
    el.password.value = '';
    button.disabled = false;
  }
});

el.logout.addEventListener('click', async () => {
  try {
    await request('/api/auth/logout', { method: 'POST', body: '{}' });
    showLogin('已退出。');
  } catch (error) {
    if (error.status === 401) showLogin();
    else status(error.message, true);
  }
});

async function verifyPublished(item) {
  for (let attempt = 0; attempt < 10 && csrf; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 6000));
    if (!csrf) return;
    const data = await request('api/status?id=' + encodeURIComponent(item.id));
    if (data.removed) {
      status(`已确认网页下架「${item.title}」。`);
      return;
    }
  }
  if (csrf) status(`已提交「${item.title}」的下架，等待网页部署完成。`);
}

el['confirm-dialog'].addEventListener('close', async () => {
  const item = selected;
  selected = null;
  if (el['confirm-dialog'].returnValue !== 'delete' || !item || busy) return;
  busy = true;
  render();
  status(`正在提交「${item.title}」的下架…`);
  try {
    await request('api/delete', {
      method: 'POST', body: JSON.stringify({ id: item.id, revision: item.revision })
    });
    offers = offers.filter(offer => offer.id !== item.id);
    render();
    status(`已提交「${item.title}」的下架，正在等待网页部署…`);
    await verifyPublished(item).catch(error => {
      if (error.status === 401) showLogin('下架已提交，请重新登录。');
      else status(`已提交「${item.title}」的下架，暂时无法确认网页部署状态。`);
    });
  } catch (error) {
    if (error.status === 401) showLogin(error.message);
    else {
      if ([404, 409].includes(error.status)) await load();
      status(error.message, true);
    }
  } finally {
    busy = false;
    render();
  }
});

el.search.addEventListener('input', render);
el.refresh.addEventListener('click', async () => {
  if (await load() && !busy) status(writesEnabled ? '' : '当前为只读，网页提交权限尚未启用。');
});
el.retry.addEventListener('click', start);
start();
