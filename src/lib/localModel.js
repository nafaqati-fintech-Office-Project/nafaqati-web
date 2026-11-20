// The merchant classifier running in the browser: the same TF-IDF + logistic regression model the server and the
// mobile app use (exported by merchant_api_project/mobile_export.py). This is a port of the app's localModel.ts;
// tests/localModel.test.js checks it gives the server's answers.
//
// Pure functions only: no network. Fetching the model is merchantModel.js.

export const SUPPORTED_FORMAT = 1

// ---- cleaning: a port of clean_merchant_text in merchant_api_project/main.py --------------------------
// Python's \d and \b understand Unicode; the JS versions are ASCII only, so they are spelled out here.
const WORD = '[\\p{L}\\p{N}_]'
const NOT_AFTER_WORD = `(?<!${WORD})`
const NOT_BEFORE_WORD = `(?!${WORD})`

const NOISE_URL = /https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/giu
const STORE_CODE = new RegExp(
  `#\\s*\\p{Nd}+|${NOT_AFTER_WORD}(?:no|store|branch|terminal|ref|id)\\.?\\s*[:#]?\\s*\\p{Nd}+${NOT_BEFORE_WORD}`,
  'giu',
)
const NUMERIC_TOKEN = /(?<!\S)\p{Nd}[\p{Nd}\-/.:,]*(?!\S)/gu
const GLUED_NUMBER = new RegExp(`${NOT_AFTER_WORD}\\p{Nd}{3,}(?=[A-Za-z])`, 'gu')
const PREFIX = new RegExp(`^(?:pos|ecom|purchase at|payment to|paid to)${NOT_BEFORE_WORD}[\\s:*-]*`, 'iu')
const SYMBOL_NOISE = /[*_|~^=<>[\]{}\\]+/gu
const TRAILING_PLACE = new RegExp(
  '(?:\\s+(?:lahore|karachi|islamabad|rawalpindi|bahawalpur|multan|faisalabad|' +
    'peshawar|quetta|sialkot|gujranwala|hyderabad|dubai|abu dhabi|sharjah|' +
    'riyadh|jeddah|london|pakistan|pk|pak|uae|ae|lhr|khi|isb))+$',
  'iu',
)
const EDGE = ' .,-:;/'

function stripEdge(text, chars = EDGE) {
  let start = 0
  let end = text.length
  while (start < end && chars.includes(text[start])) start += 1
  while (end > start && chars.includes(text[end - 1])) end -= 1
  return text.slice(start, end)
}

export function cleanMerchantText(text) {
  if (!text) return ''
  let cleaned = text
    .replace(NOISE_URL, ' ')
    .replace(STORE_CODE, ' ')
    .replace(NUMERIC_TOKEN, ' ')
    .replace(GLUED_NUMBER, ' ')
    .replace(SYMBOL_NOISE, ' ')
  cleaned = stripEdge(cleaned.replace(/\s+/gu, ' '))
  if (cleaned.startsWith('(') && cleaned.endsWith(')') && cleaned.split('(').length - 1 === 1) {
    cleaned = cleaned.slice(1, -1).trim()
  }
  cleaned = stripEdge(cleaned.replace(PREFIX, ''))
  const withoutPlace = stripEdge(cleaned.replace(TRAILING_PLACE, ''))
  return withoutPlace || cleaned
}

// ---- scoring: scikit-learn's TfidfVectorizer(analyzer="char_wb") + LogisticRegression -------------------
const prepared = new WeakMap()

function prepare(model) {
  let ready = prepared.get(model)
  if (!ready) {
    const index = new Map()
    model.terms.forEach((term, i) => index.set(term, i))
    ready = { index, coef: Float64Array.from(model.coef) }
    prepared.set(model, ready)
  }
  return ready
}

// The n-grams scikit-learn builds for one text: inside each word padded with a space, every run of
// min..max characters. Counted in code points, like Python.
function charWbNgrams(text, min, max) {
  const grams = []
  for (const word of text.toLowerCase().split(/\s+/u)) {
    if (!word) continue
    const chars = [' ', ...Array.from(word), ' ']
    for (let n = min; n <= max; n += 1) {
      let offset = 0
      grams.push(chars.slice(offset, offset + n).join(''))
      while (offset + n < chars.length) {
        offset += 1
        grams.push(chars.slice(offset, offset + n).join(''))
      }
      if (offset === 0) break // a word shorter than n counts once
    }
  }
  return grams
}

// Probability of every class for an already cleaned text; null when no n-gram is known to the model.
export function classProbabilities(model, cleaned) {
  const { index, coef } = prepare(model)
  const classes = model.classes.length
  const counts = new Map()
  for (const gram of charWbNgrams(cleaned, model.ngram_range[0], model.ngram_range[1])) {
    const term = index.get(gram)
    if (term !== undefined) counts.set(term, (counts.get(term) ?? 0) + 1)
  }
  if (counts.size === 0) return null

  let norm = 0
  const weights = []
  counts.forEach((count, term) => {
    const weight = count * model.idf[term]
    weights.push([term, weight])
    norm += weight * weight
  })
  norm = Math.sqrt(norm)

  const logits = Float64Array.from(model.intercept)
  for (const [term, weight] of weights) {
    const scaled = weight / norm
    const row = term * classes
    for (let c = 0; c < classes; c += 1) logits[c] += scaled * coef[row + c]
  }
  let top = -Infinity
  for (const value of logits) if (value > top) top = value
  let sum = 0
  const probabilities = Array.from(logits, (value) => {
    const e = Math.exp(value - top)
    sum += e
    return e
  })
  return probabilities.map((e) => e / sum)
}

// The model's best category and its probability for a merchant name, or null when it cannot judge.
export function predictLocal(model, merchant) {
  const cleaned = cleanMerchantText(merchant.trim())
  if (!cleaned) return null
  const probabilities = classProbabilities(model, cleaned)
  if (!probabilities) return null
  let best = 0
  for (let c = 1; c < probabilities.length; c += 1) if (probabilities[c] > probabilities[best]) best = c
  return { category: model.classes[best], confidence: probabilities[best] }
}

export function isValidModel(m) {
  return (
    typeof m === 'object' &&
    m !== null &&
    m.format === SUPPORTED_FORMAT &&
    typeof m.version === 'string' &&
    typeof m.threshold === 'number' &&
    Array.isArray(m.ngram_range) &&
    m.ngram_range.length === 2 &&
    Array.isArray(m.classes) &&
    Array.isArray(m.intercept) &&
    Array.isArray(m.terms) &&
    Array.isArray(m.idf) &&
    Array.isArray(m.coef) &&
    m.intercept.length === m.classes.length &&
    m.idf.length === m.terms.length &&
    m.coef.length === m.terms.length * m.classes.length
  )
}

// "Food & Beverage" -> FOOD_AND_BEVERAGE, "Loans/EMI" -> LOANS_EMI: the backend's category codes.
export const categoryCodeOf = (name) =>
  name
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
