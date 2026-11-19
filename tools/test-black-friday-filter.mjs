import fs from 'node:fs';
import vm from 'node:vm';

const appSource = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const stateStart = appSource.indexOf('const state =');
if (stateStart < 0) throw new Error('Unable to locate filter source in assets/app.js');

const context = {};
vm.runInNewContext(`${appSource.slice(0, stateStart)}\nglobalThis.blackFridayTestApi = {
  match: isBlackFridayCampaign,
  scenes: classifyScenes,
  sceneOptions: SCENE_OPTIONS,
  topCategory: TOP_CATEGORIES.at(-1),
  secondaryGroup: SECONDARY_FILTER_GROUPS['黑五优惠']
};`, context);

const { match, scenes, sceneOptions, topCategory, secondaryGroup } = context.blackFridayTestApi;
const cases = [
  ['Chinese Black Friday', { title: '浦发信用卡·黑五海淘季380元消费券包' }, true],
  ['full Chinese name', { title: '黑色星期五指定商户8折' }, true],
  ['English Black Friday', { title: 'Visa Black Friday cashback' }, true],
  ['Cyber Monday', { title: 'Cyber Monday online shopping offer' }, true],
  ['Chinese Cyber Monday', { title: '网络星期一海淘优惠' }, true],
  ['Chinese short Cyber Monday', { title: '网一大促满100减20' }, true],
  ['ordinary Friday stays out', { title: '每周五信用卡餐饮满100减20' }, false],
  ['black number is unrelated', { title: '黑卡5倍积分活动' }, false]
];

let failures = 0;
for (const [name, item, expected] of cases) {
  const actual = match(item);
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

const explicitSceneItem = {
  title: 'Black Friday海外指定商户返现',
  scenes: ['购物']
};
if (!scenes(explicitSceneItem).includes('黑五优惠')) {
  failures += 1;
  console.error('FAIL Black Friday category should be added alongside an explicit scene');
}

if (!topCategory || topCategory.label !== '黑五优惠' || topCategory.scene !== '黑五优惠') {
  failures += 1;
  console.error(`FAIL top category configuration: ${JSON.stringify(topCategory)}`);
}

if (!sceneOptions.includes('黑五优惠') || sceneOptions.at(-1) !== '黑五优惠') {
  failures += 1;
  console.error(`FAIL mobile scene filter configuration: ${JSON.stringify(sceneOptions)}`);
}

const secondaryCases = [
  ['VPS/云服务', 'Hostinger 人民币站黑五 VPS 最高减 70%'],
  ['数码家电', 'Best Buy 美国黑五 iPhone 17 Pro 系列减 100 美元'],
  ['海淘电商', '日本乐天黑五跨店购物最高 10 倍积分'],
  ['旅行出行', '国泰航空日本站黑五往返机票最高减 15%'],
  ['酒店住宿', 'Trip.com 英国黑五指定酒店券满 400 英镑减 120 英镑'],
  ['软件订阅', 'Adobe 美区黑五 Creative Cloud Pro 个人版首年减 57%'],
  ['游戏娱乐', 'Nintendo 任天堂黑五 Switch 游戏限时折扣'],
  ['支付/信用卡', '中信 Visa 信用卡黑五境外消费返现'],
  ['其他黑五', '黑五限定餐厅双人套餐 7 折']
];

if (!secondaryGroup || secondaryGroup.key !== 'black-friday') {
  failures += 1;
  console.error(`FAIL Black Friday secondary group configuration: ${JSON.stringify(secondaryGroup)}`);
} else {
  const labels = secondaryGroup.options.map((option) => option.label);
  if (labels[0] !== '全部黑五') {
    failures += 1;
    console.error(`FAIL Black Friday all option should be first: ${JSON.stringify(labels)}`);
  }
  for (const [key, sample] of secondaryCases) {
    const option = secondaryGroup.options.find((entry) => entry.key === key);
    if (!option || !option.test(sample)) {
      failures += 1;
      console.error(`FAIL secondary category ${key} did not match: ${sample}`);
    }
  }
}

const dataPath = process.argv[2];
if (dataPath) {
  const payload = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const rows = Array.isArray(payload) ? payload : (payload.data || []);
  const activeAt = new Date('2026-11-18T00:00:00+08:00');
  const active = rows.filter((item) => {
    const end = item.validTo ? new Date(`${String(item.validTo).slice(0, 10)}T23:59:59+08:00`) : null;
    return !end || Number.isNaN(end.getTime()) || end >= activeAt;
  });
  const blackFriday = active.filter(match);
  console.log(`DATA active=${active.length} blackFriday=${blackFriday.length}`);
  console.log(blackFriday.map((item) => `${item.id} ${item.title}`).join('\n'));
  if (!blackFriday.length) {
    failures += 1;
    console.error('FAIL live data should contain at least one active Black Friday campaign');
  }
}

if (failures) process.exitCode = 1;
else console.log(`PASS ${cases.length + secondaryCases.length + 5} Black Friday filter cases`);
