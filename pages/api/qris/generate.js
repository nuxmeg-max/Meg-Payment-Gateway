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

function generateDynamicQris(staticQris, amount) {
  let base = staticQris.substring(0, staticQris.lastIndexOf('6304'))
  base = base.replace('010211', '010212')

  const match = base.match(/54\d{2}\d+/)
  if (match) base = base.replace(match[0], '')

  const amountStr = String(parseInt(amount))
  const amountLen = String(amountStr.length).padStart(2, '0')
  const amountTag = `54${amountLen}${amountStr}`

  const tag58Index = base.indexOf('5802')
  if (tag58Index !== -1) {
    base = base.substring(0, tag58Index) + amountTag + base.substring(tag58Index)
  } else {
    base = base + amountTag
  }

  const withCrcTag = base + '6304'
  return withCrcTag + crc16(withCrcTag)
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  const { amount } = req.body

  if (!amount || isNaN(amount) || parseInt(amount) < 1000)
    return res.status(400).json({ error: 'Nominal tidak valid, minimum Rp 1.000' })

  const qrisStatis = process.env.QRIS_STATIC_STRING
  if (!qrisStatis)
    return res.status(500).json({ error: 'QRIS statis belum dikonfigurasi' })

  try {
    const dynamicQrisString = generateDynamicQris(qrisStatis, parseInt(amount))

    const QRCode = (await import('qrcode')).default
    const qrBase64 = await QRCode.toDataURL(dynamicQrisString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' }
    })

    const base64 = qrBase64.replace('data:image/png;base64,', '')

    return res.status(200).json({ qris_base64: base64 })
  } catch (err) {
    return res.status(500).json({ error: 'Gagal generate QRIS: ' + err.message })
  }
}
