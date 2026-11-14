const API_BASE = 'https://mini.vooqqqm.com/api';
const CAMPAIGN_LOAD_TIMEOUT = 12000;
const TIME_OPTIONS = ['全部时间', '今日新增', '3天内', '7天内', '14天内', '30天内'];
const EXPIRING_SOON_DAYS = 20;
const BANK_MATCHERS = [
  ['工行', /工商|工行/],
  ['农行', /农业|农行/],
  ['建行', /建设|建行/],
  ['中行', /中国银行|中行|中银/],
  ['交行', /交通|交行/],
  ['邮储', /邮储|邮政储蓄/],
  ['招行', /招商|招行/],
  ['中信', /中信/],
  ['光大', /光大/],
  ['华夏', /华夏/],
  ['民生', /民生/],
  ['广发', /广发/],
  ['平安', /平安/],
  ['兴业', /兴业/],
  ['浦发', /浦发|浦东发展/],
  ['浙商', /浙商/],
  ['渤海', /渤海/],
  ['恒丰', /恒丰/]
];
const BANK_FILTER_OPTIONS = [
  '全部', ...BANK_MATCHERS.map(([label]) => label), '其他银行',
  '信用卡返现', '固定活动', '每日签到', '重点推荐'
];
const SHORTCUTS = [
  { key: 'all', label: '全部活动', description: '清除筛选查看全部' },
  { key: 'food', label: '吃喝', description: '餐饮茶咖与外卖', scene: '吃喝' },
  { key: 'shopping', label: '购物', description: '商超购物优惠', scene: '购物' },
  { key: 'travel', label: '出行', description: '交通酒店与机票', scene: '出行' },
  { key: 'overseas', label: '境外游', description: '境外出行消费', scene: '境外游' },
  { key: 'life', label: '生活', description: '缴费与日常服务', scene: '生活' },
  { key: 'today', label: '今日新增', description: '今天收录的活动', time: '今日新增' },
  { key: 'expiring', label: '快到期', description: '20 天内到期', expiring: true }
];

// 与小程序 pages/utils/campaign_scene.js 使用同一组场景分类规则。
// Explicit scenario metadata wins. Legacy records use concrete merchants/services only.
const SCENE_OPTIONS = ['全部', '吃喝', '购物', '出行', '境外游', '生活', '会员权益', '通用优惠'];

// A card's issuing country or bank name is not the campaign's travel destination.
function overseasDestination(region) {
  return String(region || '').split(/[·；;，,]/)
    .filter(part => !/发卡|发行|持卡|信用卡客户|银行客户|身份证|居民/.test(part))
    .join(' ');
}

function isOverseasTravel(activity, tags) {
  // Keep eligibility, bank names and app/payment channels out of destination inference.
  const text = [activity.title, activity.desc, tags.join(' ')].join(' ');
  const destination = overseasDestination(activity.region);
  const abroad = /境外|海外|国外|出境|香港|澳门|台湾|日本|韩国|泰国|新加坡|马来西亚|越南|印尼|印度尼西亚|菲律宾|柬埔寨|老挝|欧洲|英国|法国|德国|意大利|西班牙|瑞士|北美|美国|加拿大|澳大利亚|澳洲|新西兰|阿联酋|迪拜/;
  const travelUse = /旅游|旅行|度假|机票|航空|航班|酒店|订房|住宿|交通|公交|地铁|的士|出租车|打车|租车|机场|贵宾厅|休息室|景点|门票|乐园|游轮|邮轮|八达通|西瓜卡|餐饮|餐厅|茶饮|外卖|咖啡|购物|商场|商户|门市|零售|便利店|超市|购机|消费|签账|流量|漫游|上网卡|eSIM|Apple Pay|手机Pay|SOGO|Klook|Agoda|Trip\.com/i;
  const explicitTravel = /境外游|出境游|出国游|海外游|国际机票|国际航班|全球(?:指定)?酒店/;
  if (explicitTravel.test(text + ' ' + destination)) return true;

  // Match actual overseas services, not phrases such as "境外银联卡" or "香港发卡".
  const overseasService = /(?:境外|海外|国外|出境)(?:线下|线上|网上|指定|合资格|手机Pay|手机支付|Apple Pay|交通|旅游|旅行|酒店|机票|购物|流量|漫游|消费|签账)/i;
  const serviceText = text.replace(/(?:不含|不适用|不包括|不支持|不参与|排除)(?:境外|海外)[^。；;，,\n]*/g, '');
  if (overseasService.test(serviceText)) return true;
  if (abroad.test(destination) && travelUse.test(text)) return true;

  // Some older records say "全国" for eligibility, while describing the destination.
  const destinationService = /(?:香港|澳门|台湾|日本|韩国|泰国|新加坡|欧洲|美国|英国|澳洲)(?:、(?:中国)?(?:香港|澳门|台湾))?(?:的|指定)?(?:交通|公交|地铁|的士|餐饮|购物|消费|酒店|机票|流量|漫游|机场)/;
  return destinationService.test(serviceText);
}

