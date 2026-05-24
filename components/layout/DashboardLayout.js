import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function DashboardLayout({ children }) {
  const { data: session } = useSession()
  const router = useRouter()

  const navItems = [
    { href: '/dashboard', label: 'OVERVIEW' },
    { href: '/dashboard/topup', label: 'TOP UP' },
    { href: '/dashboard/transactions', label: 'TRANSAKSI' },
    { href: '/dashboard/apikeys', label: 'API KEYS' },
  ]

  if (session?.user?.role === 'admin') {
    navItems.push({ href: '/admin', label: 'ADMIN' })
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 border-r-2 border-black flex-col">
        <div className="p-6 border-b-2 border-black">
          <span className="font-display text-3xl">MEG</span>
          <span className="font-mono text-black/40 text-xs block">PAYMENT GATEWAY</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center px-4 py-3 font-mono text-xs font-bold border-2 transition-all
                  ${active ? 'bg-black text-white border-black' : 'border-transparent hover:border-black hover:bg-gray-50'}`}>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t-2 border-black">
          <div className="neo-card p-3 mb-3">
            <p className="font-mono text-xs font-bold truncate">{session?.user?.name}</p>
            <p className="font-mono text-xs text-black/50 truncate">{session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="neo-btn neo-btn-secondary w-full py-2 text-xs">
            KELUAR →
          </button>
        </div>
      </aside>

      {/* Mobile navbar - bawah layar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black flex">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 text-center py-3 font-mono text-xs font-bold border-r-2 border-black last:border-r-0 transition-all
              ${router.pathname === item.href ? 'bg-black text-white' : 'text-black'}`}>
            {item.label === 'TRANSAKSI' ? 'TX' : item.label === 'API KEYS' ? 'API' : item.label}
          </Link>
        ))}
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="px-3 py-3 font-mono text-xs font-bold border-black bg-white">
          EXIT
        </button>
      </div>

      <main className="flex-1 md:overflow-auto">
        <div className="md:hidden h-4" />
        {children}
        <div className="md:hidden h-16" />
      </main>
    </div>
  )
                           }
