const API_BASE = 'https://mini.vooqqqm.com/api';
const TIME_OPTIONS = ['全部时间', '3天内', '7天内', '14天内', '30天内'];
const BANK_FILTER_OPTIONS = ['全部', '工商银行', '农业银行', '建设银行', '中国银行', '其他银行', '信用卡返现', '固定活动', '每日签到', '重点推荐'];

const state = {
  campaigns: [],
  filtered: [],
  view: 'all',
  bank: '全部',
  time: '全部时间',
  keyword: ''
};

const els = {
  loading: document.getElementById('loadingState'),
  error: document.getElementById('errorState'),
  empty: document.getElementById('emptyState'),
  grid: document.getElementById('cardGrid'),
  resultSummary: document.getElementById('resultSummary'),
  listTitle: document.getElementById('listTitle'),
  searchInput: document.getElementById('searchInput'),
  refreshBtn: document.getElementById('refreshBtn'),
  toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
  filtersPanel: document.getElementById('filtersPanel'),
  bankFilters: document.getElementById('bankFilters'),
  timeFilters: document.getElementById('timeFilters'),
  viewTabs: document.getElementById('viewTabs')
};

function parseDate(str) {
  if (!str) return null;
  let s = String(str).trim().replace(/-/g, '/');
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) s += ' 00:00:00';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getSortTime(item) {
  const cand = item.updatedAt || item.createdAt || item.validFrom || item.validTo;
  const d = parseDate(cand);
  if (d) return d.getTime();
  const n = Number(item.id);
  return Number.isNaN(n) ? 0 : n;
}

function isExpired(validTo) {
  const d = parseDate(validTo);
  if (!d) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return d.getTime() < todayStart.getTime();
}

