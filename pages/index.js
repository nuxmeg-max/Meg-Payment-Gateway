import { getSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head><title>Meg Payment Gateway</title></Head>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Navbar */}
        <nav className="border-b-2 border-black px-8 py-4 flex items-center justify-between">
          <span className="font-display text-3xl">MEG</span>
          <div className="flex gap-3">
            <Link href="/auth/login" className="neo-btn neo-btn-secondary px-5 py-2 text-xs">MASUK</Link>
            <Link href="/auth/register" className="neo-btn neo-btn-primary px-5 py-2 text-xs">DAFTAR</Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex items-center">
          <div className="max-w-5xl mx-auto px-8 py-16 w-full">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="neo-badge neo-badge-pending mb-4">BETA</div>
                <h1 className="font-display text-7xl leading-none mb-6">
                  PAYMENT<br />GATE<br />WAY
                </h1>
                <p className="font-mono text-sm text-black/60 mb-8 leading-relaxed">
                  Infrastruktur pembayaran sederhana berbasis QRIS. API key siap pakai untuk bot, website, dan aplikasi kamu.
                </p>
                <div className="flex gap-3">
                  <Link href="/auth/register" className="neo-btn neo-btn-primary px-8 py-3 text-sm">
                    MULAI GRATIS →
                  </Link>
                  <Link href="/auth/login" className="neo-btn neo-btn-secondary px-8 py-3 text-sm">
                    MASUK
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: '⌘', title: 'API KEY SYSTEM', desc: 'Generate API key untuk integrasi bot WhatsApp, Telegram, atau website kamu.' },
                  { icon: '↗', title: 'WEBHOOK SUPPORT', desc: 'Terima notifikasi real-time setiap transaksi berhasil ke URL yang kamu tentukan.' },
                  { icon: '◈', title: 'SALDO TERPISAH', desc: 'Setiap user punya saldo masing-masing yang bisa dipakai via API.' },
                  { icon: '≡', title: 'RIWAYAT LENGKAP', desc: 'Semua transaksi tercatat dengan reference unik untuk audit.' },
                ].map(f => (
                  <div key={f.title} className="neo-card p-5 flex gap-4 items-start">
                    <span className="font-mono text-2xl shrink-0">{f.icon}</span>
                    <div>
                      <p className="font-mono text-xs font-bold mb-1">{f.title}</p>
                      <p className="font-mono text-xs text-black/60">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t-2 border-black px-8 py-4">
          <p className="font-mono text-xs text-black/40 text-center">© 2024 Meg Payment Gateway</p>
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
