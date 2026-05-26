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

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    axios.get('/api/user/profile').then(res => {
      setData(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))

    if (session?.user?.role === 'admin') {
      axios.get('/api/admin/users').then(res => {
        setUserCount(res.data.users?.length || 0)
      }).catch(() => {})
    }
  }, [session])

  const totalTopup = data?.transactions?.filter(t => t.type === 'topup').reduce((a, t) => a + t.amount, 0) || 0
  const totalDebit = data?.transactions?.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0) || 0

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

          {/* Saldo Card */}
          <div className="neo-card bg-black text-white relative overflow-hidden" style={{ boxShadow: '6px 6px 0px #555' }}>
            {/* Kanji di dalam card */}
            <div className="absolute top-0 right-0 p-4 pointer-events-none select-none">
              <span className="font-jp text-6xl text-white/10 font-bold">残高</span>
            </div>
            <div className="relative p-8 pb-6">
              <p className="font-mono text-xs text-white/50 mb-2">
                <i className="fas fa-wallet mr-1" /> SALDO AKTIF
                <span className="font-jp ml-2 text-white/30">残高</span>
              </p>
              {loading ? (
                <div className="h-16 w-48 bg-white/10 animate-pulse" />
              ) : (
                <p className="font-display text-6xl text-white tracking-wide">
                  {formatRp(data?.user?.saldo || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Video Banner — full width tanpa halangan */}
          <div className="neo-card overflow-hidden p-0" style={{ boxShadow: '4px 4px 0px #555' }}>
            <video autoPlay loop muted playsInline
              className="w-full object-cover"
              style={{ maxHeight: '200px' }}>
              <source src="/banner.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Action buttons di bawah banner */}
          <div className="flex gap-3">
            <Link href="/dashboard/topup"
              className="neo-btn neo-btn-primary px-6 py-3 text-sm flex-1 justify-center">
              <i className="fas fa-plus mr-2" /> TOP UP
            </Link>
            <a href={`https://wa.me/${WA_NUMBER}?text=Halo Admin, saya butuh bantuan`}
              target="_blank" rel="noreferrer"
              className="neo-btn neo-btn-secondary px-6 py-3 text-sm flex-1 justify-center">
              <i className="fab fa-whatsapp mr-2" /> HUBUNGI ADMIN
            </a>
          </div>

          {/* Stats 4 kolom */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'TOTAL TRANSAKSI', jp: '取引数', value: loading ? '...' : `${data?.transactions?.length || 0}`, unit: 'TX', icon: 'fas fa-list' },
              { label: 'TOTAL TOPUP', jp: '入金合計', value: loading ? '...' : formatRp(totalTopup), unit: '', icon: 'fas fa-arrow-down' },
              { label: 'TOTAL TERPAKAI', jp: '使用合計', value: loading ? '...' : formatRp(totalDebit), unit: '', icon: 'fas fa-arrow-up' },
              {
                label: session?.user?.role === 'admin' ? 'TOTAL USER' : 'MEMBER SEJAK',
                jp: session?.user?.role === 'admin' ? 'ユーザー' : '加入年',
                value: loading ? '...' : session?.user?.role === 'admin'
                  ? userCount
                  : data?.user?.created_at ? new Date(data.user.created_at).getFullYear() : '—',
                unit: session?.user?.role === 'admin' ? 'USER' : '',
                icon: session?.user?.role === 'admin' ? 'fas fa-users' : 'fas fa-calendar'
              },
            ].map(s => (
              <div key={s.label} className="neo-card p-5 relative overflow-hidden bg-white">
                <div className="absolute top-2 right-2 pointer-events-none select-none">
                  <i className={`${s.icon} text-xl text-black/10`} />
                </div>
                <p className="font-jp text-xs text-black/20 mb-0.5">{s.jp}</p>
                <p className="font-mono text-xs text-black/50 mb-1">{s.label}</p>
                <p className="font-display text-3xl leading-none">
                  {s.value} <span className="text-base text-black/40">{s.unit}</span>
                </p>
              </div>
            ))}
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
