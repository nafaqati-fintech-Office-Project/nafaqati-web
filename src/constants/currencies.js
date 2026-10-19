// The only currencies and countries the backend supports (transaction-service `Currency` enum:
// PKR, AED, SAR, QAR, KWD, BHD, OMR). Keep this the single list used by Onboarding and Settings.
export const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', currency: 'PKR' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD' },
  { code: 'OM', name: 'Oman', currency: 'OMR' },
]

export const CURRENCIES = COUNTRIES.map((c) => c.currency)

export const currencyForCountry = (code) => COUNTRIES.find((c) => c.code === code)?.currency ?? ''

// Country guessed from the browser language (e.g. "en-PK" -> "PK"), only if we support it
export function countryFromLocale(locale = navigator.language) {
  const region = locale.split('-')[1]?.toUpperCase()
  return COUNTRIES.some((c) => c.code === region) ? region : ''
}

// Decimal places the backend accepts per currency (3 for the dinar-type currencies, 2 otherwise)
export const CURRENCY_DECIMALS = { PKR: 2, AED: 2, SAR: 2, QAR: 2, KWD: 3, BHD: 3, OMR: 3 }
export const decimalsFor = (currency) => CURRENCY_DECIMALS[currency] ?? 2
