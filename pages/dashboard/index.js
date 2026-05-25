import { useSession, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'
import Link from 'next/link'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    axios.get('/api/user/profile').then(res => {
      setData(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))

    if (session?.user?.role === 'admin') {
      axios.get('/api/admin/users').then(res => {
        setUserCount(res.data.users?.length || 0)
      }).catch(() => {})
    }
  }, [session])

  const totalTopup = data?.transactions?.filter(t => t.type === 'topup').reduce((a, t) => a + t.amount, 0) || 0
  const totalDebit = data?.transactions?.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0) || 0

  return (
    <>
      <Head><title>Dashboard — Meg PG</title></Head>
      <DashboardLayout>
        <div className="relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-64 h-64 border-2 border-black/5 rotate-12" />
            <div className="absolute top-20 -right-5 w-40 h-40 border-2 border-black/5 rotate-45" />
            <div className="absolute -top-5 right-32 w-20 h-20 bg-black/3" />
          </div>

          <div className="p-6 md:p-10 space-y-8 animate-slide-up relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-black/40 mb-1">SELAMAT DATANG</p>
                <h1 className="font-display text-5xl">{session?.user?.name?.toUpperCase()}</h1>
              </div>
              <div className="neo-badge bg-black text-white px-3 py-1 text-xs">
                {session?.user?.role?.toUpperCase()}
              </div>
            </div>

            <div className="neo-card p-8 bg-black text-white relative overflow-hidden" style={{ boxShadow: '6px 6px 0px #555' }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 border-2 border-white/10 rotate-12" />
              <div className="absolute -right-4 -bottom-8 w-24 h-24 border-2 border-white/10 rotate-45" />
              <p className="font-mono text-xs text-white/50 mb-2 relative">SALDO AKTIF</p>
              {loading ? (
                <div className="h-16 w-48 bg-white/10 animate-pulse" />
              ) : (
                <p className="font-display text-6xl text-white tracking-wide relative">
                  {formatRp(data?.user?.saldo || 0)}
                </p>
              )}
              <div className="mt-6 flex gap-3 relative">
                <Link href="/dashboard/topup" className="neo-btn neo-btn-secondary px-5 py-2 text-xs">
                  ⊕ TOP UP
                </Link>
                <Link href="/dashboard/apikeys" className="neo-btn px-5 py-2 text-xs border-white/30 text-white/70 bg-transparent hover:bg-white/10">
                  ⌘ API KEYS
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'TOTAL TRANSAKSI', value: loading ? '...' : `${data?.transactions?.length || 0}`, unit: 'TX', icon: '≡' },
                { label: 'TOTAL TOPUP', value: loading ? '...' : formatRp(totalTopup), unit: '', icon: '↓' },
                { label: 'TOTAL TERPAKAI', value: loading ? '...' : formatRp(totalDebit), unit: '', icon: '↑' },
                {
                  label: session?.user?.role === 'admin' ? 'TOTAL USER' : 'MEMBER SEJAK',
                  value: loading ? '...' : session?.user?.role === 'admin' ? userCount : new Date(data?.user?.created_at).getFullYear(),
                  unit: session?.user?.role === 'admin' ? 'USER' : '',
                  icon: '◈'
                },
              ].map(s => (
                <div key={s.label} className="neo-card p-5 relative overflow-hidden">
                  <div className="absolute top-3 right-3 font-mono text-2xl text-black/10">{s.icon}</div>
                  <p className="font-mono text-xs text-black/50 mb-1">{s.label}</p>
                  <p className="font-display text-3xl leading-none">
                    {s.value} <span className="text-base text-black/40">{s.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl">TRANSAKSI TERBARU</h2>
                <Link href="/dashboard/transactions" className="font-mono text-xs underline">Lihat semua →</Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-gray-50" />)}
                </div>
              ) : !data?.transactions?.length ? (
                <div className="neo-card p-8 text-center">
                  <p className="font-mono text-xs text-black/40">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.transactions?.slice(0, 5).map(tx => (
                    <div key={tx.id} className="neo-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 border-2 border-black flex items-center justify-center font-mono text-lg shrink-0
                          ${tx.type === 'topup' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.type === 'topup' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold">{tx.description}</p>
                          <p className="font-mono text-xs text-black/40">{tx.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-sm font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'topup' ? '+' : '-'}{formatRp(tx.amount)}
                        </p>
                        <p className="font-mono text-xs text-black/40">
                          {new Date(tx.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx)
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } }
  return { props: {} }
                               }
