// ============================================================
// RekenGame.jsx — Module 7: Optellen & Aftrekken
// Sommen worden uitgesproken + getoond. Kind kiest uit 3 opties.
// 7 levels: optellen/aftrekken tot 5/10/20 + mix.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import Salamander from './Salamander'
import { speakItem, stopAll } from './speech'
import { debugLog } from './debugLogger'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

// ---- Level definities ----
// [operator, maxGetal]  — 'plus' | 'min' | 'mix'
const LEVELS = [
  { op: 'plus', max: 5,  label: 'Optellen tot 5' },
  { op: 'plus', max: 10, label: 'Optellen tot 10' },
  { op: 'min',  max: 5,  label: 'Aftrekken tot 5' },
  { op: 'min',  max: 10, label: 'Aftrekken tot 10' },
  { op: 'plus', max: 20, label: 'Optellen tot 20' },
  { op: 'min',  max: 20, label: 'Aftrekken tot 20' },
  { op: 'mix',  max: 20, label: 'Optellen én aftrekken tot 20' },
]

function pickOp(levelDef) {
  if (levelDef.op === 'mix') return Math.random() < 0.5 ? 'plus' : 'min'
  return levelDef.op
}

function generateSum(levelDef) {
  const op = pickOp(levelDef)
  const max = levelDef.max
  if (op === 'plus') {
    // a en b minimaal 1, zodat 0 nooit voorkomt
    const a = Math.floor(Math.random() * (max - 1)) + 1
    const b = Math.floor(Math.random() * (max - a)) + 1
    return { a, b, op, answer: a + b }
  } else {
    // Aftrekken: b minimaal 1, antwoord minimaal 1 (zodat ook a > b altijd geldt)
    const answer = Math.floor(Math.random() * (max - 1)) + 1
    const b = Math.floor(Math.random() * (max - answer)) + 1
    const a = answer + b
    return { a, b, op, answer }
  }
}

function generateOptions(correct, max) {
  const opts = new Set([correct])
  let tries = 0
  while (opts.size < 3 && tries < 50) {
    tries++
    const delta = Math.floor(Math.random() * 4) + 1
    const candidate = correct + (Math.random() < 0.5 ? delta : -delta)
    if (candidate >= 1 && candidate <= max + 5 && candidate !== correct) {
      opts.add(candidate)
    }
  }
  const arr = [...opts]
  // Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function playTone(freq, durationMs, type = 'sine') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000)
    osc.start(); osc.stop(ctx.currentTime + durationMs / 1000)
  } catch { /* audio niet beschikbaar */ }
}

function playCorrectSound() { playTone(880, 150) }
function playWrongSound()   { playTone(220, 300, 'square') }
function playStarSound() {
  [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 200), i * 200))
}

// Spreek een som uit via audio-bestanden + TTS fallback
function speakSum(a, b, op) {
  stopAll()
  // Keten: "Hoeveel is" + getal_a + operator + getal_b + "?"
  // Gebruik TTS als fallback wanneer bestanden ontbreken
  const operatorId   = op === 'plus' ? 'rekenen-plus' : 'rekenen-min'
  const operatorText = op === 'plus' ? 'plus' : 'min'

  speakItem(`getal-${a}`, String(a), {
    onEnd: () => {
      speakItem(operatorId, operatorText, {
        onEnd: () => {
          speakItem(`getal-${b}`, String(b))
        },
      })
    },
  })
}

