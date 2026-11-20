import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/today-deals.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(readFileSync(new URL('../assets/china-regions.js', import.meta.url), 'utf8'), { window });
vm.runInNewContext(source.replace(
  'window.TodayDeals = { mount };',
  'window.TodayDeals = { todayInChina, shortList, qualify, bankOptionsFor };'
), { window });

const { todayInChina, shortList, qualify, bankOptionsFor } = window.TodayDeals;
const friday = todayInChina(new Date('2026-11-20T11:00:00+08:00'));
const saturday = todayInChina(new Date('2026-11-21T00:30:00+08:00'));
assert.equal(saturday.day, 6);
assert.equal(saturday.date, '2026-11-21');

const basic = {
  id: '123', title: '招商银行信用卡·外卖满20减5元',
  desc: '美团外卖满20元立减5元', bankName: '招商银行', bankGroup: 'joint', bankSub: '招行',
  region: '全国', validFrom: '2026-11-01', validTo: '2026-12-31', isCredit: true
};
const debit = {
  ...basic, id: '124', title: '中国银行借记卡·外卖满15减3元',
  desc: '外卖支付宝满15元减3元', bankName: '中国银行', bankGroup: 'big6', bankSub: '中行', isCredit: false
};
const profile = { location: { province: '湖北省', city: '武汉市' }, cards: [{ bank: '招行', type: 'credit' }, { bank: '中行', type: 'debit' }] };
const shortlist = shortList([
  basic, debit,
  { ...debit, id: 'wrong-city', region: '广东省/深圳市' },
  { ...basic, id: 'partial-cities', region: '中国大陆·全国部分城市' },
  { ...basic, id: 'future', validFrom: '2026-11-22' },
  { ...basic, id: 'expired', validTo: '2026-11-15' },
  { ...basic, id: 'random', desc: '随机减最高5元' },
  { ...basic, id: 'first', title: '招商银行信用卡·外卖首绑立减', desc: '满20减5元' },
  { ...basic, id: 'web', websiteOfferId: 'web' },
  { ...basic, id: 'not-owned', bankSub: '建行' }
], profile, friday);
assert.equal(shortlist.map(candidate => candidate.item.id).join(','), '124,123');

const candidate = shortlist[1];
const detail = {
  ...basic, recurringType: 'week', recurringText: '每周重复',
  pathDesc: '打开美团外卖下单 → 在美团支付收银台选招商银行信用卡结账',
  awardDesc: '每周五10:00至20:00，满20元立减5元，名额有限。'
};
const match = qualify(candidate, detail, friday);
assert.equal(match.payment, '美团支付');
assert.equal(match.isLimited, true);
assert.equal(match.saving, 5);
assert.equal(qualify(candidate, detail, saturday), null);
assert.equal(qualify(candidate, detail, todayInChina(new Date('2026-11-20T21:00:00+08:00'))), null);
assert.equal(qualify(candidate, { ...detail, awardDesc: '每周五满30减5元。' }, friday), null);
assert.equal(qualify(candidate, { ...detail, awardDesc: '【活动对象】仅限新户。【优惠】每周五满20减5元。' }, friday), null);
const china = window.ChinaRegions;
const guangzhou = { province: '广东省', city: '广州市' };
const shenzhen = { province: '广东省', city: '深圳市' };
const wuhan = profile.location;
const hongKong = { province: '香港特别行政区', city: '香港特别行政区' };
assert.equal(china.provinces.length, 34);
assert.equal(china.cities('广东省').length, 21);
assert.ok(china.cities('新疆维吾尔自治区').includes('白杨市'));
assert.equal(china.fromLegacyCity('广州').province, '广东省');
assert.equal(china.fromLegacyCity('广州').city, '广州市');
assert.equal(china.fromLegacyCity('上海').city, '上海市');
assert.equal(china.matches('广东广州', guangzhou), true);
assert.equal(china.matches('广东省-广州市', shenzhen), false);
assert.equal(china.matches('广东省/深圳市', { province: '广东省' }), false);
assert.equal(china.matches('广东省', guangzhou), true);
assert.equal(china.matches('广东省', wuhan), false);
assert.equal(china.matches('广东（不含深圳）', guangzhou), true);
assert.equal(china.matches('广东（除深圳）', shenzhen), false);
assert.equal(china.matches('广东省（深圳市除外）', shenzhen), false);
assert.equal(china.matches('全国（仅限广州）', wuhan), false);
assert.equal(china.matches('延边', { province: '吉林省', city: '延边朝鲜族自治州' }), true);
assert.equal(china.matches('全国（除深圳，广州）', guangzhou), false);
assert.equal(china.matches('全国（除深圳，广州）', wuhan), true);
assert.equal(china.matches('全国指定场景', guangzhou), true);
assert.equal(china.matches('中国大陆·全国部分城市及指定外卖门店', guangzhou), false);
assert.equal(china.matches('全国部分城市：深圳、广州', guangzhou), true);
assert.equal(china.matches('全国部分城市：深圳、广州', wuhan), false);
assert.equal(china.matches('中国香港', hongKong), true);
assert.equal(china.matches('全国', hongKong), false);
assert.equal(china.matches('境外（含中国香港、中国澳门、中国台湾）', hongKong), false);
assert.equal(china.matches('臺北市', { province: '台湾省', city: '台北市' }), true);

