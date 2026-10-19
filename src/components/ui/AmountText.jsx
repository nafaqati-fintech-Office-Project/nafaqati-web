import { useFormat } from '../../hooks/useFormat.js'
import { formatCurrency } from '../../utils/format.js'

// Income is green with "+"; expenses are red with "-". Always 2 decimals, in the transaction's OWN currency
// (old transactions may be in another currency than the user's current preference).
export default function AmountText({ type, amount, currency, className = '' }) {
  const { currency: preferred } = useFormat()
  const income = type === 'INCOME'
  return (
    <span className={`amount num ${income ? 'amount-in' : 'amount-out'} ${className}`}>
      {income ? '+' : '-'} {formatCurrency(amount, currency ?? preferred, { decimals: 2 })}
    </span>
  )
}
