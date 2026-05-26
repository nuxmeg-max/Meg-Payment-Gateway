import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false
    })
    if (res?.error) {
      setError('Email atau password salah')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Head>
        <title>ログイン — Meg Payment Gateway</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <div className="min-h-screen bg-white flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12 relative overflow-hidden">
          {/* Kanji background dekorasi */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="font-jp text-white/5 font-bold" style={{ fontSize: '20rem', lineHeight: 1 }}>決</span>
          </div>
          <div className="absolute top-8 right-8 pointer-events-none select-none">
            <span className="font-jp text-white/10 font-bold text-6xl">支払</span>
          </div>
          <div className="absolute bottom-32 left-8 pointer-events-none select-none">
            <span className="font-jp text-white/10 font-bold text-4xl">安全</span>
          </div>

          <div className="relative">
            <span className="font-display text-white text-5xl tracking-wider">MEG</span>
            <span className="font-mono text-white/40 text-xs block mt-1">PAYMENT GATEWAY</span>
            <span className="font-jp text-white/20 text-sm block mt-1">決済ゲートウェイ</span>
          </div>

          <div className="relative">
            <div className="border-l-4 border-white pl-6 mb-8">
              <p className="font-jp text-white/30 text-sm mb-2">支払いインフラ</p>
              <p className="font-display text-white text-4xl leading-tight">
                PAYMENT<br />INFRASTRUCTURE<br />FOR YOUR APPS
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { en: 'API Key System', jp: 'APIキー' },
                { en: 'Webhook Support', jp: 'Webhook' },
                { en: 'QRIS Dynamic', jp: 'QRIS動的' },
                { en: 'Real-time Balance', jp: 'リアル残高' }
              ].map(f => (
                <div key={f.en} className="border border-white/20 p-3">
                  <span className="font-jp text-white/30 text-xs block">{f.jp}</span>
                  <span className="font-mono text-white/70 text-xs">{f.en}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="font-mono text-white/30 text-xs relative">© 2026 Meg Payment Gateway</p>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
          {/* Kanji dekorasi sudut */}
          <div className="absolute top-4 right-4 pointer-events-none select-none text-right">
            <span className="kanji-deco text-8xl">入</span>
          </div>
          <div className="absolute bottom-4 left-4 pointer-events-none select-none">
            <span className="kanji-deco text-6xl">金</span>
          </div>

          <div className="w-full max-w-md animate-slide-up relative">
            <div className="lg:hidden mb-8">
              <span className="font-display text-5xl">MEG</span>
              <span className="font-jp text-black/20 text-sm block">決済ゲートウェイ</span>
            </div>

            <div className="neo-card p-8 bg-white">
              <p className="font-jp text-black/20 text-sm mb-1">ログイン</p>
              <h1 className="font-display text-4xl mb-1">MASUK</h1>
              <p className="font-mono text-xs text-black/50 mb-8">
                Belum punya akun? <Link href="/auth/register" className="text-black underline font-bold">Daftar</Link>
              </p>

              {error && (
                <div className="neo-badge neo-badge-failed w-full text-center mb-6 py-2">
                  <i className="fas fa-triangle-exclamation mr-1" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-mono text-xs font-bold mb-2 block">
                    <i className="fas fa-envelope mr-1" /> EMAIL
                  </label>
                  <input type="email" className="neo-input"
                    placeholder="email@kamu.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold mb-2 block">
                    <i className="fas fa-lock mr-1" /> PASSWORD
                  </label>
                  <input type="password" className="neo-input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required />
                </div>
                <button type="submit" disabled={loading}
                  className="neo-btn neo-btn-primary w-full py-3 text-sm">
                  {loading
                    ? <><i className="fas fa-spinner fa-spin mr-2" /> MEMPROSES...</>
                    : <><i className="fas fa-right-to-bracket mr-2" /> MASUK</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
          }
