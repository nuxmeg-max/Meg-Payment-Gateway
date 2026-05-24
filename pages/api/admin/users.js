import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' })

  // GET - semua user
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, saldo, created_at')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: 'Gagal mengambil data' })
    return res.status(200).json({ users: data })
  }

  // PATCH - update saldo manual
  if (req.method === 'PATCH') {
    const { userId, saldo } = req.body

    if (!userId || saldo === undefined)
      return res.status(400).json({ error: 'userId dan saldo wajib diisi' })

    const { error } = await supabaseAdmin
      .from('users')
      .update({ saldo: parseInt(saldo) })
      .eq('id', userId)

    if (error) return res.status(500).json({ error: 'Gagal update saldo' })
    return res.status(200).json({ message: 'Saldo berhasil diupdate' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
