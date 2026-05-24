export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  const { amount } = req.body

  if (!amount || isNaN(amount) || parseInt(amount) < 1000)
    return res.status(400).json({ error: 'Nominal tidak valid' })

  const qrisStatis = process.env.QRIS_STATIC_STRING
  if (!qrisStatis)
    return res.status(500).json({ error: 'QRIS statis belum dikonfigurasi' })

  try {
    const response = await fetch('https://qrisku.my.id/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: String(parseInt(amount)),
        qris_statis: qrisStatis
      })
    })

    const data = await response.json()

    if (data.status !== 'success')
      return res.status(500).json({ error: data.message || 'Gagal generate QRIS' })

    return res.status(200).json({ qris_base64: data.qris_base64 })
  } catch (err) {
    return res.status(500).json({ error: 'Gagal menghubungi server QRIS' })
  }
}
