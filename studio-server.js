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
    const studioFile = path.join(STUDIO_DIR, `${item.id}.webm`)
    const recorded = fs.existsSync(studioFile)
    const recordedAt = recorded ? fs.statSync(studioFile).mtime.toISOString() : null
    return { ...item, recorded, recordedAt }
  })
  res.json(items)
})

// API: sla opname op
app.post('/api/save/:id', upload.single('audio'), (req, res) => {
  const { id } = req.params
  // Valideer dat het id in het manifest staat
  const valid = SPEECH_ITEMS.find(i => i.id === id)
  if (!valid) return res.status(400).json({ error: 'Onbekend id' })
  if (!req.file) return res.status(400).json({ error: 'Geen audio' })

  const filePath = path.join(STUDIO_DIR, `${id}.webm`)
  fs.writeFileSync(filePath, req.file.buffer)
  console.log(`✓ Opgeslagen: ${id}.webm (${Math.round(req.file.size / 1024)}KB)`)
  res.json({ ok: true, path: `/audio/studio/${id}.webm` })
})

// API: verwijder opname
app.delete('/api/save/:id', (req, res) => {
  const { id } = req.params
  const filePath = path.join(STUDIO_DIR, `${id}.webm`)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`✗ Verwijderd: ${id}.webm`)
    res.json({ ok: true })
  } else {
    res.status(404).json({ error: 'Bestand niet gevonden' })
  }
})

// API: stats
app.get('/api/stats', (req, res) => {
  const total = SPEECH_ITEMS.length
  const recorded = SPEECH_ITEMS.filter(item =>
    fs.existsSync(path.join(STUDIO_DIR, `${item.id}.webm`))
  ).length
  res.json({ total, recorded, todo: total - recorded })
})

app.listen(PORT, () => {
  const total = SPEECH_ITEMS.length
  const recorded = SPEECH_ITEMS.filter(item =>
    fs.existsSync(path.join(STUDIO_DIR, `${item.id}.webm`))
  ).length
  console.log(`
🎙️  Voice Studio gestart!
    Open: http://localhost:${PORT}

    Voortgang: ${recorded}/${total} ingesproken
    Opnames:   public/audio/studio/
  `)
})
