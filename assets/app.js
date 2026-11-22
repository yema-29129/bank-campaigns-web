const API_BASE = 'https://mini.vooqqqm.com/api';
const OVERSEAS_CATALOG_PATH = './activities/overseas-catalog.json';
const WEBSITE_BLACK_FRIDAY_PATH = './activities/topics/black-friday-2026.html';
const CAMPAIGN_LOAD_TIMEOUT = 12000;
const EXPIRING_SOON_DAYS = 20;
const DEFAULT_SORT_MODE = 'added';
const SORT_MODES = new Set([DEFAULT_SORT_MODE, 'recommended', 'ending', 'starting', 'discount', 'merchant']);
const GROUP_QR_URL = 'https://github.com/yema-29129/bank-campaigns-web/blob/main/assets/group-wechat-qr.png?raw=true';
const WECHAT_CONTACT_QR_URL = './assets/wechat-contact-qr.jpg';

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

const INVOICE_PRIZE_RE = /有奖发票|发票(?:抽奖|摇奖|兑奖|开奖)|(?:消费|数电|电子)?发票[^。；;，,\n]{0,18}(?:抽|奖|红包|消费券)/;
const PUBLIC_BENEFIT_EXPLICIT_RE = /惠民|普惠促消费|政府消费券|消费补贴|促消费(?:活动|券)|文旅惠民|惠享消费/;
const PUBLIC_AGENCY_RE = /人民政府|商务局|商务厅|商务委|商务委员会|文化和旅游|文旅厅|文旅局|体育局|财政局|工业和信息化|经济技术开发区|管委会/;
const PUBLIC_BENEFIT_RE = /消费券|补贴|红包|促消费|满\d+(?:\.\d+)?(?:元)?减|\d+(?:\.\d+)?折|立减|优惠券|文旅券|餐饮券|零售券|购车|家电|数码|体育惠民|成品油券|加油券|票根当钱花/;

function classifyPublicBenefitType(activity = {}) {
  const tags = Array.isArray(activity.tags) ? activity.tags : [];
  const text = [
    activity.title, activity.desc, activity.awardDesc, activity.pathDesc,
    activity.channel, activity.consumeChannel, activity.region, ...tags
  ].filter(Boolean).join(' ');
  if (INVOICE_PRIZE_RE.test(text)) return '发票有奖';
  if (PUBLIC_BENEFIT_EXPLICIT_RE.test(text)) return '惠民活动';

  const organizer = [activity.bankName, activity.title].filter(Boolean).join(' ');
  return PUBLIC_AGENCY_RE.test(organizer) && PUBLIC_BENEFIT_RE.test(text)
    ? '惠民活动'
    : '';
}

const SCENE_OPTIONS = ['全部', '吃喝', '购物', '出行', '境外游', '海外活动', '生活', '发票有奖', '会员权益', '通用优惠', '黑五优惠'];

const TOP_CATEGORIES = [
  { key: 'all', label: '全部', scene: '全部', cashback: false },
  { key: 'overseas-deals', label: '海外活动', scene: '海外活动', cashback: false },
  { key: 'food', label: '吃喝', scene: '吃喝', cashback: false },
  { key: 'shopping', label: '购物', scene: '购物', cashback: false },
  { key: 'travel', label: '出行', scene: '出行', cashback: false },
  { key: 'overseas', label: '境外游', scene: '境外游', cashback: false },
  { key: 'cashback', label: '返现', scene: '全部', cashback: true },
  { key: 'life', label: '生活', scene: '生活', cashback: false },
  { key: 'invoice-benefit', label: '发票有奖', scene: '发票有奖', cashback: false },
  { key: 'vip', label: '会员权益', scene: '会员权益', cashback: false },
  { key: 'general', label: '通用优惠', scene: '通用优惠', cashback: false },
  { key: 'black-friday', label: '黑五优惠', scene: '黑五优惠', cashback: false }
];

const BLACK_FRIDAY_VPS_RE = /VPS|云主机|云服务器|云服务|独立服务器|虚拟主机|网站托管|主机托管|域名|Hostinger|OVHcloud|Cloudways|Namecheap|Porkbun|ScalaHosting|web\s*hosting/i;
const BLACK_FRIDAY_DIGITAL_RE = /数码|家电|手机|iPhone|MacBook|Mac\s*mini|AirPods|Apple\s*Watch|电脑|电视|相机|耳机|智能手表|配件|打印机|Dyson|MediaMarkt|Samsung|三星|PB\s*Tech|Best\s*Buy|Currys/i;
const BLACK_FRIDAY_ECOMMERCE_RE = /海淘|跨境电商|电商|网购|购物|百货|商城|商场|超市|日用品|美妆|护肤|服饰|运动鞋|礼卡|Amazon|亚马逊|Walmart|Target|Bloomingdale|Kohl|LEGO|乐高|Rakuten|乐天|伊藤洋华堂|Green\s*Beans|MUSINSA|Nike|OLIVE\s*YOUNG|Coupang|Costco|Magalu/i;
const BLACK_FRIDAY_TRAVEL_RE = /旅行|旅游|机票|航空|航班|邮轮|游轮|船票|eSIM|漫游|流量|Airalo|Ubigi|租车|交通|中华航空|国泰航空|皇家加勒比/i;
const BLACK_FRIDAY_HOTEL_RE = /酒店|住宿|订房|房型|房晚|套房|度假村|Trip\.com|Marriott|万豪|Hilton|希尔顿|Hyatt|凯悦|IHG|洲际|Accor|雅高/i;
const BLACK_FRIDAY_SOFTWARE_RE = /软件|SaaS|订阅|许可证|license|Creative\s*Cloud|Adobe|Microsoft\s*365|Canva|Notion|Dropbox|云盘/i;
const BLACK_FRIDAY_GAMING_RE = /游戏|Nintendo|任天堂|Switch|Xbox|PlayStation|PSN|PS\s*Plus|主机游戏|游戏机|手柄/i;
const BLACK_FRIDAY_PAYMENT_RE = /信用卡|银行卡|卡组织|Visa|万事达|Mastercard|运通|American\s*Express|银联|Apple\s*Pay|支付|返现|刷卡金|账单金|银行/i;
const KNOWN_BLACK_FRIDAY_TYPE_RE = new RegExp([
  BLACK_FRIDAY_VPS_RE.source,
  BLACK_FRIDAY_DIGITAL_RE.source,
  BLACK_FRIDAY_ECOMMERCE_RE.source,
  BLACK_FRIDAY_TRAVEL_RE.source,
  BLACK_FRIDAY_HOTEL_RE.source,
  BLACK_FRIDAY_SOFTWARE_RE.source,
  BLACK_FRIDAY_GAMING_RE.source,
  BLACK_FRIDAY_PAYMENT_RE.source
].join('|'), 'i');

const BLACK_FRIDAY_TYPE_OPTIONS = [
  { key: '全部', label: '全部黑五', test: () => true },
  { key: 'VPS/云服务', label: 'VPS/云服务', test: (text) => BLACK_FRIDAY_VPS_RE.test(text) },
  { key: '数码家电', label: '数码家电', test: (text) => BLACK_FRIDAY_DIGITAL_RE.test(text) },
  { key: '海淘电商', label: '海淘电商', test: (text) => BLACK_FRIDAY_ECOMMERCE_RE.test(text) },
  { key: '旅行出行', label: '旅行出行', test: (text) => BLACK_FRIDAY_TRAVEL_RE.test(text) },
  { key: '酒店住宿', label: '酒店住宿', test: (text) => BLACK_FRIDAY_HOTEL_RE.test(text) },
  { key: '软件订阅', label: '软件订阅', test: (text) => BLACK_FRIDAY_SOFTWARE_RE.test(text) },
  { key: '游戏娱乐', label: '游戏娱乐', test: (text) => BLACK_FRIDAY_GAMING_RE.test(text) },
  { key: '支付/信用卡', label: '支付/信用卡', test: (text) => BLACK_FRIDAY_PAYMENT_RE.test(text) },
  { key: '其他黑五', label: '其他黑五', test: (text) => !KNOWN_BLACK_FRIDAY_TYPE_RE.test(text) }
];

const KNOWN_FOOD_TYPE_RE = /餐饮|餐厅|饭店|酒楼|中餐|西餐|火锅|烤肉|日料|料理|咖啡|星巴克|瑞幸|茶饮|奶茶|喜茶|奈雪|茶百道|霸王茶姬|库迪|Manner|麦当劳|肯德基|汉堡|快餐|小吃|必胜客|汉堡王|达美乐|德克士|外卖|饿了么|美团外卖|到家|配送|烘焙|蛋糕|甜品|面包|糕点|冰淇淋|冰激凌|酒吧|夜宵|啤酒|清吧|烧烤/i;

const FOOD_TYPE_OPTIONS = [
  { key: '全部', label: '全部吃喝', test: () => true },
  { key: '餐厅正餐', label: '餐厅正餐', test: (text) => /餐饮|餐厅|饭店|酒楼|中餐|西餐|火锅|烤肉|日料|料理/.test(text) },
  { key: '咖啡茶饮', label: '咖啡茶饮', test: (text) => /咖啡|星巴克|瑞幸|茶饮|奶茶|喜茶|奈雪|茶百道|霸王茶姬|库迪|Manner/i.test(text) },
  { key: '快餐小吃', label: '快餐小吃', test: (text) => /麦当劳|肯德基|汉堡|快餐|小吃|必胜客|汉堡王|达美乐|德克士/.test(text) },
  { key: '外卖到家', label: '外卖到家', test: (text) => /外卖|饿了么|美团外卖|到家|配送/.test(text) },
  { key: '烘焙甜品', label: '烘焙甜品', test: (text) => /烘焙|蛋糕|甜品|面包|糕点|冰淇淋|冰激凌/.test(text) },
  { key: '酒吧夜宵', label: '酒吧夜宵', test: (text) => /酒吧|夜宵|啤酒|清吧|烧烤/.test(text) },
  { key: '其他吃喝', label: '其他吃喝', test: (text) => !KNOWN_FOOD_TYPE_RE.test(text) }
];

