import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const { status } = req.query
    let query = supabaseAdmin
      .from('topup_requests')
      .select('id, amount, unique_code, total_transfer, status, created_at, user_id, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(50)

    // Default tampilkan pending saja kalau tidak ada filter
    const filterStatus = status || 'pending'
    query = query.eq('status', filterStatus)

    const { data, error } = await query
    if (error) {
      console.error('Admin topup error:', error)
      return res.status(500).json({ error: 'Gagal mengambil data', detail: error.message })
    }
    return res.status(200).json({ requests: data || [] })
  }

  if (req.method === 'POST') {
    const { requestId, action } = req.body

    if (!['confirm', 'reject'].includes(action))
      return res.status(400).json({ error: 'Action tidak valid' })

    const { data: topup, error: fetchError } = await supabaseAdmin
      .from('topup_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !topup)
      return res.status(404).json({ error: 'Request tidak ditemukan atau sudah diproses' })

    if (action === 'confirm') {
      const { error: saldoError } = await supabaseAdmin.rpc('add_saldo', {
        user_id: topup.user_id,
        amount: topup.amount
      })
      if (saldoError) return res.status(500).json({ error: 'Gagal menambah saldo' })

      await supabaseAdmin.from('transactions').insert({
        user_id: topup.user_id,
        type: 'topup',
        amount: topup.amount,
        description: 'Topup dikonfirmasi admin',
        status: 'success',
        reference: `TOPUP-${topup.id.slice(0, 8).toUpperCase()}`,
        metadata: { topup_request_id: topup.id, unique_code: topup.unique_code }
      })
    }

    await supabaseAdmin
      .from('topup_requests')
      .update({
        status: action === 'confirm' ? 'confirmed' : 'rejected',
        confirmed_by: session.user.id,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    return res.status(200).json({
      message: action === 'confirm' ? 'Topup berhasil dikonfirmasi' : 'Topup ditolak'
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
      }
