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
              <i className={`${session?.user?.role === 'admin' ? 'fas fa-shield-halved' : 'fas fa-user'} mr-1`} />
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

          {/* Stats 4 kolom */}
          <div className="grid grid-cols-2 gap-4">
            {/* 1. SALDO AKTIF */}
            <div className="neo-card p-5 relative overflow-hidden bg-black text-white col-span-2" style={{ boxShadow: '4px 4px 0 #555' }}>
              <div className="absolute top-2 right-4 pointer-events-none select-none">
                <span className="font-jp text-5xl text-white/10">残高</span>
              </div>
              <p className="font-jp text-xs text-white/30 mb-0.5">残高</p>
              <p className="font-mono text-xs text-white/50 mb-1">SALDO AKTIF</p>
              <p className="font-display text-4xl text-white leading-none">
                {loading ? '...' : formatRp(data?.user?.saldo || 0)}
              </p>
            </div>

            {/* 2. TOTAL TRANSAKSI */}
            <div className="neo-card p-5 relative overflow-hidden bg-white">
              <div className="absolute top-2 right-2 pointer-events-none select-none">
                <i className="fas fa-list text-xl text-black/10" />
              </div>
              <p className="font-jp text-xs text-black/20 mb-0.5">取引数</p>
              <p className="font-mono text-xs text-black/50 mb-1">TOTAL TRANSAKSI</p>
              <p className="font-display text-3xl leading-none">
                {loading ? '...' : data?.transactions?.length || 0}
                <span className="text-base text-black/40"> TX</span>
              </p>
            </div>

            {/* 3. TOTAL USER (admin) / API KEY AKTIF (user) */}
            <div className="neo-card p-5 relative overflow-hidden bg-white">
              <div className="absolute top-2 right-2 pointer-events-none select-none">
                <i className={`fas ${session?.user?.role === 'admin' ? 'fa-users' : 'fa-key'} text-xl text-black/10`} />
              </div>
              <p className="font-jp text-xs text-black/20 mb-0.5">
                {session?.user?.role === 'admin' ? 'ユーザー' : 'APIキー'}
              </p>
              <p className="font-mono text-xs text-black/50 mb-1">
                {session?.user?.role === 'admin' ? 'TOTAL USER' : 'API KEY AKTIF'}
              </p>
              <p className="font-display text-3xl leading-none">
                {loading ? '...' : session?.user?.role === 'admin' ? userCount : activeKeys}
                <span className="text-base text-black/40">
                  {session?.user?.role === 'admin' ? ' USER' : ' KEY'}
                </span>
              </p>
            </div>

            {/* 4. STATUS */}
            <div className="neo-card p-5 relative overflow-hidden bg-white col-span-2">
              <div className="absolute top-2 right-2 pointer-events-none select-none">
                <i className="fas fa-circle-check text-xl text-black/10" />
              </div>
              <p className="font-jp text-xs text-black/20 mb-0.5">ステータス</p>
              <p className="font-mono text-xs text-black/50 mb-2">STATUS AKUN</p>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-black animate-pulse" />
                <p className="font-display text-2xl leading-none text-green-600">AKTIF</p>
                <span className="font-jp text-sm text-black/30 ml-1">アクティブ</span>
              </div>
              <p className="font-mono text-xs text-black/40 mt-2">
                <i className="fas fa-calendar mr-1" />
                Member sejak {loading ? '...' : data?.user?.created_at ? new Date(data.user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : '—'}
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
              <Link href="/dashboard/transactions" className="font-mono text-xs underline">
                Lihat semua <i className="fas fa-arrow-right ml-1" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="neo-card p-4 h-16 animate-pulse bg-white" />)}
              </div>
            ) : !data?.transactions?.length ? (
              <div className="neo-card p-8 text-center bg-white">
                <i className="fas fa-inbox text-3xl text-black/20 mb-2 block" />
                <p className="font-jp text-sm text-black/20 mb-1">取引なし</p>
                <p className="font-mono text-xs text-black/40">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.transactions?.slice(0, 5).map(tx => (
                  <div key={tx.id} className="neo-card p-4 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 border-2 border-black flex items-center justify-center text-lg shrink-0
                        ${tx.type === 'topup' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <i className={`fas ${tx.type === 'topup' ? 'fa-arrow-down text-green-600' : 'fa-arrow-up text-red-600'}`} />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold">{tx.description}</p>
                        <p className="font-mono text-xs text-black/40">{tx.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'topup' ? '+' : '-'}{formatRp(tx.amount)}
                      </p>
                      <p className="font-mono text-xs text-black/40">
                        {new Date(tx.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
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
