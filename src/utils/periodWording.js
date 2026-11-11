// Page copy written for a calendar month ("this month", "vs last month") reads wrong for a custom date range.
// forRange(text, lang) returns the same text tree with those phrases rewritten; strings returned by text functions
// are rewritten too. Results are cached per text object.
const PERIOD_WORDS = {
  en: [
    [/Compared with last month/g, 'Compared with the previous period'],
    [/Monthly spending/g, 'Spending report'],
    [/This month/g, 'This period'],
    [/Last month/g, 'Previous period'],
    [/this month/g, 'in this period'],
    [/last month/g, 'the previous period'],
    [/of the month/g, 'of the period'],
    [/in another month; only this month is counted/g, 'outside the period; only the period is counted'],
    [/any month/g, 'any period'],
  ],
  ar: [
    [/هذا الشهر/g, 'هذه الفترة'],
    [/الشهر الماضي/g, 'الفترة السابقة'],
    [/الشهر السابق/g, 'الفترة السابقة'],
  ],
}

const rewrite = (value, words) => {
  if (typeof value === 'string') return words.reduce((s, [from, to]) => s.replace(from, to), value)
  if (typeof value === 'function') return (...args) => rewrite(value(...args), words)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v, words)]))
  return value
}

const cache = new WeakMap()

export function forRange(text, lang) {
  if (!cache.has(text)) cache.set(text, rewrite(text, PERIOD_WORDS[lang] ?? PERIOD_WORDS.en))
  return cache.get(text)
}
