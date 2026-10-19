import { BriefcaseBusiness, Car, GraduationCap, House, Landmark, Plane, ShieldCheck } from 'lucide-react'
import { decimalsFor } from '../../constants/currencies.js'
import { todayKey } from '../../utils/dateRange.js'

export const GOAL_CATEGORIES = [
  { key: 'travel', icon: Plane },
  { key: 'car', icon: Car },
  { key: 'home', icon: House },
  { key: 'education', icon: GraduationCap },
  { key: 'emergency', icon: ShieldCheck },
  { key: 'custom', icon: BriefcaseBusiness },
]

export const goalIcon = (key) => GOAL_CATEGORIES.find((item) => item.key === key)?.icon ?? Landmark

export function goalMetrics(goal, timeZone) {
  const target = Number(goal.targetAmount) || 0
  const saved = Number(goal.savedAmount) || 0
  const percentage = Number(goal.progressPercentage ?? (target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0))
  const remaining = Math.max(0, target - saved)
  const today = todayKey(timeZone)
  const daysLeft = goal.targetDate
    ? Math.max(0, Math.ceil((new Date(`${goal.targetDate}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / 86400000))
    : null
  const monthsLeft = daysLeft == null ? null : Math.max(1, Math.ceil(daysLeft / 30))
  const requiredMonthlySaving = monthsLeft ? remaining / monthsLeft : remaining
  const expectedProgress = daysLeft == null ? null : Math.min(100, Math.round(((365 - Math.min(365, daysLeft)) / 365) * 100))
  const status = saved >= target ? 'COMPLETED' : goal.status
  const track = status === 'COMPLETED' || expectedProgress == null || percentage + 5 >= expectedProgress ? 'onTrack' : 'behind'
  return { target, saved, percentage, remaining, daysLeft, requiredMonthlySaving, status, track }
}

export function formatGoalMoney(amount, currency) {
  const decimals = decimalsFor(currency)
  return `${currency} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function amountError(value, currency, labels) {
  const text = String(value ?? '').trim()
  const max = decimalsFor(currency)
  if (!text || !/^\d+(\.\d+)?$/.test(text) || Number(text) <= 0) return labels.amount
  if ((text.split('.')[1] ?? '').length > max) return labels.decimals(currency, max)
  return ''
}

export function dateError(value, timeZone, labels) {
  if (!value) return ''
  return value < todayKey(timeZone) ? labels.date : ''
}

export function formatGoalDate(dateKey, locale) {
  if (!dateKey) return ''
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
