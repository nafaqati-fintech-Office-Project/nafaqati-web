import {
  ArrowLeftRight,
  ChartColumn,
  FileText,
  Flag,
  LayoutDashboard,
  Repeat,
  Settings,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'

// Pages reachable from elsewhere (avatar menu) but not listed in the sidebar
export const EXTRA_PAGES = [
  { key: 'profile', path: '/profile' },
  { key: 'notifications', path: '/notifications' },
  { key: 'plans', path: '/plans' },
]

// Labels live in APP_TEXT.nav[key]
export const NAV_ITEMS = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'transactions', path: '/transactions', icon: ArrowLeftRight },
  { key: 'analytics', path: '/analytics', icon: ChartColumn },
  { key: 'budgets', path: '/budgets', icon: WalletCards },
  { key: 'goals', path: '/goals', icon: Flag },
  { key: 'subscriptions', path: '/subscriptions', icon: Repeat },
  { key: 'family', path: '/family', icon: Users },
  { key: 'ai', path: '/ai-assistant', icon: Sparkles },
  { key: 'reports', path: '/reports', icon: FileText },
  // { key: 'wallets', path: '/wallets', icon: Landmark },
  { key: 'settings', path: '/settings', icon: Settings },
]
