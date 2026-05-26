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
            <p className="font-mono text-xs text-black/50 mt-1">
              Integrasikan bot atau website kamu untuk generate QRIS dinamis
            </p>
          </div>

          {newKey && (
            <div className="neo-card p-5 bg-black text-white" style={{ boxShadow: '4px 4px 0 #555' }}>
              <p className="font-mono text-xs text-white/50 mb-2">
                <i className="fas fa-triangle-exclamation mr-1" /> SIMPAN KEY INI — tidak akan ditampilkan lagi
              </p>
              <div className="flex items-center gap-3">
                <code className="font-mono text-sm text-white flex-1 break-all">{newKey.key}</code>
                <button onClick={() => copyKey(newKey.key)}
                  className="neo-btn neo-btn-secondary px-4 py-2 text-xs shrink-0">
                  <i className={`fas ${copied === newKey.key ? 'fa-check' : 'fa-copy'} mr-1`} />
                  {copied === newKey.key ? 'DISALIN!' : 'SALIN'}
                </button>
              </div>
              <button onClick={() => setNewKey(null)} className="font-mono text-xs text-white/40 mt-3 block">
                <i className="fas fa-times mr-1" /> Tutup
              </button>
            </div>
          )}

          <div className="neo-card p-6 bg-white">
            <h2 className="font-display text-2xl mb-4">BUAT API KEY BARU</h2>
            {error && (
              <div className="neo-badge neo-badge-failed w-full text-center py-2 mb-4">
                <i className="fas fa-triangle-exclamation mr-1" /> {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="flex gap-3">
              <input type="text" className="neo-input flex-1"
                placeholder="Label (misal: WhatsApp Bot)"
                value={label}
                onChange={e => setLabel(e.target.value)}
                maxLength={50} />
              <button type="submit" disabled={creating}
                className="neo-btn neo-btn-primary px-5 py-2 text-xs shrink-0">
                <i className={`fas ${creating ? 'fa-spinner fa-spin' : 'fa-plus'} mr-1`} />
                {creating ? 'BUAT...' : 'BUAT'}
              </button>
            </form>
            <p className="font-mono text-xs text-black/40 mt-3">
              <i className="fas fa-circle-info mr-1" /> Maksimal 5 API key aktif per akun
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">API KEYS AKTIF</h2>
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="neo-card p-4 h-20 animate-pulse bg-white" />)}
              </div>
            ) : keys.filter(k => k.is_active).length === 0 ? (
              <div className="neo-card p-8 text-center bg-white">
                <i className="fas fa-key text-3xl text-black/20 mb-2 block" />
                <p className="font-mono text-xs text-black/40">Belum ada API key</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.filter(k => k.is_active).map(k => (
                  <div key={k.id} className="neo-card p-4 bg-white">
                    {/* Baris 1: label + badge + cabut */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm font-bold truncate">{k.label}</span>
                        <span className="neo-badge neo-badge-success shrink-0">
                          <i className="fas fa-check mr-1" /> AKTIF
                        </span>
                      </div>
                      <button onClick={() => handleRevoke(k.id)}
                        className="neo-btn neo-btn-danger px-4 py-2 text-xs shrink-0">
                        <i className="fas fa-trash mr-1" /> CABUT
                      </button>
                    </div>
                    {/* Baris 2: key + salin */}
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-black/60 truncate flex-1 bg-gray-50 border border-black/10 px-2 py-1">
                        {k.key.slice(0, 24)}••••••••••••
                      </code>
                      <button onClick={() => copyKey(k.key)}
                        className="neo-btn neo-btn-secondary px-3 py-1 text-xs shrink-0">
                        <i className={`fas ${copied === k.key ? 'fa-check' : 'fa-copy'} mr-1`} />
                        {copied === k.key ? 'DISALIN' : 'SALIN'}
                      </button>
                    </div>
                    {/* Baris 3: meta */}
                    <p className="font-mono text-xs text-black/40 mt-2">
                      <i className="fas fa-calendar mr-1" />
                      Dibuat: {new Date(k.created_at).toLocaleDateString('id-ID')}
                      {k.last_used && (
                        <> · Terakhir: {new Date(k.last_used).toLocaleDateString('id-ID')}</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Docs API */}
          <div className="neo-card p-6 bg-white">
            <h2 className="font-display text-2xl mb-2">
              <i className="fas fa-book mr-2 text-black/40" /> DOCS API
            </h2>
            <p className="font-mono text-xs text-black/50 mb-5">
              Generate QRIS dinamis untuk bot atau website kamu
            </p>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="neo-badge bg-black text-white text-xs px-2 py-1">POST</span>
                  <code className="font-mono text-sm font-bold">/api/qris/create</code>
                </div>
                <p className="font-mono text-xs text-black/50 mb-3">
                  Generate QRIS dinamis dengan nominal tertentu menggunakan API key.
                </p>
              </div>
              <div>
                <p className="font-mono text-xs font-bold mb-2">
                  <i className="fas fa-arrow-up mr-1 text-black/40" /> REQUEST
                </p>
                <pre className="bg-black text-green-400 font-mono text-xs p-4 overflow-x-auto border-2 border-black">{`POST /api/qris/create
Header: x-api-key: meg_xxxxxxxxxxxxx
Content-Type: application/json

{
  "amount": 10000,        // wajib, min 1000
  "reference": "ORD-123" // opsional
}`}</pre>
              </div>
              <div>
                <p className="font-mono text-xs font-bold mb-2">
                  <i className="fas fa-arrow-down mr-1 text-black/40" /> RESPONSE
                </p>
                <pre className="bg-black text-green-400 font-mono text-xs p-4 overflow-x-auto border-2 border-black">{`{
  "success": true,
  "amount": 10000,
  "reference": "ORD-123",
  "qris_string": "000201...",
  "qris_base64": "iVBORw0...",
  "qris_image_url": "data:image/png;base64,..."
}`}</pre>
              </div>
              <div>
                <p className="font-mono text-xs font-bold mb-2">
                  <i className="fab fa-whatsapp mr-1 text-black/40" /> CONTOH — WhatsApp Bot (Node.js)
                </p>
                <pre className="bg-black text-green-400 font-mono text-xs p-4 overflow-x-auto border-2 border-black">{`const res = await fetch('https://meg-payment-gateway.vercel.app/api/qris/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'meg_xxxxxxxxxxxxx'
  },
  body: JSON.stringify({ amount: 10000 })
})

const data = await res.json()
// data.qris_base64 → kirim sebagai gambar ke user
// data.qris_string → string QRIS jika diperlukan`}</pre>
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
