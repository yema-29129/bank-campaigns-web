import fs from 'node:fs';
import vm from 'node:vm';

const appSource = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const stateStart = appSource.indexOf('const state =');
const start = appSource.indexOf('function parseDate');
const end = appSource.indexOf('function setLoadingState');
if (stateStart < 0 || start <= stateStart || end <= start) throw new Error('Unable to locate sorting source');

const context = {};
vm.runInNewContext(`${appSource.slice(0, stateStart)}\n${appSource.slice(start, end)}\nglobalThis.sortTestApi = {
  metrics: getDiscountMetrics,
  compare: compareCampaign,
  normalize: normalizeCampaign
};`, context);

const { metrics, compare, normalize } = context.sortTestApi;
let checks = 0;
let failures = 0;

function expect(name, actual, expected) {
  checks += 1;
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

expect('75折 becomes 25% off', metrics({ title: '指定套餐75折' }).discountRate, 25);
expect('满400减120 becomes 30% off', metrics({ title: '酒店券满400英镑减120英镑' }).discountRate, 30);
expect('highest percentage is retained', metrics({ title: '最高减80%，其他商品减20%' }).discountRate, 80);
expect('RMB fixed saving is retained', metrics({ title: '指定家电最高减250元' }).discountAmount, 250);
expect('monthly equivalent is not read as 1折', metrics({ title: '首期最高减70%', desc: '折合每月1.49美元' }).discountRate, 70);

const today = new Date();
today.setHours(0, 0, 0, 0);
const iso = (offset) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const item = (id, fromOffset, toOffset, discountRate = 0) => ({
  id,
  validFrom: iso(fromOffset),
  validTo: iso(toOffset),
  isExpired: toOffset < 0,
  isTodayAdded: false,
  discountRate,
  discountAmount: 0,
  referenceTime: 0,
  sortTime: 0
});

const additions = [
  { ...item('older-edited-today', -2, 1), createdAt: `${iso(-5)} 19:35:00`, updatedAt: `${iso(0)} 12:00:00` },
  { ...item('unknown-add-time', -1, 8), updatedAt: `${iso(0)} 22:00:00` },
  { ...item('new-upcoming', 4, 9), createdAt: `${iso(-1)} 10:30:00` },
  { ...item('new-ongoing', -4, 6), created_at: `${iso(-1)} 09:30:00` },
  { ...item('already-expired', -4, -1), createdAt: `${iso(0)} 06:00:00` }
].map(normalize).sort(compare);
expect('default puts the latest addition first across start states', additions[0].id, 'new-upcoming');
expect('default compares addition times within the same day', additions[1].id, 'new-ongoing');
expect('edits do not change the addition order', additions[2].id, 'older-edited-today');
expect('older undated activity follows dated entries', additions[3].id, 'unknown-add-time');
expect('expired records stay in the separate archive group', additions[4].id, 'already-expired');

const recommended = [
  item('upcoming', 2, 10, 90),
  item('later-ending', -4, 6, 20),
  item('soon-ending', -2, 1, 10)
].sort((a, b) => compare(a, b, 'recommended'));
expect('recommended keeps ongoing before upcoming', recommended[0].id, 'soon-ending');
expect('recommended orders ongoing by nearest end', recommended[1].id, 'later-ending');
expect('recommended puts upcoming after ongoing', recommended[2].id, 'upcoming');

const discount = [
  item('ongoing-20', -2, 3, 20),
  item('upcoming-80', 2, 6, 80)
].sort((a, b) => compare(a, b, 'discount'));
expect('discount mode sorts active and upcoming by strength', discount[0].id, 'upcoming-80');

const starting = [
  item('upcoming-later', 5, 9),
  item('upcoming-sooner', 2, 8)
].sort((a, b) => compare(a, b, 'starting'));
expect('starting mode puts nearest upcoming first', starting[0].id, 'upcoming-sooner');

const merchants = [
  { ...item('z', -1, 5), bankName: 'Zeta' },
  { ...item('a', 2, 6), bankName: 'Alpha' }
].sort((a, b) => compare(a, b, 'merchant'));
expect('merchant mode sorts across active and upcoming items', merchants[0].bankName, 'Alpha');

if (failures) process.exitCode = 1;
else console.log(`PASS ${checks} campaign sorting cases`);
