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
  const [loading, setLoading] = useState(true)
  const [editSaldo, setEditSaldo] = useState({})
  const [msg, setMsg] = useState('')

  const fetchTopups = async () => {
    const res = await axios.get('/api/admin/topup?status=pending')
    setTopups(res.data.requests || [])
  }

  const fetchUsers = async () => {
    const res = await axios.get('/api/admin/users')
    setUsers(res.data.users || [])
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTopups(), fetchUsers()]).finally(() => setLoading(false))
  }, [])

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
            <div className="neo-badge neo-badge-success w-full text-center py-2">{msg}</div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {['topup', 'users'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`neo-btn px-6 py-2 text-sm ${tab === t ? 'neo-btn-primary' : 'neo-btn-secondary'}`}
              >
                {t === 'topup' ? `TOPUP PENDING (${topups.length})` : 'SEMUA USER'}
              </button>
            ))}
          </div>

          {/* Topup Requests */}
          {tab === 'topup' && (
            <div>
              <h2 className="font-display text-2xl mb-4">REQUEST TOPUP PENDING</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-20 animate-pulse bg-gray-50" />)}
                </div>
              ) : topups.length === 0 ? (
                <div className="neo-card p-10 text-center">
                  <p className="font-mono text-xs text-black/40">Tidak ada request pending</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topups.map(req => (
                    <div key={req.id} className="neo-card p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-mono text-sm font-bold">{req.users?.name} <span className="text-black/40">({req.users?.email})</span></p>
                          <p className="font-mono text-xs text-black/60 mt-1">
                            Nominal: <strong>{formatRp(req.amount)}</strong> · Transfer: <strong>{formatRp(req.total_transfer)}</strong> · Kode: +{req.unique_code}
                          </p>
                          <p className="font-mono text-xs text-black/40 mt-1">
                            {new Date(req.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTopupAction(req.id, 'confirm')}
                            className="neo-btn neo-btn-primary px-4 py-2 text-xs"
                          >
                            ✓ KONFIRMASI
                          </button>
                          <button
                            onClick={() => handleTopupAction(req.id, 'reject')}
                            className="neo-btn neo-btn-danger px-4 py-2 text-xs"
                          >
                            ✕ TOLAK
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div>
              <h2 className="font-display text-2xl mb-4">SEMUA PENGGUNA</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-20 animate-pulse bg-gray-50" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className="neo-card p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono text-sm font-bold">{u.name}</p>
                            <span className={`neo-badge ${u.role === 'admin' ? 'bg-black text-white' : 'neo-badge-pending'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-black/50">{u.email}</p>
                          <p className="font-mono text-sm font-bold mt-1">{formatRp(u.saldo)}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            className="neo-input w-32 text-sm"
                            placeholder="Saldo baru"
                            value={editSaldo[u.id] ?? ''}
                            onChange={e => setEditSaldo(prev => ({ ...prev, [u.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => handleSaldoUpdate(u.id)}
                            disabled={editSaldo[u.id] === undefined || editSaldo[u.id] === ''}
                            className="neo-btn neo-btn-primary px-4 py-2 text-xs"
                          >
                            SET
                          </button>
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
