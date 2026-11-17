const API_BASE = 'https://mini.vooqqqm.com/api';
const CAMPAIGN_LOAD_TIMEOUT = 12000;
const EXPIRING_SOON_DAYS = 20;
const GROUP_QR_URL = 'https://github.com/yema-29129/bank-campaigns-web/blob/main/assets/group-wechat-qr.png?raw=true';

const POSTER_FIELDS = [
  'posterUrl', 'posterPath', 'poster',
  'imageUrl', 'imagePath', 'image',
  'qrCodeUrl', 'qrCodePath', 'qrCode',
  'qrcodeUrl', 'qrcodePath', 'qrcode',
  'poster_url', 'poster_path',
  'image_url', 'image_path',
  'qr_code_url', 'qr_code_path',
  'qrcode_url', 'qrcode_path'
];

const OVERSEAS_BANK_RE = /汇丰|恒生|渣打|星展|大新|东亚|花旗|众安|ZA\s*Bank|Mox|中银香港|中银信用卡|（香港）|（中国香港）|（亚洲）|（澳门）|运通|AEON|安信/i;

const BANK_GROUPS = [
  {
    key: 'big6',
    label: '国有大行',
    allLabel: '全部国有行',
    defaultOpen: true,
    items: [
      ['农行', /农业银行|农行/],
      ['工行', /工商银行|工行/],
      ['邮储', /邮政储蓄|邮储/],
      ['建行', /建设银行|建行/],
      ['中行', /中国银行|中行/],
      ['交行', /交通银行|交银|交行/]
    ]
  },
  {
    key: 'joint',
    label: '股份制银行',
    allLabel: '全部股份制',
    defaultOpen: false,
    items: [
      ['招行', /招商银行|招行/],
      ['兴业', /兴业/],
      ['中信', /中信/],
      ['浦发', /浦发|浦东发展/],
      ['民生', /民生/],
      ['光大', /光大/],
      ['华夏', /华夏/],
      ['平安', /平安银行|平安信用卡|^平安$/],
      ['广发', /广发/],
      ['浙商', /浙商/],
      ['渤海', /渤海/],
      ['恒丰', /恒丰/]
    ]
  },
  {
    key: 'local',
    label: '地方银行',
    allLabel: '全部地方行',
    defaultOpen: false,
    items: [
      ['宁波银行', /宁波银行/],
      ['广州银行', /广州银行/],
      ['上海银行', /上海银行/],
      ['重庆银行', /重庆银行/],
      ['北京银行', /北京银行/],
      ['徽商银行', /徽商银行/],
      ['东莞银行', /东莞银行/],
      ['南京/杭州', /南京银行|杭州银行/],
      ['农商/农信', /农商|农村商业|农信|农村信用/],
      ['其他城商行', /长沙银行|烟台银行|福建海峡银行|中原银行|甘肃银行|宁夏银行|江苏银行|盛京银行|城商/]
    ]
  },
  {
    key: 'other',
    label: '其他银行',
    allLabel: '全部其他',
    defaultOpen: false,
    items: [
      ['港澳/外资', OVERSEAS_BANK_RE],
      ['银联/云闪付', /银联|云闪付/],
      ['国际卡组织', /visa|万事达|mastercard|jcb/i],
      ['政府消费券', /商务局|商务厅|商务委|人民政府|文旅|经委|体育局/],
      ['其他机构', /.*/]
    ]
  }
];

const CARD_ORG_OPTIONS = [
  { key: '全部', label: '全部', test: () => true },
  { key: '银联', label: '银联', test: (t) => /银联|云闪付|62开头|UnionPay/i.test(t) },
  { key: '万事达', label: '万事达', test: (t) => /万事达|Mastercard|万事网联/i.test(t) },
  { key: 'Visa', label: 'Visa', test: (t) => /\bVisa\b|维萨/i.test(t) },
  { key: '运通', label: '美国运通', test: (t) => /运通|American\s*Express|\bAMEX\b/i.test(t) },
  { key: 'JCB', label: 'JCB', test: (t) => /\bJCB\b/i.test(t) }
];

const PAY_OPTIONS = [
  { key: '全部', label: '全部', test: () => true },
  { key: '微信支付', label: '微信支付', test: (t) => /微信/.test(t) },
  { key: '支付宝', label: '支付宝', test: (t) => /支付宝/.test(t) },
  { key: '云闪付/银联', label: '云闪付/银联', test: (t) => /云闪付|银联/.test(t) },
  { key: '手机Pay', label: '手机Pay', test: (t) => /\bPay\b|Apple\s*Pay|Huawei\s*Pay|Samsung\s*Pay|手机Pay/i.test(t) },
  { key: '京东/美团/抖音', label: '京东/美团/抖音', test: (t) => /京东|美团|抖音|多多/.test(t) },
  { key: '刷卡/银行App', label: '刷卡/银行App', test: (t) => /刷卡|App|e生活|掌上生活|官网/i.test(t) }
];

const REGION_OPTIONS = [
  { key: '全部', label: '全部', test: () => true },
  { key: '全国通用', label: '全国通用', test: (r) => /^(全国|中国大陆|中国内地)/.test(r) },
  { key: '港澳/境外', label: '港澳/境外', test: (r) => /香港|澳门|台湾|境外|海外/.test(r) },
  { key: '指定省市', label: '指定省市', test: (r) => !!r && !/^(全国|中国大陆|中国内地)/.test(r) && !/香港|澳门|台湾|境外|海外/.test(r) }
];

const SCENE_OPTIONS = ['全部', '吃喝', '购物', '出行', '境外游', '生活', '会员权益', '通用优惠'];

const TOP_CATEGORIES = [
  { key: 'all', label: '全部', scene: '全部', cashback: false },
  { key: 'food', label: '吃喝', scene: '吃喝', cashback: false },
  { key: 'shopping', label: '购物', scene: '购物', cashback: false },
  { key: 'travel', label: '出行', scene: '出行', cashback: false },
  { key: 'overseas', label: '境外游', scene: '境外游', cashback: false },
  { key: 'cashback', label: '返现', scene: '全部', cashback: true },
  { key: 'life', label: '生活', scene: '生活', cashback: false },
  { key: 'vip', label: '会员权益', scene: '会员权益', cashback: false },
  { key: 'general', label: '通用优惠', scene: '通用优惠', cashback: false }
];

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

function classifyBank(bankName) {
  const name = String(bankName || '').trim();
  if (!OVERSEAS_BANK_RE.test(name)) {
    for (const grp of BANK_GROUPS.slice(0, 3)) {
      for (const [subKey, pattern] of grp.items) {
        if (pattern.test(name)) return { group: grp.key, sub: subKey };
      }
    }
    if (/银行/.test(name)) {
      return { group: 'local', sub: '其他城商行' };
    }
  }
  const otherGrp = BANK_GROUPS[3];
  for (const [subKey, pattern] of otherGrp.items) {
    if (pattern.test(name)) return { group: 'other', sub: subKey };
  }
  return { group: 'other', sub: '其他机构' };
}

