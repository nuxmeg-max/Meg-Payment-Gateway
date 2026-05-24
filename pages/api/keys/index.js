import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const userId = session.user.id

  // GET - list semua API keys milik user
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, key, label, is_active, created_at, last_used')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: 'Gagal mengambil API keys' })
    return res.status(200).json({ keys: data })
  }

  // POST - generate API key baru
  if (req.method === 'POST') {
    const { label } = req.body

    // Max 5 API key per user
    const { count } = await supabaseAdmin
      .from('api_keys')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (count >= 5) return res.status(400).json({ error: 'Maksimal 5 API key aktif' })

    const newKey = `meg_${uuidv4().replace(/-/g, '')}`

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({ user_id: userId, key: newKey, label: label || 'Default Key' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'Gagal membuat API key' })
    return res.status(201).json({ key: data })
  }

  // DELETE - revoke API key
  if (req.method === 'DELETE') {
    const { keyId } = req.body

    const { error } = await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userId)

    if (error) return res.status(500).json({ error: 'Gagal menonaktifkan API key' })
    return res.status(200).json({ message: 'API key dinonaktifkan' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
