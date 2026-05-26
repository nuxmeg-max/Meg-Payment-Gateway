import { useState, useEffect } from 'react'
import { getSession } from 'next-auth/react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function AdminPage() {
  const [tab, setTab] = useState('topup')
  const [topups, setTopups] = useState([])
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editSaldo, setEditSaldo] = useState({})
  const [msg, setMsg] = useState('')
  const [txLoading, setTxLoading] = useState(false)

  const fetchTopups = async () => {
    const res = await axios.get('/api/admin/topup?status=pending')
    setTopups(res.data.requests || [])
  }

  const fetchUsers = async () => {
    const res = await axios.get('/api/admin/users')
    setUsers(res.data.users || [])
  }

  const fetchTransactions = async (userId = null) => {
    setTxLoading(true)
    const url = userId
      ? `/api/admin/transactions?user_id=${userId}&limit=50`
      : `/api/admin/transactions?limit=50`
    const res = await axios.get(url)
    setTransactions(res.data.transactions || [])
    setTxLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTopups(), fetchUsers()]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'transactions') fetchTransactions(selectedUser)
  }, [tab, selectedUser])

  const handleTopupAction = async (requestId, action) => {
    try {
      await axios.post('/api/admin/topup', { requestId, action })
      setMsg(action === 'confirm' ? 'Topup dikonfirmasi!' : 'Topup ditolak')
      fetchTopups()
      fetchUsers()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Gagal')
    }
  }

  const handleSaldoUpdate = async (userId) => {
    const newSaldo = editSaldo[userId]
    if (!newSaldo && newSaldo !== 0) return
    try {
      await axios.patch('/api/admin/users', { userId, saldo: parseInt(newSaldo) })
      setMsg('Saldo diupdate!')
      fetchUsers()
      setEditSaldo(prev => { const n = { ...prev }; delete n[userId]; return n })
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setMsg('Gagal update saldo')
    }
  }

  const tabs = [
    { key: 'topup', label: `TOPUP PENDING (${topups.length})`, icon: 'fas fa-clock' },
    { key: 'users', label: 'SEMUA USER', icon: 'fas fa-users' },
    { key: 'transactions', label: 'TRANSAKSI', icon: 'fas fa-list' },
  ]

  const statusColor = (s) => s === 'success' ? 'neo-badge-success' : s === 'pending' ? 'neo-badge-pending' : 'neo-badge-failed'
  const statusIcon = (s) => s === 'success' ? 'fa-check' : s === 'pending' ? 'fa-clock' : 'fa-times'

  return (
    <>
      <Head><title>Admin — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up">
          <div>
            <h1 className="font-display text-5xl">ADMIN PANEL</h1>
            <p className="font-mono text-xs text-black/50 mt-1">Kelola topup dan pengguna</p>
          </div>

          {msg && (
            <div className="neo-badge neo-badge-success w-full text-center py-2">
              <i className="fas fa-check mr-1" /> {msg}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`neo-btn px-4 py-2 text-xs gap-2 ${tab === t.key ? 'neo-btn-primary' : 'neo-btn-secondary'}`}>
                <i className={t.icon} /> {t.label}
              </button>
            ))}
          </div>

          {/* TOPUP PENDING */}
          {tab === 'topup' && (
            <div>
              <h2 className="font-display text-2xl mb-4">REQUEST TOPUP PENDING</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-20 animate-pulse bg-white" />)}
                </div>
              ) : topups.length === 0 ? (
                <div className="neo-card p-10 text-center bg-white">
                  <i className="fas fa-check-circle text-3xl text-black/20 mb-2 block" />
                  <p className="font-mono text-xs text-black/40">Tidak ada request pending</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topups.map(req => (
                    <div key={req.id} className="neo-card p-5 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <i className="fas fa-user text-black/40" />
                            <p className="font-mono text-sm font-bold">{req.users?.name}</p>
                            <span className="font-mono text-xs text-black/40">({req.users?.email})</span>
                          </div>
                          <p className="font-mono text-xs text-black/60 mt-1">
                            <i className="fas fa-money-bill mr-1" />
                            Nominal: <strong>{formatRp(req.amount)}</strong>
                          </p>
                          <p className="font-mono text-xs text-black/40 mt-1">
                            <i className="fas fa-calendar mr-1" />
                            {new Date(req.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleTopupAction(req.id, 'confirm')}
                            className="neo-btn neo-btn-primary px-4 py-2 text-xs gap-1">
                            <i className="fas fa-check" /> KONFIRMASI
                          </button>
                          <button onClick={() => handleTopupAction(req.id, 'reject')}
                            className="neo-btn neo-btn-danger px-4 py-2 text-xs gap-1">
                            <i className="fas fa-times" /> TOLAK
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div>
              <h2 className="font-display text-2xl mb-4">SEMUA PENGGUNA</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-20 animate-pulse bg-white" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className="neo-card p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono text-sm font-bold">{u.name}</p>
                            <span className={`neo-badge ${u.role === 'admin' ? 'bg-black text-white' : 'neo-badge-pending'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-black/50">
                            <i className="fas fa-envelope mr-1" /> {u.email}
                          </p>
                          <p className="font-mono text-sm font-bold mt-1">
                            <i className="fas fa-wallet mr-1 text-black/40" /> {formatRp(u.saldo)}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => { setSelectedUser(u.id); setTab('transactions') }}
                            className="neo-btn neo-btn-secondary px-3 py-2 text-xs gap-1">
                            <i className="fas fa-list" /> TX
                          </button>
                          <input type="number" className="neo-input w-28 text-sm"
                            placeholder="Saldo baru"
                            value={editSaldo[u.id] ?? ''}
                            onChange={e => setEditSaldo(prev => ({ ...prev, [u.id]: e.target.value }))} />
                          <button
                            onClick={() => handleSaldoUpdate(u.id)}
                            disabled={editSaldo[u.id] === undefined || editSaldo[u.id] === ''}
                            className="neo-btn neo-btn-primary px-4 py-2 text-xs gap-1">
                            <i className="fas fa-check" /> SET
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRANSACTIONS */}
          {tab === 'transactions' && (
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="font-display text-2xl">
                  {selectedUser
                    ? `TX — ${users.find(u => u.id === selectedUser)?.name || 'User'}`
                    : 'SEMUA TRANSAKSI'}
                </h2>
                <div className="flex gap-2">
                  {selectedUser && (
                    <button onClick={() => setSelectedUser(null)}
                      className="neo-btn neo-btn-secondary px-3 py-2 text-xs gap-1">
                      <i className="fas fa-times" /> RESET FILTER
                    </button>
                  )}
                  <select
                    className="neo-input text-xs py-2 w-auto"
                    value={selectedUser || ''}
                    onChange={e => setSelectedUser(e.target.value || null)}>
                    <option value="">Semua User</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              {txLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-white" />)}
                </div>
              ) : transactions.length === 0 ? (
                <div className="neo-card p-10 text-center bg-white">
                  <i className="fas fa-inbox text-3xl text-black/20 mb-2 block" />
                  <p className="font-mono text-xs text-black/40">Tidak ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map(tx => (
                    <div key={tx.id} className="neo-card p-4 bg-white">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 border-2 border-black flex items-center justify-center shrink-0
                            ${tx.type === 'topup' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <i className={`fas ${tx.type === 'topup' ? 'fa-arrow-down text-green-600' : 'fa-arrow-up text-red-600'} text-sm`} />
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold">{tx.user?.name}</p>
                            <p className="font-mono text-xs text-black/40">{tx.description}</p>
                            <p className="font-mono text-xs text-black/30">{tx.reference}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-mono text-sm font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'topup' ? '+' : '-'}{formatRp(tx.amount)}
                          </p>
                          <span className={`neo-badge ${statusColor(tx.status)}`}>
                            <i className={`fas ${statusIcon(tx.status)} mr-1`} />
                            {tx.status.toUpperCase()}
                          </span>
                          <p className="font-mono text-xs text-black/30 mt-1">
                            {new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx)
  if (!session || session.user.role !== 'admin')
    return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: {} }
                    }
