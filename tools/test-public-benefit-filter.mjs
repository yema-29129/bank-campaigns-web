import fs from 'node:fs';
import vm from 'node:vm';

const appSource = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const stateStart = appSource.indexOf('const state =');
if (stateStart < 0) throw new Error('Unable to locate filter source in assets/app.js');

const context = {};
vm.runInNewContext(`${appSource.slice(0, stateStart)}\nglobalThis.publicBenefitTestApi = {
  classify: classifyPublicBenefitType,
  scenes: classifyScenes,
  options: PUBLIC_BENEFIT_OPTIONS.map((item) => item.label)
};`, context);

const { classify, scenes, options } = context.publicBenefitTestApi;
const cases = [
  ['standard invoice prize', { title: '周口市商务局·有奖发票满100抽2000元券', bankName: '周口市商务局' }, '发票有奖'],
  ['invoice lottery wording', { title: '佛山餐饮发票抽奖最高300元红包', bankName: '佛山市商务局' }, '发票有奖'],
  ['government consumption voucher', { title: '枣庄零售餐饮消费券满120减20', bankName: '枣庄市商务局' }, '惠民活动'],
  ['explicit public benefit wording', { title: '体育惠民券满200减20', bankName: '西安经济技术开发区' }, '惠民活动'],
  ['ordinary invoice mention stays out', { title: '信用卡消费可申请电子发票', bankName: '示例银行' }, ''],
  ['ordinary bank discount stays out', { title: '信用卡微信支付满100减10', bankName: '示例银行' }, '']
];

let failures = 0;
for (const [name, item, expected] of cases) {
  const actual = classify(item);
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${name}: expected ${expected || '(empty)'}, got ${actual || '(empty)'}`);
  }
}

const explicitSceneItem = {
  title: '商务局有奖发票满100抽500元券',
  bankName: '某市商务局',
  scenes: ['通用优惠']
};
if (!scenes(explicitSceneItem).includes('发票有奖')) {
  failures += 1;
  console.error('FAIL invoice category should be added even when an explicit scene already exists');
}

if (JSON.stringify(options) !== JSON.stringify(['发票有奖', '惠民活动'])) {
  failures += 1;
  console.error(`FAIL secondary options: ${JSON.stringify(options)}`);
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
  const invoice = active.filter((item) => classify(item) === '发票有奖');
  const publicBenefit = active.filter((item) => classify(item) === '惠民活动');
  console.log(`DATA active=${active.length} invoice=${invoice.length} publicBenefit=${publicBenefit.length}`);
  if (!invoice.length || !publicBenefit.length) {
    failures += 1;
    console.error('FAIL live data should contain both invoice-prize and public-benefit activities');
  }
}

if (failures) process.exitCode = 1;
else console.log(`PASS ${cases.length + 2} public-benefit filter cases`);
