import { useState, useEffect, useRef } from 'react'
import { getSession } from 'next-auth/react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function crc16(data) {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

function generateDynamicQris(staticQrisData, amount) {
  let base = staticQrisData.substring(0, staticQrisData.lastIndexOf('6304'))
  base = base.replace('010211', '010212')
  const tag54Index = base.indexOf('54')
  if (tag54Index !== -1) {
    const len = parseInt(base.substring(tag54Index + 2, tag54Index + 4), 10)
    base = base.substring(0, tag54Index) + base.substring(tag54Index + 4 + len)
  }
  const amountStr = String(amount)
  const amountLen = String(amountStr.length).padStart(2, '0')
  const amountTag = `54${amountLen}${amountStr}`
  const tag58Index = base.indexOf('5802')
  if (tag58Index !== -1) {
    base = base.substring(0, tag58Index) + amountTag + base.substring(tag58Index)
  } else {
    base = base + amountTag
  }
  const qrisWithCrcTag = base + '6304'
  return qrisWithCrcTag + crc16(qrisWithCrcTag)
}

async function decodeQrFromImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      if (typeof jsQR === 'undefined') { reject(new Error('jsQR belum dimuat')); return }
      const result = jsQR(imageData.data, imageData.width, imageData.height)
      if (result && result.data) resolve(result.data)
      else reject(new Error('QR tidak terdeteksi'))
    }
    img.onerror = () => reject(new Error('Gagal memuat gambar QRIS'))
    img.src = imageUrl
  })
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
  const [jsqrLoaded, setJsqrLoaded] = useState(false)
  const [merchantName, setMerchantName] = useState('')
  const qrRef = useRef(null)
  const timerRef = useRef(null)

  const presets = [1000, 5000, 10000, 25000, 50000, 100000]

  useEffect(() => {
    const loadScript = (src) => new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return }
      const s = document.createElement('script')
      s.src = src
      s.onload = res
      s.onerror = rej
      document.head.appendChild(s)
    })
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'),
      loadScript('https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js')
    ]).then(() => setJsqrLoaded(true))
      .catch(() => setError('Gagal memuat library QR'))
  }, [])

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

  useEffect(() => {
    if (!dynamicQris || !qrRef.current) return
    if (typeof QRCode === 'undefined') return
    qrRef.current.innerHTML = ''
    new QRCode(qrRef.current, {
      text: dynamicQris,
      width: 220,
      height: 220,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    })
  }, [dynamicQris])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!jsqrLoaded) { setError('Library QR belum siap, tunggu sebentar'); return }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('/api/topup/request', { amount: parseInt(amount) })
      const req = res.data.request
      const staticData = await decodeQrFromImage('/qris.png')
      if (!staticData.startsWith('00020101')) throw new Error('Format QRIS tidak valid')
      const tag59 = staticData.indexOf('59')
      if (tag59 !== -1) {
        const len = parseInt(staticData.substring(tag59 + 2, tag59 + 4), 10)
        setMerchantName(staticData.substring(tag59 + 4, tag59 + 4 + len).trim())
      }
      const dynamic = generateDynamicQris(staticData, req.total_transfer)
      setDynamicQris(dynamic)
      setRequestData(req)
      setStep('qris')
      setAmount('')
    } catch (err) {
      setError(err.message || 'Gagal generate QRIS')
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
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `QRIS_${formatRp(requestData?.total_transfer)}.png`
    link.href = canvas.toDataURL('image/png')
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
              {step === 'form' ? 'Masukkan nominal, scan QRIS dinamis, transfer, tunggu konfirmasi admin' : 'Scan QRIS di bawah dengan e-wallet / m-banking'}
            </p>
          </div>

          {step === 'form' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="neo-card p-6">
                <h2 className="font-display text-2xl mb-5">MASUKKAN NOMINAL</h2>
                {error && <div className="neo-badge neo-badge-failed w-full text-center py-2 mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="font-mono text-xs font-bold mb-2 block">NOMINAL (IDR)</label>
                    <input
                      type="number"
                      className="neo-input text-lg"
                      placeholder="10000"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="10000"
                      required
                    />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-black/50 mb-2">PILIH NOMINAL</p>
                    <div className="grid grid-cols-3 gap-2">
                      {presets.map(p => (
                        <button key={p} type="button" onClick={() => setAmount(p.toString())}
                          className={`neo-btn py-2 text-xs ${amount == p ? 'neo-btn-primary' : 'neo-btn-secondary'}`}>
                          {formatRp(p)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={loading || !jsqrLoaded}
                    className="neo-btn neo-btn-primary w-full py-3 text-sm">
                    {loading ? 'GENERATE QRIS...' : !jsqrLoaded ? 'MEMUAT...' : 'GENERATE QRIS →'}
                  </button>
                </form>
              </div>
              <div className="neo-card p-5">
                <p className="font-mono text-xs font-bold mb-3">CARA TOP UP</p>
                {['1. Masukkan nominal topup','2. Klik Generate QRIS','3. Scan QRIS dinamis yang muncul','4. Nominal sudah otomatis terisi','5. Konfirmasi bayar di e-wallet','6. Tunggu konfirmasi admin (max 1x24 jam)'].map(s => (
                  <p key={s} className="font-mono text-xs text-black/60 mb-1">{s}</p>
                ))}
              </div>
            </div>
          )}

          {step === 'qris' && (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="neo-card p-5 bg-black text-white" style={{ boxShadow: '4px 4px 0 #555' }}>
                <p className="font-mono text-xs text-white/50 mb-1">TRANSFER TEPAT</p>
                <p className="font-display text-5xl text-white">{formatRp(requestData?.total_transfer)}</p>
                {merchantName && <p className="font-mono text-xs text-white/50 mt-2">{merchantName}</p>}
                <p className="font-mono text-xs text-white/40 mt-1">Kode unik sudah termasuk dalam nominal</p>
              </div>
              <div className="neo-card p-6 text-center">
                <div className={`w-56 h-56 mx-auto flex items-center justify-center border-2 border-black bg-white transition-all ${expired ? 'opacity-20 blur-sm' : ''}`}
                  ref={qrRef} />
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
                <button onClick={downloadQr} disabled={expired} className="neo-btn neo-btn-secondary py-3 text-xs">↓ UNDUH QR</button>
                <button onClick={handleReset} className="neo-btn neo-btn-primary py-3 text-xs">← BUAT BARU</button>
              </div>
              <div className="neo-card p-4">
                <p className="font-mono text-xs text-black/60 text-center">
                  Setelah transfer, tunggu konfirmasi admin.<br />Saldo akan masuk otomatis setelah dikonfirmasi.
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
                      <p className="font-mono text-xs text-black/40">Transfer: {formatRp(req.total_transfer)}</p>
                      <p className="font-mono text-xs text-black/40">{new Date(req.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <span className={`neo-badge neo-badge-${req.status}`}>
                      {req.status === 'pending' ? 'MENUNGGU' : req.status === 'confirmed' ? 'DIKONFIRMASI' : 'DITOLAK'}
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
