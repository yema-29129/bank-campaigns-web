import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/today-deals.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(readFileSync(new URL('../assets/china-regions.js', import.meta.url), 'utf8'), { window });
vm.runInNewContext(source.replace(
  'window.BankLookup = { mount, matches };',
  'window.BankLookup = { matches, bankOptionsFor };'
), { window });

const { matches, bankOptionsFor } = window.BankLookup;
const china = window.ChinaRegions;
const guangzhou = { province: '广东省', city: '广州市' };
const shenzhen = { province: '广东省', city: '深圳市' };
const wuhan = { province: '湖北省', city: '武汉市' };
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

const huanggang = { province: '湖北省', city: '黄冈市' };
const agriculture = { location: huanggang, cards: [{ bank: '农行', type: 'all' }] };
const agricultureDebit = { ...agriculture, cards: [{ bank: '农行', type: 'debit' }] };
const agricultureCredit = { ...agriculture, cards: [{ bank: '农行', type: 'credit' }] };
const randomSaving = {
  bankName: '中国农业银行', bankGroup: 'big6', bankSub: '农行', isCredit: false, region: '全国',
  title: '农业银行借记卡·支付宝碰一下支付满50随机减2至10元'
};
const travelCredit = {
  ...randomSaving, isCredit: true, title: '农业银行信用卡·湖北省旅客火车票券', region: '湖北省'
};
const firstBind = { ...travelCredit, title: '农业银行信用卡·首次绑定微信支付领立减金' };
assert.equal(matches(randomSaving, agriculture), true);
assert.equal(matches(randomSaving, agricultureDebit), true);
assert.equal(matches(randomSaving, agricultureCredit), false);
assert.equal(matches(travelCredit, agriculture), true);
assert.equal(matches(travelCredit, agricultureDebit), false);
assert.equal(matches(firstBind, agriculture), true);
assert.equal(matches({ ...firstBind, isExpired: true }, agriculture), true);
assert.equal(matches({ ...firstBind, validFrom: '2027-01-01' }, agriculture), true);
assert.equal(matches({ ...travelCredit, region: '湖北省/武汉市' }, agriculture), false);
assert.equal(matches({ ...travelCredit, region: '广东省' }, agriculture), false);
assert.equal(matches({ ...travelCredit, bankName: '黄冈农村商业银行', bankGroup: 'local', bankSub: '农商/农信' }, agriculture), false);

const hongKongQuery = { location: hongKong, cards: [{ bank: '香港汇丰银行', type: 'all' }] };
const hongKongOffer = {
  bankName: '香港汇丰银行', bankGroup: 'other', websiteOfferId: 'travel',
  region: '境外（含中国香港、中国澳门）', title: '香港汇丰银行·旅行优惠'
};
assert.equal(matches(hongKongOffer, hongKongQuery), true);
assert.equal(matches({ ...hongKongOffer, region: '境外（新加坡）' }, hongKongQuery), false);
assert.equal(matches({ ...hongKongOffer, region: '全国' }, hongKongQuery), false);
const multipleBanks = {
  ...travelCredit, bankName: '工农中建交招等14家银行', bankGroup: 'local'
};
assert.equal(matches(multipleBanks, agriculture), true);
assert.equal(matches(multipleBanks, { ...agriculture, cards: [{ bank: '浦发', type: 'all' }] }), false);

const bankGroups = [{ items: [['工行'], ['农行']] }, { items: [['招行']] }];
const bankOptions = bankOptionsFor([
  { bankName: '深圳农商银行', bankGroup: 'local' },
  { bankName: '上海银行', bankGroup: 'local' },
  { bankName: '工商银行', bankGroup: 'big6', bankSub: '工行' },
  { bankName: '香港汇丰银行', bankGroup: 'other' },
  { bankName: '澳门大西洋银行（BNU）', bankGroup: 'local' },
  { bankName: '工农中建交招等14家银行', bankGroup: 'local' }
], bankGroups);
assert.equal(bankOptions.map(([label]) => label).join(','), '六大国有银行,股份制银行,城市商业银行,其他银行');
assert.equal(bankOptions[0][1].map(([key]) => key).join(','), '工行,农行');
assert.equal(bankOptions[0][1][1][1], '中国农业银行');
assert.equal(bankOptions[2][1].map(([key]) => key).join(','), '上海银行');
assert.equal(bankOptions[3][1].some(([key]) => key === '深圳农商银行'), true);
console.log('Bank lookup, region matching and issuer group checks passed.');