const state = {
  campaigns: [],
  filtered: [],
  quick: 'all',        // 'all' | 'today' | 'expiring' | 'recurring'
  view: 'all',         // 'all' | 'credit' | 'debit'
  cardOrg: '全部',      // CARD_ORG_OPTIONS.key
  bank: '全部',         // '全部' | 'group:<key>' | '<subKey>'
  pay: '全部',          // PAY_OPTIONS.key
  regionGroup: '全部',  // REGION_OPTIONS.key
  scene: '全部',        // SCENE_OPTIONS
  cashback: false,     // top tab '返现'
  keyword: '',
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
  activeFilterSummary: document.getElementById('activeFilterSummary'),
  searchInput: document.getElementById('searchInput'),
  mobileSearchInput: document.getElementById('mobileSearchInput'),
  refreshBtn: document.getElementById('refreshBtn'),
  retryLoadBtn: document.getElementById('retryLoadBtn'),
  loadErrorMessage: document.getElementById('loadErrorMessage'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  sidebarResetBtn: document.getElementById('sidebarResetBtn'),
  viewTabs: document.getElementById('viewTabs'),
  cardOrgFilters: document.getElementById('cardOrgFilters'),
  bankGroupRoot: document.getElementById('bankGroupRoot'),
  payFilters: document.getElementById('payFilters'),
  regionFilters: document.getElementById('regionFilters'),
  sceneFilters: document.getElementById('sceneFilters'),
  topCategoryBar: document.getElementById('topCategoryBar'),
  activeViewBadge: document.getElementById('activeViewBadge'),
  activeCardOrgBadge: document.getElementById('activeCardOrgBadge'),
  activeBankBadge: document.getElementById('activeBankBadge'),
  activePayBadge: document.getElementById('activePayBadge'),
  activeRegionBadge: document.getElementById('activeRegionBadge'),
  activeSceneBadge: document.getElementById('activeSceneBadge'),
  radarSidebar: document.getElementById('radarSidebar'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  openSidebarBtn: document.getElementById('openSidebarBtn'),
  topMobileMenuBtn: document.getElementById('topMobileMenuBtn'),
  topMobileMenuBadge: document.getElementById('topMobileMenuBadge'),
  mobileFilterCount: document.getElementById('mobileFilterCount'),
  detailDrawer: document.getElementById('detailDrawer'),
  drawerBackdrop: document.getElementById('drawerBackdrop'),
  drawerHeadMeta: document.getElementById('drawerHeadMeta'),
  drawerBody: document.getElementById('drawerBody'),
  drawerOpenPage: document.getElementById('drawerOpenPage'),
  drawerShareBtn: document.getElementById('drawerShareBtn'),
  shareSheet: document.getElementById('shareSheet'),
  sharePreview: document.getElementById('sharePreview'),
  shareSystemBtn: document.getElementById('shareSystemBtn'),
  shareCopyTextBtn: document.getElementById('shareCopyTextBtn'),
  shareCopyLinkBtn: document.getElementById('shareCopyLinkBtn'),
  lightbox: document.getElementById('imageLightbox'),
  lightboxImage: document.getElementById('lightboxImage'),
  lightboxError: document.getElementById('lightboxError'),
  lightboxRawLink: document.getElementById('lightboxRawLink'),
  lightboxErrorTitle: document.getElementById('lightboxErrorTitle'),
  lightboxErrorText: document.getElementById('lightboxErrorText')
};

const detailCache = new Map();
let selectedId = null;
let currentDrawerActivity = null;
let currentLightboxType = 'poster';

function isListPage() {
  return !!(els.grid && els.bankGroupRoot && els.topCategoryBar);
}

function setMeta(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

function setHomeMeta() {
  const isCredit = state.view === 'credit';
  const title = isCredit
    ? '2026信用卡活动专区：信用卡返现、刷卡金与首绑立减汇总 | 好羊毛银行活动站'
    : '2026银行优惠与微信立减金汇总：信用卡返现/云闪付满减/数币红包 | 好羊毛银行活动站';
  const description = isCredit
    ? '好羊毛银行活动站（羊毛助手Pro）实时汇总全国银行信用卡返现、刷卡金、首绑立减与港卡境外消费返现活动，支持按银行、卡组织、支付方式与场景筛选并查看领取路径。'
    : '好羊毛银行活动站（羊毛助手Pro）每日实时核验更新全国银行微信立减金、云闪付满减、支付宝红包、数币红包、信用卡返现与港卡境外优惠，附详细领取入口与参与步骤。';

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
  const bankInfo = classifyBank(normalized.bankName);

  return {
    ...normalized,
    bankGroup: bankInfo.group,
    bankSub: bankInfo.sub,
    orgText: [normalized.cardOrg, normalized.title, normalized.desc, normalized.bankName, normalized.channel, normalized.consumeChannel, ...normalizedTags].filter(Boolean).join(' '),
    payText: [normalized.channel, normalized.consumeChannel, normalized.title].filter(Boolean).join(' '),
    regionText: String(normalized.region || '').trim(),
    isCredit: hasCreditTag(normalized),
    hasCashback: hasCashbackEvidence(normalized),
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
  const hasPrerendered = !!(els.grid && els.grid.children.length > 0);
  if (els.loading) els.loading.classList.toggle('hidden', !(loading && !hasPrerendered));
  if (els.error) els.error.classList.toggle('hidden', !error);
  if (els.empty) els.empty.classList.toggle('hidden', !empty);
}

function matchesKeyword(item) {
  const keyword = state.keyword.trim().toLowerCase();
  return !keyword || [item.title, item.desc, item.bankName, item.channel, item.region].join(' ').toLowerCase().includes(keyword);
}

function matchesView(item) {
  if (state.view === 'credit' && !item.isCredit) return false;
  if (state.view === 'debit' && item.isCredit) return false;
  return true;
}

function matchesCardOrg(item, orgKey = state.cardOrg) {
  if (!orgKey || orgKey === '全部') return true;
  const rule = CARD_ORG_OPTIONS.find((opt) => opt.key === orgKey);
  return rule ? rule.test(item.orgText) : true;
}

function matchesBank(item, bankValue = state.bank) {
  if (!bankValue || bankValue === '全部') return true;
  if (bankValue.startsWith('group:')) {
    return item.bankGroup === bankValue.slice(6);
  }
  return item.bankSub === bankValue;
}

function matchesPay(item, payKey = state.pay) {
  if (!payKey || payKey === '全部') return true;
  const rule = PAY_OPTIONS.find((opt) => opt.key === payKey);
  return rule ? rule.test(item.payText) : true;
}

function matchesRegion(item, regionKey = state.regionGroup) {
  if (!regionKey || regionKey === '全部') return true;
  const rule = REGION_OPTIONS.find((opt) => opt.key === regionKey);
  return rule ? rule.test(item.regionText) : true;
}

function matchesSceneOrCashback(item, scene = state.scene, cashback = state.cashback) {
  if (cashback && !item.hasCashback) return false;
  return scene === '全部' || item.sceneLabels.includes(scene);
}

function matchesQuick(item, quick = state.quick) {
  if (quick === 'today') return item.isTodayAdded;
  if (quick === 'expiring') return item.isSoon;
  if (quick === 'recurring') return item.isRecurring;
  return true;
}

function matchesAll(item, override = {}) {
  return (
    matchesKeyword(item) &&
    matchesView(item) &&
    matchesCardOrg(item, 'cardOrg' in override ? override.cardOrg : state.cardOrg) &&
    matchesBank(item, 'bank' in override ? override.bank : state.bank) &&
    matchesPay(item, 'pay' in override ? override.pay : state.pay) &&
    matchesRegion(item, 'regionGroup' in override ? override.regionGroup : state.regionGroup) &&
    matchesSceneOrCashback(
      item,
      'scene' in override ? override.scene : state.scene,
      'cashback' in override ? override.cashback : state.cashback
    ) &&
    matchesQuick(item, 'quick' in override ? override.quick : state.quick)
  );
}

function hasDefaultFilters() {
  return (
    state.quick === 'all' &&
    state.view === 'all' &&
    state.cardOrg === '全部' &&
    state.bank === '全部' &&
    state.pay === '全部' &&
    state.regionGroup === '全部' &&
    state.scene === '全部' &&
    !state.cashback &&
    !state.keyword.trim()
  );
}

function countActiveExtraFilters() {
  let n = 0;
  if (state.view !== 'all') n++;
  if (state.cardOrg !== '全部') n++;
  if (state.bank !== '全部') n++;
  if (state.pay !== '全部') n++;
  if (state.regionGroup !== '全部') n++;
  if (state.scene !== '全部' || state.cashback) n++;
  return n;
}

function resetFilters() {
  Object.assign(state, {
    quick: 'all',
    view: 'all',
    cardOrg: '全部',
    bank: '全部',
    pay: '全部',
    regionGroup: '全部',
    scene: '全部',
    cashback: false,
    keyword: '',
    showExpired: false
  });
  if (els.searchInput) els.searchInput.value = '';
  if (els.mobileSearchInput) els.mobileSearchInput.value = '';
}

function mountTopCategories() {
  if (!els.topCategoryBar) return;
  els.topCategoryBar.innerHTML = '';
  TOP_CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'radar-cat-tab';
    btn.dataset.topCat = cat.key;
    btn.setAttribute('role', 'tab');
    btn.textContent = cat.label;
    btn.addEventListener('click', () => {
      const isAlready = cat.key !== 'all' && (cat.cashback ? state.cashback : (state.scene === cat.scene && !state.cashback));
      if (cat.key === 'all' || isAlready) {
        state.scene = '全部';
        state.cashback = false;
      } else {
        state.scene = cat.scene;
        state.cashback = !!cat.cashback;
      }
      applyFilters();
    });
    els.topCategoryBar.appendChild(btn);
  });
}

function mountBankGroups() {
  if (!els.bankGroupRoot) return;
  els.bankGroupRoot.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'radar-mini-chip radar-bank-all is-active';
  allBtn.dataset.bank = '全部';
  allBtn.innerHTML = '<span>全部银行</span><b data-bank-count="全部">—</b>';
  allBtn.addEventListener('click', () => {
    state.bank = '全部';
    applyFilters();
  });
  els.bankGroupRoot.appendChild(allBtn);

  BANK_GROUPS.forEach((grp) => {
    const details = document.createElement('details');
    details.className = 'radar-l2 radar-bank-cat';
    details.dataset.bankGroup = grp.key;
    if (grp.defaultOpen) details.open = true;

    const summary = document.createElement('summary');
    summary.innerHTML = `<span class="radar-cat-name">${grp.label}</span><span class="radar-cat-count" data-bank-group-count="${grp.key}">—</span>`;
    details.appendChild(summary);

    const grid = document.createElement('div');
    grid.className = 'radar-mini-chips';

    const grpBtn = document.createElement('button');
    grpBtn.type = 'button';
    grpBtn.className = 'radar-mini-chip is-group-all';
    grpBtn.dataset.bank = `group:${grp.key}`;
    grpBtn.innerHTML = `<span>${grp.allLabel}</span><b data-bank-count="group:${grp.key}">—</b>`;
    grpBtn.addEventListener('click', () => {
      state.bank = state.bank === `group:${grp.key}` ? '全部' : `group:${grp.key}`;
      applyFilters();
    });
    grid.appendChild(grpBtn);

    grp.items.forEach(([subKey]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'radar-mini-chip';
      btn.dataset.bank = subKey;
      btn.innerHTML = `<span>${escapeHtml(subKey)}</span><b data-bank-count="${escapeAttribute(subKey)}">—</b>`;
      btn.addEventListener('click', () => {
        state.bank = state.bank === subKey ? '全部' : subKey;
        applyFilters();
      });
      grid.appendChild(btn);
    });

    details.appendChild(grid);
    els.bankGroupRoot.appendChild(details);
  });
}

function mountCardOrgFilters() {
  if (!els.cardOrgFilters) return;
  els.cardOrgFilters.innerHTML = '';
  CARD_ORG_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'radar-mini-chip';
    btn.dataset.chipKey = opt.key;
    btn.innerHTML = `<span>${escapeHtml(opt.label)}</span><b data-org-count="${escapeAttribute(opt.key)}">—</b>`;
    btn.addEventListener('click', () => {
      state.cardOrg = (opt.key === '全部' || state.cardOrg === opt.key) ? '全部' : opt.key;
      applyFilters();
    });
    els.cardOrgFilters.appendChild(btn);
  });
}

