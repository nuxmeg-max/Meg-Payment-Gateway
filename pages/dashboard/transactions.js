import { useState, useEffect } from 'react'
import { getSession } from 'next-auth/react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    axios.get('/api/user/profile').then(res => {
      setTxs(res.data.transactions || [])
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.status === filter)

  const filters = [
    { key: 'all', label: 'SEMUA', icon: 'fas fa-border-all' },
    { key: 'success', label: 'BERHASIL', icon: 'fas fa-check-circle' },
    { key: 'pending', label: 'PENDING', icon: 'fas fa-clock' },
    { key: 'failed', label: 'GAGAL', icon: 'fas fa-times-circle' },
  ]

  return (
    <>
      <Head><title>Transaksi — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up">
          <div>
            <h1 className="font-display text-5xl">TRANSAKSI</h1>
            <p className="font-mono text-xs text-black/50 mt-1">Riwayat semua transaksi kamu</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`neo-btn px-4 py-2 text-xs gap-2 ${filter === f.key ? 'neo-btn-primary' : 'neo-btn-secondary'}`}>
                <i className={f.icon} /> {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-white" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="neo-card p-10 text-center bg-white">
              <i className="fas fa-inbox text-3xl text-black/20 mb-3 block" />
              <p className="font-mono text-xs text-black/40">Tidak ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(tx => (
                <div key={tx.id} className="neo-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-white">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 border-2 border-black flex items-center justify-center text-lg shrink-0
                      ${tx.type === 'topup' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <i className={`fas ${tx.type === 'topup' ? 'fa-arrow-down text-green-600' : 'fa-arrow-up text-red-600'}`} />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold">{tx.description}</p>
                      <p className="font-mono text-xs text-black/40">{tx.reference}</p>
                    </div>
                  </div>
                  <div className="text-right flex sm:flex-col justify-between sm:justify-end items-end gap-2">
                    <p className={`font-mono font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'topup' ? '+' : '-'}{formatRp(tx.amount)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`neo-badge neo-badge-${tx.status}`}>
                        <i className={`fas ${tx.status === 'success' ? 'fa-check' : tx.status === 'pending' ? 'fa-clock' : 'fa-times'} mr-1`} />
                        {tx.status.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs text-black/40">
                        {new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
