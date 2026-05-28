import { useState, useEffect } from 'react'
import { getSession } from 'next-auth/react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const statusColor = (s) => {
  if (s === 'success') return 'neo-badge-success'
  if (s === 'pending') return 'neo-badge-pending'
  return 'neo-badge-failed'
}
const statusIcon = (s) => {
  if (s === 'success') return 'fa-check'
  if (s === 'pending') return 'fa-clock'
  return 'fa-times'
}
const statusLabel = (s) => {
  if (s === 'success') return 'BERHASIL'
  if (s === 'pending') return 'PENDING'
  return 'GAGAL'
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('/api/user/profile')
      .then(res => {
        setTxs(res.data.transactions || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Gagal memuat transaksi')
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.status === filter)

  const counts = {
    all: txs.length,
    success: txs.filter(t => t.status === 'success').length,
    pending: txs.filter(t => t.status === 'pending').length,
    failed: txs.filter(t => t.status === 'failed').length,
  }

  const filters = [
    { key: 'all', label: 'SEMUA', icon: 'fas fa-border-all' },
    { key: 'success', label: 'BERHASIL', icon: 'fas fa-check-circle' },
    { key: 'pending', label: 'PENDING', icon: 'fas fa-clock' },
    { key: 'failed', label: 'GAGAL', icon: 'fas fa-times-circle' },
  ]

  return (
    <>
      <Head><title>取引 — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up">
          <div>
            <p className="font-jp text-xs text-black/20">取引履歴</p>
            <h1 className="font-display text-5xl">TRANSAKSI</h1>
            <p className="font-mono text-xs text-black/50 mt-1">Riwayat semua transaksi kamu</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`neo-btn px-4 py-2 text-xs flex items-center gap-2 ${filter === f.key ? 'neo-btn-primary' : 'neo-btn-secondary'}`}>
                <i className={f.icon} />
                {f.label}
                <span className={`font-mono text-xs px-1.5 py-0.5 border ${filter === f.key ? 'border-white/40 text-white/70' : 'border-black/20 text-black/40'}`}>
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div className="neo-badge neo-badge-failed w-full text-center py-2">
              <i className="fas fa-triangle-exclamation mr-1" /> {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-white" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="neo-card p-10 text-center bg-white">
              <i className="fas fa-inbox text-3xl text-black/20 mb-3 block" />
              <p className="font-jp text-sm text-black/20 mb-1">取引なし</p>
              <p className="font-mono text-xs text-black/40">
                {filter === 'all' ? 'Tidak ada transaksi' : `Tidak ada transaksi ${filter === 'success' ? 'berhasil' : filter === 'pending' ? 'pending' : 'gagal'}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(tx => (
                <div key={tx.id} className="neo-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-white">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 border-2 border-black flex items-center justify-center text-lg shrink-0
                      ${tx.status === 'pending' ? 'bg-yellow-50' : tx.type === 'topup' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.status === 'pending' ? (
                        <i className="fas fa-clock text-yellow-500" />
                      ) : (
                        <i className={`fas ${tx.type === 'topup' ? 'fa-arrow-down text-green-600' : 'fa-arrow-up text-red-600'}`} />
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold">{tx.description}</p>
                      <p className="font-mono text-xs text-black/40">{tx.reference}</p>
                      {/* Info unique code untuk pending topup */}
                      {tx._source === 'topup_request' && tx.status === 'pending' && (
                        <p className="font-mono text-xs text-yellow-600 mt-0.5">
                          <i className="fas fa-info-circle mr-1" />
                          Transfer: {formatRp(tx._total_transfer)} (kode unik: +{tx._unique_code})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex sm:flex-col justify-between sm:justify-end items-end gap-2">
                    <p className={`font-mono font-bold ${tx.status === 'failed' ? 'text-black/40 line-through' : tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'topup' ? '+' : '-'}{formatRp(tx.amount)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`neo-badge ${statusColor(tx.status)}`}>
                        <i className={`fas ${statusIcon(tx.status)} mr-1`} />
                        {statusLabel(tx.status)}
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
