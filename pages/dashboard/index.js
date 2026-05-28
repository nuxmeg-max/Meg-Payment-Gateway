import { useSession, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Head from 'next/head'
import axios from 'axios'
import Link from 'next/link'

const WA_NUMBER = '6285188724658'

function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const statusColor = (s) => {
  if (s === 'success') return 'text-green-600'
  if (s === 'pending') return 'text-yellow-500'
  return 'text-red-500'
}
const statusLabel = (s) => {
  if (s === 'success') return 'BERHASIL'
  if (s === 'pending') return 'PENDING'
  return 'GAGAL'
}

const FAQ_ITEMS = [
  { q: 'Bagaimana cara top up?', a: 'Klik TOP UP → masukkan nominal → scan QRIS → transfer → tunggu konfirmasi admin.' },
  { q: 'Berapa lama konfirmasi top up?', a: 'Maksimal 1x24 jam setelah transfer masuk.' },
  { q: 'Bagaimana cara pakai API?', a: 'Buat API key di menu API, lalu gunakan endpoint /api/qris/create dengan header x-api-key.' },
  { q: 'Minimal top up berapa?', a: 'Minimal Rp 1.000 per transaksi.' },
]

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userCount, setUserCount] = useState(0)
  const [activeKeys, setActiveKeys] = useState(0)
  const [faqOpen, setFaqOpen] = useState(null)

  useEffect(() => {
    axios.get('/api/user/profile').then(res => {
      setData(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))

    if (session?.user?.role === 'admin') {
      axios.get('/api/admin/users').then(res => {
        setUserCount(res.data.users?.length || 0)
      }).catch(() => {})
    } else {
      axios.get('/api/keys').then(res => {
        setActiveKeys(res.data.keys?.filter(k => k.is_active).length || 0)
      }).catch(() => {})
    }
  }, [session])

  const txs = data?.transactions || []
  const successTx = txs.filter(t => t.status === 'success').length
  const pendingTx = txs.filter(t => t.status === 'pending').length
  const failedTx = txs.filter(t => t.status === 'failed').length

  const isAdmin = session?.user?.role === 'admin'

  return (
    <>
      <Head><title>ダッシュボード — Meg PG</title></Head>
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-8 animate-slide-up relative">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-black/40 mb-1">
                <span className="font-jp mr-2">ようこそ</span>SELAMAT DATANG
              </p>
              <h1 className="font-display text-5xl">{session?.user?.name?.toUpperCase()}</h1>
            </div>
            <div className="neo-badge bg-black text-white px-3 py-1 text-xs">
              <i className={`${isAdmin ? 'fas fa-shield-halved' : 'fas fa-user'} mr-1`} />
              {session?.user?.role?.toUpperCase()}
            </div>
          </div>

          {/* Video Banner */}
          <div className="neo-card overflow-hidden p-0" style={{ boxShadow: '4px 4px 0px #555' }}>
            <video autoPlay loop muted playsInline
              className="w-full object-cover"
              style={{ maxHeight: '220px', display: 'block' }}>
              <source src="/banner.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Link href="/dashboard/topup"
              className="neo-btn neo-btn-secondary px-6 py-3 text-sm flex-1 justify-center">
              <i className="fas fa-plus mr-2" /> TOP UP
            </Link>
            <button
              onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="neo-btn neo-btn-secondary px-6 py-3 text-sm flex-1 justify-center">
              <i className="fas fa-circle-question mr-2" /> FAQ
            </button>
          </div>

          {/* 4 Stats — grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">

            {/* 1. STATUS AKUN */}
            <div className="neo-card p-5 relative overflow-hidden bg-white">
              <i className="fas fa-circle-dot absolute top-3 right-3 text-xl text-black/8" />
              <p className="font-jp text-xs text-black/20 mb-0.5">ステータス</p>
              <p className="font-mono text-xs text-black/40 mb-3 uppercase tracking-widest">Status Akun</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black animate-pulse shrink-0" />
                <span className="font-display text-2xl text-green-600 leading-none">AKTIF</span>
              </div>
              <p className="font-mono text-xs text-black/30 leading-relaxed">
                <i className="fas fa-calendar mr-1" />
                {loading ? '—' : data?.user?.created_at
                  ? new Date(data.user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })
                  : '—'}
              </p>
            </div>

            {/* 2. SALDO AKTIF */}
            <div className="neo-card p-5 relative overflow-hidden bg-black text-white">
              <i className="fas fa-wallet absolute top-3 right-3 text-xl text-white/10" />
              <p className="font-jp text-xs text-white/30 mb-0.5">残高</p>
              <p className="font-mono text-xs text-white/40 mb-3 uppercase tracking-widest">Saldo</p>
              <p className="font-display text-2xl text-white leading-none break-all">
                {loading
                  ? <span className="animate-pulse text-white/40">—</span>
                  : formatRp(data?.user?.saldo || 0)}
              </p>
              {!loading && pendingTx > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="font-mono text-xs text-yellow-400">{pendingTx} pending</span>
                </div>
              )}
            </div>

            {/* 3. TOTAL TRANSAKSI */}
            <div className="neo-card p-5 relative overflow-hidden bg-white">
              <i className="fas fa-receipt absolute top-3 right-3 text-xl text-black/8" />
              <p className="font-jp text-xs text-black/20 mb-0.5">取引数</p>
              <p className="font-mono text-xs text-black/40 mb-3 uppercase tracking-widest">Total TX</p>
              <p className="font-display text-3xl leading-none">
                {loading ? <span className="animate-pulse text-black/20">—</span> : txs.length}
                <span className="text-sm text-black/30 ml-1">TX</span>
              </p>
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {!loading && (
                  <>
                    <span className="font-mono text-xs text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5">
                      {successTx} sukses
                    </span>
                    {pendingTx > 0 && (
                      <span className="font-mono text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5">
                        {pendingTx} pending
                      </span>
                    )}
                    {failedTx > 0 && (
                      <span className="font-mono text-xs text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5">
                        {failedTx} gagal
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 4. TOTAL USER (admin) / API KEY (user) */}
            <div className="neo-card p-5 relative overflow-hidden bg-white">
              <i className={`fas ${isAdmin ? 'fa-users' : 'fa-key'} absolute top-3 right-3 text-xl text-black/8`} />
              <p className="font-jp text-xs text-black/20 mb-0.5">
                {isAdmin ? 'ユーザー' : 'APIキー'}
              </p>
              <p className="font-mono text-xs text-black/40 mb-3 uppercase tracking-widest">
                {isAdmin ? 'Total User' : 'API Key'}
              </p>
              <p className="font-display text-3xl leading-none">
                {loading
                  ? <span className="animate-pulse text-black/20">—</span>
                  : (isAdmin ? userCount : activeKeys)}
                <span className="text-sm text-black/30 ml-1">
                  {isAdmin ? 'USER' : 'KEY'}
                </span>
              </p>
              <p className="font-mono text-xs text-black/30 mt-2">
                {isAdmin ? 'Pengguna terdaftar' : 'Kunci aktif'}
              </p>
            </div>

          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-jp text-xs text-black/20">最近の取引</p>
                <h2 className="font-display text-2xl">TRANSAKSI TERBARU</h2>
              </div>
              <Link href="/dashboard/transactions" className="font-mono text-xs underline flex items-center gap-1">
                Lihat semua <i className="fas fa-arrow-right" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-white" />)}
              </div>
            ) : !txs.length ? (
              <div className="neo-card p-8 text-center bg-white">
                <i className="fas fa-inbox text-3xl text-black/20 mb-2 block" />
                <p className="font-jp text-sm text-black/20 mb-1">取引なし</p>
                <p className="font-mono text-xs text-black/40">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {txs.slice(0, 5).map(tx => (
                  <div key={tx.id} className="neo-card p-4 flex items-center justify-between bg-white gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 border-2 border-black flex items-center justify-center shrink-0
                        ${tx.status === 'pending' ? 'bg-yellow-50' : tx.type === 'topup' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.status === 'pending'
                          ? <i className="fas fa-clock text-yellow-500 text-sm" />
                          : <i className={`fas ${tx.type === 'topup' ? 'fa-arrow-down text-green-600' : 'fa-arrow-up text-red-600'} text-sm`} />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold truncate">{tx.description}</p>
                        <p className="font-mono text-xs text-black/40">{new Date(tx.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono text-sm font-bold ${tx.status === 'failed' ? 'text-black/30 line-through' : tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'topup' ? '+' : '-'}{formatRp(tx.amount)}
                      </p>
                      <span className={`font-mono text-xs ${statusColor(tx.status)}`}>
                        {statusLabel(tx.status)}
                      </span>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/transactions"
                  className="neo-card p-3 flex items-center justify-center gap-2 bg-white hover:bg-black hover:text-white transition-all font-mono text-xs font-bold border-2 border-black">
                  <i className="fas fa-list" /> Lihat Semua Transaksi
                </Link>
              </div>
            )}
          </div>

          {/* FAQ */}
          <div id="faq-section">
            <div className="mb-4">
              <p className="font-jp text-xs text-black/20">よくある質問</p>
              <h2 className="font-display text-2xl">FAQ</h2>
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="neo-card bg-white overflow-hidden">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left">
                    <span className="font-mono text-xs font-bold pr-4">{item.q}</span>
                    <i className={`fas ${faqOpen === i ? 'fa-chevron-up' : 'fa-chevron-down'} text-black/40 shrink-0`} />
                  </button>
                  {faqOpen === i && (
                    <div className="px-4 pb-4 border-t-2 border-black/10 pt-3">
                      <p className="font-mono text-xs text-black/60 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
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
