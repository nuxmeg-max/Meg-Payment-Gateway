import { useState, useEffect, useRef } from 'react'
import { getSession } from 'next-auth/react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function TopupPage() {
  const [step, setStep] = useState('form')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [requestData, setRequestData] = useState(null)
  const [dynamicQris, setDynamicQris] = useState('')
  const [timer, setTimer] = useState(3600)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef(null)

  const presets = [1000, 5000, 10000, 25000, 50000, 100000]

  useEffect(() => {
    axios.get('/api/topup/request').then(res => setHistory(res.data.requests || []))
  }, [step])

  useEffect(() => {
    if (step !== 'qris') return
    setTimer(3600)
    setExpired(false)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); setExpired(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [step])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (parseInt(amount) < 1000) { setError('Minimum topup Rp 1.000'); return }
    setLoading(true)
    setError('')

    try {
      // Buat topup request
      const res = await axios.post('/api/topup/request', { amount: parseInt(amount) })
      const req = res.data.request

      // Generate QRIS dinamis via API route
      const qrisRes = await axios.post('/api/qris/generate', { amount: req.amount })
      const { qris_base64 } = qrisRes.data

      setDynamicQris(qris_base64)
      setRequestData(req)
      setStep('qris')
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gagal generate QRIS')
    }
    setLoading(false)
  }

  const handleReset = () => {
    clearInterval(timerRef.current)
    setStep('form')
    setDynamicQris('')
    setRequestData(null)
    setExpired(false)
    setError('')
  }

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const downloadQr = () => {
    const link = document.createElement('a')
    link.download = `QRIS_${requestData?.amount}.png`
    link.href = `data:image/png;base64,${dynamicQris}`
    link.click()
  }

  return (
    <>
      <Head><title>Top Up — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up">
          <div>
            <h1 className="font-display text-5xl">TOP UP</h1>
            <p className="font-mono text-xs text-black/50 mt-1">
              {step === 'form'
                ? 'Masukkan nominal, scan QRIS dinamis, transfer, tunggu konfirmasi admin'
                : 'Scan QRIS di bawah dengan e-wallet / m-banking'}
            </p>
          </div>

          {step === 'form' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="neo-card p-6">
                <h2 className="font-display text-2xl mb-5">MASUKKAN NOMINAL</h2>
                {error && (
                  <div className="neo-badge neo-badge-failed w-full text-center py-2 mb-4">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="font-mono text-xs font-bold mb-2 block">NOMINAL (IDR)</label>
                    <input
                      type="number"
                      className="neo-input text-lg"
                      placeholder="1000"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="1000"
                      required
                    />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-black/50 mb-2">PILIH NOMINAL</p>
                    <div className="grid grid-cols-3 gap-2">
                      {presets.map(p => (
                        <button key={p} type="button"
                          onClick={() => setAmount(p.toString())}
                          className={`neo-btn py-2 text-xs ${amount == p ? 'neo-btn-primary' : 'neo-btn-secondary'}`}>
                          {formatRp(p)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="neo-btn neo-btn-primary w-full py-3 text-sm">
                    {loading ? 'GENERATE QRIS...' : 'GENERATE QRIS →'}
                  </button>
                </form>
              </div>

              <div className="neo-card p-5">
                <p className="font-mono text-xs font-bold mb-3">CARA TOP UP</p>
                {[
                  '1. Masukkan nominal topup',
                  '2. Klik Generate QRIS',
                  '3. Scan QRIS dinamis yang muncul',
                  '4. Nominal sudah otomatis terisi',
                  '5. Konfirmasi bayar di e-wallet',
                  '6. Tunggu konfirmasi admin (max 1x24 jam)',
                ].map(s => (
                  <p key={s} className="font-mono text-xs text-black/60 mb-1">{s}</p>
                ))}
              </div>
            </div>
          )}

          {step === 'qris' && (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="neo-card p-5 bg-black text-white" style={{ boxShadow: '4px 4px 0 #555' }}>
                <p className="font-mono text-xs text-white/50 mb-1">TRANSFER TEPAT</p>
                <p className="font-display text-5xl text-white">{formatRp(requestData?.amount)}</p>
                <p className="font-mono text-xs text-white/40 mt-1">Tanpa biaya tambahan</p>
              </div>

              <div className="neo-card p-6 text-center">
                {dynamicQris && (
                  <img
                    src={`data:image/png;base64,${dynamicQris}`}
                    alt="QRIS Dinamis"
                    className={`w-60 h-60 mx-auto border-2 border-black transition-all ${expired ? 'opacity-20 blur-sm' : ''}`}
                  />
                )}
                {expired ? (
                  <div className="mt-3">
                    <p className="font-mono text-xs font-bold text-red-600">QRIS KADALUARSA</p>
                    <p className="font-mono text-xs text-black/50">Buat transaksi baru</p>
                  </div>
                ) : (
                  <p className={`font-mono text-xs mt-3 font-bold ${timer < 300 ? 'text-red-600' : 'text-black/60'}`}>
                    Berlaku: {formatTimer(timer)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadQr} disabled={expired}
                  className="neo-btn neo-btn-secondary py-3 text-xs">
                  ↓ UNDUH QR
                </button>
                <button onClick={handleReset}
                  className="neo-btn neo-btn-primary py-3 text-xs">
                  ← BUAT BARU
                </button>
              </div>

              <div className="neo-card p-4">
                <p className="font-mono text-xs text-black/60 text-center">
                  Setelah transfer, tunggu konfirmasi admin.<br />
                  Saldo akan masuk setelah dikonfirmasi.
                </p>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-2xl mb-4">RIWAYAT REQUEST</h2>
            {history.length === 0 ? (
              <div className="neo-card p-6 text-center">
                <p className="font-mono text-xs text-black/40">Belum ada request topup</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(req => (
                  <div key={req.id} className="neo-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold">{formatRp(req.amount)}</p>
                      <p className="font-mono text-xs text-black/40">
                        {new Date(req.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className={`neo-badge neo-badge-${req.status}`}>
                      {req.status === 'pending' ? 'MENUNGGU'
                        : req.status === 'confirmed' ? 'DIKONFIRMASI'
                        : 'DITOLAK'}
                    </span>
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