const KNOWN_SHOPPING_TYPE_RE = /超市|商超|便利店|山姆|盒马|永辉|沃尔玛|大润发|罗森|7-Eleven|京东|淘宝|天猫|拼多多|唯品会|抖音商城|苏宁|小红书|得物|百货|商场|购物中心|奥特莱斯|银泰|万象城|SOGO|SKP|手机|数码|家电|电脑|电器|苹果|Apple Store|小米|华为|国美|服饰|服装|鞋|箱包|美妆|护肤|化妆品|珠宝|黄金|家居|家具|家装|宜家|IKEA|日用品|母婴|亲子|儿童|玩具|宝宝/i;

const SHOPPING_TYPE_OPTIONS = [
  { key: '全部', label: '全部购物', test: () => true },
  { key: '商超便利', label: '商超便利', test: (text) => /超市|商超|便利店|山姆|盒马|永辉|沃尔玛|大润发|罗森|7-Eleven/i.test(text) },
  { key: '电商平台', label: '电商平台', test: (text) => /京东|淘宝|天猫|拼多多|唯品会|抖音商城|苏宁|小红书|得物/.test(text) },
  { key: '百货商场', label: '百货商场', test: (text) => /百货|商场|购物中心|奥特莱斯|银泰|万象城|SOGO|SKP/i.test(text) },
  { key: '数码家电', label: '数码家电', test: (text) => /手机|数码|家电|电脑|电器|苹果|Apple Store|小米|华为|苏宁易购|国美/i.test(text) },
  { key: '服饰美妆', label: '服饰美妆', test: (text) => /服饰|服装|鞋|箱包|美妆|护肤|化妆品|珠宝|黄金/.test(text) },
  { key: '家居生活', label: '家居生活', test: (text) => /家居|家具|家装|宜家|IKEA|日用品/i.test(text) },
  { key: '母婴亲子', label: '母婴亲子', test: (text) => /母婴|亲子|儿童|玩具|宝宝/.test(text) },
  { key: '其他购物', label: '其他购物', test: (text) => !KNOWN_SHOPPING_TYPE_RE.test(text) }
];

const KNOWN_OVERSEAS_DESTINATION_RE = /中国香港|香港|中国澳门|澳门|中国台湾|台湾|日本|东京|大阪|京都|冲绳|北海道|韩国|首尔|济州|釜山|东南亚|新加坡|泰国|曼谷|清迈|普吉|马来西亚|吉隆坡|槟城|沙巴|印度尼西亚|印尼|巴厘岛|雅加达|越南|河内|胡志明|岘港|菲律宾|马尼拉|长滩岛|宿务|柬埔寨|老挝|缅甸|文莱|美国|美利坚|纽约|洛杉矶|旧金山|夏威夷|关岛|加拿大|温哥华|多伦多|欧洲|欧盟|英国|法国|德国|意大利|西班牙|瑞士|荷兰|奥地利|葡萄牙|希腊|北欧|挪威|瑞典|芬兰|丹麦|冰岛|澳大利亚|澳洲|悉尼|墨尔本|布里斯班|珀斯|新西兰|奥克兰|皇后镇|中东|阿联酋|迪拜|阿布扎比|卡塔尔|多哈|沙特|土耳其|以色列/;

// Destination filters are coverage filters, not literal keyword filters. A campaign
// that applies to all overseas spending also applies in Japan, the US, Europe, etc.
const BROAD_OVERSEAS_SCOPE_RE = /境外|海外|国外|出境|跨境|全球|全世界|世界各地|全球范围|国际(?:消费|签账|交易|支付|商户)|外币(?:消费|签账|交易|支付)/i;
const OVERSEAS_REGIONAL_SCOPE_RE = /港澳台|大湾区|亚洲|亚太|东亚|东南亚|北美|南美|美洲|欧洲|欧盟|大洋洲|中东|西亚/;
const OVERSEAS_DESTINATION_SCOPE = {
  '中国香港': { explicit: /中国香港|香港/, regional: /港澳台|大湾区/ },
  '中国澳门': { explicit: /中国澳门|澳门/, regional: /港澳台|大湾区/ },
  '中国台湾': { explicit: /中国台湾|台湾/, regional: /港澳台/ },
  '日本': { explicit: /日本|东京|大阪|京都|冲绳|北海道/, regional: /亚洲|亚太|东亚/ },
  '韩国': { explicit: /韩国|首尔|济州|釜山/, regional: /亚洲|亚太|东亚/ },
  '泰国': { explicit: /泰国|曼谷|清迈|普吉/, regional: /东南亚|亚洲|亚太/ },
  '东南亚': { explicit: /东南亚|新加坡|泰国|马来西亚|印度尼西亚|印尼|越南|菲律宾|柬埔寨|老挝|缅甸|文莱|巴厘岛/, regional: /亚洲|亚太/ },
  '美国': { explicit: /美国|美利坚|纽约|洛杉矶|旧金山|夏威夷|关岛/, regional: /北美|美洲/ },
  '欧洲': { explicit: /欧洲|欧盟|英国|法国|德国|意大利|西班牙|瑞士|荷兰|奥地利|葡萄牙|希腊|北欧|挪威|瑞典|芬兰|丹麦|冰岛/ },
  '澳新': { explicit: /澳大利亚|澳洲|悉尼|墨尔本|布里斯班|珀斯|新西兰|奥克兰|皇后镇/, regional: /大洋洲|亚太/ },
  '中东': { explicit: /中东|阿联酋|迪拜|阿布扎比|卡塔尔|多哈|沙特|土耳其|以色列/, regional: /西亚/ }
};

const DESTINATION_EXCLUSION_WORDS = '不含|不包括|不适用|不支持|不覆盖|排除|除外|不可用于|不能用于|不参与';

function stripIssuerOnlyPhrases(text) {
  return String(text || '')
    .replace(/(?:中国香港|香港|中国澳门|澳门|中国台湾|台湾|日本|韩国|泰国|美国|英国|法国|德国|澳大利亚|澳洲|新西兰|境外|海外|国外)(?:地区)?(?:发行|发卡|银行卡|信用卡|银联卡|卡片|账户|客户)/g, '')
    .replace(/(?:中国香港|香港|中国澳门|澳门|中国台湾|台湾|日本|韩国|泰国|美国|英国|法国|德国|澳大利亚|澳洲|新西兰)(?:地区)?(?:出发|始发|起飞)/g, '')
    .replace(/(?:发卡|发行|持卡|账户)地区[^。；;，,\n]{0,24}/g, '');
}

function overseasTitleScope(title) {
  const parts = String(title || '').split('·');
  return parts.length > 1 ? parts.slice(1).join('·') : parts[0];
}

function hasDestinationExclusion(text, destinationPattern) {
  const source = destinationPattern.source;
  const before = new RegExp(`(?:${DESTINATION_EXCLUSION_WORDS})[^。；;，,\\n]{0,20}(?:${source})`, 'i');
  const after = new RegExp(`(?:${source})[^。；;，,\\n]{0,12}(?:${DESTINATION_EXCLUSION_WORDS})`, 'i');
  return before.test(text) || after.test(text);
}

function isRestrictedToAnotherDestination(text, destinationPattern) {
  const restrictions = String(text || '').match(/(?:仅限|只限|限于|仅适用于|只适用于)[^。；;，,\n]{1,40}/g) || [];
  return restrictions.some((segment) => (
    KNOWN_OVERSEAS_DESTINATION_RE.test(segment) && !destinationPattern.test(segment)
  ));
}

function hasNamedDestinationRestriction(text) {
  const restrictions = String(text || '').match(/(?:仅限|只限|限于|仅适用于|只适用于)[^。；;，,\n]{1,40}/g) || [];
  return restrictions.some((segment) => KNOWN_OVERSEAS_DESTINATION_RE.test(segment));
}

