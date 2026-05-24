import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' })

  // GET - semua topup request pending
  if (req.method === 'GET') {
    const { status } = req.query
    let query = supabaseAdmin
      .from('topup_requests')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: 'Gagal mengambil data' })
    return res.status(200).json({ requests: data })
  }

  // POST - konfirmasi atau tolak topup
  if (req.method === 'POST') {
    const { requestId, action } = req.body // action: 'confirm' | 'reject'

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
      // Tambah saldo user
      const { error: saldoError } = await supabaseAdmin.rpc('add_saldo', {
        user_id: topup.user_id,
        amount: topup.amount
      })

      if (saldoError) return res.status(500).json({ error: 'Gagal menambah saldo' })

      // Buat transaksi record
      await supabaseAdmin.from('transactions').insert({
        user_id: topup.user_id,
        type: 'topup',
        amount: topup.amount,
        description: `Topup dikonfirmasi admin`,
        status: 'success',
        reference: `TOPUP-${topup.id.slice(0, 8).toUpperCase()}`,
        metadata: { topup_request_id: topup.id, unique_code: topup.unique_code }
      })
    }

    // Update status request
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
