import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' })

  // 1. Fetch semua dari tabel transactions
  const { data: transactions, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (txError) {
    console.error('TX error:', txError)
    return res.status(500).json({ error: 'Gagal mengambil transaksi' })
  }

  // 2. Fetch SEMUA topup_requests user (sama persis seperti /api/topup/request yang sudah jalan)
  const { data: allTopups, error: trError } = await supabaseAdmin
    .from('topup_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (trError) {
    console.error('TR error:', trError)
  }

  // 3. Filter di JS — ambil yang pending & rejected saja (confirmed sudah ada di transactions)
  const pendingRejected = (allTopups || []).filter(r =>
    r.status === 'pending' || r.status === 'rejected'
  )

  // 4. Map ke format seragam
  const mappedTopups = pendingRejected.map(r => ({
    id: `topupreq-${r.id}`,
    type: 'topup',
    amount: r.amount,
    description: r.status === 'pending'
      ? 'Topup menunggu konfirmasi admin'
      : 'Topup ditolak admin',
    status: r.status === 'pending' ? 'pending' : 'failed',
    reference: `TOPUP-REQ-${r.id.slice(0, 8).toUpperCase()}`,
    created_at: r.created_at,
    updated_at: r.updated_at,
    _source: 'topup_request',
    _total_transfer: r.total_transfer,
    _unique_code: r.unique_code,
  }))

  // 5. Gabungkan & sort desc
  const all = [...(transactions || []), ...mappedTopups]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return res.status(200).json({ transactions: all })
}
