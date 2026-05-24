import { useSession, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'
import Link from 'next/link'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function TxBadge({ type }) {
  const map = { topup: ['TOPUP', 'neo-badge-success'], debit: ['DEBIT', 'neo-badge-failed'], credit: ['KREDIT', 'neo-badge-pending'] }
  const [label, cls] = map[type] || ['?', '']
  return <span className={`neo-badge ${cls}`}>{label}</span>
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/user/profile').then(res => {
      setData(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <>
      <Head><title>Dashboard — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up">
          {/* Header */}
          <div>
            <h1 className="font-display text-5xl">OVERVIEW</h1>
            <p className="font-mono text-xs text-black/50 mt-1">Selamat datang, {session?.user?.name}</p>
          </div>

          {/* Saldo Card */}
          <div className="neo-card p-8 bg-black text-white" style={{ boxShadow: '6px 6px 0px #555' }}>
            <p className="font-mono text-xs text-white/50 mb-2">SALDO AKTIF</p>
            {loading ? (
              <div className="h-12 w-48 bg-white/10 animate-pulse" />
            ) : (
              <p className="font-display text-6xl text-white tracking-wide">
                {formatRp(data?.user?.saldo || 0)}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <Link href="/dashboard/topup" className="neo-btn neo-btn-secondary px-5 py-2 text-xs">
                ⊕ TOP UP
              </Link>
              <Link href="/dashboard/apikeys" className="neo-btn px-5 py-2 text-xs border-white/40 text-white bg-transparent hover:bg-white/10">
                ⌘ API KEYS
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'TOTAL TRANSAKSI', value: data?.transactions?.length || 0, unit: 'tx' },
              { label: 'TOTAL DEBIT', value: formatRp(data?.transactions?.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0) || 0), unit: '' },
              { label: 'TOTAL TOPUP', value: formatRp(data?.transactions?.filter(t => t.type === 'topup').reduce((a, t) => a + t.amount, 0) || 0), unit: '' },
            ].map(s => (
              <div key={s.label} className="neo-card p-5">
                <p className="font-mono text-xs text-black/50 mb-1">{s.label}</p>
                <p className="font-display text-3xl">{loading ? '...' : s.value} <span className="text-lg text-black/40">{s.unit}</span></p>
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">TRANSAKSI TERBARU</h2>
              <Link href="/dashboard/transactions" className="font-mono text-xs underline">Lihat semua →</Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-gray-50" />)}
              </div>
            ) : data?.transactions?.length === 0 ? (
              <div className="neo-card p-8 text-center">
                <p className="font-mono text-xs text-black/40">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.transactions?.slice(0, 5).map(tx => (
                  <div key={tx.id} className="neo-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TxBadge type={tx.type} />
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
      </DashboardLayout>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx)
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } }
  return { props: {} }
}
