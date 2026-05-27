import { getSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Meg Payment Gateway</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Kanji dekorasi background */}
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
          <span className="kanji-deco absolute font-jp font-bold" style={{ fontSize: '20rem', top: '-5rem', right: '-5rem', lineHeight: 1 }}>決</span>
          <span className="kanji-deco absolute font-jp font-bold" style={{ fontSize: '12rem', bottom: '5rem', left: '-3rem', lineHeight: 1 }}>済</span>
          <span className="kanji-deco absolute font-jp font-bold" style={{ fontSize: '8rem', top: '40%', left: '50%', lineHeight: 1 }}>支払</span>
        </div>

        {/* Navbar */}
        <nav className="border-b-2 border-black px-6 md:px-8 py-4 flex items-center justify-between bg-white/80 backdrop-blur relative z-10">
          <div>
            <span className="font-display text-3xl">MEG</span>
            <span className="font-jp text-black/20 text-xs ml-2">決済</span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/login" className="neo-btn neo-btn-secondary px-5 py-2 text-xs">
              <i className="fas fa-right-to-bracket mr-1" /> MASUK
            </Link>
            <Link href="/auth/register" className="neo-btn neo-btn-primary px-5 py-2 text-xs">
              <i className="fas fa-user-plus mr-1" /> DAFTAR
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex items-center relative z-10">
          <div className="max-w-5xl mx-auto px-6 md:px-8 py-12 w-full">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="neo-badge bg-black text-white px-3 py-1 text-xs">
                    <i className="fas fa-code-branch mr-1" /> v0.1
                  </div>
                  <span className="font-jp text-xs text-black/30">ベータ版</span>
                </div>

                <h1 className="font-display leading-none mb-4" style={{ fontSize: 'clamp(3rem, 15vw, 5rem)' }}>
                  MEG<br />PAYMENT<br />GATEWAY
                </h1>

                <p className="font-jp text-sm text-black/30 mb-1">決済インフラ</p>
                <p className="font-mono text-sm text-black/60 mb-8 leading-relaxed">
                  Infrastruktur pembayaran sederhana berbasis QRIS. API key siap pakai untuk bot, website, dan aplikasi kamu.
                </p>

                <div className="flex gap-3 flex-wrap">
                  <Link href="/auth/register" className="neo-btn neo-btn-primary px-8 py-3 text-sm">
                    <i className="fas fa-rocket mr-2" /> MULAI GRATIS
                  </Link>
                  <Link href="/auth/login" className="neo-btn neo-btn-secondary px-8 py-3 text-sm">
                    <i className="fas fa-right-to-bracket mr-2" /> MASUK
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: 'fas fa-qrcode', jp: 'QRISコード', title: 'QRIS DINAMIS', desc: 'Generate QRIS dinamis otomatis dari QRIS statis kamu via API.' },
                  { icon: 'fas fa-key', jp: 'APIキー', title: 'API KEY SYSTEM', desc: 'Generate API key untuk integrasi bot WhatsApp, Telegram, atau website.' },
                  { icon: 'fas fa-wallet', jp: '残高管理', title: 'MANAJEMEN SALDO', desc: 'Setiap user punya saldo masing-masing yang terisolasi.' },
                  { icon: 'fas fa-shield-halved', jp: '管理パネル', title: 'ADMIN PANEL', desc: 'Konfirmasi topup, kelola user, dan pantau semua transaksi.' },
                ].map(f => (
                  <div key={f.title} className="neo-card p-4 flex gap-4 items-start bg-white">
                    <div className="w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 bg-black text-white">
                      <i className={`${f.icon} text-sm`} />
                    </div>
                    <div>
                      <p className="font-jp text-xs text-black/30">{f.jp}</p>
                      <p className="font-mono text-xs font-bold mb-1">{f.title}</p>
                      <p className="font-mono text-xs text-black/60">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t-2 border-black px-8 py-4 bg-white/80 relative z-10">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-black/40">© 2026 Meg Payment Gateway</p>
            <span className="font-jp text-xs text-black/20">決済ゲートウェイ v0.1</span>
          </div>
        </footer>
      </div>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx)
  if (session) return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: {} }
  }
