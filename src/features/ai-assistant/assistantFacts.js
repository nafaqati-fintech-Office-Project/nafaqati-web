// The assistant's numbers come from here, never from the model: it works out the exact figures for a question
// and the model only puts them into words. When the model cannot be reached the fallback text is shown as it is.
// Same rules as the mobile app (src/features/assistant/assistantFacts.ts there).
//
// data (see assistantData.js): { currency, today: 'YYYY-MM-DD', months: [newest first, the first still running],
//   budget, goals, subscriptions }. Amounts are numbers in major units; the maths runs in minor units (x100).
// text: ASSISTANT_TEXT[lang]; nameOf(code): the category's name in the user's language.

import { lifestyleGroup } from '../reports/reportUtils.js'

const DAY_MS = 86_400_000
const CUT_SHARE = 0.25
const MAX_ROWS = 5

const CATEGORY_WORDS = [
  [/restaurant|food|eat|dining|lunch|dinner|مطعم|مطاعم|طعام|أكل/i, 'FOOD_AND_BEVERAGE'],
  [/grocer|supermarket|بقال|سوبر ?ماركت|تموين/i, 'GROCERIES'],
  [/fuel|petrol|gasoline|بنزين|وقود/i, 'FUEL'],
  [/transport|taxi|uber|careem|ride|مواصلات|تاكسي|نقل/i, 'TRANSPORTATION'],
  [/shopping|cloth|fashion|تسوق|ملابس|أزياء/i, 'CLOTHING_AND_SHOPPING'],
  [/entertain|cinema|movie|game|ترفيه|سينما|ألعاب/i, 'ENTERTAINMENT'],
  [/subscription|اشتراك/i, 'SUBSCRIPTIONS'],
  [/travel|flight|hotel|سفر|طيران|فندق/i, 'TRAVEL'],
  [/health|pharmac|doctor|hospital|صحة|صيدلي|طبيب|مستشفى/i, 'HEALTH'],
  [/utilit|electric|water bill|internet|phone bill|فواتير|كهرباء|ماء|إنترنت/i, 'UTILITIES'],
  [/rent|housing|إيجار|سكن/i, 'HOUSING'],
  [/educat|school|tuition|course|تعليم|مدرس|دراس/i, 'EDUCATION'],
  [/loan|emi|instal|قرض|قسط|أقساط/i, 'LOANS_EMI'],
  [/charity|donat|zakat|sadaqah|صدق|تبرع|زكاة/i, 'CHARITY'],
]

const COFFEE_WORD = /coffee|cafe|café|latte|قهوة|كافيه|كوفي/i
const COFFEE_SHOP =
  /coffee|cafe|café|starbucks|costa|tim hortons|dunkin|barn'?s|caribou|dose|half million|arabica|espresso|brew|قهوة|كوفي|كافيه/i

const INTENTS = [
  ['invest', /invest|stock|shares|fund|crypto|استثمار|أستثمر|أسهم|صندوق|صناديق/i],
  ['goal', /\bgoals?\b|vacation|holiday|trip|save up|saving for|save for|saved for|afford|هدف|أهداف|إجازة|رحلة|عطلة/i],
  ['cut', /\bcut|reduce|spend less|save money|where can i save|cheaper|lower my|تقليل|أقلل|قلل|أخفض|توفير|أوفر/i],
  ['subscriptions', /subscription|اشتراك/i],
  ['budget', /budget|limit|ميزانية|الحد/i],
  ['topExpenses', /\btop\b|biggest|largest|most expensive|highest|أكبر|أعلى|أغلى/i],
  ['rising', /rising|increas|going up|grew|overspend|زاد|زيادة|ارتفع|ارتفاع|تجاوز/i],
  ['compare', /compar|\bvs\b|versus|than last|difference|مقارنة|قارن|مقابل/i],
  ['savings', /savings rate|how much (did i|have i) save|kept|saved|نسبة الادخار|ادخرت|وفرت/i],
  ['spendOn', /spen[dt]|cost|paid|pay for|how much|صرفت|أنفقت|دفعت|كم/i],
]

const LAST_MONTH = /last month|previous month|past month|الشهر الماضي|الشهر السابق|الشهر اللي فات/i

const toMinor = (amount) => Math.round(Number(amount) * 100)
const plain = (minor, currency) => `${currency} ${(minor / 100).toFixed(2)}`
const fill = (template, params = {}) => template.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match)
const lines = (...parts) => parts.filter(Boolean).join('\n')

