// Pure helpers for the Reports page. Amounts arrive as JSON numbers per currency and are never added across
// currencies; the sums here are for display shares only.

// Which spending is a need and which a want (category codes, as the services send them). Anything not listed
// (Charity, Investments, Uncategorized ...) is "other". The same split as the mobile app.
const ESSENTIALS = new Set(['GROCERIES', 'UTILITIES', 'HEALTH', 'EDUCATION', 'TRANSPORTATION', 'FUEL', 'HOUSING', 'LOANS_EMI'])
const LIFESTYLE = new Set(['FOOD_AND_BEVERAGE', 'CLOTHING_AND_SHOPPING', 'ENTERTAINMENT', 'TRAVEL', 'SUBSCRIPTIONS', 'PERSONAL_CARE'])

export const lifestyleGroup = (code) => (ESSENTIALS.has(code) ? 'essentials' : LIFESTYLE.has(code) ? 'lifestyle' : 'other')

const percentOf = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// [{ code, label, amount, count, percent }] largest first; empty categories are left out
export function categoryRows(categories = []) {
  const rows = categories.filter((c) => Number(c.total) > 0)
  const whole = rows.reduce((sum, c) => sum + Number(c.total), 0)
  return rows
    .map((c) => ({ code: c.categoryCode ?? null, label: c.category, amount: Number(c.total), count: c.count ?? 0 }))
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({ ...c, percent: percentOf(c.amount, whole) }))
}

// Always essentials, lifestyle, other: [{ group, amount, percent }]
export function lifestyleShares(categories = []) {
  const sums = { essentials: 0, lifestyle: 0, other: 0 }
  for (const c of categories) if (Number(c.total) > 0) sums[lifestyleGroup(c.categoryCode)] += Number(c.total)
  const whole = sums.essentials + sums.lifestyle + sums.other
  return ['essentials', 'lifestyle', 'other'].map((group) => ({ group, amount: sums[group], percent: percentOf(sums[group], whole) }))
}

