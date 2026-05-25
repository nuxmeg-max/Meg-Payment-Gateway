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
  const [regenLoading, setRegenLoading] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [requestData, setRequestData] = useState(null)
  const [dynamicQris, setDynamicQris] = useState('')
  const [timer, setTimer] = useState(3600)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef(null)

  const presets = [1000, 5000, 10000, 25000, 50000, 100000]

  const fetchHistory = () => {
    axios.get('/api/topup/request').then(res => setHistory(res.data.requests || []))
  }

  useEffect(() => { fetchHistory() }, [step])

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

  const generateQris = async (amount) => {
    const qrisRes = await axios.post('/api/qris/generate', { amount })
    return qrisRes.data.qris_base64
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (parseInt(amount) < 1000) { setError('Minimum topup Rp 1.000'); return }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('/api/topup/request', { amount: parseInt(amount) })
      const req = res.data.request
      const qris_base64 = await generateQris(req.amount)
      setDynamicQris(qris_base64)
      setRequestData(req)
      setStep('qris')
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gagal generate QRIS')
    }
    setLoading(false)
  }

  const handleRegenQris = async (req) => {
    setRegenLoading(req.id)
    setError('')
    try {
      const qris_base64 = await generateQris(req.amount)
      setDynamicQris(qris_base64)
      setRequestData(req)
      setStep('qris')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal generate QRIS')
    }
    setRegenLoading(null)
  }

  const handleReset = () => {
    clearInterval(timerRef.current)
    setStep('form')
    setDynamicQris('')
    setRequestData(null)
    setExpired(false)
    setError('')
    fetchHistory()
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
              <div className="neo-card p-6 bg-white">
                <h2 className="font-display text-2xl mb-5">MASUKKAN NOMINAL</h2>
                {error && (
                  <div className="neo-badge neo-badge-failed w-full text-center py-2 mb-4">
                    <i className="fas fa-triangle-exclamation mr-1" /> {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="font-mono text-xs font-bold mb-2 block">
                      <i className="fas fa-rupiah-sign mr-1" /> NOMINAL (IDR)
                    </label>
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
                    {loading
                      ? <><i className="fas fa-spinner fa-spin mr-2" /> GENERATE QRIS...</>
                      : <><i className="fas fa-qrcode mr-2" /> GENERATE QRIS</>}
                  </button>
                </form>
              </div>

              <div className="neo-card p-5 bg-white">
                <p className="font-mono text-xs font-bold mb-3">
                  <i className="fas fa-circle-info mr-1" /> CARA TOP UP
                </p>
                {[
                  { n: '1', text: 'Masukkan nominal topup' },
                  { n: '2', text: 'Klik Generate QRIS' },
                  { n: '3', text: 'Scan QRIS dinamis yang muncul' },
                  { n: '4', text: 'Nominal sudah otomatis terisi' },
                  { n: '5', text: 'Konfirmasi bayar di e-wallet' },
                  { n: '6', text: 'Tunggu konfirmasi admin (max 1x24 jam)' },
                ].map(s => (
                  <div key={s.n} className="flex gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-black/30 w-4 shrink-0">{s.n}.</span>
                    <p className="font-mono text-xs text-black/60">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'qris' && (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="neo-card p-5 bg-black text-white" style={{ boxShadow: '4px 4px 0 #555' }}>
                <p className="font-mono text-xs text-white/50 mb-1">
                  <i className="fas fa-wallet mr-1" /> TRANSFER TEPAT
                </p>
                <p className="font-display text-5xl text-white">{formatRp(requestData?.amount)}</p>
                <p className="font-mono text-xs text-white/40 mt-1">
                  <i className="fas fa-check mr-1" /> Tanpa biaya tambahan
                </p>
              </div>

              <div className="neo-card p-6 text-center bg-white">
                {dynamicQris && (
                  <img
                    src={`data:image/png;base64,${dynamicQris}`}
                    alt="QRIS Dinamis"
                    className={`w-60 h-60 mx-auto border-2 border-black transition-all ${expired ? 'opacity-20 blur-sm' : ''}`}
                  />
                )}
                {expired ? (
                  <div className="mt-3">
                    <p className="font-mono text-xs font-bold text-red-600">
                      <i className="fas fa-clock mr-1" /> QRIS KADALUARSA
                    </p>
                    <p className="font-mono text-xs text-black/50">Buat transaksi baru</p>
                  </div>
                ) : (
                  <p className={`font-mono text-xs mt-3 font-bold ${timer < 300 ? 'text-red-600' : 'text-black/60'}`}>
                    <i className="fas fa-stopwatch mr-1" /> Berlaku: {formatTimer(timer)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadQr} disabled={expired}
                  className="neo-btn neo-btn-secondary py-3 text-xs gap-2">
                  <i className="fas fa-download" /> UNDUH QR
                </button>
                <button onClick={handleReset}
                  className="neo-btn neo-btn-primary py-3 text-xs gap-2">
                  <i className="fas fa-arrow-left" /> BUAT BARU
                </button>
              </div>

              <div className="neo-card p-4 bg-white">
                <p className="font-mono text-xs text-black/60 text-center">
                  <i className="fas fa-circle-info mr-1" />
                  Setelah transfer, tunggu konfirmasi admin.<br />
                  Saldo akan masuk setelah dikonfirmasi.
                </p>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-2xl mb-4">
              <i className="fas fa-clock-rotate-left mr-2 text-black/40" /> RIWAYAT REQUEST
            </h2>
            {history.length === 0 ? (
              <div className="neo-card p-6 text-center bg-white">
                <i className="fas fa-inbox text-3xl text-black/20 mb-2 block" />
                <p className="font-mono text-xs text-black/40">Belum ada request topup</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(req => (
                  <div key={req.id} className="neo-card p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs font-bold">{formatRp(req.amount)}</p>
                        <p className="font-mono text-xs text-black/40">
                          <i className="fas fa-calendar mr-1" />
                          {new Date(req.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleRegenQris(req)}
                            disabled={regenLoading === req.id}
                            className="neo-btn neo-btn-secondary px-3 py-1 text-xs gap-1">
                            <i className={`fas ${regenLoading === req.id ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`} />
                            {regenLoading === req.id ? '' : 'QRIS'}
                          </button>
                        )}
                        <span className={`neo-badge neo-badge-${req.status}`}>
                          <i className={`fas ${req.status === 'pending' ? 'fa-clock' : req.status === 'confirmed' ? 'fa-check' : 'fa-times'} mr-1`} />
                          {req.status === 'pending' ? 'MENUNGGU'
                            : req.status === 'confirmed' ? 'DIKONFIRMASI'
                            : 'DITOLAK'}
                        </span>
                      </div>
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
