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
        <title>Daftar — Meg Payment Gateway</title>
      </Head>
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <Link href="/" className="font-display text-4xl">MEG</Link>
            <span className="font-mono text-black/40 text-xs block">PAYMENT GATEWAY</span>
          </div>

          <div className="neo-card p-8">
            <h1 className="font-display text-4xl mb-1">DAFTAR</h1>
            <p className="font-mono text-xs text-black/50 mb-8">
              Sudah punya akun? <Link href="/auth/login" className="text-black underline font-bold">Masuk</Link>
            </p>

            {error && (
              <div className="neo-badge neo-badge-failed w-full text-center mb-6 py-2">{error}</div>
            )}
            {success && (
              <div className="neo-badge neo-badge-success w-full text-center mb-6 py-2">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-mono text-xs font-bold mb-2 block">NAMA LENGKAP</label>
                <input
                  type="text"
                  className="neo-input"
                  placeholder="Nama kamu"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
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
                  placeholder="Min. 6 karakter"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="neo-btn neo-btn-primary w-full py-3 text-sm"
              >
                {loading ? 'MEMPROSES...' : 'BUAT AKUN →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
