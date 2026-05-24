import { supabaseAdmin } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// Helper: validasi API key dan ambil user
async function validateApiKey(apiKey) {
  if (!apiKey) return null

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*, users(*)')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  // Update last_used
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('key', apiKey)

  return data
}

// Helper: kirim webhook
async function sendWebhook(url, payload, transactionId) {
  if (!url) return

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Meg-Signature': transactionId },
      timeout: 10000
    })

    await supabaseAdmin.from('webhook_logs').insert({
      transaction_id: transactionId,
      url,
      payload,
      response_status: response.status,
      response_body: JSON.stringify(response.data).slice(0, 500)
    })

    await supabaseAdmin
      .from('transactions')
      .update({ webhook_sent: true })
      .eq('id', transactionId)
  } catch (err) {
    await supabaseAdmin.from('webhook_logs').insert({
      transaction_id: transactionId,
      url,
      payload,
      response_status: err.response?.status || 0,
      response_body: err.message.slice(0, 500)
    })
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = req.headers['x-api-key'] || req.body.api_key
  const keyData = await validateApiKey(apiKey)

  if (!keyData) return res.status(401).json({ error: 'API key tidak valid atau tidak aktif' })

  const user = keyData.users
  const { amount, description, reference, webhook_url } = req.body

  // Validasi
  if (!amount || isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: 'Amount tidak valid' })

  if (amount < 100)
    return res.status(400).json({ error: 'Minimum transaksi Rp 100' })

  // Cek saldo cukup
  const { data: freshUser } = await supabaseAdmin
    .from('users')
    .select('saldo')
    .eq('id', user.id)
    .single()

  if (freshUser.saldo < amount)
    return res.status(400).json({
      error: 'Saldo tidak mencukupi',
      saldo: freshUser.saldo,
      required: amount
    })

  const txRef = reference || `MEG-${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`

  // Cek reference unik
  if (reference) {
    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('reference', txRef)
      .single()

    if (existing) return res.status(400).json({ error: 'Reference sudah digunakan' })
  }

  // Potong saldo (atomic dengan RPC)
  const { error: deductError } = await supabaseAdmin.rpc('deduct_saldo', {
    user_id: user.id,
    amount: parseInt(amount)
  })

  if (deductError)
    return res.status(500).json({ error: 'Gagal memotong saldo' })

  // Buat transaksi
  const { data: tx, error: txError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'debit',
      amount: parseInt(amount),
      description: description || 'Transaksi via API',
      status: 'success',
      reference: txRef,
      webhook_url,
      metadata: { api_key_label: keyData.label }
    })
    .select()
    .single()

  if (txError)
    return res.status(500).json({ error: 'Gagal membuat transaksi' })

  // Kirim webhook (async, tidak block response)
  if (webhook_url) {
    sendWebhook(webhook_url, {
      event: 'transaction.success',
      transaction_id: tx.id,
      reference: txRef,
      amount: parseInt(amount),
      description: description || 'Transaksi via API',
      status: 'success',
      timestamp: tx.created_at
    }, tx.id)
  }

  return res.status(200).json({
    success: true,
    transaction: {
      id: tx.id,
      reference: txRef,
      amount: parseInt(amount),
      description: tx.description,
      status: 'success',
      created_at: tx.created_at
    }
  })
}
