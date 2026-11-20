import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/today-deals.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source.replace(
  'window.TodayDeals = { mount };',
  'window.TodayDeals = { todayInChina, shortList, qualify };'
), { window });

const { todayInChina, shortList, qualify } = window.TodayDeals;
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
const profile = { city: '武汉市', cards: [{ bank: '招行', type: 'credit' }, { bank: '中行', type: 'debit' }] };
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
console.log('Today deals checks passed.');
