import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const WA_NUMBER = '6285188724658'
const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbCD4Uf9xVJbc463p91R'

export default function DashboardLayout({ children }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [waOpen, setWaOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'OVERVIEW', icon: 'fas fa-grip' },
    { href: '/dashboard/topup', label: 'TOP UP', icon: 'fas fa-plus-circle' },
    { href: '/dashboard/transactions', label: 'TX', icon: 'fas fa-list' },
    { href: '/dashboard/apikeys', label: 'API', icon: 'fas fa-key' },
  ]

  if (session?.user?.role === 'admin') {
    navItems.push({ href: '/admin', label: 'ADMIN', icon: 'fas fa-shield-halved' })
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 border-r-2 border-black flex-col bg-white">
        <div className="p-6 border-b-2 border-black">
          <span className="font-display text-3xl">MEG</span>
          <span className="font-mono text-black/40 text-xs block">PAYMENT GATEWAY</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold border-2 transition-all
                  ${active ? 'bg-black text-white border-black' : 'border-transparent hover:border-black hover:bg-gray-50'}`}>
                <i className={`${item.icon} w-4 text-center`} />
                {item.label === 'TX' ? 'TRANSAKSI' : item.label === 'API' ? 'API KEYS' : item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t-2 border-black space-y-2 bg-white">
          <a href={`https://wa.me/${WA_NUMBER}?text=Halo Admin, saya butuh bantuan`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold border-2 border-black hover:bg-black hover:text-white transition-all">
            <i className="fab fa-whatsapp" /> CHAT ADMIN
          </a>
          <a href={WA_CHANNEL} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold border-2 border-black hover:bg-black hover:text-white transition-all">
            <i className="fas fa-bullhorn" /> CHANNEL WA
          </a>
          <div className="neo-card p-3">
            <p className="font-mono text-xs font-bold truncate">{session?.user?.name}</p>
            <p className="font-mono text-xs text-black/50 truncate">{session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="neo-btn neo-btn-secondary w-full py-2 text-xs">
            <i className="fas fa-right-from-bracket mr-2" /> KELUAR
          </button>
        </div>
      </aside>

      {/* Mobile navbar bawah */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black">
        <div className="flex">
          {navItems.map(item => {
            const active = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center py-2 gap-0.5 border-r-2 border-black last:border-r-0 transition-all
                  ${active ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}>
                <i className={`${item.icon} text-sm leading-none`} />
                <span className="font-mono font-bold leading-none" style={{ fontSize: '8px' }}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex flex-col items-center justify-center py-2 px-3 gap-0.5 bg-white text-black hover:bg-gray-50">
            <i className="fas fa-right-from-bracket text-sm leading-none" />
            <span className="font-mono font-bold leading-none" style={{ fontSize: '8px' }}>EXIT</span>
          </button>
        </div>
      </div>

      {/* Floating WA button mobile - accordion */}
      <div className="md:hidden fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2">
        {waOpen && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <a href={WA_CHANNEL} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-white border-2 border-black px-3 py-2 font-mono text-xs font-bold"
              style={{ boxShadow: '3px 3px 0 #000' }}>
              <i className="fas fa-bullhorn" /> CHANNEL
            </a>
            <a href={`https://wa.me/${WA_NUMBER}?text=Halo Admin, saya butuh bantuan`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-white border-2 border-black px-3 py-2 font-mono text-xs font-bold"
              style={{ boxShadow: '3px 3px 0 #000' }}>
              <i className="fab fa-whatsapp" /> CHAT ADMIN
            </a>
          </div>
        )}
        <button
          onClick={() => setWaOpen(!waOpen)}
          className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center text-white transition-all"
          style={{ boxShadow: '3px 3px 0 #555', transform: waOpen ? 'rotate(45deg)' : 'none' }}>
          <i className={`${waOpen ? 'fas fa-times' : 'fab fa-whatsapp'} text-xl`} />
        </button>
      </div>

      <main className="flex-1 md:overflow-auto">
        <div className="md:hidden h-2" />
        {children}
        <div className="md:hidden h-20" />
      </main>
    </div>
  )
              }
