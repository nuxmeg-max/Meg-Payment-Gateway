import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, password } = req.body

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Semua field wajib diisi' })

  if (password.length < 6)
    return res.status(400).json({ error: 'Password minimal 6 karakter' })

  // Cek email sudah dipakai
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) return res.status(400).json({ error: 'Email sudah terdaftar' })

  const hashedPassword = await bcrypt.hash(password, 10)

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ name, email, password: hashedPassword, role: 'user', saldo: 0 })
    .select('id, name, email, role')
    .single()

  if (error) return res.status(500).json({ error: 'Gagal membuat akun' })

  return res.status(201).json({ message: 'Akun berhasil dibuat', user })
}