function isSoon(validTo, days = 3) {
  const d = parseDate(validTo);
  if (!d) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const diff = d.getTime() - todayStart.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function hasCreditTag(item) {
  const raw = item.tags || [];
  const list = Array.isArray(raw) ? raw : String(raw).split(/[，,]/);
  return list.some((tag) => {
    const t = String(tag).trim();
    return t.includes('信用卡') || t.includes('刷卡') || t.includes('返现') || t.includes('卡片');
  });
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (!tags) return [];
  return String(tags).split(/[，,]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeCampaign(item) {
  const normalizedTags = normalizeTags(item.tags);
  return {
    ...item,
    tags: normalizedTags,
    isCredit: hasCreditTag({ ...item, tags: normalizedTags }),
    isRecurring: Number(item.isRecurring) === 1 || !!item.recurringText,
    isExpired: isExpired(item.validTo),
    isSoon: !isExpired(item.validTo) && isSoon(item.validTo),
    sortTime: getSortTime(item)
  };
}

function compareCampaign(a, b) {
  const ea = a.isExpired ? 1 : 0;
  const eb = b.isExpired ? 1 : 0;
  if (ea !== eb) return ea - eb;
  return b.sortTime - a.sortTime;
}

function setLoadingState({ loading = false, error = false, empty = false } = {}) {
  els.loading.classList.toggle('hidden', !loading);
  els.error.classList.toggle('hidden', !error);
  els.empty.classList.toggle('hidden', !empty);
}

function renderBankFilters() {
  els.bankFilters.innerHTML = '';
  BANK_FILTER_OPTIONS.forEach((bank) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip ${state.bank === bank ? 'is-active' : ''}`;
    button.textContent = bank;
    button.addEventListener('click', () => {
      state.bank = bank;
      renderBankFilters();
      applyFilters();
    });
    els.bankFilters.appendChild(button);
  });
}

function renderTimes() {
  els.timeFilters.innerHTML = '';
  TIME_OPTIONS.forEach((time) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip ${state.time === time ? 'is-active' : ''}`;
    button.textContent = time;
    button.addEventListener('click', () => {
      state.time = time;
      renderTimes();
      applyFilters();
    });
    els.timeFilters.appendChild(button);
  });
}

function renderCards() {
  els.grid.innerHTML = '';

  state.filtered.forEach((item) => {
    const card = document.createElement('a');
    const cardTone = item.isCredit ? 'tone-credit' : item.isRecurring ? 'tone-recurring' : 'tone-default';
    card.className = `campaign-card ${cardTone} ${item.isExpired ? 'is-expired' : ''}`;
    card.href = `./detail.html?id=${encodeURIComponent(item.id)}`;

    const badges = [];
    item.tags.forEach((tag) => {
      badges.push(`<span class="badge tag">${escapeHtml(tag)}</span>`);
    });
    if (item.isRecurring) {
      badges.push('<span class="badge recurring">循环活动</span>');
    }
    if (item.isExpired) {
      badges.push('<span class="badge expired">已过期</span>');
    } else if (item.isSoon) {
      badges.push('<span class="badge soon">快到期</span>');
    }

    card.innerHTML = `
      <div class="card-head">
        <div class="card-bank">${escapeHtml(item.bankName || '银行活动')}</div>
        <div class="badge-row">${badges.join('')}</div>
      </div>
      <h3 class="card-title">${escapeHtml(item.title || '未命名活动')}</h3>
      <p class="card-desc">${escapeHtml(item.desc || '暂无活动描述')}</p>
      <div class="card-meta">
        <span>有效期：${escapeHtml(item.validFrom || '--')} 至 ${escapeHtml(item.validTo || '--')}</span>
        <span>${escapeHtml(item.channel || item.cashbackRate || '--')}</span>
      </div>
      <div class="card-actions">
        <span class="primary-btn card-entry">查看详情</span>
      </div>
    `;

    els.grid.appendChild(card);
  });
}

function applyFilters() {
  let result = state.campaigns.slice();

  if (state.view === 'credit') {
    result = result.filter((item) => item.isCredit);
  }

  if (state.keyword.trim()) {
    const kw = state.keyword.trim();
    result = result.filter((item) => {
      return `${item.title || ''} ${item.desc || ''} ${item.bankName || ''}`.includes(kw);
    });
  }

  if (state.bank !== '全部') {
    result = result.filter((item) => matchesBankFilter(item, state.bank));
  }

  if (state.time !== '全部时间') {
    const days = Number.parseInt(state.time, 10);
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    result = result.filter((item) => {
      const d = parseDate(item.updatedAt || item.createdAt || item.validFrom || item.validTo);
      return !d || d.getTime() >= threshold;
    });
  }

  result.sort(compareCampaign);
  state.filtered = result;

  els.listTitle.textContent = state.view === 'credit' ? '信用卡活动 · 专属专区' : '发现 · 全部活动';
  els.resultSummary.textContent = `共 ${result.length} 条活动，和“好羊毛助手Pro”微信小程序保持实时数据。`;

  setLoadingState({ empty: !result.length });
  renderCards();
}

function bindEvents() {
  els.searchInput.addEventListener('input', (event) => {
    state.keyword = event.target.value || '';
    applyFilters();
  });

  els.refreshBtn.addEventListener('click', () => {
    fetchCampaigns();
  });

  els.toggleFiltersBtn.addEventListener('click', () => {
    const isCollapsed = els.filtersPanel.classList.toggle('is-collapsed');
    els.toggleFiltersBtn.textContent = isCollapsed ? '展开筛选' : '收起筛选';
  });

  els.viewTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (!button) return;

    state.view = button.dataset.view;
    state.bank = '全部';

    Array.from(els.viewTabs.querySelectorAll('.segmented-btn')).forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });

    renderBankFilters();
    applyFilters();
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-nav-view]');
    if (!link) return;

    event.preventDefault();
    const targetView = link.dataset.navView;
    if (!targetView || !els.viewTabs) return;

    state.view = targetView;
    state.bank = '全部';

    Array.from(els.viewTabs.querySelectorAll('.segmented-btn')).forEach((item) => {
      item.classList.toggle('is-active', item.dataset.view === targetView);
    });

    renderBankFilters();
    applyFilters();

    const targetId = link.getAttribute('href');
    if (targetId && targetId.startsWith('./index.html#')) {
      const anchor = document.querySelector(targetId.replace('./index.html', ''));
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

async function fetchCampaigns() {
  setLoadingState({ loading: true, error: false, empty: false });
  els.grid.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/campaigns.php`, { credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    state.campaigns = Array.isArray(data) ? data.map(normalizeCampaign).sort(compareCampaign) : [];
    renderBankFilters();
    renderTimes();
    applyFilters();
    setLoadingState({ loading: false, empty: !state.filtered.length });
  } catch (err) {
    console.error('加载活动失败', err);
    setLoadingState({ loading: false, error: true });
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function matchesBankFilter(item, selected) {
  const bankName = String(item.bankName || '');
  const tags = item.tags || [];

  if (selected === '工商银行') return bankName.includes('工商');
  if (selected === '农业银行') return bankName.includes('农业');
  if (selected === '建设银行') return bankName.includes('建设');
  if (selected === '中国银行') return bankName.includes('中国银行') && !bankName.includes('中国工商') && !bankName.includes('中国农业') && !bankName.includes('中国建设');
  if (selected === '其他银行') {
    return !bankName.includes('工商') && !bankName.includes('农业') && !bankName.includes('建设') && !(bankName.includes('中国银行') && !bankName.includes('中国工商') && !bankName.includes('中国农业') && !bankName.includes('中国建设'));
  }
  if (selected === '信用卡返现') return item.isCredit || tags.some((tag) => String(tag).includes('返现'));
  if (selected === '固定活动' || selected === '每日签到' || selected === '重点推荐') {
    return tags.includes(selected);
  }

  return true;
}

bindEvents();
renderTimes();
fetchCampaigns();