function classifyScenes(activity = {}) {
  const explicit = activity.scenes || activity.scene || activity.sceneCategory;
  const values = Array.isArray(explicit) ? explicit : String(explicit || '').split(/[,，、|]/);
  const known = values.map(v => String(v).trim()).filter(v => SCENE_OPTIONS.includes(v) && v !== '全部');
  if (known.length) return [...new Set(known)];
  const tags = Array.isArray(activity.tags) ? activity.tags : [];
  const text = [activity.title, activity.channel, activity.consumeChannel, ...tags].join(' ');
  const rules = [
    ['吃喝', /肯德基|麦当劳|星巴克|瑞幸|茶百道|喜茶|奈雪|餐饮|餐厅|咖啡|茶咖|奶茶|外卖|饿了么|美团外卖/],
    ['购物', /京东|淘宝|天猫|拼多多|唯品会|苏宁|山姆|盒马|超市|商超|购物|百货|抖音商城|抖音购物/],
    ['出行', /滴滴|打车|出租车|公交|地铁|八达通|高铁|铁路|机票|航空|酒店|携程|去哪儿|同程旅行|租车|加油|充电桩/],
    ['生活', /话费|流量包|水费|电费|燃气|生活缴费|宽带|物业费|洗衣|洗车|快递/],
    ['会员权益', /会员|VIP|贵宾厅|机场休息室|视频月卡|视频年卡/i]
  ];
  const matched = rules.filter(([, pattern]) => pattern.test(text)).map(([scene]) => scene);
  // Preserve all previous categories, including the generic-discount fallback.
  if (!matched.length && /通用优惠|通用立减金|全渠道|任意消费|不限商户/.test(text)) matched.push('通用优惠');
  if (isOverseasTravel(activity, tags)) matched.push('境外游');
  return matched;
}