// The live ICBC offer reported in the mobile screenshot uses a phone wallet.
const icbc = {
  ...debit, id: '1184', bankName: '工商银行', bankSub: '工行',
  title: '工商银行借记卡·美团App手机Pay支付满10定额立减2元',
  desc: '工商银行借记卡持卡人在美团App点外卖或买菜使用手机Pay调起工行储蓄卡付款，享单笔满10元定额立减2元',
  channel: 'Pay', recurringType: 'day',
  pathDesc: '在手机钱包绑定工商银行借记卡（储蓄卡） → 打开美团App下单满10元 → 收银台选Apple Pay/手机Pay用工行储蓄卡付款立减2元',
  awardDesc: '【活动对象】持有中国工商银行62开头银联借记卡（储蓄卡）的个人客户。【活动内容】在美团App选购外卖餐饮，单笔满10元定额立减2元。'
};
const screenshotTime = todayInChina(new Date('2026-11-21T05:05:00+08:00'));
const icbcProfile = { location: guangzhou, cards: [{ bank: '工行', type: 'debit' }] };
const [icbcCandidate] = shortList([icbc], icbcProfile, screenshotTime);
const phonePay = qualify(icbcCandidate, icbc, screenshotTime);
assert.equal(phonePay.saving, 2);
assert.equal(phonePay.minimum, 10);
assert.equal(phonePay.payment, 'Apple Pay / 手机Pay');
assert.equal(shortList([icbc], { ...icbcProfile, cards: [{ bank: '工行', type: 'credit' }] }, screenshotTime).length, 0);
assert.equal(shortList([{ ...icbc, title: '美团随机刷卡金' }], icbcProfile, screenshotTime).length, 0);
assert.equal(qualify(icbcCandidate, { ...icbc, awardDesc: icbc.awardDesc.replace('立减2元','立减1元') }, screenshotTime), null);
assert.equal(qualify(icbcCandidate, { ...icbc, region: '深圳市' }, screenshotTime), null);

const bankGroups = [{ items: [['工行'], ['农行']] }, { items: [['招行']] }];
const bankOptions = bankOptionsFor([
  { bankName: '深圳农商银行', bankGroup: 'local' },
  { bankName: '上海银行', bankGroup: 'local' },
  { bankName: '工商银行', bankGroup: 'big6', bankSub: '工行' },
  { bankName: '香港汇丰银行', bankGroup: 'other' },
  { bankName: '澳门大西洋银行（BNU）', bankGroup: 'local' }
], bankGroups);
assert.equal(bankOptions.map(([label]) => label).join(','), '六大国有银行,股份制银行,城市商业银行,其他银行');
assert.equal(bankOptions[0][1].map(([key]) => key).join(','), '工行,农行');
assert.equal(bankOptions[2][1].map(([key]) => key).join(','), '上海银行');
assert.equal(bankOptions[3][1].some(([key]) => key === '深圳农商银行'), true);
console.log('Today deals, administrative locations and bank group checks passed.');
