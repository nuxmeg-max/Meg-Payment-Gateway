import { useState, useEffect } from 'react'
import { getSession } from 'next-auth/react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([])
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [newKey, setNewKey] = useState(null)

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/keys')
      setKeys(res.data.keys || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchKeys() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const res = await axios.post('/api/keys', { label: label || 'Default Key' })
      setNewKey(res.data.key)
      setLabel('')
      fetchKeys()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat API key')
    }
    setCreating(false)
  }

  const handleRevoke = async (keyId) => {
    if (!confirm('Yakin ingin menonaktifkan API key ini?')) return
    try {
      await axios.delete('/api/keys', { data: { keyId } })
      fetchKeys()
    } catch {}
  }

  const copyKey = (key) => {
    navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <>
      <Head><title>API Keys — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up">
          <div>
            <h1 className="font-display text-5xl">API KEYS</h1>
            <p className="font-mono text-xs text-black/50 mt-1">Gunakan untuk integrasi bot, website, dan aplikasi</p>
          </div>

          {/* New Key Alert */}
          {newKey && (
            <div className="neo-card p-5 bg-black text-white" style={{ boxShadow: '4px 4px 0 #555' }}>
              <p className="font-mono text-xs text-white/50 mb-2">⚠ SIMPAN KEY INI SEKARANG — tidak akan ditampilkan lagi</p>
              <div className="flex items-center gap-3">
                <code className="font-mono text-sm text-white flex-1 break-all">{newKey.key}</code>
                <button
                  onClick={() => copyKey(newKey.key)}
                  className="neo-btn neo-btn-secondary px-4 py-2 text-xs shrink-0"
                >
                  {copied === newKey.key ? 'DISALIN!' : 'SALIN'}
                </button>
              </div>
              <button onClick={() => setNewKey(null)} className="font-mono text-xs text-white/40 mt-3">Tutup</button>
            </div>
          )}

          {/* Create Form */}
          <div className="neo-card p-6">
            <h2 className="font-display text-2xl mb-4">BUAT API KEY BARU</h2>
            {error && <div className="neo-badge neo-badge-failed w-full text-center py-2 mb-4">{error}</div>}
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                className="neo-input flex-1"
                placeholder="Label (misal: WhatsApp Bot)"
                value={label}
                onChange={e => setLabel(e.target.value)}
                maxLength={50}
              />
              <button type="submit" disabled={creating} className="neo-btn neo-btn-primary px-6 py-2 text-sm shrink-0">
                {creating ? '...' : '⊕ BUAT'}
              </button>
            </form>
            <p className="font-mono text-xs text-black/40 mt-3">Maksimal 5 API key aktif per akun</p>
          </div>

          {/* API Keys List */}
          <div>
            <h2 className="font-display text-2xl mb-4">API KEYS AKTIF</h2>
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="neo-card p-4 h-20 animate-pulse bg-gray-50" />)}
              </div>
            ) : keys.filter(k => k.is_active).length === 0 ? (
              <div className="neo-card p-8 text-center">
                <p className="font-mono text-xs text-black/40">Belum ada API key</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.filter(k => k.is_active).map(k => (
                  <div key={k.id} className="neo-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm font-bold">{k.label}</span>
                          <span className="neo-badge neo-badge-success">AKTIF</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-black/60 truncate flex-1">
                            {k.key.slice(0, 20)}••••••••••••••••
                          </code>
                          <button
                            onClick={() => copyKey(k.key)}
                            className="neo-btn neo-btn-secondary px-3 py-1 text-xs shrink-0"
                          >
                            {copied === k.key ? '✓' : 'SALIN'}
                          </button>
                        </div>
                        <p className="font-mono text-xs text-black/40 mt-2">
                          Dibuat: {new Date(k.created_at).toLocaleDateString('id-ID')}
                          {k.last_used && ` · Terakhir dipakai: ${new Date(k.last_used).toLocaleDateString('id-ID')}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="neo-btn neo-btn-danger px-3 py-2 text-xs shrink-0"
                      >
                        CABUT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Docs */}
          <div className="neo-card p-6">
            <h2 className="font-display text-2xl mb-4">CARA PAKAI API</h2>
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs font-bold mb-2">BUAT TRANSAKSI (potong saldo)</p>
                <pre className="bg-black text-green-400 font-mono text-xs p-4 overflow-x-auto border-2 border-black">{`POST /api/transaction/create
Header: x-api-key: meg_xxxxxxxxxxxxx

Body (JSON):
{
  "amount": 10000,
  "description": "Pembelian item",
  "reference": "ORDER-123",  // opsional, unik
  "webhook_url": "https://..."  // opsional
}`}</pre>
              </div>
              <div>
                <p className="font-mono text-xs font-bold mb-2">CEK STATUS TRANSAKSI</p>
                <pre className="bg-black text-green-400 font-mono text-xs p-4 overflow-x-auto border-2 border-black">{`GET /api/transaction/status?reference=ORDER-123
Header: x-api-key: meg_xxxxxxxxxxxxx`}</pre>
              </div>
              <div>
                <p className="font-mono text-xs font-bold mb-2">WEBHOOK PAYLOAD</p>
                <pre className="bg-black text-green-400 font-mono text-xs p-4 overflow-x-auto border-2 border-black">{`{
  "event": "transaction.success",
  "transaction_id": "uuid",
  "reference": "ORDER-123",
  "amount": 10000,
  "status": "success",
  "timestamp": "2024-01-01T00:00:00Z"
}`}</pre>
              </div>
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
