import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import axios from 'axios'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/auth/register', form)
      setSuccess('Akun berhasil dibuat! Redirecting...')
      setTimeout(() => router.push('/auth/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat akun')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>登録 — Meg Payment Gateway</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <div className="min-h-screen bg-white flex items-center justify-center p-8 relative overflow-hidden">
        {/* Kanji dekorasi */}
        <div className="absolute top-4 right-4 pointer-events-none select-none text-right">
          <span className="kanji-deco text-8xl">登</span>
        </div>
        <div className="absolute bottom-4 left-4 pointer-events-none select-none">
          <span className="kanji-deco text-6xl">録</span>
        </div>
        <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none select-none">
          <span className="kanji-deco text-9xl">新</span>
        </div>

        <div className="w-full max-w-md animate-slide-up relative">
          <div className="mb-8">
            <Link href="/" className="font-display text-4xl">MEG</Link>
            <span className="font-jp text-black/20 text-sm block">決済ゲートウェイ</span>
          </div>

          <div className="neo-card p-8 bg-white">
            <p className="font-jp text-black/20 text-sm mb-1">アカウント登録</p>
            <h1 className="font-display text-4xl mb-1">DAFTAR</h1>
            <p className="font-mono text-xs text-black/50 mb-8">
              Sudah punya akun? <Link href="/auth/login" className="text-black underline font-bold">Masuk</Link>
            </p>

            {error && (
              <div className="neo-badge neo-badge-failed w-full text-center mb-6 py-2">
                <i className="fas fa-triangle-exclamation mr-1" /> {error}
              </div>
            )}
            {success && (
              <div className="neo-badge neo-badge-success w-full text-center mb-6 py-2">
                <i className="fas fa-check mr-1" /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-mono text-xs font-bold mb-2 block">
                  <i className="fas fa-user mr-1" /> NAMA LENGKAP
                </label>
                <input type="text" className="neo-input"
                  placeholder="Nama kamu"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required />
              </div>
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
                  placeholder="Min. 6 karakter"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required minLength={6} />
              </div>
              <button type="submit" disabled={loading}
                className="neo-btn neo-btn-primary w-full py-3 text-sm">
                {loading
                  ? <><i className="fas fa-spinner fa-spin mr-2" /> MEMPROSES...</>
                  : <><i className="fas fa-user-plus mr-2" /> BUAT AKUN</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
                    }