// Top shops of the rows (already expenses): [{ name, amount, count, categoryId }] largest first
export function merchantTotals(items = [], currency, limit = 10) {
  const groups = new Map()
  for (const item of items) {
    const name = item.merchant?.name
    if (item.currency !== currency || !name) continue
    const key = name.toLowerCase()
    const group = groups.get(key) ?? { name, amount: 0, count: 0, categories: new Map() }
    group.amount += item.amount
    group.count += 1
    group.categories.set(item.categoryId, (group.categories.get(item.categoryId) ?? 0) + 1)
    groups.set(key, group)
  }
  return [...groups.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((g) => ({
      name: g.name,
      amount: g.amount,
      count: g.count,
      categoryId: [...g.categories.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }))
}

export function biggestExpense(items = [], currency) {
  let top = null
  for (const item of items) if (item.currency === currency && (!top || item.amount > top.amount)) top = item
  return top
}

// Days the average is spread over: the whole month, or the days so far when it is the current month
export function daysCounted(month, today) {
  const [y, m] = month.split('-').map(Number)
  const inMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return today.slice(0, 7) === month ? Number(today.slice(8, 10)) : inMonth
}

export const averagePerDay = (total, days) => (days > 0 ? Number(total) / days : 0)

// Share of income kept, rounded; null when nothing came in
export const savingsRatePercent = (income, net) => (Number(income) > 0 ? Math.round((Number(net) / Number(income)) * 100) : null)

// ---- Pages added from the client's spending report (weekly, cards, money movement, debt, CSV) ----

// Money moved between the person's own accounts is not spending, so no list or count in the report includes it.
export const OWN_ACCOUNT = 'INTERNAL_TRANSFERS'
const TRANSFERS = 'TRANSFERS'
const CASH = 'CASH_WITHDRAWALS'
const LOANS = 'LOANS_EMI'

// The month's expense rows without own-account moves
export const spendingItems = (items = []) => items.filter((i) => i.categoryId !== OWN_ACCOUNT)

const DAY_MS = 86_400_000
const pad = (n) => String(n).padStart(2, '0')
const keyOf = (ms) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

// The calendar day (YYYY-MM-DD) of an instant in a time zone
export function dayInZone(iso, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

// Everyday spending week by week (weeks start on Sunday): [{ start: 'YYYY-MM-DD', amount, partial }] oldest first.
// partial: the week runs into the month before or after, and only this month's days are counted.
// Transfers to other people are not everyday spending, so they are left out.
export function weeklySpending(items = [], currency, month, timeZone) {
  const [y, m] = month.split('-').map(Number)
  const first = Date.UTC(y, m - 1, 1)
  const last = Date.UTC(y, m, 0)
  const totals = new Map()
  for (const item of items) {
    if (item.currency !== currency || item.categoryId === TRANSFERS || !item.occurredAt) continue
    const [dy, dm, dd] = dayInZone(item.occurredAt, timeZone).split('-').map(Number)
    const day = Date.UTC(dy, dm - 1, dd)
    const start = keyOf(day - new Date(day).getUTCDay() * DAY_MS)
    totals.set(start, (totals.get(start) ?? 0) + item.amount)
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, amount]) => {
      const [sy, sm, sd] = start.split('-').map(Number)
      const from = Date.UTC(sy, sm - 1, sd)
      return { start, amount, partial: from < first || from + 6 * DAY_MS > last }
    })
}

// Everyday spending by the card it was paid with, read from the description the phone's sync stored
// ("<bank> · card ****1234"): [{ card: '1234' | null, amount, count, percent }] largest first.
export function paymentMethods(items = [], currency) {
  const groups = new Map()
  for (const item of items) {
    if (item.currency !== currency || item.categoryId === TRANSFERS) continue
    const card = /\*{4}\s*(\d{4})/.exec(item.description ?? '')?.[1] ?? null
    const group = groups.get(card) ?? { amount: 0, count: 0 }
    group.amount += item.amount
    group.count += 1
    groups.set(card, group)
  }
  const whole = [...groups.values()].reduce((sum, g) => sum + g.amount, 0)
  return [...groups.entries()]
    .sort(([, a], [, b]) => b.amount - a.amount)
    .map(([card, g]) => ({ card, amount: g.amount, count: g.count, percent: percentOf(g.amount, whole) }))
}

const totalOf = (categories = [], code) => Number(categories.find((c) => c.categoryCode === code)?.total ?? 0)

// Everyday spending against transfers to others (purpose unknown) and cash taken out (part of everyday spending),
// next to what came in
export function moneyMovement(categories = [], spent = 0, income = 0) {
  const transfers = totalOf(categories, TRANSFERS)
  return { dayToDay: Math.max(Number(spent) - transfers, 0), transfers, cash: totalOf(categories, CASH), income: Number(income) }
}

// What went to loans and instalments: { loans, percentOfIncome (null without income), percentOfSpending }
export function debtSummary(categories = [], spent = 0, income = 0) {
  const loans = totalOf(categories, LOANS)
  return {
    loans,
    percentOfIncome: Number(income) > 0 ? percentOf(loans, Number(income)) : null,
    percentOfSpending: percentOf(loans, Number(spent)),
  }
}

// A cell with a comma, a quote or a line break is wrapped in quotes. One starting with = + - @ or a tab would run
// as a formula in Excel, and merchant names are free text, so it gets a leading apostrophe.
const TAB = String.fromCharCode(9)
const LF = String.fromCharCode(10)
const CR = String.fromCharCode(13)
const CRLF = CR + LF
export function csvCell(value) {
  const text = String(value ?? '')
  const risky = '=+-@'.includes(text[0] ?? ' ') || text[0] === TAB || text[0] === CR
  const safe = risky ? "'" + text : text
  const quoted = safe.includes(',') || safe.includes('"') || safe.includes(LF) || safe.includes(CR)
  return quoted ? '"' + safe.split('"').join('""') + '"' : safe
}

// The month's spending rows as CSV text that opens in Excel (the byte order mark makes Arabic read correctly).
// labels: { date, merchant, description, category, amount, currency }; nameOf: category code -> display name.
export function reportCsv(items = [], currency, labels, nameOf, timeZone) {
  const header = [labels.date, labels.merchant, labels.description, labels.category, labels.amount, labels.currency]
  const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false })
  const rows = items
    .filter((i) => i.currency === currency)
    .map((i) =>
      [
        i.occurredAt ? dayInZone(i.occurredAt, timeZone) + ' ' + time.format(new Date(i.occurredAt)) : '',
        i.merchant?.name ?? '',
        i.description ?? '',
        i.categoryId ? nameOf(i.categoryId) : '',
        i.amount,
        i.currency,
      ]
        .map(csvCell)
        .join(','),
    )
  return String.fromCharCode(0xfeff) + [header.map(csvCell).join(','), ...rows].join(CRLF) + CRLF
}
