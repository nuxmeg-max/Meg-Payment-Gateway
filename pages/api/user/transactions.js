import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' })

  // 1. Fetch dari tabel transactions (semua status: success, pending, failed)
  const { data: transactions, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('id, type, amount, description, status, reference, created_at, updated_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (txError) {
    console.error('TX fetch error:', txError)
    return res.status(500).json({ error: 'Gagal mengambil transaksi' })
  }

  // 2. Fetch dari topup_requests — pending & rejected (confirmed sudah ada di transactions)
  const { data: topupRequests, error: trError } = await supabaseAdmin
    .from('topup_requests')
    .select('id, amount, unique_code, total_transfer, status, created_at, updated_at')
    .eq('user_id', session.user.id)
    .in('status', ['pending', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(200)

  if (trError) {
    console.error('TR fetch error:', trError)
  }

  // 3. Map topup_requests ke format seragam
  const mappedTopups = (topupRequests || []).map(r => ({
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

  // 4. Gabungkan & sort by created_at desc
  const all = [...(transactions || []), ...mappedTopups]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return res.status(200).json({ transactions: all })
}
