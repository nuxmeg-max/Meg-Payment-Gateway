import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('topup_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return res.status(500).json({ error: 'Gagal mengambil data' })
    return res.status(200).json({ requests: data })
  }

  if (req.method === 'POST') {
    const { amount } = req.body

    // Fix: minimum 1000
    if (!amount || isNaN(amount) || amount < 1000)
      return res.status(400).json({ error: 'Minimum topup Rp 1.000' })

    const uniqueCode = Math.floor(Math.random() * 900) + 100
    const totalTransfer = parseInt(amount) + uniqueCode

    const { data, error } = await supabaseAdmin
      .from('topup_requests')
      .insert({
        user_id: session.user.id,
        amount: parseInt(amount),
        unique_code: uniqueCode,
        total_transfer: totalTransfer,
        status: 'pending'
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'Gagal membuat request topup' })
    return res.status(201).json({ request: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