export function detectIntent(question) {
  return INTENTS.find(([, pattern]) => pattern.test(question))?.[0] ?? 'overview'
}

// Average money left over a month across the finished months (this month only when there is nothing else), in minor units.
export function freeCashFlow(data) {
  const same = data.months.filter((m) => m.currency === data.currency)
  const source = same.slice(1).length ? same.slice(1) : same
  if (!source.length) return null
  return Math.round(source.reduce((sum, m) => sum + toMinor(m.net), 0) / source.length)
}

function averageSpent(data) {
  const same = data.months.filter((m) => m.currency === data.currency)
  const source = same.slice(1).length ? same.slice(1) : same
  if (!source.length) return null
  return Math.round(source.reduce((sum, m) => sum + toMinor(m.spent), 0) / source.length)
}

export function risingCategories(later, earlier) {
  return later.categories
    .map((row) => {
      const before = earlier.categories.find((c) => c.code === row.code)
      const now = toMinor(row.amount)
      const then = before ? toMinor(before.amount) : 0
      return { ...row, increase: now - then, percent: then > 0 ? Math.round(((now - then) / then) * 100) : null }
    })
    .filter((r) => r.increase > 0 && (r.percent === null || r.percent >= 10))
    .sort((a, b) => b.increase - a.increase)
}

// Lifestyle spending of the last finished month trimmed by a quarter, and each confirmed subscription. Biggest first.
export function cutOptions(data) {
  const report = data.months[1] ?? data.months[0]
  const categories =
    report && report.currency === data.currency
      ? report.categories
          .filter((c) => lifestyleGroup(c.code) === 'lifestyle' && c.code !== 'SUBSCRIPTIONS')
          .map((c) => ({ kind: 'category', code: c.code, name: c.name, saving: Math.round(toMinor(c.amount) * CUT_SHARE) }))
      : []
  const subs = data.subscriptions
    .filter((s) => s.currency === data.currency)
    .map((s) => ({ kind: 'subscription', name: s.name, saving: toMinor(s.monthlyCost) }))
  return [...categories, ...subs].filter((c) => c.saving > 0).sort((a, b) => b.saving - a.saving)
}

const words = (s) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3)

export function namedGoal(question, goals) {
  const asked = new Set(words(question))
  return goals.find((g) => words(g.name).some((w) => asked.has(w))) ?? null
}

export const findGoal = (question, goals) => namedGoal(question, goals) ?? (goals.length === 1 ? goals[0] : null)

const ceilDiv = (a, b) => Math.ceil(a / b)
const dayValue = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// All money in minor units of the goal's currency.
export function planGoal(goal, data) {
  const remaining = Math.max(toMinor(goal.target) - toMinor(goal.saved), 0)
  const free = goal.currency === data.currency ? freeCashFlow(data) : null
  const daysLeft = goal.targetDate ? Math.max(Math.round((dayValue(goal.targetDate) - dayValue(data.today)) / DAY_MS), 1) : null
  const plan = {
    remaining,
    daysLeft,
    perDay: daysLeft ? ceilDiv(remaining, daysLeft) : null,
    perWeek: daysLeft ? (daysLeft <= 7 ? remaining : ceilDiv(remaining * 7, daysLeft)) : null,
    perMonth: daysLeft ? (daysLeft <= 30 ? remaining : ceilDiv(remaining * 30, daysLeft)) : null,
    free,
    availableByDate: null,
    realistic: null,
    gap: 0,
    monthsAtPace: null,
    cuts: [],
  }
  if (remaining === 0 || free === null) return plan
  if (daysLeft === null) {
    plan.monthsAtPace = free > 0 ? ceilDiv(remaining, free) : null
    return plan
  }
  const available = Math.max(Math.floor((free * daysLeft) / 30), 0)
  plan.availableByDate = available
  plan.realistic = available >= remaining
  plan.gap = Math.max(remaining - available, 0)
  if (plan.gap > 0) {
    const neededMonthly = ceilDiv(plan.gap * 30, Math.max(daysLeft, 30))
    let covered = 0
    for (const option of cutOptions(data)) {
      if (covered >= neededMonthly) break
      plan.cuts.push(option)
      covered += option.saving
    }
  }
  return plan
}

