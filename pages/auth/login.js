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
        <title>Login — Meg Payment Gateway</title>
      </Head>
      <div className="min-h-screen bg-white flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12">
          <div>
            <span className="font-display text-white text-5xl tracking-wider">MEG</span>
            <span className="font-mono text-white/40 text-xs block mt-1">PAYMENT GATEWAY</span>
          </div>
          <div>
            <div className="border-l-4 border-white pl-6 mb-8">
              <p className="font-display text-white text-4xl leading-tight">
                PAYMENT<br />INFRASTRUCTURE<br />FOR YOUR APPS
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['API Key System', 'Webhook Support', 'Real-time Balance', 'Transaction History'].map(f => (
                <div key={f} className="border border-white/20 p-3">
                  <span className="font-mono text-white/70 text-xs">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="font-mono text-white/30 text-xs">© 2024 Meg Payment Gateway</p>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md animate-slide-up">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
              <span className="font-display text-5xl">MEG</span>
              <span className="font-mono text-black/40 text-xs block">PAYMENT GATEWAY</span>
            </div>

            <div className="neo-card p-8">
              <h1 className="font-display text-4xl mb-1">MASUK</h1>
              <p className="font-mono text-xs text-black/50 mb-8">Belum punya akun? <Link href="/auth/register" className="text-black underline font-bold">Daftar</Link></p>

              {error && (
                <div className="neo-badge neo-badge-failed w-full text-center mb-6 py-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-mono text-xs font-bold mb-2 block">EMAIL</label>
                  <input
                    type="email"
                    className="neo-input"
                    placeholder="email@kamu.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold mb-2 block">PASSWORD</label>
                  <input
                    type="password"
                    className="neo-input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="neo-btn neo-btn-primary w-full py-3 text-sm"
                >
                  {loading ? 'MEMPROSES...' : 'MASUK →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
