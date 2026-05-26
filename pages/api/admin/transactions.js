import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const { user_id, status, limit = 50 } = req.query

    let query = supabaseAdmin
      .from('transactions')
      .select('id, type, amount, description, status, reference, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (user_id) query = query.eq('user_id', user_id)
    if (status) query = query.eq('status', status)

    const { data: transactions, error } = await query

    if (error) return res.status(500).json({ error: 'Gagal mengambil data' })

    // Ambil nama user
    const userIds = [...new Set((transactions || []).map(t => t.user_id))]
    let usersMap = {}
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', userIds)
      if (users) users.forEach(u => { usersMap[u.id] = u })
    }

    const result = (transactions || []).map(t => ({
      ...t,
      user: usersMap[t.user_id] || { name: 'Unknown', email: '-' }
    }))

    return res.status(200).json({ transactions: result })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