// The facts for one question: { intent, facts (English, for the model), fallback (user's language), actions }.
// format(amount, currency) formats a major-unit amount for the user; monthLabel('YYYY-MM') names a month.
export function answerQuestion(question, data, { text, nameOf, format, monthLabel }) {
  const currency = data.currency
  const money = (minor, cur = currency) => format(minor / 100, cur)
  const catName = (c) => nameOf(c.code) || c.name
  const pickMonth = () => (LAST_MONTH.test(question) ? data.months[1] : data.months[0]) ?? null
  const say = (key, params) => fill(text.f[key], params)
  const noData = (intent, report) => ({
    intent,
    facts: ['The app has no spending data for this question yet.'],
    fallback: report ? say('noDataMonth', { month: monthLabel(report.month) }) : say('noData'),
    actions: [{ id: 'view_transactions' }],
  })
  const cutFact = (c) =>
    c.kind === 'category'
      ? `Spend 25% less on ${c.name}: saves ${plain(c.saving, currency)} a month`
      : `Cancel the ${c.name} subscription: saves ${plain(c.saving, currency)} a month`
  const cutLine = (c) =>
    c.kind === 'category'
      ? say('cutCategory', { category: catName(c), amount: money(c.saving) })
      : say('cutSub', { name: c.name, amount: money(c.saving) })

  const intent = detectIntent(question)

  if (intent === 'invest') {
    const free = freeCashFlow(data)
    const spent = averageSpent(data)
    if (free === null || spent === null || free <= 0) {
      return {
        intent,
        facts: [free === null ? 'No income or spending data yet.' : `Free cash flow is ${plain(free, currency)} a month: no surplus to invest.`, 'Give general guidance only.'],
        fallback: lines(say('investNoSurplus'), say('investDisclaimer')),
        actions: [{ id: 'view_budget' }],
      }
    }
    return {
      intent,
      facts: [
        `Usual free cash flow: ${plain(free, currency)} a month. Average monthly spending: ${plain(spent, currency)}.`,
        `Emergency fund of 3 to 6 months of spending: ${plain(spent * 3, currency)} to ${plain(spent * 6, currency)}.`,
        'Give general guidance only: emergency fund first, then savings accounts or Sharia-compliant funds as categories of options. No specific products.',
      ],
      fallback: lines(
        say('investIntro', { free: money(free) }),
        say('investEmergency', { low: money(spent * 3), high: money(spent * 6) }),
        say('investOptions'),
        say('investDisclaimer'),
      ),
      actions: [{ id: 'view_goals' }],
    }
  }

  if (intent === 'goal' || (intent === 'overview' && namedGoal(question, data.goals))) {
    const goals = data.goals
    if (!goals.length) return { intent: 'goal', facts: ['The user has no active goals.'], fallback: say('goalNone'), actions: [{ id: 'view_goals' }] }
    const goal = findGoal(question, goals)
    if (!goal) {
      return {
        intent: 'goal',
        facts: [`Active goals: ${goals.map((g) => `${g.name} (${g.currency} ${g.saved} of ${g.target})`).join('; ')}. The question did not name one.`],
        fallback: say('goalWhich', { list: goals.map((g) => g.name).join(', ') }),
        actions: [{ id: 'view_goals' }],
      }
    }
    const plan = planGoal(goal, data)
    const gm = (minor) => money(minor, goal.currency)
    const gp = (minor) => plain(minor, goal.currency)
    const facts = [
      `Goal "${goal.name}": target ${goal.currency} ${goal.target}, saved ${goal.saved}, remaining ${gp(plan.remaining)}` +
        (goal.targetDate ? `, target date ${goal.targetDate} (${plan.daysLeft} days left).` : ', no target date.'),
    ]
    if (plan.remaining === 0) {
      return { intent: 'goal', facts: [...facts, 'The goal is fully saved.'], fallback: say('goalReached', { goal: goal.name }), actions: [{ id: 'view_goals' }] }
    }
    const out = []
    const actions = [{ id: 'add_to_goal', goalId: goal.id, goalName: goal.name }]
    if (plan.daysLeft !== null) {
      facts.push(`Needed: ${gp(plan.perDay)} a day, ${gp(plan.perWeek)} a week, ${gp(plan.perMonth)} a month.`)
      out.push(say('goalPlan', { goal: goal.name, remaining: gm(plan.remaining), days: String(plan.daysLeft), perDay: gm(plan.perDay), perWeek: gm(plan.perWeek) }))
    } else {
      out.push(say('goalNoDate', { goal: goal.name, remaining: gm(plan.remaining) }))
    }
    if (goal.currency !== currency) {
      facts.push(`The goal's currency (${goal.currency}) differs from the spending currency (${currency}); no comparison with cash flow.`)
      out.push(say('goalCurrency', { goalCurrency: goal.currency, currency }))
    } else if (plan.free !== null) {
      facts.push(`Usual free cash flow (income minus spending, average of finished months): ${gp(plan.free)} a month.`)
      if (plan.free <= 0) {
        facts.push('There is no surplus at the current pace.')
        out.push(say('goalNoSurplus'))
      } else {
        out.push(say('goalFree', { free: gm(plan.free) }))
        if (plan.realistic === true) {
          facts.push(`By the target date the usual surplus adds up to about ${gp(plan.availableByDate)}: realistic.`)
          out.push(say('goalRealistic'))
        } else if (plan.realistic === false) {
          facts.push(`By the target date the usual surplus adds up to about ${gp(plan.availableByDate)}: short by ${gp(plan.gap)}, not realistic without changes.`)
          out.push(say('goalGap', { gap: gm(plan.gap) }))
        } else if (plan.monthsAtPace !== null) {
          facts.push(`At the usual pace it takes about ${plan.monthsAtPace} months.`)
          out.push(say('goalMonths', { months: String(plan.monthsAtPace) }))
        }
      }
    }
    if (plan.cuts.length) {
      facts.push('Cuts that would close the gap: ' + plan.cuts.map(cutFact).join('; ') + '.')
      out.push(...plan.cuts.map((c) => `• ${cutLine(c)}`))
      actions.push({ id: 'edit_budget' })
    }
    return { intent: 'goal', facts, fallback: out.join('\n'), actions }
  }

  if (intent === 'cut') {
    const options = cutOptions(data).slice(0, MAX_ROWS)
    const report = data.months[1] ?? data.months[0]
    if (!options.length) return { intent, facts: ['No lifestyle spending or subscriptions to cut.'], fallback: say('cutNone'), actions: [{ id: 'view_reports' }] }
    const total = options.reduce((sum, c) => sum + c.saving, 0)
    const lifestyle = report?.lifestyle.find((l) => l.group === 'lifestyle')
    return {
      intent,
      facts: [
        report && lifestyle ? `Lifestyle (wants) spending in ${report.month}: ${report.currency} ${lifestyle.amount.toFixed(2)} (${lifestyle.percent}% of spending).` : '',
        ...options.map(cutFact),
        `All of these together: ${plain(total, currency)} a month.`,
      ].filter(Boolean),
      fallback: lines(say('cut', { month: report ? monthLabel(report.month) : '' }), ...options.map((c) => `• ${cutLine(c)}`), say('cutTotal', { amount: money(total) })),
      actions: [{ id: 'edit_budget' }, { id: 'view_subscriptions' }],
    }
  }

  if (intent === 'subscriptions') {
    const subs = data.subscriptions.filter((s) => s.currency === currency).sort((a, b) => b.monthlyCost - a.monthlyCost)
    if (!subs.length) return { intent, facts: ['No confirmed subscriptions.'], fallback: say('subsNone'), actions: [{ id: 'view_subscriptions' }] }
    const total = subs.reduce((sum, s) => sum + toMinor(s.monthlyCost), 0)
    return {
      intent,
      facts: [`Confirmed subscriptions: ${subs.length}, together ${plain(total, currency)} a month.`, ...subs.map((s) => `${s.name}: ${plain(toMinor(s.monthlyCost), currency)} a month (${String(s.cycle).toLowerCase()}).`)],
      fallback: say('subs', { total: money(total), count: String(subs.length), list: subs.slice(0, 3).map((s) => `${s.name} (${money(toMinor(s.monthlyCost))})`).join(', ') }),
      actions: [{ id: 'view_subscriptions' }],
    }
  }

  if (intent === 'budget') {
    const b = data.budget
    if (!b) return { intent, facts: ['The user has no budget for this month.'], fallback: say('budgetNone'), actions: [{ id: 'view_budget' }] }
    const list = (rows) => rows.map((c) => `${catName(c)} (${c.percent}%)`).join(', ')
    const over = b.categories.filter((c) => c.status === 'over')
    const warn = b.categories.filter((c) => c.status === 'warning')
    return {
      intent,
      facts: [
        `Budget this month: ${b.currency} ${b.spent} spent of ${b.limit} (${b.percent}%), ${b.remaining} left.`,
        ...b.categories.map((c) => `${c.name}: ${c.spent} of ${c.limit} (${c.percent}%, ${c.status}).`),
      ],
      fallback: lines(
        say('budget', { spent: format(b.spent, b.currency), limit: format(b.limit, b.currency), percent: String(b.percent) }),
        over.length > 0 && say('budgetOver', { list: list(over) }),
        warn.length > 0 && say('budgetWarn', { list: list(warn) }),
      ),
      actions: [{ id: 'edit_budget' }],
    }
  }

  if (intent === 'topExpenses') {
    const report = pickMonth()
    if (!report) return noData(intent)
    const n = Math.min(Math.max(Number(/(\d+)/.exec(question)?.[1] ?? MAX_ROWS), 1), 10)
    const byShop = report.merchantsState === 'ready' && report.merchants.length > 0
    const rows = byShop
      ? [...report.merchants].sort((a, b) => b.amount - a.amount).slice(0, n).map((m) => ({ name: m.name, shown: m.name, amount: m.amount }))
      : report.categories.slice(0, n).map((c) => ({ name: c.name, shown: catName(c), amount: c.amount }))
    if (!rows.length) return noData(intent, report)
    return {
      intent,
      facts: [`Top ${rows.length} ${byShop ? 'merchants' : 'categories'} by spending in ${report.month}: ` + rows.map((r, i) => `${i + 1}. ${r.name} ${plain(toMinor(r.amount), report.currency)}`).join('; ')],
      fallback: lines(say('top', { n: String(rows.length), month: monthLabel(report.month) }), ...rows.map((r, i) => say('row', { rank: String(i + 1), name: r.shown, amount: format(r.amount, report.currency) }))),
      actions: [{ id: 'view_reports' }],
    }
  }

  if (intent === 'rising') {
    const [current, previous, before] = data.months
    const later = before ? previous : current
    const earlier = before ?? previous
    if (!later || !earlier) return noData(intent, current)
    const rows = risingCategories(later, earlier).slice(0, MAX_ROWS)
    const near = (data.budget?.categories ?? []).filter((c) => c.status !== 'ok')
    const month = monthLabel(later.month)
    return {
      intent,
      facts: [
        rows.length
          ? `Categories that rose in ${later.month} vs ${earlier.month}: ` + rows.map((r) => `${r.name} ${plain(toMinor(r.amount), later.currency)} (${r.percent === null ? 'new' : `+${r.percent}%`})`).join('; ')
          : `No category rose by 10% or more in ${later.month} vs ${earlier.month}.`,
        ...near.map((c) => `Budget this month: ${c.name} used ${c.percent}% (${c.spent} of ${c.limit}), status ${c.status}.`),
      ],
      fallback: lines(
        rows.length ? say('rising', { month }) : say('risingNone', { month }),
        ...rows.map((r) => say(r.percent === null ? 'risingNew' : 'risingRow', { category: catName(r), amount: format(r.amount, later.currency), percent: String(r.percent ?? 0) })),
        ...near.map((c) => say('budgetNear', { category: catName(c), percent: String(c.percent), spent: format(c.spent, data.budget.currency), limit: format(c.limit, data.budget.currency) })),
      ),
      actions: near.length ? [{ id: 'edit_budget' }, { id: 'view_reports' }] : [{ id: 'view_reports' }],
    }
  }

  if (intent === 'compare') {
    const [current, previous] = data.months
    if (!current || !previous) return noData(intent, current)
    const change = previous.spent > 0 ? Math.round(((current.spent - previous.spent) / previous.spent) * 100) : null
    const changeText = change === null || Math.abs(change) < 1 ? text.f.same : fill(change > 0 ? text.f.more : text.f.less, { percent: String(Math.abs(change)) })
    return {
      intent,
      facts: [
        `${current.month} so far (month still running) vs ${previous.month}: spent ${current.currency} ${current.spent.toFixed(2)} vs ${previous.spent.toFixed(2)} (${change ?? 'n/a'}%), ` +
          `income ${current.income.toFixed(2)} vs ${previous.income.toFixed(2)}, net ${current.net.toFixed(2)} vs ${previous.net.toFixed(2)}.`,
      ],
      fallback: say('compare', { previous: monthLabel(previous.month), spent: format(current.spent, current.currency), change: changeText, income: format(current.income, current.currency), net: format(current.net, current.currency) }),
      actions: [{ id: 'view_reports' }],
    }
  }

  if (intent === 'savings') {
    const report = LAST_MONTH.test(question) ? data.months[1] : (data.months[1] ?? data.months[0])
    if (!report) return noData(intent)
    const month = monthLabel(report.month)
    if (report.savingsRate === null) {
      return { intent, facts: [`No income recorded in ${report.month}; savings rate unknown.`], fallback: say('savingsNoIncome', { month }), actions: [{ id: 'view_reports' }] }
    }
    return {
      intent,
      facts: [`${report.month}: income ${report.currency} ${report.income.toFixed(2)}, spent ${report.spent.toFixed(2)}, kept ${report.net.toFixed(2)} (savings rate ${report.savingsRate}%).`],
      fallback: say('savings', { month, net: format(report.net, report.currency), income: format(report.income, report.currency), rate: String(report.savingsRate) }),
      actions: [{ id: 'view_goals' }],
    }
  }

  if (intent === 'spendOn') {
    const report = pickMonth()
    if (!report) return noData(intent)
    const month = monthLabel(report.month)
    const coffee = COFFEE_WORD.test(question)
    const shops = coffee
      ? report.merchants.filter((m) => COFFEE_SHOP.test(m.name))
      : report.merchants.filter((m) => m.name.length >= 3 && question.toLowerCase().includes(m.name.toLowerCase()))
    if (shops.length) {
      const total = shops.reduce((sum, m) => sum + toMinor(m.amount), 0)
      const count = shops.reduce((sum, m) => sum + m.count, 0)
      const names = shops.slice(0, 4).map((m) => m.name).join(', ')
      return {
        intent,
        facts: [`Spent at ${names} in ${report.month}: ${plain(total, report.currency)} over ${count} payments.`, report.merchantsPartial ? 'Shop totals are partial for this month.' : ''].filter(Boolean),
        fallback: lines(say('spendMerchant', { amount: money(total, report.currency), merchants: names, month, count: String(count) }), report.merchantsPartial && say('partial')),
        actions: [{ id: 'view_transactions' }],
      }
    }
    const code = coffee ? 'FOOD_AND_BEVERAGE' : CATEGORY_WORDS.find(([pattern]) => pattern.test(question))?.[1]
    if (code) {
      const row = report.categories.find((c) => c.code === code)
      if (!row) return { intent, facts: [`No spending in ${code} in ${report.month}.`], fallback: say('spendNone', { target: nameOf(code) || code, month }), actions: [{ id: 'view_transactions' }] }
      return {
        intent,
        facts: [
          `Spent on ${row.name} in ${report.month}: ${plain(toMinor(row.amount), report.currency)} (${row.percent}% of the month's spending).`,
          coffee ? 'No coffee shop was found by name, so this is the whole Food & Beverage category.' : '',
        ].filter(Boolean),
        fallback: lines(say('spendCategory', { amount: format(row.amount, report.currency), category: catName(row), month }), coffee && say('coffeeAsFood')),
        actions: [{ id: 'view_transactions' }],
      }
    }
    return {
      intent,
      facts: [`Total spent in ${report.month}: ${plain(toMinor(report.spent), report.currency)}.`],
      fallback: lines(say('spendTotal', { amount: format(report.spent, report.currency), month }), say('spendWhat')),
      actions: [{ id: 'view_reports' }],
    }
  }

  const report = data.months[0]
  if (!report) return noData('overview')
  const top = report.categories[0]
  return {
    intent: 'overview',
    facts: [
      `${report.month} so far: spent ${report.currency} ${report.spent.toFixed(2)}, income ${report.income.toFixed(2)}, net ${report.net.toFixed(2)}.`,
      top ? `Biggest category: ${top.name} ${plain(toMinor(top.amount), report.currency)} (${top.percent}%).` : '',
      data.budget ? `Budget used: ${data.budget.percent}%.` : '',
    ].filter(Boolean),
    fallback: lines(
      say('overview', { month: monthLabel(report.month), spent: format(report.spent, report.currency), income: format(report.income, report.currency), net: format(report.net, report.currency) }),
      top && say('overviewTop', { category: catName(top), amount: format(top.amount, report.currency) }),
    ),
    actions: [{ id: 'view_reports' }],
  }
}