export default function RekenGame({ savedProgress, onProgressUpdate, onBack }) {
  const [level, setLevel]                 = useState(() => Math.min(savedProgress?.current_level ?? 0, LEVELS.length - 1))
  const [consecutiveCorrect, setCC]       = useState(() => savedProgress?.consecutive_correct ?? 0)
  const [consecutiveWrong, setCW]         = useState(() => savedProgress?.consecutive_wrong ?? 0)
  const [totalStars, setTotalStars]       = useState(() => savedProgress?.total_stars ?? 0)
  const [sessionStars, setSessionStars]   = useState(0)
  const [samiState, setSamiState]         = useState('idle')

  const [currentSum, setCurrentSum]       = useState(null)
  const [options, setOptions]             = useState([])
  const [selectedOpt, setSelectedOpt]     = useState(null)
  const [answerResult, setAnswerResult]   = useState(null) // null | 'correct' | 'wrong'

  const levelDef = LEVELS[level]

  // ---- Nieuwe vraag ----
  const nextQuestion = useCallback(() => {
    const sum = generateSum(levelDef)
    const opts = generateOptions(sum.answer, levelDef.max)
    debugLog('RekenGame som', `${sum.a} ${sum.op === 'plus' ? '+' : '-'} ${sum.b} = ${sum.answer} (${levelDef.label})`)
    setCurrentSum(sum)
    setOptions(opts)
    setSelectedOpt(null)
    setAnswerResult(null)
    setSamiState('thinking')

    setTimeout(() => {
      setSamiState('idle')
      // Eerst intro-tekst, dan de som zelf
      speakItem('rekenen-intro', 'Hoeveel is...', {
        onEnd: () => speakSum(sum.a, sum.b, sum.op),
      })
    }, 400)
  }, [levelDef])

  useEffect(() => {
    stopAll()
    speakItem('rekenen-intro', 'Leren optellen en aftrekken!', {
      onEnd: () => nextQuestion(),
    })
    return () => stopAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (opt) => {
    if (answerResult) return
    stopAll()
    setSelectedOpt(opt)

    if (opt === currentSum.answer) {
      debugLog('RekenGame antwoord', `correct: ${opt}`)
      setSamiState('happy')
      setAnswerResult('correct')
      playCorrectSound()

      const newCC = consecutiveCorrect + 1
      setCC(newCC)
      setCW(0)

      let newLevel = level
      let newStars = totalStars

      // Level omhoog na 5x goed op rij
      if (newCC >= 5 && level < LEVELS.length - 1) {
        newLevel = level + 1
        setLevel(newLevel)
        setCC(0)
        debugLog('Level', `${LEVELS[level].label} → ${LEVELS[newLevel].label}`)
      }

      // Ster elke 5 goede antwoorden
      if (newCC % 5 === 0) {
        newStars = totalStars + 1
        setTotalStars(newStars)
        setSessionStars(s => s + 1)
        playStarSound()
        setSamiState('celebrating')
        debugLog('Sami state', 'celebrating')
      }

      speakItem('rekenen-goed', 'Helemaal goed!')
      onProgressUpdate?.({
        current_level: newLevel,
        total_stars: newStars,
        consecutive_correct: newCC >= 5 ? 0 : newCC,
        consecutive_wrong: 0,
      })

      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 1600)
    } else {
      debugLog('RekenGame antwoord', `fout: gekozen ${opt}, correct: ${currentSum.answer}`)
      setSamiState('sad')
      setAnswerResult('wrong')
      playWrongSound()

      const newCW = consecutiveWrong + 1
      setCW(newCW)
      setCC(0)

      let newLevel = level
      if (newCW >= 2 && level > 0) {
        newLevel = level - 1
        setLevel(newLevel)
        setCW(0)
        debugLog('Level', `${LEVELS[level].label} → ${LEVELS[newLevel].label} (terugval)`)
      }

      speakItem('rekenen-fout', 'Niet helemaal, probeer het nog eens!')
      onProgressUpdate?.({
        current_level: newLevel,
        total_stars: totalStars,
        consecutive_correct: 0,
        consecutive_wrong: newCW,
      })

      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 2200)
    }
  }

  const opSymbol = currentSum?.op === 'plus' ? '+' : '−'

  return (
    <div style={{
      minHeight: '100%',
      background: '#FFF3E0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <button
          onClick={() => { stopAll(); onBack() }}
          style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '1rem', padding: '0.4rem 0.9rem', cursor: 'pointer', ...font, color: '#555' }}
        >
          ← Terug
        </button>
        <span style={{ ...font, fontSize: '0.85rem', color: '#E65100' }}>{levelDef.label}</span>
        <span style={{ ...font, fontSize: '1rem', color: '#E65100' }}>⭐ {sessionStars}</span>
      </div>

      {/* Som weergave */}
      {currentSum && (
        <div style={{
          background: 'white',
          borderRadius: '2rem',
          padding: '1.5rem 2.5rem',
          margin: '1.5rem 0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <p style={{ ...font, fontSize: '3rem', fontWeight: 'bold', color: '#3E2009', margin: 0 }}>
            {currentSum.a} {opSymbol} {currentSum.b} = ?
          </p>
        </div>
      )}

      {/* Herhaal knop */}
      {currentSum && !answerResult && (
        <button
          onClick={() => speakSum(currentSum.a, currentSum.b, currentSum.op)}
          style={{
            background: 'transparent',
            border: '2px solid #FFB74D',
            borderRadius: '1.5rem',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            ...font,
            fontSize: '0.9rem',
            color: '#E65100',
            marginBottom: '1rem',
          }}
        >
          🔊 Nog een keer
        </button>
      )}

      {/* Antwoord-opties */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt, i) => {
          const isCorrect = currentSum && opt === currentSum.answer
          const isSelected = selectedOpt === opt

          let bg = 'white'
          let border = '2px solid #FFCC80'
          if (answerResult && isCorrect)  { bg = '#C8E6C9'; border = '2px solid #4CAF50' }
          else if (answerResult && isSelected) { bg = '#FFCDD2'; border = '2px solid #F44336' }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!answerResult}
              style={{
                ...font,
                width: 100,
                height: 100,
                background: bg,
                border,
                borderRadius: '1.5rem',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#3E2009',
                cursor: answerResult ? 'default' : 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.93)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.93)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* Sami rechtsonder */}
      <div style={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Salamander state={samiState} size="sm" />
      </div>
    </div>
  )
}
