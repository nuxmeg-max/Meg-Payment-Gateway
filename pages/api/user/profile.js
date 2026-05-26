import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, saldo, created_at')
      .eq('id', session.user.id)
      .single()

    if (error) return res.status(500).json({ error: 'Gagal mengambil data' })

    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('id, type, amount, description, status, reference, created_at, updated_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    return res.status(200).json({ user, transactions: transactions || [] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
  }
