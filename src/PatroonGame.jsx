// ============================================================
// PatroonGame.jsx — Module 4: Patroon Herkennen
// Onthoud welke vakjes oplichten, tik ze daarna aan.
// Adaptief: grid grootte, aantal vakjes en show-tijd groeien mee.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import Salamander from './Salamander'
import { speakItem, stopAll } from './speech'
import { playTone, playClick, playCorrect, playWrong, playStar, playCombo } from './sounds'
import { debugLog } from './debugLogger'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

const DIFFICULTY_STEPS = [
  [3, 2, 3000],
  [3, 3, 3000],
  [3, 3, 2000],
  [3, 4, 3000],
  [4, 3, 3000],
  [4, 4, 3000],
  [4, 4, 2000],
  [4, 5, 3000],
  [4, 5, 2000],
  [4, 6, 3000],
  [5, 5, 3000],
  [5, 6, 3000],
]

function pickRandomCells(gridSize, count) {
  const total = gridSize * gridSize
  const indices = Array.from({ length: total }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return new Set(indices.slice(0, count))
}

function playFlashTone() { playTone(700, 120, 'sine') }

export default function PatroonGame({ savedProgress, onProgressUpdate, onBack }) {
  // Progress state
  const [diffStep, setDiffStep]       = useState(() => savedProgress?.current_level ?? 0)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(() => savedProgress?.consecutive_correct ?? 0)
  const [consecutiveWrong, setConsecutiveWrong]     = useState(() => savedProgress?.consecutive_wrong ?? 0)
  const [totalStars, setTotalStars]   = useState(() => savedProgress?.total_stars ?? 0)

  // Spel state
  const [phase, setPhase]         = useState('intro') // intro | showing | input | feedback
  const [targetCells, setTargetCells] = useState(new Set())
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [feedbackCells, setFeedbackCells] = useState({}) // index → 'correct'|'missed'|'wrong'
  const [samiState, setSamiState] = useState('idle')
  const [stars, setStars]         = useState(0) // sterren deze sessie
  const phaseRef = useRef(phase)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const clampedStep = Math.min(diffStep, DIFFICULTY_STEPS.length - 1)
  const [gridSize, numCells, showMs] = DIFFICULTY_STEPS[clampedStep]

  // ---- Start een nieuwe ronde ----
  const startRound = useCallback(() => {
    const cells = pickRandomCells(gridSize, numCells)
    debugLog('PatroonGame ronde start', `${gridSize}×${gridSize} raster, ${numCells} vakjes, ${showMs}ms`)
    setTargetCells(cells)
    setSelectedCells(new Set())
    setFeedbackCells({})
    setSamiState('thinking')
    setPhase('showing')

    speakItem('patroon-intro', 'Onthoud de gekleurde vakjes!', {
      onEnd: () => {
        // Na show-tijd: verberg de vakjes
        setTimeout(() => {
          if (phaseRef.current !== 'showing') return
          setPhase('input')
          setSamiState('idle')
          speakItem('patroon-klaar', 'Welke vakjes waren gekleurd?')
        }, showMs)
      },
    })
  }, [gridSize, numCells, showMs])

  useEffect(() => {
    const t = setTimeout(startRound, 600)
    return () => clearTimeout(t)
  }, [startRound])

  // ---- Uitleg herhalen via Sami ----
  const handleSamiPress = () => {
    stopAll()
    speakItem('uitleg-patroon', 'Kijk welke vakjes oplichten! Onthoud ze goed en tik ze daarna zelf aan!')
    setSamiState('happy')
    setTimeout(() => setSamiState('idle'), 2000)
  }

  // ---- Cel toggle tijdens input fase ----
  const toggleCell = (idx) => {
    if (phase !== 'input') return
    playClick()
    setSelectedCells(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  // ---- Check antwoord ----
  const checkAnswer = () => {
    if (phase !== 'input') return
    playClick()
    stopAll()
    setPhase('feedback')

    const fb = {}
    let allCorrect = true

    targetCells.forEach(idx => {
      if (selectedCells.has(idx)) {
        fb[idx] = 'correct'
      } else {
        fb[idx] = 'missed'
        allCorrect = false
      }
    })
    selectedCells.forEach(idx => {
      if (!targetCells.has(idx)) {
        fb[idx] = 'wrong'
        allCorrect = false
      }
    })
    setFeedbackCells(fb)

    if (allCorrect) {
      debugLog('PatroonGame antwoord', 'correct')
      const newCorrect = consecutiveCorrect + 1
      setConsecutiveCorrect(newCorrect)
      setConsecutiveWrong(0)

      let newStars = totalStars
      let newStep = diffStep

      if (newCorrect % 3 === 0) {
        playCombo()
        newStars = totalStars + 1
        setTotalStars(newStars)
        setStars(s => s + 1)
        playStar()
        setSamiState('celebrating')
        debugLog('Sami state', 'celebrating')
        speakItem('patroon-goed', 'Je hebt ze allemaal onthouden!', {
          onEnd: () => speakItem('sami-ster', 'Je hebt een ster verdiend!'),
        })
        if (diffStep < DIFFICULTY_STEPS.length - 1) {
          newStep = diffStep + 1
          debugLog('Level', `${diffStep} → ${newStep}`)
          setDiffStep(newStep)
        }
      } else {
        playCorrect()
        setSamiState('happy')
        speakItem('patroon-goed', 'Je hebt ze allemaal onthouden!')
      }

      onProgressUpdate?.({
        current_level: newStep,
        total_stars: newStars,
        consecutive_correct: newCorrect,
        consecutive_wrong: 0,
      })

      setTimeout(() => {
        setSamiState('idle')
        startRound()
      }, 1400)
    } else {
      debugLog('PatroonGame antwoord', 'fout')
      playWrong()
      setSamiState('sad')
      const newWrong = consecutiveWrong + 1
      setConsecutiveWrong(newWrong)
      setConsecutiveCorrect(0)

      let newStep = diffStep
      if (newWrong >= 2 && diffStep > 0) {
        newStep = diffStep - 1
        setDiffStep(newStep)
      }

      speakItem('patroon-fout', 'Niet helemaal, probeer het nog eens!')

      onProgressUpdate?.({
        current_level: newStep,
        total_stars: totalStars,
        consecutive_correct: 0,
        consecutive_wrong: newWrong,
      })

      setTimeout(() => {
        setSamiState('idle')
        startRound()
      }, 1800)
    }
  }

  // ---- Cel-kleur bepalen ----
  const getCellColor = (idx) => {
    if (phase === 'feedback') {
      const fb = feedbackCells[idx]
      if (fb === 'correct') return '#4CAF50'
      if (fb === 'missed' || fb === 'wrong') return '#F44336'
      return '#E0E0E0'
    }
    if (phase === 'showing' && targetCells.has(idx)) return '#FFD700'
    if (phase === 'input' && selectedCells.has(idx)) return '#42A5F5'
    return '#E0E0E0'
  }

  const cellSize = gridSize === 3 ? 80 : gridSize === 4 ? 65 : 52
  const gap = 10

  return (
    <div style={{
      minHeight: '100%',
      background: '#FFFBF0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <button
          onClick={() => { stopAll(); onBack() }}
          style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '1rem', padding: '0.4rem 0.9rem', cursor: 'pointer', ...font, color: '#555' }}
        >
          ← Terug
        </button>
        <span style={{ ...font, fontSize: '1rem', color: '#8B6914' }}>⭐ {stars}</span>
      </div>

      {/* Level-info */}
      <p style={{ ...font, fontSize: '0.85rem', color: '#999', margin: '0 0 0.5rem' }}>
        {gridSize}×{gridSize} raster · {numCells} vakjes · {showMs / 1000}s
      </p>

      {/* Fase-label */}
      <p style={{ ...font, fontSize: '1rem', color: '#5D3A1A', marginBottom: '1rem', fontWeight: 'bold', minHeight: '1.5em' }}>
        {phase === 'showing' && '👀 Onthoud de gekleurde vakjes!'}
        {phase === 'input'   && '👆 Tik de vakjes die gekleurd waren!'}
        {phase === 'feedback' && (Object.values(feedbackCells).some(f => f !== 'correct') ? '❌ Niet helemaal...' : '✅ Goed gedaan!')}
        {phase === 'intro'   && ''}
      </p>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gap: `${gap}px`,
          margin: '0.5rem 0 1.5rem',
        }}
      >
        {Array.from({ length: gridSize * gridSize }, (_, idx) => (
          <button
            key={idx}
            onClick={() => toggleCell(idx)}
            disabled={phase !== 'input'}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: '1rem',
              background: getCellColor(idx),
              border: 'none',
              cursor: phase === 'input' ? 'pointer' : 'default',
              transition: 'background 0.2s, transform 0.1s',
              transform: phase === 'showing' && targetCells.has(idx) ? 'scale(1.05)' : 'scale(1)',
              boxShadow: phase === 'showing' && targetCells.has(idx)
                ? '0 0 15px rgba(255,215,0,0.6)'
                : '0 2px 6px rgba(0,0,0,0.1)',
            }}
          />
        ))}
      </div>

      {/* Check knop — verschijnt pas na eerste selectie */}
      {phase === 'input' && selectedCells.size > 0 && (
        <button
          onClick={checkAnswer}
          style={{
            ...font,
            background: '#F0821E',
            color: 'white',
            border: 'none',
            borderRadius: '2rem',
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(240,130,30,0.4)',
            marginBottom: '1rem',
          }}
        >
          Check! ✓
        </button>
      )}

      {/* Sami rechtsonder — klikbaar voor uitleg */}
      <div
        style={{ position: 'fixed', bottom: 16, right: 16, cursor: 'pointer', textAlign: 'center' }}
        onClick={handleSamiPress}
        title="Tik op Sami voor uitleg"
      >
        <Salamander state={samiState} size="sm" />
        <div style={{ color: '#999', fontSize: '0.65rem', marginTop: 2, ...font }}>❓ uitleg</div>
      </div>
    </div>
  )
}