function matchesOverseasDestination(item, selected) {
  if (!selected || selected === '全部') return true;
  const regionText = stripIssuerOnlyPhrases(item.overseasRegionText || '');
  const campaignText = stripIssuerOnlyPhrases(item.overseasCampaignText || item.overseasDestinationText || '');
  const scopeText = stripIssuerOnlyPhrases(item.overseasScopeText || campaignText);
  const text = `${regionText} ${campaignText}`.trim();
  const option = OVERSEAS_DESTINATION_OPTIONS.find((entry) => entry.key === selected);
  const regionIsBroad = BROAD_OVERSEAS_SCOPE_RE.test(regionText);
  const campaignIsBroad = BROAD_OVERSEAS_SCOPE_RE.test(scopeText);
  const fullCampaignIsBroad = BROAD_OVERSEAS_SCOPE_RE.test(campaignText);
  const regionHasSpecificScope = KNOWN_OVERSEAS_DESTINATION_RE.test(regionText) || OVERSEAS_REGIONAL_SCOPE_RE.test(regionText);
  const campaignHasSpecificScope = KNOWN_OVERSEAS_DESTINATION_RE.test(scopeText) || OVERSEAS_REGIONAL_SCOPE_RE.test(scopeText);

  if (selected === '其他境外') {
    if (hasNamedDestinationRestriction(text)) return false;
    if (regionHasSpecificScope && !regionIsBroad) return false;
    if (campaignHasSpecificScope && !campaignIsBroad) return false;
    if (regionIsBroad || campaignIsBroad || fullCampaignIsBroad) return true;
    return !regionHasSpecificScope && !campaignHasSpecificScope;
  }

  const scope = OVERSEAS_DESTINATION_SCOPE[selected];
  if (!scope) return option ? option.test(text) : true;
  if (hasDestinationExclusion(text, scope.explicit)) return false;
  if (isRestrictedToAnotherDestination(text, scope.explicit)) return false;

  const selectedRegionMatches = !!(scope.regional && scope.regional.test(regionText));
  const selectedCampaignMatches = scope.explicit.test(scopeText) || !!(scope.regional && scope.regional.test(scopeText));

  // A broad region such as "境外" covers every destination, unless the actual
  // offer title narrows it to Japan, Europe, another country, or a region.
  // The issuer prefix before "·" and generic tags are excluded from scopeText,
  // so "香港某银行信用卡·日本指定商户" is treated as Japan-only.
  if (regionIsBroad) {
    if (campaignHasSpecificScope && !campaignIsBroad) return selectedCampaignMatches;
    return true;
  }

  // A specific region field is authoritative. Do not let a generic tag such as
  // "境外返现" turn a Macau-only or Europe-only campaign into a Japan result.
  if (regionHasSpecificScope) return selectedRegionMatches || scope.explicit.test(regionText);

  if (selectedCampaignMatches) return true;
  if (campaignHasSpecificScope && !campaignIsBroad && !selectedCampaignMatches) return false;

  return campaignIsBroad || fullCampaignIsBroad || (!regionHasSpecificScope && !campaignHasSpecificScope);
}

const OVERSEAS_DESTINATION_OPTIONS = [
  { key: '全部', label: '全部境外', test: () => true },
  { key: '中国香港', label: '中国香港', test: (text) => /中国香港|香港/.test(text) },
  { key: '中国澳门', label: '中国澳门', test: (text) => /中国澳门|澳门/.test(text) },
  { key: '中国台湾', label: '中国台湾', test: (text) => /中国台湾|台湾/.test(text) },
  { key: '日本', label: '日本', test: (text) => /日本|东京|大阪|京都|冲绳|北海道/.test(text) },
  { key: '韩国', label: '韩国', test: (text) => /韩国|首尔|济州|釜山/.test(text) },
  { key: '泰国', label: '泰国', test: (text) => /泰国|曼谷|清迈|普吉/.test(text) },
  { key: '东南亚', label: '东南亚', test: (text) => /东南亚|新加坡|泰国|马来西亚|印度尼西亚|印尼|越南|菲律宾|柬埔寨|老挝|缅甸|文莱|巴厘岛/.test(text) },
  { key: '美国', label: '美国', test: (text) => /美国|美利坚|纽约|洛杉矶|旧金山|夏威夷|关岛/.test(text) },
  { key: '欧洲', label: '欧洲', test: (text) => /欧洲|欧盟|英国|法国|德国|意大利|西班牙|瑞士|荷兰|奥地利|葡萄牙|希腊|北欧|挪威|瑞典|芬兰|丹麦|冰岛/.test(text) },
  { key: '澳新', label: '澳新', test: (text) => /澳大利亚|澳洲|悉尼|墨尔本|布里斯班|珀斯|新西兰|奥克兰|皇后镇/.test(text) },
  { key: '中东', label: '中东', test: (text) => /中东|阿联酋|迪拜|阿布扎比|卡塔尔|多哈|沙特|土耳其|以色列/.test(text) },
  { key: '其他境外', label: '其他境外', test: (text) => !KNOWN_OVERSEAS_DESTINATION_RE.test(text) }
];

const KNOWN_TRAVEL_MODE_RE = /机票|航空|航班|飞机|飞猪|高铁|火车|铁路|12306|动车|列车|船舶|轮船|船票|邮轮|游轮|客轮|渡轮|滴滴|打车|出租车|网约车|的士|T3出行|曹操出行|高德打车|花小猪|公交|地铁|八达通|交通卡|乘车码|一卡通|轨道交通|加油|加气|充电桩|停车|高速|ETC|洗车|自驾|车主|租车|酒店|住宿|订房|宾馆|民宿|旅馆|度假村|景区|景点|门票|乐园|主题公园|博物馆|机场|贵宾厅|休息室|接送机/;

const TRAVEL_MODE_OPTIONS = [
  { key: '全部', label: '全部出行', test: () => true },
  { key: '飞机', label: '飞机', test: (text) => /机票|航空|航班|飞机|飞猪/.test(text) },
  { key: '高铁/火车', label: '高铁/火车', test: (text) => /高铁|火车|铁路|12306|动车|列车/.test(text) },
  { key: '打车', label: '打车', test: (text) => /滴滴|打车|出租车|网约车|的士|T3出行|曹操出行|高德打车|花小猪/.test(text) },
  { key: '公交/地铁', label: '公交/地铁', test: (text) => /公交|地铁|八达通|交通卡|乘车码|一卡通|轨道交通/.test(text) },
  { key: '酒店住宿', label: '酒店住宿', test: (text) => /酒店|住宿|订房|宾馆|民宿|旅馆|度假村/.test(text) },
  { key: '景区门票', label: '景区门票', test: (text) => /景区|景点|门票|乐园|主题公园|博物馆/.test(text) },
  { key: '自驾/加油', label: '自驾/加油', test: (text) => /加油|加气|充电桩|停车|高速|ETC|洗车|自驾|车主/.test(text) },
  { key: '租车', label: '租车', test: (text) => /租车|神州租车|一嗨租车/.test(text) },
  { key: '机场服务', label: '机场服务', test: (text) => /机场|贵宾厅|休息室|接送机|机场停车/.test(text) },
  { key: '船舶/邮轮', label: '船舶/邮轮', test: (text) => /船舶|轮船|船票|邮轮|游轮|客轮|渡轮/.test(text) },
  { key: '其他出行', label: '其他出行', test: (text) => !KNOWN_TRAVEL_MODE_RE.test(text) }
];

const KNOWN_CASHBACK_TYPE_RE = /返\d+(?:\.\d+)?%|百分之|笔笔返|返现率|返\d+(?:\.\d+)?(?:元|港币|美元)|返现\d+|返人民币|返港币|返美元|刷卡金|账单金|消费金|抵扣金|达标|累计消费|消费满|境外|海外|国外|跨境|港澳|新户|新客|首刷|首绑|首次|微信|支付宝|云闪付|线上支付|快捷支付/i;

const CASHBACK_TYPE_OPTIONS = [
  { key: '全部', label: '全部返现', test: () => true },
  { key: '比例返现', label: '比例返现', test: (text) => /返\d+(?:\.\d+)?%|百分之|笔笔返|返现率/.test(text) },
  { key: '固定金额返现', label: '固定金额返现', test: (text) => /返\d+(?:\.\d+)?(?:元|港币|美元)|返现\d+|返(?:人民币|港币|美元)/.test(text) },
  { key: '刷卡金/账单金', label: '刷卡金/账单金', test: (text) => /刷卡金|账单金|消费金|抵扣金/.test(text) },
  { key: '达标返现', label: '达标返现', test: (text) => /达标|累计消费|满\d+[^。；;，,]*返|消费满/.test(text) },
  { key: '境外返现', label: '境外返现', test: (text) => /境外|海外|国外|跨境|港澳/.test(text) },
  { key: '新户/首刷', label: '新户/首刷', test: (text) => /新户|新客|首刷|首绑|首次/.test(text) },
  { key: '线上支付返现', label: '线上支付返现', test: (text) => /微信|支付宝|云闪付|线上支付|快捷支付/.test(text) },
  { key: '其他返现', label: '其他返现', test: (text) => !KNOWN_CASHBACK_TYPE_RE.test(text) }
];

const KNOWN_LIFE_TYPE_RE = /话费|流量|手机充值|通信|宽带|电信|移动|联通|水费|电费|燃气|水电|供暖|生活缴费|物业|社保|公积金|交通罚款|医疗|医院|药店|健康|体检|牙科|口腔|运动|健身|体育|瑜伽|游泳|电影|影院|演出|音乐|游戏|KTV|娱乐|洗衣|家政|保洁|维修|快递|洗护|保险|保费/i;

const LIFE_TYPE_OPTIONS = [
  { key: '全部', label: '全部生活', test: () => true },
  { key: '话费流量', label: '话费流量', test: (text) => /话费|流量|手机充值|通信|宽带|电信|移动|联通/.test(text) },
  { key: '水电燃气', label: '水电燃气', test: (text) => /水费|电费|燃气|水电|供暖/.test(text) },
  { key: '日常缴费', label: '日常缴费', test: (text) => /生活缴费|物业|社保|公积金|交通罚款|缴费/.test(text) },
  { key: '医疗健康', label: '医疗健康', test: (text) => /医疗|医院|药店|健康|体检|牙科|口腔/.test(text) },
  { key: '运动健身', label: '运动健身', test: (text) => /运动|健身|体育|瑜伽|游泳/.test(text) },
  { key: '影音娱乐', label: '影音娱乐', test: (text) => /电影|影院|演出|音乐|游戏|KTV|娱乐/i.test(text) },
  { key: '洗护家政', label: '洗护家政', test: (text) => /洗衣|家政|保洁|维修|快递|洗护/.test(text) },
  { key: '保险保障', label: '保险保障', test: (text) => /保险|保费/.test(text) },
  { key: '其他生活', label: '其他生活', test: (text) => !KNOWN_LIFE_TYPE_RE.test(text) }
];

