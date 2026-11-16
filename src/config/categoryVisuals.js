import {
  ArrowLeftRight,
  Banknote,
  Bus,
  CircleHelp,
  CirclePlus,
  Clapperboard,
  Fuel,
  Gavel,
  GraduationCap,
  HandHeart,
  HeartPulse,
  House,
  Landmark,
  Plane,
  Receipt,
  Repeat,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Tag,
  TrendingUp,
  Undo2,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react'

// The single registry of how a category looks, keyed by the backend category code
// (GET /api/transactions/categories). Names come from the backend; only color and icon live here.
export const CATEGORY_VISUALS = {
  FOOD_AND_BEVERAGE: { color: '#14B8A6', icon: UtensilsCrossed },
  GROCERIES: { color: '#84CC16', icon: ShoppingBasket },
  CLOTHING_AND_SHOPPING: { color: '#F59E0B', icon: ShoppingBag },
  TRANSPORTATION: { color: '#EC4899', icon: Bus },
  FUEL: { color: '#F97316', icon: Fuel },
  ENTERTAINMENT: { color: '#22C55E', icon: Clapperboard },
  SUBSCRIPTIONS: { color: '#D946EF', icon: Repeat },
  HEALTH: { color: '#3B82F6', icon: HeartPulse },
  EDUCATION: { color: '#6366F1', icon: GraduationCap },
  TRAVEL: { color: '#06B6D4', icon: Plane },
  UTILITIES: { color: '#7B3FF2', icon: Zap },
  INVESTMENTS: { color: '#0F766E', icon: TrendingUp },
  HOUSING: { color: '#0EA5E9', icon: House },
  CHARITY: { color: '#E11D48', icon: HandHeart },
  LOANS_EMI: { color: '#64748B', icon: Landmark },
  SALARY: { color: '#16A34A', icon: Banknote },
  OTHER_INCOME: { color: '#65A30D', icon: CirclePlus },
  UNCATEGORIZED: { color: '#94A3B8', icon: CircleHelp },
  TRANSFERS: { color: '#475569', icon: ArrowLeftRight },
  CASH_WITHDRAWALS: { color: '#CA8A04', icon: Wallet },
  BANK_FEES: { color: '#78716C', icon: Receipt },
  GOVERNMENT_AND_FINES: { color: '#DC2626', icon: Gavel },
  PERSONAL_CARE: { color: '#A855F7', icon: Sparkles },
  INTERNAL_TRANSFERS: { color: '#64748B', icon: ArrowLeftRight },
  REFUNDS: { color: '#16A34A', icon: Undo2 },
}

const FALLBACK = { color: '#94A3B8', icon: Tag }

// Unknown or missing codes get a neutral look instead of crashing
export const categoryVisual = (code) => CATEGORY_VISUALS[code] ?? FALLBACK
export const categoryColor = (code) => categoryVisual(code).color
