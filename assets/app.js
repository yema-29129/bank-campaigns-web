const API_BASE = 'https://mini.vooqqqm.com/api';
const TIME_OPTIONS = ['全部时间', '今日新增', '3天内', '7天内', '14天内', '30天内'];
const BANK_FILTER_OPTIONS = ['全部', '工商银行', '农业银行', '建设银行', '中国银行', '其他银行', '信用卡返现', '固定活动', '每日签到', '重点推荐'];

const state = {
  campaigns: [],
  filtered: [],
  view: 'all',
  bank: '全部',
  time: '全部时间',
  keyword: '',
  showExpired: false,
  todayNewCount: 0
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

let todayEntryEl = null;

function isListPage() {
  return !!(els.grid && els.bankFilters && els.timeFilters);
}

function setMeta(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

function setHomeMeta() {
  const isCredit = state.view === 'credit';
  const title = isCredit
    ? '信用卡活动专区 | 信用卡返现 | 好羊毛银行活动站'
    : '银行立减金活动网站 | 微信立减金 | 信用卡返现 | 好羊毛银行活动站';
  const description = isCredit
    ? '查看信用卡返现、刷卡优惠、现金红包和信用卡活动，支持按银行、标签和时间快速筛选。'
    : '薅羊毛·银行/微信立减金/信用卡返现网站，实时更新微信立减金、返现、信用卡返现、信用卡活动、现金红包等信息。';

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
}

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

function isTodayAdded(item) {
  const d = parseDate(item.updatedAt || item.createdAt);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (!tags) return [];
  return String(tags)
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasCreditTag(item) {
  if (item && (item.isCredit === 1 || item.isCredit === true)) {
    return true;
  }

  const bankName = String(item.bankName || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();
  const desc = String(item.desc || '').toLowerCase();
  const channel = String(item.channel || '').toLowerCase();

  const tagsRaw = item.tags || [];
  const tagsText = Array.isArray(tagsRaw)
    ? tagsRaw.map((tag) => String(tag).toLowerCase()).join(' ')
    : String(tagsRaw).toLowerCase();

  const allText = `${bankName} ${title} ${desc} ${channel} ${tagsText}`;

  const keywords = [
    '信用卡',
    '刷卡',
    '返现',
    '卡片',
    'visa',
    'mastercard',
    '万事达',
    '运通',
    'american express',
    'amex',
    '银联',
    'apple pay',
    'google pay',
    'paywave',
    'paypass'
  ];

  return keywords.some((keyword) => allText.includes(keyword.toLowerCase()));
}

function normalizeCampaign(item) {
  const normalizedTags = normalizeTags(item.tags);
  const normalized = {
    ...item,
    tags: normalizedTags
  };

  return {
    ...normalized,
    isCredit: hasCreditTag(normalized),
    isRecurring: Number(normalized.isRecurring) === 1 || !!normalized.recurringText,
    isExpired: isExpired(normalized.validTo),
    isSoon: !isExpired(normalized.validTo) && isSoon(normalized.validTo),
    isTodayAdded: isTodayAdded(normalized),
    sortTime: getSortTime(normalized)
  };
}

function compareCampaign(a, b) {
  const ea = a.isExpired ? 1 : 0;
  const eb = b.isExpired ? 1 : 0;
  if (ea !== eb) return ea - eb;

  const na = a.isTodayAdded ? 0 : 1;
  const nb = b.isTodayAdded ? 0 : 1;
  if (na !== nb) return na - nb;

  return b.sortTime - a.sortTime;
}

function setLoadingState({ loading = false, error = false, empty = false } = {}) {
  if (els.loading) els.loading.classList.toggle('hidden', !loading);
  if (els.error) els.error.classList.toggle('hidden', !error);
  if (els.empty) els.empty.classList.toggle('hidden', !empty);
}

function injectRuntimeStyles() {
  if (document.getElementById('tmhzz-runtime-styles')) return;

  const style = document.createElement('style');
  style.id = 'tmhzz-runtime-styles';
  style.textContent = `
    .today-entry-web {
      margin: 12px 0;
      padding: 14px 16px;
      border-radius: 18px;
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border: 1px solid #fed7aa;
      color: #9a3412;
      box-shadow: 0 10px 22px rgba(249, 115, 22, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: transform 0.16s ease, box-shadow 0.16s ease;
    }

    .today-entry-web:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 28px rgba(249, 115, 22, 0.12);
    }

    .today-entry-web-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .today-entry-web-icon {
      font-size: 22px;
      line-height: 1;
      flex-shrink: 0;
    }

    .today-entry-web-texts {
      min-width: 0;
    }

    .today-entry-web-title {
      font-size: 18px;
      font-weight: 800;
      color: #c2410c;
      line-height: 1.2;
    }

    .today-entry-web-sub {
      margin-top: 4px;
      font-size: 13px;
      color: #9a3412;
      line-height: 1.45;
    }

    .today-entry-web-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .today-entry-web-count {
      padding: 6px 10px;
      border-radius: 999px;
      background: #fdba74;
      color: #7c2d12;
      font-size: 13px;
      font-weight: 800;
    }

    .today-entry-web-arrow {
      font-size: 28px;
      color: #c2410c;
      line-height: 1;
      opacity: 0.8;
    }

    .filters-swapped {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 28px;
      align-items: start;
    }

    .filters-swapped .filter-group {
      min-width: 0;
    }

    .filters-swapped .filter-group-time {
      order: 1;
    }

    .filters-swapped .filter-group-bank {
      order: 2;
    }

    @media (max-width: 900px) {
      .filters-swapped {
        grid-template-columns: 1fr;
        gap: 18px;
      }

      .filters-swapped .filter-group-time,
      .filters-swapped .filter-group-bank {
        order: initial;
      }
    }

    @media (max-width: 768px) {
      .today-entry-web {
        padding: 12px 14px;
        border-radius: 16px;
      }

      .today-entry-web-title {
        font-size: 16px;
      }

      .today-entry-web-sub {
        font-size: 12px;
      }

      .today-entry-web-count {
        font-size: 12px;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureTodayEntry() {
  if (!isListPage()) return null;
  if (todayEntryEl) return todayEntryEl;

  injectRuntimeStyles();

  todayEntryEl = document.createElement('div');
  todayEntryEl.className = 'today-entry-web';
  todayEntryEl.innerHTML = `
    <div class="today-entry-web-left">
      <div class="today-entry-web-icon">🕘</div>
      <div class="today-entry-web-texts">
        <div class="today-entry-web-title">今日新增</div>
        <div class="today-entry-web-sub">今天暂无新活动，也可以点我快速查看</div>
      </div>
    </div>
    <div class="today-entry-web-right">
      <div class="today-entry-web-count hidden"></div>
      <div class="today-entry-web-arrow">›</div>
    </div>
  `;

  todayEntryEl.addEventListener('click', () => {
    state.time = '今日新增';
    renderTimes();
    applyFilters();
    scrollToResults();
  });

  const searchWrap = els.searchInput ? els.searchInput.closest('.search-wrap') : null;
  if (searchWrap && searchWrap.parentNode) {
    searchWrap.parentNode.insertBefore(todayEntryEl, searchWrap);
  }

  return todayEntryEl;
}

function updateTodayEntry() {
  const el = ensureTodayEntry();
  if (!el) return;

  const countEl = el.querySelector('.today-entry-web-count');
  const subEl = el.querySelector('.today-entry-web-sub');

  state.todayNewCount = state.campaigns.filter((item) => item.isTodayAdded).length;

  if (state.todayNewCount > 0) {
    countEl.classList.remove('hidden');
    countEl.textContent = `${state.todayNewCount}条`;
    subEl.textContent = `今天有 ${state.todayNewCount} 条新活动，点我快速查看`;
  } else {
    countEl.classList.add('hidden');
    countEl.textContent = '';
    subEl.textContent = '今天暂无新活动，也可以点我快速查看';
  }
}

function swapFilterLayout() {
  if (!isListPage() || !els.filtersPanel || !els.bankFilters || !els.timeFilters) return;

  injectRuntimeStyles();

  const bankGroup = els.bankFilters.closest('.filter-group');
  const timeGroup = els.timeFilters.closest('.filter-group');

  if (!bankGroup || !timeGroup) return;

  els.filtersPanel.classList.add('filters-swapped');
  bankGroup.classList.add('filter-group-bank');
  timeGroup.classList.add('filter-group-time');

  if (timeGroup.previousElementSibling !== null) {
    els.filtersPanel.insertBefore(timeGroup, els.filtersPanel.firstChild);
  }
}

function renderBankFilters() {
  if (!els.bankFilters) return;

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
  if (!els.timeFilters) return;

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
  if (!els.grid) return;

  els.grid.innerHTML = '';
  const activeItems = state.filtered.filter((item) => !item.isExpired);
  const expiredItems = state.filtered.filter((item) => item.isExpired);

  activeItems.forEach((item) => {
    els.grid.appendChild(buildCard(item));
  });

  if (expiredItems.length) {
    const expiredSection = document.createElement('section');
    expiredSection.className = 'expired-panel';
    expiredSection.innerHTML = `
      <button class="expired-toggle" type="button" id="expiredToggleBtn" aria-expanded="${state.showExpired ? 'true' : 'false'}">
        <span>已过期活动（${expiredItems.length}）</span>
        <span class="expired-toggle-icon">${state.showExpired ? '收起' : '展开'}</span>
      </button>
      <div class="expired-grid ${state.showExpired ? '' : 'hidden'}" id="expiredGrid"></div>
    `;
    els.grid.appendChild(expiredSection);

    const expiredGrid = expiredSection.querySelector('#expiredGrid');
    expiredItems.forEach((item) => {
      expiredGrid.appendChild(buildCard(item));
    });

    const expiredToggleBtn = expiredSection.querySelector('#expiredToggleBtn');
    expiredToggleBtn.addEventListener('click', () => {
      state.showExpired = !state.showExpired;
      renderCards();
    });
  }
}

function buildCard(item) {
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

  if (item.isCredit) {
    badges.push('<span class="badge credit">信用卡</span>');
  }

  if (item.isExpired) {
    badges.push('<span class="badge expired">已过期</span>');
  } else if (item.isSoon) {
    badges.push('<span class="badge soon">快到期</span>');
  }

  card.innerHTML = `
    <div class="card-head">
      <div class="badge-row">
        <div class="card-bank">${escapeHtml(item.bankName || '银行活动')}</div>
        ${badges.join('')}
      </div>
    </div>
    <h3 class="card-title">${escapeHtml(item.title || '未命名活动')}</h3>
    <p class="card-desc">${escapeHtml(item.desc || '暂无活动描述')}</p>
    <div class="card-meta">
      <span>有效期：${escapeHtml(item.validFrom || '--')} 至 ${escapeHtml(item.validTo || '--')}</span>
    </div>
    <div class="card-actions">
      <span class="primary-btn card-entry">查看详情</span>
    </div>
  `;

  return card;
}

function scrollToResults() {
  if (!els.grid) return;
  const top = els.grid.getBoundingClientRect().top + window.scrollY - 120;
  window.scrollTo({
    top: top > 0 ? top : 0,
    behavior: 'smooth'
  });
}

function applyFilters() {
  if (!isListPage()) return;

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
    if (state.time === '今日新增') {
      result = result.filter((item) => item.isTodayAdded);
    } else {
      const days = Number.parseInt(state.time, 10);
      const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((item) => {
        const d = parseDate(item.updatedAt || item.createdAt || item.validFrom || item.validTo);
        return !d || d.getTime() >= threshold;
      });
    }
  }

  result.sort(compareCampaign);
  state.filtered = result;

  if (els.listTitle) {
    els.listTitle.textContent = state.view === 'credit' ? '信用卡活动 · 专属专区' : '发现 · 全部活动';
  }

  if (els.resultSummary) {
    els.resultSummary.textContent = `共 ${result.length} 条活动，和“好羊毛助手Pro”微信小程序保持实时数据。`;
  }

  setHomeMeta();
  setLoadingState({ loading: false, error: false, empty: !result.length });
  renderCards();
  updateTodayEntry();
}

function bindEvents() {
  if (!isListPage()) return;

  if (els.searchInput) {
    els.searchInput.addEventListener('input', (event) => {
      state.keyword = event.target.value || '';
      applyFilters();
    });
  }

  if (els.refreshBtn) {
    els.refreshBtn.addEventListener('click', () => {
      fetchCampaigns();
    });
  }

  if (els.toggleFiltersBtn && els.filtersPanel) {
    els.toggleFiltersBtn.addEventListener('click', () => {
      const isCollapsed = els.filtersPanel.classList.toggle('is-collapsed');
      els.toggleFiltersBtn.textContent = isCollapsed ? '展开筛选' : '收起筛选';
    });
  }

  if (els.viewTabs) {
    els.viewTabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-view]');
      if (!button) return;

      state.view = button.dataset.view;
      state.bank = '全部';
      state.time = '全部时间';
      state.showExpired = false;

      Array.from(els.viewTabs.querySelectorAll('.segmented-btn')).forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });

      renderBankFilters();
      renderTimes();
      applyFilters();
    });
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-nav-view]');
    if (!link) return;

    event.preventDefault();
    const targetView = link.dataset.navView;
    if (!targetView || !els.viewTabs) return;

    state.view = targetView;
    state.bank = '全部';
    state.time = '全部时间';
    state.showExpired = false;

    Array.from(els.viewTabs.querySelectorAll('.segmented-btn')).forEach((item) => {
      item.classList.toggle('is-active', item.dataset.view === targetView);
    });

    renderBankFilters();
    renderTimes();
    applyFilters();

    const targetId = link.getAttribute('href');
    if (targetId && targetId.startsWith('./index.html#')) {
      const anchor = document.querySelector(targetId.replace('./index.html', ''));
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

async function fetchCampaigns() {
  if (!isListPage()) return;

  setLoadingState({ loading: true, error: false, empty: false });
  if (els.grid) els.grid.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/campaigns.php`, { credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const ok = payload && payload.code === 0;
    const list = ok && Array.isArray(payload.data) ? payload.data : [];

    if (!ok) {
      console.error('网站活动接口返回异常', payload);
      throw new Error(payload.message || '接口返回异常');
    }

    state.campaigns = list.map(normalizeCampaign).sort(compareCampaign);

    ensureTodayEntry();
    swapFilterLayout();
    renderBankFilters();
    renderTimes();
    applyFilters();
    updateTodayEntry();

    setLoadingState({ loading: false, error: false, empty: !state.filtered.length });
  } catch (err) {
    console.error('加载活动失败', err);
    setLoadingState({ loading: false, error: true, empty: false });
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
  if (selected === '中国银行') {
    return bankName.includes('中国银行') &&
      !bankName.includes('中国工商') &&
      !bankName.includes('中国农业') &&
      !bankName.includes('中国建设');
  }

  if (selected === '其他银行') {
    return !bankName.includes('工商') &&
      !bankName.includes('农业') &&
      !bankName.includes('建设') &&
      !(bankName.includes('中国银行') &&
        !bankName.includes('中国工商') &&
        !bankName.includes('中国农业') &&
        !bankName.includes('中国建设'));
  }

  if (selected === '信用卡返现') {
    return item.isCredit || tags.some((tag) => String(tag).includes('返现'));
  }

  if (selected === '固定活动') {
    return tags.includes('固定活动');
  }

  if (selected === '每日签到') {
    return tags.includes('每日签到') || item.recurringType === 'day' || item.recurringText === '每日签到';
  }

  if (selected === '重点推荐') {
    return tags.includes('重点推荐') || String(item.star || '').includes('🌟🌟🌟');
  }

  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isListPage()) {
    return;
  }

  bindEvents();
  renderTimes();
  ensureTodayEntry();
  swapFilterLayout();
  fetchCampaigns();
});
