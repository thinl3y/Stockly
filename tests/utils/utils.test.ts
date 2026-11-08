// Unit tests for the pure helper functions (statistics, validation, greeting, dates).
// Run with: npm test
import { computePurchaseStats, countThisMonth, recordsInPeriod } from '../../src/utils/stats';
import { isValidEmail, parseOptionalQuantity } from '../../src/utils/validation';
import { getFirstName, getGreeting, getInitials } from '../../src/utils/greeting';
import { dayKey, formatDayLabel, formatQuantity } from '../../src/utils/format';
import type { Category, PurchaseRecord } from '../../src/types';

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, extra = '') => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
};

const NOW = new Date(2026, 10, 7, 20, 0); // 7 Nov 2026, 8 pm local time
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
let id = 0;
const rec = (name: string, when: Date | null, category: Category = 'Groceries'): PurchaseRecord => ({
  id: `r${++id}`,
  itemId: null,
  shoppingItemId: `s${id}`,
  name,
  category,
  quantity: null,
  unit: null,
  purchasedAt: when,
});

const records: PurchaseRecord[] = [
  rec('Rice', daysAgo(1)),
  rec('rice ', daysAgo(3)), // same item, different spelling
  rec('Milk', daysAgo(2)),
  rec('Rice', daysAgo(20)),
  rec('Soap', daysAgo(10), 'Toiletries'),
  rec('Soap', daysAgo(12), 'Toiletries'),
  rec('Candles', daysAgo(45), 'Others'),
  rec('Bread', null), // server time still pending -> counts as "now"
];

// ---- Purchase statistics ----
const week = computePurchaseStats(records, '7d', NOW);
check('7 days: counts purchases in the last 7 days (incl. pending)', week.total === 4, `got ${week.total}`);
check('7 days: groups names ignoring case/spaces', week.top[0]?.name === 'Rice' && week.top[0]?.count === 2);
check('7 days: distinct items', week.distinctItems === 3, `got ${week.distinctItems}`);

const month = computePurchaseStats(records, '30d', NOW);
check('30 days: total', month.total === 7, `got ${month.total}`);
check('30 days: top items ordered by count', month.top.map((t) => `${t.name}:${t.count}`).join(',') === 'Rice:3,Soap:2,Bread:1',
  month.top.map((t) => `${t.name}:${t.count}`).join(','));
check('30 days: top item keeps its category', month.top[1]?.category === 'Toiletries');

const all = computePurchaseStats(records, 'all', NOW);
check('All time: includes old purchases', all.total === 8 && all.distinctItems === 5);
check('Top list is limited to 3', all.top.length === 3);
check('Empty history gives zero stats', computePurchaseStats([], '30d', NOW).total === 0);
check('recordsInPeriod excludes older records', recordsInPeriod(records, '7d', NOW).every((r) => r.name !== 'Soap'));
check('This month counts November only (20+ days ago is October)', countThisMonth(records, NOW) === 4, `got ${countThisMonth(records, NOW)}`);

// ---- Validation ----
check('Valid email accepted', isValidEmail('tenzin@example.com') && isValidEmail(' a.b@uni.edu.bt '));
check('Invalid emails rejected', !isValidEmail('tenzin@example') && !isValidEmail('no-at.com') && !isValidEmail('a b@c.com'));
check('Empty quantity -> null', parseOptionalQuantity('  ') === null);
check('Decimal quantity with comma -> number', parseOptionalQuantity('1,5') === 1.5);
check('Text quantity -> NaN (rejected by forms)', Number.isNaN(parseOptionalQuantity('abc')));
check('Negative quantity rejected', Number.isNaN(parseOptionalQuantity('-2')));

// ---- Greeting and names ----
check('Greeting: morning', getGreeting(new Date(2026, 0, 1, 8)) === 'Good Morning');
check('Greeting: afternoon', getGreeting(new Date(2026, 0, 1, 13)) === 'Good Afternoon');
check('Greeting: evening', getGreeting(new Date(2026, 0, 1, 19)) === 'Good Evening');
check('Greeting: late night is still evening', getGreeting(new Date(2026, 0, 1, 23)) === 'Good Evening' && getGreeting(new Date(2026, 0, 1, 2)) === 'Good Evening');
check('First name', getFirstName('  Tenzin   Wangmo ') === 'Tenzin');
check('Initials', getInitials('Tenzin Wangmo') === 'TW' && getInitials('pema') === 'P' && getInitials('') === '?');

// ---- Dates and quantities ----
check('Day label: today', formatDayLabel(new Date(2026, 10, 7, 9), NOW) === 'Today');
check('Day label: yesterday', formatDayLabel(new Date(2026, 10, 6, 23), NOW) === 'Yesterday');
check('Day key groups by local day', dayKey(new Date(2026, 10, 7, 0, 5)) === '2026-11-07');
check('Quantity formatting', formatQuantity(2, 'kg') === '2 kg' && formatQuantity(null, null) === null && formatQuantity(3, ' ') === '3');

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exitCode = 1;