const state = {
  campaigns: [],
  filtered: [],
  view: 'all',
  bank: '全部',
  scene: '全部',
  time: '全部时间',
  keyword: '',
  expiring: false,
  loadStatus: 'loading',
  requestPending: false,
  showExpired: false
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
  retryLoadBtn: document.getElementById('retryLoadBtn'),
  loadNotice: document.getElementById('loadNotice'),
  loadErrorMessage: document.getElementById('loadErrorMessage'),
  toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
  filtersPanel: document.getElementById('filtersPanel'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  sceneFilters: document.getElementById('sceneFilters'),
  bankFilters: document.getElementById('bankFilters'),
  activeSceneLabel: document.getElementById('activeSceneLabel'),
  activeBankLabel: document.getElementById('activeBankLabel'),
  timeFilters: document.getElementById('timeFilters'),
  quickTimeFilters: document.getElementById('quickTimeFilters'),
  viewTabs: document.getElementById('viewTabs')
};

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
    ? '信用卡活动专区 | 信用卡返现 | 羊毛助手Pro'
    : '银行立减金活动网站 | 微信立减金 | 信用卡返现 | 羊毛助手Pro';
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

function isSoon(validTo, days = EXPIRING_SOON_DAYS) {
  const d = parseDate(validTo);
  if (!d) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const diff = d.getTime() - todayStart.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function getCreatedDate(item) {
  const fields = [
    'createdAt', 'created_at', 'createTime', 'create_time', 'createDate', 'create_date',
    'firstSeenAt', 'first_seen_at', 'addedAt', 'added_at', 'addTime', 'add_time'
  ];
  for (const field of fields) {
    const date = parseDate(item[field]);
    if (date) return date;
  }
  return null;
}

function isTodayAdded(item) {
  const d = getCreatedDate(item);
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
  if (Number(item.isCredit) === 1) return true;
  const text = [item.bankName, item.title, item.desc, item.channel, ...item.tags].join(' ');
  return /信用卡|贷记卡|credit card/i.test(text);
}

function isDailyCampaign(item) {
  return item.tags.some(tag => String(tag).includes('每日签到')) ||
    item.recurringType === 'day' || /每日|签到/.test(item.recurringText || '');
}

function isFixedCampaign(item) {
  return !isDailyCampaign(item) && (
    item.tags.some(tag => String(tag).includes('固定活动')) ||
    ['week', 'month', 'quarter', 'year'].includes(item.recurringType) ||
    /每周|每月|每季|每年|固定活动|长期/.test(item.recurringText || '')
  );
}

function hasCashbackEvidence(item) {
  const amounts = String(item.cashbackRate || '').match(/\d+(?:\.\d+)?/g) || [];
  if (amounts.some(value => Number(value) > 0)) return true;
  return /返现/.test([item.title, item.desc, item.channel, item.cashbackText, ...item.tags].join(' '));
}

function normalizeCampaign(item) {
  const normalizedTags = normalizeTags(item.tags);
  const normalized = {
    ...item,
    tags: normalizedTags
  };

  const referenceDate = getCreatedDate(normalized) ||
    parseDate(normalized.updatedAt || normalized.validFrom || normalized.validTo);
  return {
    ...normalized,
    isCredit: hasCreditTag(normalized),
    sceneLabels: classifyScenes(normalized),
    isRecurring: Number(normalized.isRecurring) === 1 || !!normalized.recurringText,
    isExpired: isExpired(normalized.validTo),
    isSoon: !isFixedCampaign(normalized) && !isDailyCampaign(normalized) && isSoon(normalized.validTo),
    isTodayAdded: isTodayAdded(normalized),
    referenceTime: referenceDate ? referenceDate.getTime() : null,
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

function mountChips(container, key, options) {
  if (!container) return;
  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.filterValue = option;
    button.textContent = option;
    button.addEventListener('click', () => {
      state[key] = option;
      applyFilters();
    });
    container.appendChild(button);
  });
}

function setSelected(button, selected) {
  button.classList.toggle('is-active', selected);
  button.setAttribute('aria-pressed', String(selected));
}

function syncFilterControls() {
  const groups = [
    [els.viewTabs, '[data-view]', 'view', state.view],
    [els.sceneFilters, '[data-filter-value]', 'filterValue', state.scene],
    [els.bankFilters, '[data-filter-value]', 'filterValue', state.bank],
    [els.timeFilters, '[data-filter-value]', 'filterValue', state.time]
  ];
  for (const [container, selector, key, value] of groups) {
    if (!container) continue;
    container.querySelectorAll(selector).forEach(button => setSelected(button, button.dataset[key] === value));
  }
  if (els.activeSceneLabel) els.activeSceneLabel.textContent = state.scene;
  if (els.activeBankLabel) els.activeBankLabel.textContent = state.bank;
  if (els.resetFiltersBtn) els.resetFiltersBtn.disabled = hasDefaultFilters();
}

function hasDefaultFilters() {
  return state.view === 'all' && state.bank === '全部' && state.scene === '全部' &&
    state.time === '全部时间' && !state.keyword.trim() && !state.expiring;
}

function resetFilters() {
  Object.assign(state, {
    view: 'all', bank: '全部', scene: '全部', time: '全部时间',
    keyword: '', expiring: false, showExpired: false
  });
  if (els.searchInput) els.searchInput.value = '';
}

function matchesTimeFilter(item, time) {
  if (time === '全部时间') return true;
  if (time === '今日新增') return item.isTodayAdded;
  const threshold = Date.now() - Number.parseInt(time, 10) * 24 * 60 * 60 * 1000;
  return item.referenceTime === null || item.referenceTime >= threshold;
}

function matchesScope(item) {
  if (state.view === 'credit' && !item.isCredit) return false;
  if (state.view === 'debit' && item.isCredit) return false;
  if (!matchesBankFilter(item, state.bank)) return false;
  const keyword = state.keyword.trim().toLowerCase();
  return !keyword || [item.title, item.desc, item.bankName].join(' ').toLowerCase().includes(keyword);
}

function matchesFilters(item, { scene, time, expiring }) {
  return (scene === '全部' || item.sceneLabels.includes(scene)) &&
    matchesTimeFilter(item, time) && (!expiring || item.isSoon);
}

function mountShortcuts() {
  if (!els.quickTimeFilters) return;
  for (const shortcut of SHORTCUTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shortcut-card';
    button.dataset.shortcut = shortcut.key;
    button.innerHTML = `
      <strong>${shortcut.label}</strong>
      <span class="shortcut-count"><b>—</b><span>条</span></span>
      <small>${shortcut.description}</small>
    `;

    button.addEventListener('click', () => {
      if (shortcut.key === 'all') resetFilters();
      if (shortcut.scene) state.scene = state.scene === shortcut.scene ? '全部' : shortcut.scene;
      if (shortcut.time) state.time = state.time === shortcut.time ? '全部时间' : shortcut.time;
      if (shortcut.expiring) state.expiring = !state.expiring;
      applyFilters();
      scrollToResults();
    });

    els.quickTimeFilters.appendChild(button);
  }
}

function updateShortcuts(scope) {
  if (!els.quickTimeFilters) return;
  for (const shortcut of SHORTCUTS) {
    const button = els.quickTimeFilters.querySelector(`[data-shortcut="${shortcut.key}"]`);
    const isAll = shortcut.key === 'all';
    const active = isAll ? hasDefaultFilters() :
      shortcut.scene === state.scene || shortcut.time === state.time || Boolean(shortcut.expiring && state.expiring);
    const candidate = {
      scene: shortcut.scene || state.scene,
      time: shortcut.time || state.time,
      expiring: shortcut.expiring || state.expiring
    };
    const count = isAll ? state.campaigns.length : scope.filter(item => matchesFilters(item, candidate)).length;
    setSelected(button, active);
    button.querySelector('.shortcut-count b').textContent = state.loadStatus === 'ready' ? String(count) : '—';
  }
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

  const scope = state.campaigns.filter(matchesScope);
  syncFilterControls();
  updateShortcuts(scope);
  if (state.loadStatus !== 'ready') return;

  const result = scope.filter(item => matchesFilters(item, state));
  state.filtered = result;

  if (els.listTitle) {
    const titles = { all: '全部活动', debit: '储蓄卡活动', credit: '信用卡活动' };
    els.listTitle.textContent = titles[state.view];
  }

  if (els.resultSummary) {
    const expiredCount = result.filter(item => item.isExpired).length;
    els.resultSummary.textContent = expiredCount
      ? `共 ${result.length} 条 · 含 ${expiredCount} 条已过期`
      : `共 ${result.length} 条活动`;
  }

  setHomeMeta();
  setLoadingState({ loading: false, error: false, empty: !result.length });
  renderCards();
}

function bindEvents() {
  if (!isListPage()) return;

  if (els.searchInput) {
    els.searchInput.addEventListener('input', (event) => {
      state.keyword = event.target.value || '';
      applyFilters();
    });
  }

  if (els.refreshBtn) els.refreshBtn.addEventListener('click', fetchCampaigns);
  if (els.retryLoadBtn) els.retryLoadBtn.addEventListener('click', fetchCampaigns);
  if (els.resetFiltersBtn) els.resetFiltersBtn.addEventListener('click', () => {
    resetFilters();
    applyFilters();
  });

  if (els.toggleFiltersBtn && els.filtersPanel) {
    els.toggleFiltersBtn.addEventListener('click', () => {
      const isCollapsed = els.filtersPanel.classList.toggle('is-collapsed');
      els.toggleFiltersBtn.textContent = isCollapsed ? '展开筛选' : '收起筛选';
      els.toggleFiltersBtn.setAttribute('aria-expanded', String(!isCollapsed));
    });
  }

  if (els.viewTabs) {
    els.viewTabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-view]');
      if (!button || !['all', 'debit', 'credit'].includes(button.dataset.view)) return;

      state.view = button.dataset.view;
      state.showExpired = false;
      applyFilters();
    });
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-nav-view]');
    if (!link) return;

    event.preventDefault();
    const targetView = link.dataset.navView;
    if (!['all', 'debit', 'credit'].includes(targetView) || !els.viewTabs) return;

    resetFilters();
    state.view = targetView;
    applyFilters();

    const targetId = link.getAttribute('href');
    if (targetId && targetId.startsWith('./index.html#')) {
      const anchor = document.querySelector(targetId.replace('./index.html', ''));
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

async function fetchCampaigns() {
  if (!isListPage() || state.requestPending) return;
  state.requestPending = true;
  const hadData = state.loadStatus === 'ready';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CAMPAIGN_LOAD_TIMEOUT);
  if (els.refreshBtn) els.refreshBtn.disabled = true;
  if (els.loadNotice) els.loadNotice.textContent = hadData ? '正在更新活动…' : '正在加载活动…';
  if (!hadData) {
    state.loadStatus = 'loading';
    if (els.resultSummary) els.resultSummary.textContent = '正在加载活动…';
    setLoadingState({ loading: true });
  }

  try {
    const response = await fetch(`${API_BASE}/campaigns.php?view=web-list`, {
      credentials: 'omit',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!payload || payload.code !== 0 || !Array.isArray(payload.data)) {
      throw new Error((payload && payload.message) || '接口返回异常');
    }

    state.campaigns = payload.data.filter(item => item && item.id != null)
      .map(normalizeCampaign).sort(compareCampaign);
    state.loadStatus = 'ready';
    applyFilters();
    if (els.loadNotice) {
      els.loadNotice.textContent = `已加载 ${state.campaigns.length} 条活动`;
    }
  } catch (err) {
    const message = controller.signal.aborted ? '活动加载超时' : '活动加载失败';
    if (els.loadNotice) {
      els.loadNotice.textContent = hadData ? '更新失败，仍显示上次加载的活动' : `${message}，请重试`;
    }
    if (!hadData) {
      state.loadStatus = 'error';
      if (els.resultSummary) els.resultSummary.textContent = '暂未载入活动';
      if (els.loadErrorMessage) els.loadErrorMessage.textContent = `${message}，请重试。`;
      setLoadingState({ error: true });
    }
    console.error(message, err);
  } finally {
    clearTimeout(timeout);
    state.requestPending = false;
    if (els.refreshBtn) els.refreshBtn.disabled = false;
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
  if (selected === '全部') return true;
  const bankName = String(item.bankName || '');

  if (selected === '信用卡返现') {
    return item.isCredit && hasCashbackEvidence(item);
  }
  if (selected === '固定活动') return isFixedCampaign(item);
  if (selected === '每日签到') return isDailyCampaign(item);
  if (selected === '重点推荐') {
    return item.tags.some(tag => String(tag).includes('重点推荐')) ||
      (String(item.star || '').match(/🌟/g) || []).length >= 3;
  }
  const bank = BANK_MATCHERS.find(([, pattern]) => pattern.test(bankName));
  return (bank ? bank[0] : '其他银行') === selected;
}

function initializeCampaignPage() {
  if (!isListPage()) {
    return;
  }

  bindEvents();
  const query = new URLSearchParams(window.location.search).get('q');
  if (query && els.searchInput) {
    state.keyword = query;
    els.searchInput.value = query;
  }
  mountChips(els.sceneFilters, 'scene', SCENE_OPTIONS);
  mountChips(els.bankFilters, 'bank', BANK_FILTER_OPTIONS);
  mountChips(els.timeFilters, 'time', TIME_OPTIONS);
  mountShortcuts();
  syncFilterControls();
  fetchCampaigns();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCampaignPage, { once: true });
} else {
  initializeCampaignPage();
}
