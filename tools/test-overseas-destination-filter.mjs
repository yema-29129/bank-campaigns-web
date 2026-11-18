import fs from 'node:fs';
import vm from 'node:vm';

const appSource = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const stateStart = appSource.indexOf('const state =');
if (stateStart < 0) throw new Error('Unable to locate filter source in assets/app.js');

const context = {};
vm.runInNewContext(`${appSource.slice(0, stateStart)}\nglobalThis.filterTestApi = {
  match(item, destination) {
    const normalized = {
      ...item,
      overseasRegionText: overseasDestination(item.region),
      overseasCampaignText: [
        overseasTitleScope(item.title), item.desc, item.consumeChannel, item.channel,
        ...(Array.isArray(item.tags) ? item.tags : [])
      ].filter(Boolean).join(' '),
      overseasScopeText: [
        overseasTitleScope(item.title)
      ].filter(Boolean).join(' '),
      overseasDestinationText: [
        overseasDestination(item.region), item.title, item.desc,
        item.consumeChannel, item.channel,
        ...(Array.isArray(item.tags) ? item.tags : [])
      ].filter(Boolean).join(' ')
    };
    return matchesOverseasDestination(normalized, destination);
  },
  isOverseas(item) {
    return classifyScenes(item).includes('境外游');
  }
};`, context);

const { match, isOverseas } = context.filterTestApi;
const cases = [
  ['generic overseas covers Japan', { title: '信用卡境外线下消费返现', region: '境外' }, '日本', true],
  ['global coverage covers Japan', { title: '全球消费返现', region: '全球' }, '日本', true],
  ['Asia scope covers Japan', { title: '亚洲指定币种消费返现', region: '亚洲' }, '日本', true],
  ['Japan explicit coverage', { title: '日本线下消费返现', region: '日本' }, '日本', true],
  ['Europe-only does not cover Japan', { title: '英国法国指定商户返现', region: '英国、法国' }, '日本', false],
  ['Japan exclusion wins over global scope', { title: '全球消费返现（日本除外）', region: '全球' }, '日本', false],
  ['US-only restriction does not cover Japan', { title: '境外消费返现', region: '境外（仅限美国）' }, '日本', false],
  ['Macau-only campaign stays out of Japan', { title: '中国澳门消费返现', region: '中国澳门', tags: ['境外返现'] }, '日本', false],
  ['UK-France campaign stays out of Japan', { title: '英法指定商户返现', region: '英国、法国', tags: ['境外返现'] }, '日本', false],
  ['generic overseas covers the US', { title: '信用卡境外线下消费返现', region: '境外' }, '美国', true],
  ['Europe scope does not cover the US', { title: '欧洲指定商户返现', region: '欧洲' }, '美国', false],
  ['generic overseas with examples still covers other destinations', { title: '信用卡境外消费返现', region: '境外（含中国香港、中国澳门、中国台湾）' }, '其他境外', true],
  ['generic region does not widen Japan-only title to the US', { title: '中国银行信用卡·日本指定商户返现', region: '境外', tags: ['境外返现'] }, '美国', false],
  ['generic region keeps Japan-only title in Japan', { title: '中国银行信用卡·日本指定商户返现', region: '境外', tags: ['境外返现'] }, '日本', true],
  ['generic region does not widen Japan-only title to other destinations', { title: '中国银行信用卡·日本指定商户返现', region: '境外', tags: ['境外返现'] }, '其他境外', false],
  ['issuer location does not override Japan-only destination', { title: '香港某银行信用卡·日本指定商户返现', region: '境外', tags: ['境外返现'] }, '中国香港', false],
  ['issuer location keeps Japan-only destination in Japan', { title: '香港某银行信用卡·日本指定商户返现', region: '境外', tags: ['境外返现'] }, '日本', true]
];

let failures = 0;
for (const [name, item, destination, expected] of cases) {
  const actual = match(item, destination);
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

const genericChinaIssuedCard = {
  title: '中国建设银行信用卡境外线下消费返现',
  bankName: '中国建设银行',
  region: '境外'
};
const destinationKeys = [
  '中国香港', '中国澳门', '中国台湾', '日本', '韩国', '泰国',
  '东南亚', '美国', '欧洲', '澳新', '中东', '其他境外'
];
const missingGenericDestinations = destinationKeys.filter((destination) => !match(genericChinaIssuedCard, destination));
if (missingGenericDestinations.length) {
  failures += 1;
  console.error(`FAIL generic China-issued overseas card missing: ${missingGenericDestinations.join(', ')}`);
}

if (failures) process.exitCode = 1;
else console.log(`PASS ${cases.length + 1} destination coverage cases`);

const dataPath = process.argv[2];
if (dataPath) {
  const payload = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const rows = Array.isArray(payload) ? payload : (payload.data || []);
  const today = new Date('2026-11-18T00:00:00+08:00');
  const active = rows.filter((item) => {
    const end = item.validTo ? new Date(`${String(item.validTo).slice(0, 10)}T23:59:59+08:00`) : null;
    return !end || Number.isNaN(end.getTime()) || end >= today;
  });
  const overseas = active.filter(isOverseas);
  const japan = overseas.filter((item) => match(item, '日本'));
  console.log(`DATA active=${active.length} overseas=${overseas.length} japan=${japan.length}`);
  console.log(japan.slice(0, 12).map((item) => `${item.id} ${item.title}`).join('\n'));
}