function mountMiniChips(container, options, stateKey) {
  if (!container) return;
  container.innerHTML = '';
  options.forEach((opt) => {
    const key = typeof opt === 'string' ? opt : opt.key;
    const label = typeof opt === 'string' ? opt : opt.label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'radar-mini-chip';
    btn.dataset.chipKey = key;
    btn.innerHTML = `<span>${escapeHtml(label)}</span>`;
    btn.addEventListener('click', () => {
      if (stateKey === 'scene') {
        state.cashback = false;
        state.scene = (key === '全部' || state.scene === key) ? '全部' : key;
      } else {
        state[stateKey] = (key === '全部' || state[stateKey] === key) ? '全部' : key;
      }
      applyFilters();
    });
    container.appendChild(btn);
  });
}

function syncFilterControls() {
  // Top category strip
  if (els.topCategoryBar) {
    els.topCategoryBar.querySelectorAll('[data-top-cat]').forEach((btn) => {
      const cat = TOP_CATEGORIES.find((c) => c.key === btn.dataset.topCat);
      if (!cat) return;
      const isActive = cat.key === 'all'
        ? (state.scene === '全部' && !state.cashback)
        : (cat.cashback ? state.cashback : (!state.cashback && state.scene === cat.scene));
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
  }

  // Quick views (both sidebar & mobile bar)
  document.querySelectorAll('[data-quick]').forEach((btn) => {
    const isActive = btn.dataset.quick === state.quick;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  // Card type segmented
  if (els.viewTabs) {
    els.viewTabs.querySelectorAll('[data-view]').forEach((btn) => {
      const isActive = btn.dataset.view === state.view;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  // Top site nav highlight
  document.querySelectorAll('.site-nav [data-nav-view]').forEach((link) => {
    const target = link.dataset.navView;
    link.classList.toggle('is-active', target === 'credit' && state.view === 'credit');
  });
  const homeNavLink = document.querySelector('.site-nav a[href="./index.html"]');
  if (homeNavLink) homeNavLink.classList.toggle('is-active', state.view !== 'credit');

  // Bank chips
  if (els.bankGroupRoot) {
    els.bankGroupRoot.querySelectorAll('[data-bank]').forEach((btn) => {
      const isActive = btn.dataset.bank === state.bank;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  // Pay, Region, Scene chips
  const syncMini = (container, value) => {
    if (!container) return;
    container.querySelectorAll('[data-chip-key]').forEach((btn) => {
      const isActive = btn.dataset.chipKey === value;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  };
  syncMini(els.cardOrgFilters, state.cardOrg);
  syncMini(els.payFilters, state.pay);
  syncMini(els.regionFilters, state.regionGroup);
  syncMini(els.sceneFilters, state.cashback ? '' : state.scene);

  // Active mini labels in sidebar
  const cardOrgLabel = state.cardOrg === '全部'
    ? ''
    : (CARD_ORG_OPTIONS.find((o) => o.key === state.cardOrg)?.label || state.cardOrg);
  const bankLabel = state.bank === '全部'
    ? ''
    : state.bank.startsWith('group:')
      ? (BANK_GROUPS.find((g) => g.key === state.bank.slice(6))?.label || '')
      : state.bank;
  if (els.activeViewBadge) {
    els.activeViewBadge.textContent = state.view === 'credit' ? '信用卡' : state.view === 'debit' ? '储蓄卡' : '';
  }
  if (els.activeCardOrgBadge) els.activeCardOrgBadge.textContent = cardOrgLabel;
  if (els.activeBankBadge) els.activeBankBadge.textContent = bankLabel;
  if (els.activePayBadge) els.activePayBadge.textContent = state.pay === '全部' ? '' : state.pay;
  if (els.activeRegionBadge) els.activeRegionBadge.textContent = state.regionGroup === '全部' ? '' : state.regionGroup;
  if (els.activeSceneBadge) els.activeSceneBadge.textContent = state.cashback ? '返现' : (state.scene === '全部' ? '' : state.scene);

  // Search input sync
  if (els.searchInput && els.searchInput.value !== state.keyword) els.searchInput.value = state.keyword;
  if (els.mobileSearchInput && els.mobileSearchInput.value !== state.keyword) els.mobileSearchInput.value = state.keyword;

  // Reset buttons & mobile badge
  const isDefault = hasDefaultFilters();
  if (els.resetFiltersBtn) els.resetFiltersBtn.classList.toggle('hidden', isDefault);
  if (els.sidebarResetBtn) els.sidebarResetBtn.classList.toggle('hidden', isDefault);

  const extraCount = countActiveExtraFilters();
  if (els.mobileFilterCount) {
    els.mobileFilterCount.textContent = String(extraCount);
    els.mobileFilterCount.classList.toggle('hidden', extraCount === 0);
  }
  if (els.topMobileMenuBadge) {
    els.topMobileMenuBadge.textContent = String(extraCount);
    els.topMobileMenuBadge.classList.toggle('hidden', extraCount === 0);
  }

  if (els.activeFilterSummary) {
    const parts = [];
    if (state.view === 'credit') parts.push('信用卡');
    if (state.view === 'debit') parts.push('储蓄卡');
    if (cardOrgLabel) parts.push(cardOrgLabel);
    if (bankLabel) parts.push(bankLabel);
    if (state.pay !== '全部') parts.push(state.pay);
    if (state.regionGroup !== '全部') parts.push(state.regionGroup);
    if (state.quick === 'today') parts.push('今日新增');
    if (state.quick === 'expiring') parts.push('快到期');
    if (state.quick === 'recurring') parts.push('循环活动');
    if (state.keyword.trim()) parts.push(`“${state.keyword.trim()}”`);
    els.activeFilterSummary.textContent = parts.join(' · ');
  }
}

function updateSidebarCounts() {
  const ready = state.loadStatus === 'ready';
  const activeCampaigns = state.campaigns.filter((item) => !item.isExpired);

  // Quick view counts (respect current non-quick filters)
  const quickBase = activeCampaigns.filter((item) => matchesAll(item, { quick: 'all' }));
  const quickCounts = {
    all: quickBase.length,
    today: quickBase.filter((item) => item.isTodayAdded).length,
    expiring: quickBase.filter((item) => item.isSoon).length,
    recurring: quickBase.filter((item) => item.isRecurring).length
  };
  document.querySelectorAll('[data-quick-count]').forEach((el) => {
    const key = el.dataset.quickCount;
    el.textContent = ready ? String(quickCounts[key] ?? 0) : '—';
  });

  // Card org counts (respect current non-cardOrg filters)
  if (els.cardOrgFilters) {
    const orgBase = activeCampaigns.filter((item) => matchesAll(item, { cardOrg: '全部' }));
    CARD_ORG_OPTIONS.forEach((opt) => {
      const count = opt.key === '全部'
        ? orgBase.length
        : orgBase.filter((item) => opt.test(item.orgText)).length;
      const bEl = els.cardOrgFilters.querySelector(`[data-org-count="${CSS.escape(opt.key)}"]`);
      if (bEl) bEl.textContent = ready ? String(count) : '—';
      const btn = bEl && bEl.closest('.radar-mini-chip');
      if (btn) btn.classList.toggle('is-empty', ready && count === 0 && state.cardOrg !== opt.key);
    });
  }

  // Bank counts (respect current non-bank filters)
  if (!els.bankGroupRoot) return;
  const bankBase = activeCampaigns.filter((item) => matchesAll(item, { bank: '全部' }));
  const groupCounts = { big6: 0, joint: 0, local: 0, other: 0 };
  const subCounts = Object.create(null);

  bankBase.forEach((item) => {
    groupCounts[item.bankGroup] = (groupCounts[item.bankGroup] || 0) + 1;
    subCounts[item.bankSub] = (subCounts[item.bankSub] || 0) + 1;
  });

  const allBankEl = els.bankGroupRoot.querySelector('[data-bank-count="全部"]');
  if (allBankEl) allBankEl.textContent = ready ? String(bankBase.length) : '—';

  BANK_GROUPS.forEach((grp) => {
    const gCount = groupCounts[grp.key] || 0;
    const gSpan = els.bankGroupRoot.querySelector(`[data-bank-group-count="${grp.key}"]`);
    if (gSpan) gSpan.textContent = ready ? String(gCount) : '—';

    const gAllSpan = els.bankGroupRoot.querySelector(`[data-bank-count="group:${grp.key}"]`);
    if (gAllSpan) gAllSpan.textContent = ready ? String(gCount) : '—';

    grp.items.forEach(([subKey]) => {
      const sCount = subCounts[subKey] || 0;
      const btn = els.bankGroupRoot.querySelector(`[data-bank="${CSS.escape(subKey)}"]`);
      if (!btn) return;
      const bEl = btn.querySelector('b');
      if (bEl) bEl.textContent = ready ? String(sCount) : '—';
      btn.classList.toggle('is-empty', ready && sCount === 0 && state.bank !== subKey);
    });
  });
}

function formatRowDate(value) {
  const d = parseDate(value);
  if (!d) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() === new Date().getFullYear() ? `${mm}-${dd}` : `${d.getFullYear()}-${mm}-${dd}`;
}

function formatRelativeTime(item) {
  const d = getCreatedDate(item) || parseDate(item.updatedAt);
  if (!d) return '';
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const itemDayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((todayStart - itemDayStart) / 86400000);
  if (diffDays <= 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays <= 7) return `${diffDays} 天前`;
  return formatRowDate(d);
}

function renderCards() {
  if (!els.grid) return;

  els.grid.innerHTML = '';
  const activeItems = state.filtered.filter((item) => !item.isExpired);
  const expiredItems = state.filtered.filter((item) => item.isExpired);

  if (activeItems.length) {
    const list = document.createElement('div');
    list.className = 'radar-list';
    activeItems.forEach((item, idx) => {
      list.appendChild(buildRow(item, idx + 1));
    });
    els.grid.appendChild(list);
  }

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
    expiredItems.forEach((item, idx) => {
      expiredGrid.appendChild(buildRow(item, idx + 1));
    });

    const expiredToggleBtn = expiredSection.querySelector('#expiredToggleBtn');
    expiredToggleBtn.addEventListener('click', () => {
      state.showExpired = !state.showExpired;
      renderCards();
    });
  }
}

function buildRow(item, index) {
  const row = document.createElement('a');
  let statusCls = '';
  if (item.isExpired) statusCls = 'is-expired';
  else if (item.isSoon) statusCls = 'is-soon';
  else if (item.isTodayAdded) statusCls = 'is-today';

  const isSelected = selectedId && String(item.id) === String(selectedId);
  row.className = `radar-row${statusCls ? ` ${statusCls}` : ''}${isSelected ? ' is-selected' : ''}`;
  row.dataset.id = String(item.id);
  row.href = `./detail.html?id=${encodeURIComponent(item.id)}`;

  const tags = [];
  if (item.isExpired) {
    tags.push('<span class="radar-tag is-expired">已过期</span>');
  } else {
    if (item.isTodayAdded) tags.push('<span class="radar-tag is-new">今日新增</span>');
    if (item.isSoon) {
      const end = parseDate(item.validTo);
      const days = end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000)) : null;
      const soonText = days === null ? '快到期' : days === 0 ? '今天截止' : `剩 ${days} 天`;
      tags.push(`<span class="radar-tag is-soon">${soonText}</span>`);
    }
    if (item.isCredit) tags.push('<span class="radar-tag is-credit">信用卡</span>');
    if (item.isRecurring) tags.push('<span class="radar-tag is-recurring">循环</span>');
  }

  const from = formatRowDate(item.validFrom);
  const to = formatRowDate(item.validTo);
  const dateRange = (from || to) ? `${from || '--'} 至 ${to || '--'}` : '长期有效';
  const metaParts = [item.bankName || '银行活动', dateRange, item.channel || item.consumeChannel, item.region]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const relTime = formatRelativeTime(item);

  row.innerHTML = `
    <span class="radar-rank">
      <i class="radar-status-dot${statusCls ? ` ${statusCls}` : ''}" aria-hidden="true"></i>
      <span class="radar-num">${index}</span>
    </span>
    <div class="radar-row-body">
      <div class="radar-row-line1">
        <span class="radar-row-title">${escapeHtml(item.title || '未命名活动')}</span>
        ${tags.join('')}
      </div>
      <div class="radar-row-meta">${escapeHtml(metaParts.join(' · '))}</div>
    </div>
    <div class="radar-row-side">
      ${relTime ? `<span class="radar-row-time">${escapeHtml(relTime)}</span>` : ''}
      <span class="radar-row-jump" aria-hidden="true">↗</span>
    </div>
  `;

  row.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    if (selectedId && String(item.id) === String(selectedId)) {
      closeDetailDrawer();
      return;
    }
    openDetailDrawer(item);
  });

  return row;
}

function applyFilters() {
  if (!isListPage()) return;

  syncFilterControls();
  updateSidebarCounts();
  if (state.loadStatus !== 'ready') return;

  const result = state.campaigns.filter((item) => matchesAll(item));
  state.filtered = result;

  if (els.resultSummary) {
    const expiredCount = result.filter(item => item.isExpired).length;
    els.resultSummary.textContent = expiredCount
      ? `共 ${result.length} 条 · 含 ${expiredCount} 条已过期`
      : `共 ${result.length} 条`;
  }

  setHomeMeta();
  setLoadingState({ loading: false, error: false, empty: !result.length });
  renderCards();
}

/* =========================================================
   右侧极简活动详情抽屉 + 分享 + 灯箱
   ========================================================= */

function normalizeMediaUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `https://mini.vooqqqm.com${value}`;
  return `https://mini.vooqqqm.com/${value.replace(/^\.?\//, '')}`;
}

function resolvePosterUrl(activity) {
  for (const key of POSTER_FIELDS) {
    const value = activity[key];
    if (typeof value === 'string' && value.trim()) {
      return normalizeMediaUrl(value.trim());
    }
  }
  return '';
}

function buildDiscountText(activity) {
  if (activity.discountMin || activity.discountMin === 0) {
    return `${activity.discountMin} ~ ${activity.discountMax} 元`;
  }
  if (activity.discountAmount || activity.discountAmount === 0) {
    return `${activity.discountAmount} 元`;
  }
  return '--';
}

function getDetailShareUrl(id) {
  return `https://bank.vooqqqm.com/detail.html?id=${encodeURIComponent(id || '')}`;
}

function buildShareText(activity) {
  const lines = [
    `活动标题：${activity.title || '银行活动'}`,
    `立减金额：${buildDiscountText(activity)}`,
    `活动时间：${(activity.validFrom || activity.validTo) ? `${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '--'}`,
    `活动链接：${getDetailShareUrl(activity.id || selectedId)}`
  ];
  return lines.join('\n');
}

function getCleanStatus(activity) {
  const now = new Date();
  const from = parseDate(activity.validFrom);
  const to = parseDate(activity.validTo);
  if (to) to.setHours(23, 59, 59, 999);
  const DAY = 86400000;
  if (from && now < from) {
    return { cls: 'is-soon', text: `${Math.ceil((from - now) / DAY)} 天后开始` };
  }
  if (to && now > to) {
    return { cls: 'is-ended', text: '已结束' };
  }
  if (to) {
    const days = Math.max(0, Math.ceil((to - now) / DAY) - 1);
    return { cls: days <= 20 ? 'is-soon' : 'is-live', text: days === 0 ? '今天截止' : `剩 ${days} 天` };
  }
  return { cls: 'is-live', text: '进行中' };
}

const PURE_URL_RE = /^https?:\/\/\S+$/i;
const INLINE_URL_RE = /https?:\/\/[^\s<>"'）)】]+/gi;
const HAS_PREFIX_MARKER_RE = /^(?:[\d①②③④⑤⑥⑦⑧⑨⑩]+[.、)）]|[-•·*]|[（(]\d+[)）])/;

function formatRuleTextSegment(text, isStartOfLine) {
  let html = escapeHtml(text);
  if (isStartOfLine) {
    html = html.replace(/^([^：:，。,；;|（(\s]{2,14}?)([：:])/, '<span class="clean-rule-key">$1$2</span>');
  }
  html = html.replace(/(\d+(?:\.\d+)?\s*(?:万元|元|万|港元|港币|折))/g, '<span class="clean-num">$1</span>');
  return html;
}

function formatRuleInline(line) {
  const raw = String(line || '');
  const urlRe = new RegExp(INLINE_URL_RE.source, 'gi');
  let out = '';
  let lastIndex = 0;
  let match;

  while ((match = urlRe.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      out += formatRuleTextSegment(raw.slice(lastIndex, match.index), lastIndex === 0);
    }
    const rawUrl = match[0];
    const url = rawUrl.replace(/[。，；、,.!?;:)]+$/, '');
    const trailing = rawUrl.slice(url.length);
    if (url) {
      out += `<a class="clean-inline-link" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)} ↗</a>`;
    }
    if (trailing) {
      out += escapeHtml(trailing);
    }
    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < raw.length) {
    out += formatRuleTextSegment(raw.slice(lastIndex), lastIndex === 0);
  }
  return out;
}

function renderCleanTopCommunity() {
  return `
    <div class="clean-top-links">
      <a class="clean-top-pill is-tg" href="https://t.me/yangmaozhushou" target="_blank" rel="noopener noreferrer">✈ 加入 Telegram 优惠群</a>
      <button type="button" class="clean-top-pill is-wx" data-open-group-qr>💬 微信群二维码</button>
    </div>
  `;
}

function renderCleanRules(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw || raw === '--') return '<p class="clean-p">暂无详细规则</p>';

  const groups = [];
  let current = null;
  raw.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const m = line.match(/^【([^】]+)】\s*(.*)$/);
    if (m) {
      current = { title: m[1], items: [] };
      groups.push(current);
      if (m[2]) current.items.push(m[2]);
      return;
    }
    if (!current) {
      current = { title: '', items: [] };
      groups.push(current);
    }
    current.items.push(line);
  });

  return `<div class="clean-rules-list">${groups.map((g) => {
    const nonUrlCount = g.items.filter((it) => !PURE_URL_RE.test(it)).length;
    return `
      <div class="clean-rule-group">
        ${g.title ? `<h4>${escapeHtml(g.title)}</h4>` : ''}
        <div class="clean-rule-items">
          ${g.items.map((item) => {
            if (PURE_URL_RE.test(item)) {
              return `<p class="clean-p is-url">${formatRuleInline(item)}</p>`;
            }
            if (nonUrlCount > 1 && !HAS_PREFIX_MARKER_RE.test(item)) {
              return `<p class="clean-p is-bullet">${formatRuleInline(item)}</p>`;
            }
            return `<p class="clean-p">${formatRuleInline(item)}</p>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

function renderCleanSteps(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw || raw === '--') return '';
  if (!/→|->|➜|⇒/.test(raw)) {
    return raw.split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => `<p class="clean-p">${formatRuleInline(l)}</p>`).join('');
  }
  const steps = raw
    .split(/\s*(?:→|->|➜|⇒|\n)\s*/)
    .map((s) => s.replace(/[。；;]+$/, '').trim())
    .filter(Boolean);
  return `<ol class="clean-steps">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`;
}

function renderCleanDetailBody(data) {
  const discount = buildDiscountText(data);
  const amountVal = discount !== '--' ? discount : (data.cashbackRate || '');
  const minVal = (data.minAmount || data.minAmount === 0) ? `${data.minAmount} 元` : '';
  const timeVal = (data.validFrom || data.validTo) ? `${data.validFrom || '--'} 至 ${data.validTo || '--'}` : '';
  const channelVal = data.channel || data.consumeChannel || '';
  const regionVal = data.region || '';
  const recurringVal = data.recurringText || '';

  const kvItems = [
    ['优惠额度', amountVal],
    ['最低门槛', minVal],
    ['活动时间', timeVal],
    ['消费渠道', channelVal],
    ['卡组织', data.cardOrg || ''],
    ['适用地区', regionVal],
    ['重复规则', recurringVal]
  ].filter(([, v]) => Boolean(v));

  const posterUrl = resolvePosterUrl(data);
  const pathUrl = String(data.pathUrl || '').trim();
  const isHttpPath = /^https?:\/\//i.test(pathUrl);
  const stepsHtml = renderCleanSteps(data.pathDesc);

  return `
    <div class="clean-detail">
      ${renderCleanTopCommunity()}
      <h2 class="clean-title">${escapeHtml(data.title || '活动详情')}</h2>
      ${data.desc ? `<p class="clean-desc">${escapeHtml(data.desc)}</p>` : ''}

      ${kvItems.length ? `
        <dl class="clean-kv-grid">
          ${kvItems.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}
        </dl>
      ` : ''}

      ${(pathUrl || posterUrl) ? `
        <div class="clean-actions">
          ${isHttpPath ? `<a class="clean-btn is-primary" href="${escapeAttribute(pathUrl)}" target="_blank" rel="noopener noreferrer">直达活动入口 ↗</a>` : ''}
          ${pathUrl ? `<button class="clean-btn" type="button" data-copy-path>复制${isHttpPath ? '链接' : '路径'}</button>` : ''}
          ${posterUrl ? `<button class="clean-btn" type="button" data-open-poster>查看活动图片 / 二维码</button>` : ''}
        </div>
        ${(!isHttpPath && pathUrl) ? `<div class="clean-path-box">${escapeHtml(pathUrl)}</div>` : ''}
      ` : ''}

      ${stepsHtml ? `
        <section class="clean-section">
          <h3>参与路径</h3>
          ${stepsHtml}
        </section>
      ` : ''}

      <section class="clean-section">
        <h3>活动规则</h3>
        ${renderCleanRules(data.awardDesc)}
      </section>

      <footer class="clean-foot">
        <p>活动名额与细则可能变动，实际请以银行官方页面为准。</p>
      </footer>
    </div>
  `;
}

function bindDrawerBodyActions(data) {
  if (!els.drawerBody) return;
  const copyBtn = els.drawerBody.querySelector('[data-copy-path]');
  if (copyBtn && data.pathUrl) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(data.pathUrl);
        const old = copyBtn.textContent;
        copyBtn.textContent = '已复制 ✓';
        setTimeout(() => { copyBtn.textContent = old; }, 1600);
      } catch {
        window.alert('复制失败，请手动复制。');
      }
    });
  }
  const posterUrl = resolvePosterUrl(data);
  const posterBtn = els.drawerBody.querySelector('[data-open-poster]');
  if (posterBtn && posterUrl) {
    posterBtn.addEventListener('click', () => openLightbox(posterUrl, 'poster'));
  }
}

function syncRowSelection() {
  document.querySelectorAll('.radar-row').forEach((row) => {
    row.classList.toggle('is-selected', selectedId && row.dataset.id === String(selectedId));
  });
}

async function openDetailDrawer(listItem) {
  if (!els.detailDrawer || !els.drawerBody) return;
  const id = String(listItem.id);
  selectedId = id;
  currentDrawerActivity = listItem;
  syncRowSelection();

  const status = getCleanStatus(listItem);
  if (els.drawerHeadMeta) {
    els.drawerHeadMeta.innerHTML = `
      <span class="clean-bank-name">${escapeHtml(listItem.bankName || '银行活动')}</span>
      <span class="clean-status ${status.cls}">${escapeHtml(status.text)}</span>
    `;
  }
  if (els.drawerOpenPage) {
    els.drawerOpenPage.href = `./detail.html?id=${encodeURIComponent(id)}`;
  }

  els.detailDrawer.classList.remove('hidden');
  els.detailDrawer.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => els.detailDrawer.classList.add('is-open'));
  if (els.drawerBackdrop) els.drawerBackdrop.classList.remove('hidden');
  document.body.classList.add('drawer-open');

  if (detailCache.has(id)) {
    const cached = detailCache.get(id);
    currentDrawerActivity = cached;
    els.drawerBody.innerHTML = renderCleanDetailBody(cached);
    els.drawerBody.scrollTop = 0;
    bindDrawerBodyActions(cached);
    return;
  }

  els.drawerBody.innerHTML = `
    <div class="clean-detail">
      ${renderCleanTopCommunity()}
      <h2 class="clean-title">${escapeHtml(listItem.title || '加载中…')}</h2>
      ${listItem.desc ? `<p class="clean-desc">${escapeHtml(listItem.desc)}</p>` : ''}
      <div class="clean-loading">正在加载完整活动规则…</div>
    </div>
  `;

  try {
    const resp = await fetch(`${API_BASE}/campaign_detail.php?id=${encodeURIComponent(id)}`, { credentials: 'omit' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const payload = await resp.json();
    const data = (payload && payload.code === 0 && payload.data) ? payload.data : payload;
    if (!data || (!data.id && !data.title)) throw new Error('empty');
    data.tags = normalizeTags(data.tags);
    detailCache.set(id, data);

    if (String(selectedId) !== id) return;
    currentDrawerActivity = data;
    els.drawerBody.innerHTML = renderCleanDetailBody(data);
    els.drawerBody.scrollTop = 0;
    bindDrawerBodyActions(data);
  } catch (err) {
    console.error('加载抽屉详情失败', err);
    if (String(selectedId) !== id) return;
    els.drawerBody.innerHTML = `
      <div class="clean-detail">
        ${renderCleanTopCommunity()}
        <h2 class="clean-title">${escapeHtml(listItem.title || '活动详情')}</h2>
        ${listItem.desc ? `<p class="clean-desc">${escapeHtml(listItem.desc)}</p>` : ''}
        <p class="clean-error">完整规则暂时加载失败，可点击右上角「新窗口 ↗」重试。</p>
      </div>
    `;
  }
}

function closeDetailDrawer() {
  if (!els.detailDrawer) return;
  selectedId = null;
  syncRowSelection();
  els.detailDrawer.classList.remove('is-open');
  els.detailDrawer.classList.add('hidden');
  els.detailDrawer.setAttribute('aria-hidden', 'true');
  if (els.drawerBackdrop) els.drawerBackdrop.classList.add('hidden');
  document.body.classList.remove('drawer-open');
}

function openMobileSidebar() {
  if (!els.radarSidebar) return;
  els.radarSidebar.classList.add('is-mobile-open');
  if (els.sidebarBackdrop) els.sidebarBackdrop.classList.remove('hidden');
  if (els.topMobileMenuBtn) els.topMobileMenuBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('sidebar-open');
}

function closeMobileSidebar() {
  if (!els.radarSidebar) return;
  els.radarSidebar.classList.remove('is-mobile-open');
  if (els.sidebarBackdrop) els.sidebarBackdrop.classList.add('hidden');
  if (els.topMobileMenuBtn) els.topMobileMenuBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('sidebar-open');
}

function openMpQrModal() {
  let modal = document.getElementById('mpQrModal');
  if (!modal) {
    const navQrImg = document.querySelector('.site-nav-qr-pop img');
    const qrSrc = (navQrImg && navQrImg.src) ? navQrImg.src : './assets/miniprogram-qr.jpg';
    modal = document.createElement('div');
    modal.id = 'mpQrModal';
    modal.className = 'mp-qr-modal hidden';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="mp-qr-backdrop" data-close-mp-qr="true"></div>
      <div class="mp-qr-dialog" role="dialog" aria-modal="true" aria-label="微信小程序二维码">
        <img src="${escapeAttribute(qrSrc)}" alt="好羊毛助手微信小程序码" width="250" height="264">
        <p class="mp-qr-title">好羊毛助手小程序</p>
        <p class="mp-qr-hint">微信内可长按图片识别 · 或微信扫一扫</p>
        <button type="button" class="mp-qr-close" data-close-mp-qr="true">关闭</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeMpQrModal() {
  const modal = document.getElementById('mpQrModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function openShareSheet() {
  if (!els.shareSheet || !currentDrawerActivity) return;
  if (els.sharePreview) els.sharePreview.textContent = buildShareText(currentDrawerActivity);
  els.shareSheet.classList.remove('hidden');
  els.shareSheet.setAttribute('aria-hidden', 'false');
}

function closeShareSheet() {
  if (!els.shareSheet) return;
  els.shareSheet.classList.add('hidden');
  els.shareSheet.setAttribute('aria-hidden', 'true');
}

function openLightbox(src, type = 'poster') {
  currentLightboxType = type;
  if (!els.lightbox) {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }
  els.lightboxError.classList.add('hidden');
  els.lightboxImage.classList.remove('hidden');
  els.lightboxImage.src = src;
  els.lightboxRawLink.href = src;
  els.lightbox.classList.remove('hidden');
  els.lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  if (!els.lightbox) return;
  els.lightbox.classList.add('hidden');
  els.lightbox.setAttribute('aria-hidden', 'true');
  els.lightboxImage.src = '';
  els.lightboxRawLink.href = '#';
  els.lightboxError.classList.add('hidden');
  els.lightboxImage.classList.remove('hidden');
}

function setCopiedState(button, idleText, activeText = '已复制') {
  if (!button) return;
  button.textContent = activeText;
  setTimeout(() => { button.textContent = idleText; }, 1600);
}

function bindEvents() {
  if (!isListPage()) return;

  const handleSearch = (value) => {
    state.keyword = value || '';
    applyFilters();
  };

  if (els.searchInput) els.searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  if (els.mobileSearchInput) els.mobileSearchInput.addEventListener('input', (e) => handleSearch(e.target.value));

  if (els.refreshBtn) els.refreshBtn.addEventListener('click', fetchCampaigns);
  if (els.retryLoadBtn) els.retryLoadBtn.addEventListener('click', fetchCampaigns);

  const doReset = () => {
    resetFilters();
    applyFilters();
  };
  if (els.resetFiltersBtn) els.resetFiltersBtn.addEventListener('click', doReset);
  if (els.sidebarResetBtn) els.sidebarResetBtn.addEventListener('click', doReset);

  if (els.viewTabs) {
    els.viewTabs.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-view]');
      if (!btn || !['all', 'debit', 'credit'].includes(btn.dataset.view)) return;
      state.view = btn.dataset.view;
      state.showExpired = false;
      applyFilters();
    });
  }

  if (els.openSidebarBtn) {
    els.openSidebarBtn.addEventListener('click', openMobileSidebar);
  }
  if (els.topMobileMenuBtn) {
    els.topMobileMenuBtn.addEventListener('click', () => {
      if (els.radarSidebar && els.radarSidebar.classList.contains('is-mobile-open')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (els.drawerShareBtn) {
    els.drawerShareBtn.addEventListener('click', openShareSheet);
  }
  if (els.shareSystemBtn) {
    els.shareSystemBtn.addEventListener('click', async () => {
      if (!currentDrawerActivity) return;
      if (!navigator.share) {
        window.alert('当前浏览器暂不支持系统分享，请使用下面的复制按钮。');
        return;
      }
      try {
        await navigator.share({
          title: currentDrawerActivity.title || '银行活动',
          text: buildShareText(currentDrawerActivity),
          url: getDetailShareUrl(currentDrawerActivity.id || selectedId)
        });
      } catch (err) {
        if (err && err.name !== 'AbortError') window.alert('系统分享失败，请改用复制分享文案。');
      }
    });
  }
  if (els.shareCopyTextBtn) {
    els.shareCopyTextBtn.addEventListener('click', async () => {
      if (!currentDrawerActivity) return;
      try {
        await navigator.clipboard.writeText(buildShareText(currentDrawerActivity));
        setCopiedState(els.shareCopyTextBtn, '复制分享文案');
      } catch {
        window.alert('复制失败，请稍后重试。');
      }
    });
  }
  if (els.shareCopyLinkBtn) {
    els.shareCopyLinkBtn.addEventListener('click', async () => {
      if (!currentDrawerActivity) return;
      try {
        const id = currentDrawerActivity.id || selectedId;
        await navigator.clipboard.writeText(`${currentDrawerActivity.title || '银行活动'}｜${getDetailShareUrl(id)}`);
        setCopiedState(els.shareCopyLinkBtn, '复制分享链接');
      } catch {
        window.alert('复制失败，请稍后重试。');
      }
    });
  }

  if (els.lightboxImage) {
    els.lightboxImage.addEventListener('error', () => {
      els.lightboxImage.classList.add('hidden');
      if (currentLightboxType === 'group') {
        els.lightboxErrorTitle.textContent = '群二维码暂时无法显示';
        els.lightboxErrorText.textContent = '固定微信群二维码暂时无法访问，可尝试新窗口打开。';
      } else {
        els.lightboxErrorTitle.textContent = '图片加载失败';
        els.lightboxErrorText.textContent = '当前图片地址可能已失效或禁止跨域访问。';
      }
      els.lightboxError.classList.remove('hidden');
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-mp-qr="true"]')) {
      closeMpQrModal();
      return;
    }

    const qrBox = event.target.closest('.site-nav-qr');
    document.querySelectorAll('.site-nav-qr.is-open').forEach((el) => {
      if (el !== qrBox) {
        el.classList.remove('is-open');
        const b = el.querySelector('.site-nav-qr-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
    if (qrBox && event.target.closest('.site-nav-qr-btn')) {
      if (window.matchMedia('(max-width: 860px)').matches) {
        openMpQrModal();
        return;
      }
      const opened = qrBox.classList.toggle('is-open');
      const b = qrBox.querySelector('.site-nav-qr-btn');
      if (b) b.setAttribute('aria-expanded', String(opened));
    }

    if (
      selectedId &&
      !event.target.closest('#detailDrawer') &&
      !event.target.closest('.radar-row') &&
      !event.target.closest('#shareSheet') &&
      !event.target.closest('#imageLightbox') &&
      !event.target.closest('#mpQrModal')
    ) {
      closeDetailDrawer();
    }

    const quickBtn = event.target.closest('[data-quick]');
    if (quickBtn) {
      const q = quickBtn.dataset.quick;
      state.quick = (q !== 'all' && state.quick === q) ? 'all' : q;
      state.showExpired = false;
      applyFilters();
      return;
    }

    const navLink = event.target.closest('[data-nav-view]');
    if (navLink) {
      event.preventDefault();
      const targetView = navLink.dataset.navView;
      if (['all', 'debit', 'credit'].includes(targetView)) {
        resetFilters();
        state.view = targetView;
        applyFilters();
      }
      return;
    }

    if (event.target.closest('[data-open-group-qr]')) {
      openLightbox(GROUP_QR_URL, 'group');
      return;
    }
    if (event.target.closest('[data-close-sidebar="true"]')) {
      closeMobileSidebar();
      return;
    }
    if (event.target.closest('[data-close-drawer="true"]')) {
      closeDetailDrawer();
      return;
    }
    if (event.target.closest('[data-close-share="true"]')) {
      closeShareSheet();
      return;
    }
    if (event.target.closest('[data-close-lightbox="true"]')) {
      closeLightbox();
      return;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const mpModal = document.getElementById('mpQrModal');
      if (mpModal && !mpModal.classList.contains('hidden')) return closeMpQrModal();
      document.querySelectorAll('.site-nav-qr.is-open').forEach((el) => {
        el.classList.remove('is-open');
        const b = el.querySelector('.site-nav-qr-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (els.lightbox && !els.lightbox.classList.contains('hidden')) return closeLightbox();
      if (els.shareSheet && !els.shareSheet.classList.contains('hidden')) return closeShareSheet();
      if (els.detailDrawer && !els.detailDrawer.classList.contains('hidden')) return closeDetailDrawer();
      if (els.radarSidebar && els.radarSidebar.classList.contains('is-mobile-open')) return closeMobileSidebar();
      return;
    }
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (els.searchInput && els.searchInput.offsetParent !== null) {
      event.preventDefault();
      els.searchInput.focus();
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
  if (!hadData) {
    state.loadStatus = 'loading';
    if (els.resultSummary) els.resultSummary.textContent = '正在加载…';
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
  } catch (err) {
    const message = controller.signal.aborted ? '活动加载超时' : '活动加载失败';
    if (!hadData) {
      state.loadStatus = 'error';
      if (els.resultSummary) els.resultSummary.textContent = '暂未载入';
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
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initializeCampaignPage() {
  if (!isListPage()) return;

  mountTopCategories();
  mountCardOrgFilters();
  mountBankGroups();
  mountMiniChips(els.payFilters, PAY_OPTIONS, 'pay');
  mountMiniChips(els.regionFilters, REGION_OPTIONS, 'regionGroup');
  mountMiniChips(els.sceneFilters, SCENE_OPTIONS, 'scene');
  bindEvents();

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  if (query) state.keyword = query;
  const view = params.get('view');
  if (view && ['credit', 'debit'].includes(view)) state.view = view;
  const shouldOpenMenu = params.get('menu') === '1';

  syncFilterControls();
  updateSidebarCounts();
  if (shouldOpenMenu && window.matchMedia('(max-width: 860px)').matches) {
    openMobileSidebar();
    params.delete('menu');
    const cleanSearch = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${window.location.hash || ''}`;
    window.history.replaceState(null, '', cleanUrl);
  }
  fetchCampaigns();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCampaignPage, { once: true });
} else {
  initializeCampaignPage();
}
