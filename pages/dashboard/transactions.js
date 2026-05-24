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

  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter)

  return (
    <>
      <Head><title>Transaksi — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up">
          <div>
            <h1 className="font-display text-5xl">TRANSAKSI</h1>
            <p className="font-mono text-xs text-black/50 mt-1">Riwayat semua transaksi kamu</p>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'topup', 'debit', 'credit'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`neo-btn px-4 py-2 text-xs ${filter === f ? 'neo-btn-primary' : 'neo-btn-secondary'}`}
              >
                {f === 'all' ? 'SEMUA' : f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-gray-50" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="neo-card p-10 text-center">
              <p className="font-mono text-xs text-black/40">Tidak ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(tx => (
                <div key={tx.id} className="neo-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 border-2 border-black flex items-center justify-center font-mono text-lg shrink-0
                      ${tx.type === 'topup' ? 'bg-green-100' : tx.type === 'debit' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      {tx.type === 'topup' ? '↓' : tx.type === 'debit' ? '↑' : '↔'}
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold">{tx.description}</p>
                      <p className="font-mono text-xs text-black/40">{tx.reference}</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-right flex sm:flex-col justify-between sm:justify-end items-end gap-2">
                    <p className={`font-mono font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'topup' ? '+' : '-'}{formatRp(tx.amount)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`neo-badge neo-badge-${tx.status}`}>{tx.status.toUpperCase()}</span>
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