const KNOWN_MEMBER_BENEFIT_RE = /腾讯视频|爱奇艺|优酷|芒果|哔哩|视频会员|QQ音乐|网易云|喜马拉雅|音乐会员|阅读会员|知乎|WPS|贵宾厅|休息室|机场|高铁贵宾|酒店|住宿|房晚|早餐|延迟退房|餐饮|咖啡|茶饮|美食|餐厅|京东PLUS|88VIP|淘宝|天猫|苏宁|电商会员|打车|滴滴|加油|租车|出行|白金卡|钻石卡|高端卡|年费|积分兑换|权益平台/i;

const MEMBER_BENEFIT_OPTIONS = [
  { key: '全部', label: '全部权益', test: () => true },
  { key: '视频会员', label: '视频会员', test: (text) => /腾讯视频|爱奇艺|优酷|芒果|哔哩|视频会员/.test(text) },
  { key: '音乐阅读', label: '音乐阅读', test: (text) => /QQ音乐|网易云|喜马拉雅|音乐会员|阅读会员|知乎|WPS/i.test(text) },
  { key: '机场/高铁贵宾', label: '机场/高铁贵宾', test: (text) => /贵宾厅|休息室|机场|高铁贵宾/.test(text) },
  { key: '酒店权益', label: '酒店权益', test: (text) => /酒店|住宿|房晚|早餐|延迟退房/.test(text) },
  { key: '餐饮权益', label: '餐饮权益', test: (text) => /餐饮|咖啡|茶饮|美食|餐厅/.test(text) },
  { key: '电商会员', label: '电商会员', test: (text) => /京东PLUS|88VIP|淘宝|天猫|苏宁|电商会员/i.test(text) },
  { key: '出行权益', label: '出行权益', test: (text) => /打车|滴滴|加油|租车|出行/.test(text) },
  { key: '银行专属权益', label: '银行专属权益', test: (text) => /白金卡|钻石卡|高端卡|年费|积分兑换|权益平台/.test(text) },
  { key: '其他权益', label: '其他权益', test: (text) => !KNOWN_MEMBER_BENEFIT_RE.test(text) }
];

const KNOWN_GENERAL_DISCOUNT_RE = /微信立减金|微信支付|微信|支付宝|支付宝红包|云闪付|银联|数字人民币|数币|手机银行|掌上银行|掌银|银行App|生活App|消费券|红包|优惠券|券包|满\d|随机减|立减|满减|抽奖|积分|签到|任务/i;

const GENERAL_DISCOUNT_OPTIONS = [
  { key: '全部', label: '全部通用', test: () => true },
  { key: '微信立减金', label: '微信立减金', test: (text) => /微信立减金|微信支付|微信/.test(text) },
  { key: '支付宝优惠', label: '支付宝优惠', test: (text) => /支付宝|支付宝红包/.test(text) },
  { key: '云闪付/银联', label: '云闪付/银联', test: (text) => /云闪付|银联/.test(text) },
  { key: '数字人民币', label: '数字人民币', test: (text) => /数字人民币|数币/.test(text) },
  { key: '银行App', label: '银行App', test: (text) => /手机银行|掌上银行|掌银|银行App|生活App/i.test(text) },
  { key: '消费券/红包', label: '消费券/红包', test: (text) => /消费券|红包|优惠券|券包/.test(text) },
  { key: '满减/随机减', label: '满减/随机减', test: (text) => /满\d|随机减|立减|满减/.test(text) },
  { key: '抽奖/积分', label: '抽奖/积分', test: (text) => /抽奖|积分|签到|任务/.test(text) },
  { key: '其他通用', label: '其他通用', test: (text) => !KNOWN_GENERAL_DISCOUNT_RE.test(text) }
];

const PUBLIC_BENEFIT_OPTIONS = [
  { key: '发票有奖', label: '发票有奖' },
  { key: '惠民活动', label: '惠民活动' }
];

const SECONDARY_FILTER_GROUPS = {
  '海外活动': {
    key: 'overseas-deals',
    ariaLabel: '海外活动场景筛选',
    options: [
      { key: '全部', label: '全部海外' },
      { key: 'hong-kong', label: '中国香港' },
      { key: 'macau', label: '中国澳门' },
      { key: 'shopping', label: '海淘购物' },
      { key: 'travel', label: '出境旅行' }
    ]
  },
  '黑五优惠': { key: 'black-friday', ariaLabel: '黑五优惠类型筛选', options: BLACK_FRIDAY_TYPE_OPTIONS },
  '吃喝': { key: 'food', ariaLabel: '吃喝类型筛选', options: FOOD_TYPE_OPTIONS },
  '购物': { key: 'shopping', ariaLabel: '购物类型筛选', options: SHOPPING_TYPE_OPTIONS },
  '出行': { key: 'travel', ariaLabel: '出行方式筛选', options: TRAVEL_MODE_OPTIONS },
  '境外游': { key: 'overseas', ariaLabel: '境外游目的地筛选', options: OVERSEAS_DESTINATION_OPTIONS, textField: 'overseasDestinationText' },
  '返现': { key: 'cashback', ariaLabel: '返现类型筛选', options: CASHBACK_TYPE_OPTIONS },
  '生活': { key: 'life', ariaLabel: '生活类型筛选', options: LIFE_TYPE_OPTIONS },
  '发票有奖': { key: 'public-benefit', ariaLabel: '发票有奖与惠民活动筛选', options: PUBLIC_BENEFIT_OPTIONS },
  '会员权益': { key: 'member', ariaLabel: '会员权益类型筛选', options: MEMBER_BENEFIT_OPTIONS },
  '通用优惠': { key: 'general', ariaLabel: '通用优惠类型筛选', options: GENERAL_DISCOUNT_OPTIONS }
};

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
  const travelUse = /旅游|旅行|度假|机票|航空|航班|酒店|订房|住宿|交通|公交|地铁|的士|出租车|打车|租车|机场|贵宾厅|休息室|景点|门票|乐园|游轮|邮轮|八达通|西瓜卡|餐饮|餐厅|茶饮|外卖|咖啡|购物|商场|商户|门市|零售|便利店|超市|购机|消费|签账|流量|漫游|上网卡|优惠|权益|服务|回赠|返现|折扣|eSIM|Apple Pay|手机Pay|SOGO|Klook|Agoda|Trip\.com/i;
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

function isBlackFridayCampaign(activity = {}) {
  const tags = Array.isArray(activity.tags) ? activity.tags : [];
  const text = [
    activity.title, activity.desc, activity.awardDesc, activity.pathDesc,
    activity.channel, activity.consumeChannel, ...tags
  ].filter(Boolean).join(' ');
  return /黑五|黑色星期五|Black\s*Friday|BlackFriday|Cyber\s*Monday|网络星期一|网一(?:大促|优惠|活动|促销|折扣|海淘|消费)/i.test(text);
}

