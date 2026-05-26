import { supabaseAdmin } from '../../../lib/supabase'

function crc16(data) {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

function parseQris(str) {
  const raw = str.substring(0, str.lastIndexOf('6304'))
  const tags = []
  let pos = 0
  while (pos < raw.length) {
    const tag = raw.substring(pos, pos + 2)
    const len = parseInt(raw.substring(pos + 2, pos + 4), 10)
    if (isNaN(len)) break
    const value = raw.substring(pos + 4, pos + 4 + len)
    tags.push({ tag, value })
    pos += 4 + len
  }
  return tags
}

function buildQris(tags) {
  return tags.map(t => t.tag + String(t.value.length).padStart(2, '0') + t.value).join('')
}

function generateDynamicQris(staticQris, amount) {
  const tags = parseQris(staticQris)
  const tag01 = tags.find(t => t.tag === '01')
  if (tag01) tag01.value = '12'
  const idx54 = tags.findIndex(t => t.tag === '54')
  if (idx54 !== -1) tags.splice(idx54, 1)
  const idx58 = tags.findIndex(t => t.tag === '58')
  const amountTag = { tag: '54', value: String(parseInt(amount)) }
  if (idx58 !== -1) tags.splice(idx58, 0, amountTag)
  else tags.push(amountTag)
  const base = buildQris(tags) + '6304'
  return base + crc16(base)
}

async function validateApiKey(apiKey) {
  if (!apiKey) return null
  const { data } = await supabaseAdmin
    .from('api_keys')
    .select('*, users(*)')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single()
  if (data) {
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('key', apiKey)
  }
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = req.headers['x-api-key'] || req.body?.api_key
  const keyData = await validateApiKey(apiKey)
  if (!keyData) return res.status(401).json({ error: 'API key tidak valid atau tidak aktif' })

  const { amount, reference } = req.body

  if (!amount || isNaN(amount) || parseInt(amount) < 1000)
    return res.status(400).json({ error: 'Nominal tidak valid, minimum Rp 1.000' })

  const qrisStatis = process.env.QRIS_STATIC_STRING
  if (!qrisStatis)
    return res.status(500).json({ error: 'QRIS statis belum dikonfigurasi' })

  try {
    const dynamicQrisString = generateDynamicQris(qrisStatis, parseInt(amount))

    const QRCode = (await import('qrcode')).default
    const qrDataUrl = await QRCode.toDataURL(dynamicQrisString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: { dark: '#000000', light: '#ffffff' }
    })

    const base64 = qrDataUrl.replace('data:image/png;base64,', '')

    return res.status(200).json({
      success: true,
      amount: parseInt(amount),
      reference: reference || null,
      qris_string: dynamicQrisString,
      qris_base64: base64,
      qris_image_url: `data:image/png;base64,${base64}`
    })
  } catch (err) {
    return res.status(500).json({ error: 'Gagal generate QRIS: ' + err.message })
  }
}
