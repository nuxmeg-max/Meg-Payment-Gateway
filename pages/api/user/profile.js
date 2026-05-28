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

    // Fetch semua transaksi dari tabel transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, type, amount, description, status, reference, created_at, updated_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (txError) console.error('TX error:', txError)

    // Fetch topup_requests yang BELUM dikonfirmasi (pending & rejected)
    // "confirmed" tidak perlu — sudah ada di tabel transactions dengan status success
    const { data: topupRequests, error: trError } = await supabaseAdmin
      .from('topup_requests')
      .select('id, amount, unique_code, total_transfer, status, created_at, updated_at')
      .eq('user_id', session.user.id)
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(100)

    if (trError) console.error('TR error:', trError)

    // Map topup_requests ke format transaksi seragam
    const mappedTopups = (topupRequests || []).map(r => ({
      id: `tr-${r.id}`,
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

    // Gabungkan & sort desc
    const allTransactions = [...(transactions || []), ...mappedTopups]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 100)

    return res.status(200).json({
      user,
      transactions: allTransactions
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
                             }