function classifyScenes(activity = {}) {
  const publicBenefitType = classifyPublicBenefitType(activity);
  const isBlackFriday = isBlackFridayCampaign(activity);
  const explicit = activity.scenes || activity.scene || activity.sceneCategory;
  const values = Array.isArray(explicit) ? explicit : String(explicit || '').split(/[,，、|]/);
  const known = values.map(v => String(v).trim())
    .map(v => v === '海外优惠' ? '海外活动' : v)
    .filter(v => SCENE_OPTIONS.includes(v) && v !== '全部');
  if (known.length) {
    if (publicBenefitType) known.push('发票有奖');
    if (isBlackFriday) known.push('黑五优惠');
    return [...new Set(known)];
  }
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
  if (publicBenefitType) matched.push('发票有奖');
  if (isBlackFriday) matched.push('黑五优惠');
  return [...new Set(matched)];
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
  quick: 'all',        // 'all' | 'today' | 'yesterday' | 'expiring' | 'recurring'
  view: 'all',         // 'all' | 'credit' | 'debit'
  cardOrg: '全部',      // CARD_ORG_OPTIONS.key
  bank: '全部',         // '全部' | 'group:<key>' | '<subKey>'
  bankLookup: null,
  pay: '全部',          // PAY_OPTIONS.key
  regionGroup: '全部',  // REGION_OPTIONS.key
  scene: '全部',        // SCENE_OPTIONS
  secondaryFilter: '全部', // 当前一级分类对应的二级筛选
  cashback: false,     // top tab '返现'
  keyword: '',
  sortMode: DEFAULT_SORT_MODE,
  overseasCatalog: { categories: {}, websiteOffers: [] },
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
  sortSelect: document.getElementById('sortSelect'),
  searchInput: document.getElementById('searchInput'),
  mobileSearchInput: document.getElementById('mobileSearchInput'),
  refreshBtn: document.getElementById('refreshBtn'),
  retryLoadBtn: document.getElementById('retryLoadBtn'),
  loadErrorMessage: document.getElementById('loadErrorMessage'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  sidebarResetBtn: document.getElementById('sidebarResetBtn'),
  mobileResetFiltersBtn: document.getElementById('mobileResetFiltersBtn'),
  mobileApplyFiltersBtn: document.getElementById('mobileApplyFiltersBtn'),
  mobileResultCount: document.getElementById('mobileResultCount'),
  viewTabs: document.getElementById('viewTabs'),
  cardOrgFilters: document.getElementById('cardOrgFilters'),
  bankGroupRoot: document.getElementById('bankGroupRoot'),
  bankCategoryDetails: document.getElementById('bankCategoryDetails'),
  payFilters: document.getElementById('payFilters'),
  regionFilters: document.getElementById('regionFilters'),
  sceneFilters: document.getElementById('sceneFilters'),
  topCategoryBar: document.getElementById('topCategoryBar'),
  blackFridayTopicLink: document.getElementById('blackFridayTopicLink'),
  overseasTopicLink: document.getElementById('overseasTopicLink'),
  secondaryFilterBar: document.getElementById('secondaryFilterBar'),
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
const pendingDetails = new Map();
let drawerRequest = 0;
let bankLookupForm;
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
    ? '2026信用卡活动专区：信用卡返现、刷卡金与首绑立减汇总 | 羊毛助手·羊毛线报活动站'
    : '2026银行优惠活动汇总：微信立减金、信用卡返现｜羊毛助手';
  const description = isCredit
    ? '羊毛助手·羊毛线报活动站实时汇总全国银行信用卡返现、刷卡金、首绑立减与港卡境外消费返现活动，支持按银行、卡组织、支付方式与场景筛选并查看领取路径。'
    : '2026银行优惠活动汇总，每日更新微信立减金、信用卡返现、云闪付满减、支付宝红包、数字人民币红包和港卡境外优惠，支持按银行、场景、支付方式查询领取入口与活动规则。';

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

function getTodayStartTime() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
}

function getDateTime(value, fallback) {
  const date = parseDate(value);
  return date ? date.getTime() : fallback;
}

function getCampaignStage(item) {
  if (item.isExpired) return 2;
  const startTime = getDateTime(item.validFrom, -Infinity);
  return startTime > getTodayStartTime() ? 1 : 0;
}

function getDiscountMetrics(item = {}) {
  const text = [
    item.title, item.desc, item.awardDesc, item.cashbackText,
    item.discountText, item.pathDesc
  ].filter(Boolean).join(' ');
  let rate = 0;
  let amount = 0;

  const addRate = (value) => {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0 && number <= 100) rate = Math.max(rate, number);
  };
  const addAmount = (value) => {
    const number = Number(String(value ?? '').replace(/,/g, ''));
    if (Number.isFinite(number) && number > 0) amount = Math.max(amount, number);
  };

  String(item.cashbackRate || '').match(/\d+(?:\.\d+)?/g)?.forEach(addRate);
  [item.discountMax, item.discountAmount, item.discountMin].forEach(addAmount);

  for (const pattern of [
    /(?:最高|最多|至多|额外|再|立)?(?:减|省|优惠|折扣|返现|返|回赠)\s*(\d+(?:\.\d+)?)\s*%/gi,
    /(\d+(?:\.\d+)?)\s*%\s*(?:返现|返|回赠|优惠|折扣|减免)/gi
  ]) {
    for (const match of text.matchAll(pattern)) addRate(match[1]);
  }

  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*折(?!合)/g)) {
    const fold = Number(match[1]);
    if (!Number.isFinite(fold) || fold <= 0) continue;
    const payablePercent = fold <= 10 ? fold * 10 : fold;
    if (payablePercent > 0 && payablePercent <= 100) addRate(100 - payablePercent);
  }

  for (const match of text.matchAll(/(?:每)?满\s*([\d,]+(?:\.\d+)?)\s*(?:元|美元|美金|港元|港币|英镑|欧元|日元|韩元|澳元|加元|兹罗提|PLN|USD|EUR|GBP|JPY|KRW|AUD|CAD)?\s*(?:立)?(?:减|返)\s*([\d,]+(?:\.\d+)?)/gi)) {
    const threshold = Number(match[1].replace(/,/g, ''));
    const saving = Number(match[2].replace(/,/g, ''));
    if (threshold > 0 && saving > 0 && saving <= threshold) addRate((saving / threshold) * 100);
  }

  for (const match of text.matchAll(/(?:支付|用|花)\s*([\d,]+(?:\.\d+)?)\s*(?:元|美元|港元|港币)?\s*(?:买|购)\s*(?:面值)?\s*([\d,]+(?:\.\d+)?)\s*(?:元|美元|港元|港币)?\s*礼卡/gi)) {
    const paid = Number(match[1].replace(/,/g, ''));
    const value = Number(match[2].replace(/,/g, ''));
    if (value > 0 && paid > 0 && paid < value) addRate(((value - paid) / value) * 100);
  }

  // Only compare explicit RMB savings as an amount. Foreign-currency face values are
  // not mixed directly because 1 yen, 1 dollar and 1 pound are not comparable.
  for (const match of text.matchAll(/(?:最高|最多|至多)?(?:减|省|返|立减|回赠)\s*([\d,]+(?:\.\d+)?)\s*(元|人民币)/g)) {
    addAmount(match[1]);
  }

  return {
    discountRate: Math.round(rate * 100) / 100,
    discountAmount: amount
  };
}

