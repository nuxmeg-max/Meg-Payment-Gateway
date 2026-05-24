import { supabaseAdmin } from '../../../lib/supabase'

async function validateApiKey(apiKey) {
  if (!apiKey) return null
  const { data } = await supabaseAdmin
    .from('api_keys')
    .select('user_id')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single()
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = req.headers['x-api-key']
  const keyData = await validateApiKey(apiKey)
  if (!keyData) return res.status(401).json({ error: 'API key tidak valid' })

  const { reference, id } = req.query

  if (!reference && !id)
    return res.status(400).json({ error: 'Sertakan reference atau id transaksi' })

  let query = supabaseAdmin
    .from('transactions')
    .select('id, type, amount, description, status, reference, created_at, updated_at')
    .eq('user_id', keyData.user_id)

  if (reference) query = query.eq('reference', reference)
  else query = query.eq('id', id)

  const { data: tx, error } = await query.single()

  if (error || !tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' })

  return res.status(200).json({ transaction: tx })
}
