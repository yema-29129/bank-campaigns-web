import fs from 'node:fs';
import vm from 'node:vm';

const appSource = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const stateStart = appSource.indexOf('const state =');
if (stateStart < 0) throw new Error('Unable to locate filter source in assets/app.js');

const context = {};
vm.runInNewContext(`${appSource.slice(0, stateStart)}\nglobalThis.blackFridayTestApi = {
  match: isBlackFridayCampaign,
  scenes: classifyScenes,
  topCategory: TOP_CATEGORIES.find((item) => item.key === 'black-friday')
};`, context);

const { match, scenes, topCategory } = context.blackFridayTestApi;
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
else console.log(`PASS ${cases.length + 2} Black Friday filter cases`);