function compareDiscount(a, b) {
  const rateDiff = (b.discountRate || 0) - (a.discountRate || 0);
  if (rateDiff) return rateDiff;
  const amountDiff = (b.discountAmount || 0) - (a.discountAmount || 0);
  if (amountDiff) return amountDiff;
  return 0;
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

function getCalendarDaysAgo(date, now = new Date()) {
  if (!date) return null;
  const beijingNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const today = Date.UTC(beijingNow.getUTCFullYear(), beijingNow.getUTCMonth(), beijingNow.getUTCDate());
  // The public API's dates without a timezone are already written in Beijing time.
  const activityDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return (today - activityDay) / 86400000;
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

  const createdDate = getCreatedDate(normalized);
  const referenceDate = createdDate ||
    parseDate(normalized.updatedAt || normalized.validFrom || normalized.validTo);
  const bankInfo = classifyBank(normalized.bankName);
  const discountMetrics = getDiscountMetrics(normalized);

  return {
    ...normalized,
    bankGroup: bankInfo.group,
    bankSub: bankInfo.sub,
    orgText: [normalized.cardOrg, normalized.title, normalized.desc, normalized.bankName, normalized.channel, normalized.consumeChannel, ...normalizedTags].filter(Boolean).join(' '),
    payText: [normalized.channel, normalized.consumeChannel, normalized.title].filter(Boolean).join(' '),
    regionText: String(normalized.region || '').trim(),
    secondaryText: [
      normalized.title, normalized.desc, normalized.awardDesc, normalized.pathDesc,
      normalized.consumeChannel, normalized.channel, normalized.region,
      normalized.cardOrg, normalized.cashbackText, normalized.recurringText,
      ...normalizedTags
    ].filter(Boolean).join(' '),
    overseasRegionText: overseasDestination(normalized.region),
    overseasCampaignText: [
      overseasTitleScope(normalized.title), normalized.desc,
      normalized.consumeChannel, normalized.channel, ...normalizedTags
    ].filter(Boolean).join(' '),
    overseasScopeText: [
      overseasTitleScope(normalized.title)
    ].filter(Boolean).join(' '),
    overseasDestinationText: [
      overseasDestination(normalized.region), normalized.title, normalized.desc,
      normalized.consumeChannel, normalized.channel, ...normalizedTags
    ].filter(Boolean).join(' '),
    publicBenefitType: classifyPublicBenefitType(normalized),
    isCredit: hasCreditTag(normalized),
    hasCashback: hasCashbackEvidence(normalized),
    sceneLabels: classifyScenes(normalized),
    isRecurring: Number(normalized.isRecurring) === 1 || !!normalized.recurringText,
    isExpired: isExpired(normalized.validTo),
    isSoon: !isFixedCampaign(normalized) && !isDailyCampaign(normalized) && isSoon(normalized.validTo),
    isTodayAdded: getCalendarDaysAgo(createdDate) === 0,
    addedTime: createdDate ? createdDate.getTime() : null,
    ...discountMetrics,
    referenceTime: referenceDate ? referenceDate.getTime() : null,
    sortTime: getSortTime(normalized)
  };
}

function compareCampaign(a, b, mode = DEFAULT_SORT_MODE) {
  if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
  if (mode === 'added') {
    const timeA = a.addedTime ?? -Infinity;
    const timeB = b.addedTime ?? -Infinity;
    return timeA === timeB ? 0 : timeB - timeA;
  }

  const stageA = getCampaignStage(a);
  const stageB = getCampaignStage(b);
  if (!['discount', 'merchant'].includes(mode) && stageA !== stageB) return stageA - stageB;

  const startA = getDateTime(a.validFrom, -Infinity);
  const startB = getDateTime(b.validFrom, -Infinity);
  const endA = getDateTime(a.validTo, Infinity);
  const endB = getDateTime(b.validTo, Infinity);

  if (mode === 'discount') {
    const dealDiff = compareDiscount(a, b);
    if (dealDiff) return dealDiff;
  } else if (mode === 'starting') {
    const startDiff = stageA === 1 ? startA - startB : startB - startA;
    if (startDiff) return startDiff;
  } else if (mode === 'merchant') {
    const merchantDiff = String(a.bankName || '').localeCompare(String(b.bankName || ''), 'zh-CN', {
      numeric: true,
      sensitivity: 'base'
    });
    if (merchantDiff) return merchantDiff;
  } else if (mode === 'ending') {
    if (endA !== endB) return stageA === 2 ? endB - endA : endA - endB;
  } else {
    // Recommended: people can act now first. Ongoing offers ending sooner rise to the
    // top; upcoming offers follow by nearest start date; expired items stay last.
    if (stageA === 0 && endA !== endB) return endA - endB;
    if (stageA === 1 && startA !== startB) return startA - startB;
    if (stageA === 2 && endA !== endB) return endB - endA;
    const dealDiff = compareDiscount(a, b);
    if (dealDiff) return dealDiff;
  }

  if (a.isTodayAdded !== b.isTodayAdded) return a.isTodayAdded ? -1 : 1;
  if (stageA !== stageB) return stageA - stageB;
  const timeDiff = (b.sortTime || 0) - (a.sortTime || 0);
  if (timeDiff) return timeDiff;
  return String(a.id || '').localeCompare(String(b.id || ''), 'zh-CN');
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
  if (scene === '海外活动') return !!item.overseasGroup && !cashback && (state.bankLookup != null || getCampaignStage(item) === 0);
  if (item.websiteDetailPath && !state.bankLookup) {
    return !cashback && !item.overseasGroup && scene === '黑五优惠';
  }
  if (cashback && !item.hasCashback) return false;
  return scene === '全部' || item.sceneLabels.includes(scene);
}

function getSecondaryFilterGroup(scene = state.scene, cashback = state.cashback) {
  const groupName = cashback ? '返现' : scene;
  return SECONDARY_FILTER_GROUPS[groupName] || null;
}

function matchesSecondaryFilter(
  item,
  selected = state.secondaryFilter,
  scene = state.scene,
  cashback = state.cashback
) {
  const group = getSecondaryFilterGroup(scene, cashback);
  if (!group || !selected || selected === '全部') return true;
  if (group.key === 'overseas') return matchesOverseasDestination(item, selected);
  if (group.key === 'overseas-deals') return item.overseasGroup === selected;
  if (group.key === 'public-benefit') return item.publicBenefitType === selected;
  const rule = group.options.find((opt) => opt.key === selected);
  const text = group.textField ? item[group.textField] : item.secondaryText;
  return rule ? rule.test(text || '') : true;
}

function matchesQuick(item, quick = state.quick) {
  if (quick === 'today') return item.isTodayAdded;
  if (quick === 'yesterday') {
    return !item.isExpired && item.addedTime != null && getCalendarDaysAgo(new Date(item.addedTime)) === 1;
  }
  if (quick === 'expiring') return item.isSoon;
  if (quick === 'recurring') return item.isRecurring;
  return true;
}

function matchesAll(item, override = {}) {
  const selectedScene = 'scene' in override ? override.scene : state.scene;
  const selectedCashback = 'cashback' in override ? override.cashback : state.cashback;
  return (
    (!state.bankLookup || window.BankLookup.matches(item, state.bankLookup)) &&
    matchesKeyword(item) &&
    matchesView(item) &&
    matchesCardOrg(item, 'cardOrg' in override ? override.cardOrg : state.cardOrg) &&
    matchesBank(item, 'bank' in override ? override.bank : state.bank) &&
    matchesPay(item, 'pay' in override ? override.pay : state.pay) &&
    matchesRegion(item, 'regionGroup' in override ? override.regionGroup : state.regionGroup) &&
    matchesSceneOrCashback(item, selectedScene, selectedCashback) &&
    matchesSecondaryFilter(
      item,
      'secondaryFilter' in override ? override.secondaryFilter : state.secondaryFilter,
      selectedScene,
      selectedCashback
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
    !state.bankLookup &&
    state.pay === '全部' &&
    state.regionGroup === '全部' &&
    state.scene === '全部' &&
    state.secondaryFilter === '全部' &&
    !state.cashback &&
    !state.keyword.trim()
  );
}

function countActiveExtraFilters() {
  let n = 0;
  if (state.view !== 'all') n++;
  if (state.cardOrg !== '全部') n++;
  if (state.bank !== '全部') n++;
  if (state.bankLookup) n++;
  if (state.pay !== '全部') n++;
  if (state.regionGroup !== '全部') n++;
  if (state.scene !== '全部' || state.cashback) n++;
  if (state.secondaryFilter !== '全部') n++;
  return n;
}

function resetFilters() {
  Object.assign(state, {
    quick: 'all',
    view: 'all',
    cardOrg: '全部',
    bank: '全部',
    bankLookup: null,
    pay: '全部',
    regionGroup: '全部',
    scene: '全部',
    secondaryFilter: '全部',
    cashback: false,
    keyword: '',
    showExpired: false
  });
  if (els.searchInput) els.searchInput.value = '';
  if (els.mobileSearchInput) els.mobileSearchInput.value = '';
}

function syncBankCategoryDisclosure() {
  if (!els.bankCategoryDetails) return;
  const isMobile = window.matchMedia('(max-width: 860px)').matches;
  els.bankCategoryDetails.open = !isMobile;
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
        state.secondaryFilter = '全部';
      } else {
        state.scene = cat.scene;
        state.cashback = !!cat.cashback;
        state.secondaryFilter = '全部';
      }
      applyFilters();
    });
    els.topCategoryBar.appendChild(btn);
  });
}

function mountSecondaryFilters(group = getSecondaryFilterGroup()) {
  if (!els.secondaryFilterBar) return;
  els.secondaryFilterBar.innerHTML = '';
  els.secondaryFilterBar.dataset.secondaryGroup = group ? group.key : '';
  if (!group) return;
  els.secondaryFilterBar.setAttribute('aria-label', group.ariaLabel);
  group.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'radar-secondary-tab';
    btn.dataset.secondaryFilter = opt.key;
    btn.setAttribute('aria-pressed', String(opt.key === state.secondaryFilter));
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      state.secondaryFilter = opt.key === '全部' || state.secondaryFilter === opt.key
        ? '全部'
        : opt.key;
      applyFilters();
    });
    els.secondaryFilterBar.appendChild(btn);
  });
  if (group.key === 'overseas-deals' && els.overseasTopicLink) {
    els.secondaryFilterBar.appendChild(els.overseasTopicLink);
  }
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
        state.secondaryFilter = '全部';
      } else {
        state[stateKey] = (key === '全部' || state[stateKey] === key) ? '全部' : key;
      }
      applyFilters();
    });
    container.appendChild(btn);
  });
}

