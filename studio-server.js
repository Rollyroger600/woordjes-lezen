// ============================================================
// Voice Studio Server
// Start met: npm run studio
// Open: http://localhost:3333
// Opnames worden opgeslagen in: public/audio/studio/
// ============================================================

import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SPEECH_ITEMS } from './src/speechManifest.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3333
const STUDIO_DIR = path.join(__dirname, 'public', 'audio', 'studio')

// Zorg dat de studio directory bestaat
fs.mkdirSync(STUDIO_DIR, { recursive: true })

// Serveer de studio UI
app.use(express.static(path.join(__dirname, 'studio-client')))

// Serveer audio bestanden (studio + bestaande)
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')))

// Multer: sla op in memory (we schrijven zelf naar disk)
const upload = multer({ storage: multer.memoryStorage() })

// API: geef manifest terug met opname-status
app.get('/api/manifest', (req, res) => {
  const items = SPEECH_ITEMS.map(item => {
    const webm = path.join(STUDIO_DIR, `${item.id}.webm`)
    const wav = path.join(STUDIO_DIR, `${item.id}.wav`)
    const file = fs.existsSync(webm) ? webm : fs.existsSync(wav) ? wav : null
    const recorded = !!file
    const recordedAt = recorded ? fs.statSync(file).mtime.toISOString() : null
    const ext = file ? path.extname(file).slice(1) : null
    return { ...item, recorded, recordedAt, ext }
  })
  res.json(items)
})

// API: sla opname op (webm of wav)
app.post('/api/save/:id', upload.single('audio'), (req, res) => {
  const { id } = req.params
  // Valideer dat het id in het manifest staat
  const valid = SPEECH_ITEMS.find(i => i.id === id)
  if (!valid) return res.status(400).json({ error: 'Onbekend id' })
  if (!req.file) return res.status(400).json({ error: 'Geen audio' })

  // Detecteer extensie op basis van MIME type
  const mime = req.file.mimetype || ''
  const ext = mime.includes('wav') ? 'wav' : 'webm'

  // Verwijder eventueel oud bestand met andere extensie
  const otherExt = ext === 'wav' ? 'webm' : 'wav'
  const otherPath = path.join(STUDIO_DIR, `${id}.${otherExt}`)
  if (fs.existsSync(otherPath)) fs.unlinkSync(otherPath)

  const filePath = path.join(STUDIO_DIR, `${id}.${ext}`)
  fs.writeFileSync(filePath, req.file.buffer)
  console.log(`✓ Opgeslagen: ${id}.${ext} (${Math.round(req.file.size / 1024)}KB)`)
  res.json({ ok: true, path: `/audio/studio/${id}.${ext}` })
})

// API: verwijder opname
app.delete('/api/save/:id', (req, res) => {
  const { id } = req.params
  let found = false
  for (const ext of ['webm', 'wav']) {
    const filePath = path.join(STUDIO_DIR, `${id}.${ext}`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✗ Verwijderd: ${id}.${ext}`)
      found = true
    }
  }
  found ? res.json({ ok: true }) : res.status(404).json({ error: 'Bestand niet gevonden' })
})

// API: stats
app.get('/api/stats', (req, res) => {
  const total = SPEECH_ITEMS.length
  const recorded = SPEECH_ITEMS.filter(item =>
    fs.existsSync(path.join(STUDIO_DIR, `${item.id}.webm`)) ||
    fs.existsSync(path.join(STUDIO_DIR, `${item.id}.wav`))
  ).length
  res.json({ total, recorded, todo: total - recorded })
})

app.listen(PORT, () => {
  const total = SPEECH_ITEMS.length
  const recorded = SPEECH_ITEMS.filter(item =>
    fs.existsSync(path.join(STUDIO_DIR, `${item.id}.webm`)) ||
    fs.existsSync(path.join(STUDIO_DIR, `${item.id}.wav`))
  ).length
  console.log(`
🎙️  Voice Studio gestart!
    Open: http://localhost:${PORT}

    Voortgang: ${recorded}/${total} ingesproken
    Opnames:   public/audio/studio/
  `)
})