function syncFilterControls() {
  if (els.blackFridayTopicLink) {
    els.blackFridayTopicLink.hidden = state.scene !== '黑五优惠' || state.cashback;
  }

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

  if (els.secondaryFilterBar) {
    const group = state.bankLookup ? null : getSecondaryFilterGroup();
    if (group && els.secondaryFilterBar.dataset.secondaryGroup !== group.key) {
      mountSecondaryFilters(group);
    }
    els.secondaryFilterBar.classList.toggle('hidden', !group);
    els.secondaryFilterBar.setAttribute('aria-hidden', String(!group));
    els.secondaryFilterBar.querySelectorAll('[data-secondary-filter]').forEach((btn) => {
      const isActive = btn.dataset.secondaryFilter === state.secondaryFilter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
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
  document.querySelectorAll('.site-nav [data-nav-view], .radar-mobile-site-nav [data-nav-view]').forEach((link) => {
    const target = link.dataset.navView;
    const isActive = target === 'credit' ? state.view === 'credit' : target === 'all' && state.view !== 'credit';
    link.classList.toggle('is-active', isActive);
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
  if (els.sortSelect && els.sortSelect.value !== state.sortMode) els.sortSelect.value = state.sortMode;

  // Reset buttons & mobile badge
  const isDefault = hasDefaultFilters();
  if (els.resetFiltersBtn) els.resetFiltersBtn.classList.toggle('hidden', isDefault);
  if (els.sidebarResetBtn) els.sidebarResetBtn.classList.toggle('hidden', isDefault);
  if (els.mobileResetFiltersBtn) els.mobileResetFiltersBtn.disabled = isDefault;

  const extraCount = countActiveExtraFilters();
  if (els.mobileFilterCount) {
    els.mobileFilterCount.textContent = String(extraCount);
    els.mobileFilterCount.classList.toggle('hidden', extraCount === 0);
  }
  if (els.topMobileMenuBadge) {
    els.topMobileMenuBadge.textContent = String(extraCount);
    els.topMobileMenuBadge.classList.toggle('hidden', extraCount === 0);
  }

}

function updateSidebarCounts() {
  const ready = state.loadStatus === 'ready';
  const activeCampaigns = state.campaigns.filter((item) => !item.isExpired);

  // Quick view counts (respect current non-quick filters)
  const quickBase = activeCampaigns.filter((item) => matchesAll(item, { quick: 'all' }));
  const quickCounts = {
    all: quickBase.length,
    today: quickBase.filter((item) => matchesQuick(item, 'today')).length,
    yesterday: quickBase.filter((item) => matchesQuick(item, 'yesterday')).length,
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
  const diffDays = getCalendarDaysAgo(d);
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
  const idStr = String(item.id);
  row.href = item.websiteDetailPath || (/^[1-9][0-9]*$/.test(idStr)
    ? `./activities/${encodeURIComponent(idStr)}.html`
    : `./detail.html?id=${encodeURIComponent(idStr)}`);

  const tags = [];
  if (item.isExpired) {
    tags.push('<span class="radar-tag is-expired">已过期</span>');
  } else {
    if (item.isTodayAdded) tags.push('<span class="radar-tag is-new">今日新增</span>');
    if ((state.bankLookup || item.websiteDetailPath) && getCampaignStage(item) === 1) {
      tags.push('<span class="radar-tag is-new">未开始</span>');
    }
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

  const result = state.campaigns
    .filter((item) => matchesAll(item))
    .sort((a, b) => compareCampaign(a, b, state.sortMode));
  state.filtered = result;

  const activeCount = result.filter((item) => !item.isExpired).length;
  if (els.resultSummary) {
    els.resultSummary.textContent = hasDefaultFilters()
      ? `当前有效 ${activeCount} 条`
      : `符合条件 ${activeCount} 条`;
  }
  if (els.mobileResultCount) els.mobileResultCount.textContent = String(activeCount);
  const category = TOP_CATEGORIES.find((option) => option.scene === state.scene && option.cashback === state.cashback);
  bankLookupForm?.showResultCount(state.bankLookup, activeCount, result.length - activeCount, category || TOP_CATEGORIES[0]);

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
  const value = String(id || '').trim();
  return /^\d+$/.test(value)
    ? `https://bank.vooqqqm.com/activities/${encodeURIComponent(value)}.html`
    : 'https://bank.vooqqqm.com/activities/';
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

function renderCleanDetailBody(data, rulesNotice = '') {
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

      ${window.BlackFridayPricing ? window.BlackFridayPricing.render(data.pricing) : ''}

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
        ${rulesNotice}
        ${data.awardDesc ? renderCleanRules(data.awardDesc) : ''}
      </section>

      <footer class="clean-foot">
        <p>活动名额与细则可能变动，实际请以银行官方页面为准。</p>
      </footer>
    </div>
  `;
}

function bindDrawerBodyActions(data) {
  if (!els.drawerBody) return;
  if (window.BlackFridayPricing) {
    void window.BlackFridayPricing.hydrate(els.drawerBody, data.pricing);
  }
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

function syncDetailDrawerHistory(id) {
  const currentState = window.history.state && typeof window.history.state === 'object'
    ? window.history.state
    : {};
  const drawerAlreadyOpen = Boolean(
    selectedId &&
    els.detailDrawer &&
    !els.detailDrawer.classList.contains('hidden') &&
    currentState.radarDrawer
  );

  if (drawerAlreadyOpen) {
    window.history.replaceState(
      { ...currentState, radarDrawer: true, radarDrawerId: String(id) },
      '',
      window.location.href
    );
  } else {
    const cleanState = { ...currentState };
    delete cleanState.radarDrawer;
    delete cleanState.radarDrawerId;
    if (currentState.radarDrawer) {
      window.history.replaceState(cleanState, '', window.location.href);
    }
    window.history.pushState(
      { ...cleanState, radarDrawer: true, radarDrawerId: String(id) },
      '',
      window.location.href
    );
  }
}

function getLiveCampaignDetail(id) {
  if (detailCache.has(id)) return Promise.resolve(detailCache.get(id));
  if (pendingDetails.has(id)) return pendingDetails.get(id);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const request = fetch(`${API_BASE}/campaign_detail.php?id=${encodeURIComponent(id)}`, {
    credentials: 'omit', signal: controller.signal
  }).then(async (response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const data = payload?.code === 0 ? payload.data : payload?.code == null ? payload : null;
    if (String(data?.id) !== id || !data.title || !data.awardDesc?.trim()) {
      throw new Error('活动规则未返回');
    }
    const detail = { ...data, tags: normalizeTags(data.tags) };
    detailCache.set(id, detail);
    return detail;
  }).finally(() => {
    clearTimeout(timeout);
    pendingDetails.delete(id);
  });

  pendingDetails.set(id, request);
  return request;
}

async function getPublishedCampaignDetail(listItem) {
  if (!/^\d+$/.test(String(listItem.id))) return null;
  const path = `./activities/${listItem.id}.html`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(path, { signal: controller.signal });
    if (!response.ok) return null;
    const html = new DOMParser().parseFromString(await response.text(), 'text/html');
    const rules = [...html.querySelectorAll('#offer-details .activity-copy')].map(node => node.textContent.trim());
    if (!rules.some(Boolean)) return null;

    return {
      ...listItem,
      awardDesc: rules.join('\n\n'),
      pathDesc: html.querySelector('#participation .activity-copy')?.textContent.trim() || '',
      websiteDetailPath: path
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function renderDrawerActivity(data, notice = '') {
  currentDrawerActivity = data;
  els.drawerBody.innerHTML = renderCleanDetailBody(data, notice);
  bindDrawerBodyActions(data);
}

async function loadDrawerRules(listItem) {
  const version = ++drawerRequest;
  const detailPath = `./detail.html?id=${encodeURIComponent(listItem.id)}`;
  const detailAction = `<a class="clean-btn" href="${escapeAttribute(detailPath)}" target="_blank" rel="noopener noreferrer">查看独立详情 ↗</a>`;
  const id = String(listItem.id);

  renderDrawerActivity(listItem, '<p class="clean-loading" role="status">正在载入参与方式与完整活动规则…</p>');
  try {
    const detail = await getLiveCampaignDetail(id);
    if (version === drawerRequest) renderDrawerActivity(detail);
  } catch {
    if (version !== drawerRequest) return;
    const published = await getPublishedCampaignDetail(listItem);
    if (version !== drawerRequest) return;

    const detailLink = published
      ? `<a class="clean-btn" href="${escapeAttribute(published.websiteDetailPath)}" target="_blank" rel="noopener noreferrer">查看完整详情 ↗</a>`
      : detailAction;
    if (published && els.drawerOpenPage) els.drawerOpenPage.href = published.websiteDetailPath;
    const notice = published ? '以下为已发布的活动规则，最新名额和资格以官方为准。' : '活动摘要已显示，完整规则暂时无法获取。';

    renderDrawerActivity(published || listItem, `
      <div class="clean-error" role="status">
        <p>${notice}</p>
        <div class="clean-actions">
          <button class="clean-btn" type="button" data-retry-rules>重新加载规则</button>
          ${detailLink}
        </div>
      </div>
    `);
    const retry = els.drawerBody.querySelector('[data-retry-rules]');
    retry.addEventListener('click', () => {
      if (els.drawerOpenPage) els.drawerOpenPage.href = detailPath;
      void loadDrawerRules(listItem);
    });
  }
}

async function openDetailDrawer(listItem, { syncHistory = true } = {}) {
  if (!els.detailDrawer || !els.drawerBody) return;
  const id = String(listItem.id);
  if (syncHistory) syncDetailDrawerHistory(id);
  drawerRequest += 1;
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
    els.drawerOpenPage.href = listItem.websiteDetailPath || (/^[1-9][0-9]*$/.test(id)
      ? `./activities/${encodeURIComponent(id)}.html`
      : `./detail.html?id=${encodeURIComponent(id)}`);
  }

  els.detailDrawer.classList.remove('hidden');
  els.detailDrawer.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => els.detailDrawer.classList.add('is-open'));
  if (els.drawerBackdrop) els.drawerBackdrop.classList.remove('hidden');
  document.body.classList.add('drawer-open');

  els.drawerBody.scrollTop = 0;
  if (listItem.websiteOfferId || detailCache.has(id)) {
    renderDrawerActivity(detailCache.get(id) || listItem);
    return;
  }

  await loadDrawerRules(listItem);
}

function closeDetailDrawer({ fromHistory = false } = {}) {
  if (!els.detailDrawer) return;
  if (!fromHistory && window.history.state && window.history.state.radarDrawer) {
    window.history.back();
    return;
  }
  drawerRequest += 1;
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

function openWechatContactQrModal() {
  let modal = document.getElementById('wechatContactQrModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wechatContactQrModal';
    modal.className = 'mp-qr-modal hidden';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="mp-qr-backdrop" data-close-contact-qr="true"></div>
      <div class="mp-qr-dialog is-contact-qr" role="dialog" aria-modal="true" aria-labelledby="wechatContactQrTitle">
        <img src="${escapeAttribute(WECHAT_CONTACT_QR_URL)}" alt="HAIMA_Johnny 微信二维码" width="1126" height="1610">
        <p class="mp-qr-title" id="wechatContactQrTitle">添加微信好友</p>
        <p class="mp-qr-hint">微信扫一扫，手机端可长按二维码识别</p>
        <button type="button" class="mp-qr-close" data-close-contact-qr="true">关闭</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  closeMobileSidebar();
  document.querySelectorAll('[data-open-contact-qr]').forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'true');
  });
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  const closeButton = modal.querySelector('[data-close-contact-qr="true"]');
  if (closeButton) requestAnimationFrame(() => closeButton.focus());
}

function closeWechatContactQrModal() {
  const modal = document.getElementById('wechatContactQrModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('[data-open-contact-qr]').forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
  });
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
  if (els.sortSelect) {
    els.sortSelect.addEventListener('change', (event) => {
      state.sortMode = SORT_MODES.has(event.target.value) ? event.target.value : DEFAULT_SORT_MODE;
      state.showExpired = false;
      const url = new URL(window.location.href);
      if (state.sortMode === DEFAULT_SORT_MODE) url.searchParams.delete('sort');
      else url.searchParams.set('sort', state.sortMode);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      applyFilters();
    });
  }

  if (els.refreshBtn) els.refreshBtn.addEventListener('click', fetchCampaigns);
  if (els.retryLoadBtn) els.retryLoadBtn.addEventListener('click', fetchCampaigns);

  const doReset = () => {
    resetFilters();
    syncBankCategoryDisclosure();
    applyFilters();
  };
  if (els.resetFiltersBtn) els.resetFiltersBtn.addEventListener('click', doReset);
  if (els.sidebarResetBtn) els.sidebarResetBtn.addEventListener('click', doReset);
  if (els.mobileResetFiltersBtn) els.mobileResetFiltersBtn.addEventListener('click', doReset);
  if (els.mobileApplyFiltersBtn) els.mobileApplyFiltersBtn.addEventListener('click', closeMobileSidebar);

  window.addEventListener('popstate', (event) => {
    const drawerState = event.state && event.state.radarDrawer;
    if (drawerState) {
      const drawerId = String(event.state.radarDrawerId || '');
      const item = state.campaigns.find((campaign) => String(campaign.id) === drawerId);
      if (item && String(selectedId || '') !== drawerId) {
        openDetailDrawer(item, { syncHistory: false });
      }
      return;
    }
    if (els.detailDrawer && !els.detailDrawer.classList.contains('hidden')) {
      closeDetailDrawer({ fromHistory: true });
    }
  });

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
    const contactQrTrigger = event.target.closest('[data-open-contact-qr]');
    if (contactQrTrigger) {
      event.preventDefault();
      openWechatContactQrModal();
      return;
    }
    if (event.target.closest('[data-close-contact-qr="true"]')) {
      closeWechatContactQrModal();
      return;
    }
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
      !event.composedPath().includes(els.detailDrawer) &&
      !event.target.closest('[data-close-drawer="true"]') &&
      !event.target.closest('.radar-row') &&
      !event.target.closest('#shareSheet') &&
      !event.target.closest('#imageLightbox') &&
      !event.target.closest('#wechatContactQrModal') &&
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
        if (window.matchMedia('(max-width: 860px)').matches) closeMobileSidebar();
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
      const contactQrModal = document.getElementById('wechatContactQrModal');
      if (contactQrModal && !contactQrModal.classList.contains('hidden')) return closeWechatContactQrModal();
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

async function fetchWebsiteBlackFriday(signal) {
  const response = await fetch(WEBSITE_BLACK_FRIDAY_PATH, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  const offers = [];
  for (const offer of page.querySelectorAll('[data-campaign][data-website-only]')) {
    const { id } = offer;
    const { merchant, market, validFrom, validTo } = offer.dataset;
    const title = offer.querySelector('h2')?.textContent.trim();
    const paragraphs = [...offer.querySelectorAll(':scope > p')];
    const schedule = paragraphs[0]?.textContent.trim() || '';
    const desc = paragraphs[1]?.textContent.trim() || '';
    const detailLines = paragraphs.slice(1)
      .filter((paragraph) => !paragraph.querySelector('a[href]'))
      .map((paragraph) => paragraph.textContent.trim());
    const sourceLinks = [...offer.querySelectorAll('a[href]')];
    const pathUrl = sourceLinks[0]?.getAttribute('href') || '';
    if (!/^[a-z0-9-]+$/.test(id) || !merchant || !market || !title ||
        !/^\d{4}-\d{2}-\d{2}$/.test(validFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(validTo) ||
        !parseDate(validFrom) || !parseDate(validTo) || validFrom > validTo || !pathUrl) continue;

    const sourceLines = sourceLinks.flatMap((link) => [
      link.textContent.trim() || '官方来源',
      link.getAttribute('href') || ''
    ]).filter(Boolean);

    offers.push({
      id: `web-black-friday-${id}`,
      websiteOfferId: id,
      websiteDetailPath: `./detail.html?web=${encodeURIComponent(id)}`,
      websiteTopicPath: `${WEBSITE_BLACK_FRIDAY_PATH}#${id}`,
      bankName: merchant,
      region: market,
      title,
      desc,
      validFrom,
      validTo,
      channel: /门店/.test(schedule) ? '官网/门店' : '官网',
      pathUrl,
      pathDesc: `打开${merchant}官方活动页面 → 核对商品、日期、地区与结账条件 → 按页面提示参与`,
      pricing: window.BlackFridayPricing ? window.BlackFridayPricing.fromDataset(offer.dataset) : null,
      awardDesc: [
        '【活动时间与范围】', schedule,
        '【活动说明】', ...detailLines,
        '【官方来源】', ...sourceLines
      ].filter(Boolean).join('\n'),
      tags: ['黑五', '网站专题']
    });
  }
  return offers;
}

async function fetchOverseasCatalog(signal) {
  const response = await fetch(OVERSEAS_CATALOG_PATH, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const catalog = await response.json();
  if (!catalog.categories || !Array.isArray(catalog.websiteOffers)) {
    throw new Error('海外活动目录格式错误');
  }
  return catalog;
}

function websiteOverseasCampaign(item) {
  return {
    ...item,
    bankName: item.institution,
    desc: item.summary,
    websiteOfferId: item.webId,
    websiteDetailPath: item.url,
    pathUrl: item.sources[0] || '',
    pathDesc: '打开官方活动页，核对适用地区、资格及参与步骤。',
    awardDesc: [...item.rules, '【官方来源】', ...item.sources].join('\n'),
    tags: ['海外活动', '网站专题']
  };
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
    if (els.mobileResultCount) els.mobileResultCount.textContent = '—';
    setLoadingState({ loading: true });
  }

  try {
    const websiteOffers = fetchWebsiteBlackFriday(controller.signal).catch((error) => {
      console.warn('网页黑五活动暂未载入', error);
      return state.campaigns.filter((item) => item.websiteDetailPath && !item.overseasGroup);
    });
    const overseasCatalog = fetchOverseasCatalog(controller.signal).catch((error) => {
      console.warn('海外活动目录暂未载入', error);
      return state.overseasCatalog;
    });
    const response = await fetch(`${API_BASE}/campaigns.php?view=web-list`, {
      credentials: 'omit',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!payload || payload.code !== 0 || !Array.isArray(payload.data)) {
      throw new Error((payload && payload.message) || '接口返回异常');
    }

    const sharedOffers = payload.data.filter(item => item && item.id != null);
    const [blackFriday, overseas] = await Promise.all([websiteOffers, overseasCatalog]);
    state.overseasCatalog = overseas;
    state.campaigns = [...sharedOffers, ...blackFriday, ...overseas.websiteOffers.map(websiteOverseasCampaign)]
      .map((item) => normalizeCampaign({ ...item, overseasGroup: overseas.categories[item.id] }));
    state.loadStatus = 'ready';
    applyFilters();
    bankLookupForm?.syncCampaigns();
  } catch (err) {
    const message = controller.signal.aborted ? '活动加载超时' : '活动加载失败';
    if (!hadData) {
      state.loadStatus = 'error';
      if (els.resultSummary) els.resultSummary.textContent = '暂未载入';
      if (els.mobileResultCount) els.mobileResultCount.textContent = '—';
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

  document.querySelectorAll('a[href^="./activities/topics"], a[href^="/activities/topics"]').forEach((link) => {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  mountTopCategories();
  mountSecondaryFilters();
  mountCardOrgFilters();
  mountBankGroups();
  mountMiniChips(els.payFilters, PAY_OPTIONS, 'pay');
  mountMiniChips(els.regionFilters, REGION_OPTIONS, 'regionGroup');
  mountMiniChips(els.sceneFilters, SCENE_OPTIONS, 'scene');
  syncBankCategoryDisclosure();
  bindEvents();
  const bankLookupRoot = document.getElementById('todayDeals');
  if (bankLookupRoot && window.BankLookup && window.ChinaRegions) {
    bankLookupForm = window.BankLookup.mount({
      root: bankLookupRoot,
      bankGroups: BANK_GROUPS,
      categories: TOP_CATEGORIES,
      getCampaigns: () => state.campaigns,
      onSearch({ category, ...choices }) {
        resetFilters();
        const selectedCategory = TOP_CATEGORIES.find(({ key }) => key === category) || TOP_CATEGORIES[0];
        state.bankLookup = choices;
        state.scene = selectedCategory.scene;
        state.cashback = selectedCategory.cashback;
        applyFilters();
      },
      onClear() {
        state.bankLookup = null;
        state.showExpired = false;
        state.scene = '全部';
        state.cashback = false;
        state.secondaryFilter = '全部';
        applyFilters();
      }
    });
  }

  const mobileDisclosureQuery = window.matchMedia('(max-width: 860px)');
  const handleDisclosureModeChange = () => syncBankCategoryDisclosure();
  if (mobileDisclosureQuery.addEventListener) {
    mobileDisclosureQuery.addEventListener('change', handleDisclosureModeChange);
  } else if (mobileDisclosureQuery.addListener) {
    mobileDisclosureQuery.addListener(handleDisclosureModeChange);
  }

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  if (query) state.keyword = query;
  const view = params.get('view');
  if (view && ['credit', 'debit'].includes(view)) state.view = view;
  if (params.get('category') === 'overseas-deals') state.scene = '海外活动';
  const sortMode = params.get('sort');
  if (sortMode && SORT_MODES.has(sortMode)) state.sortMode = sortMode;
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
