// ============================================================
// RekenGame.jsx — Module 7: Optellen & Aftrekken
// Level 0-1: visueel tellen met emoji-plaatjes
// Level 2-8: abstracte sommen met cijfers
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import Salamander from './Salamander'
import { speakItem, stopAll } from './speech'
import { playClick, playCorrect, playWrong, playStar, playCombo } from './sounds'
import { debugLog } from './debugLogger'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

// visual:'full'  → emoji-plaatjes als vraag én als antwoord-opties
// visual:'half'  → emoji-plaatjes als vraag, cijfers als antwoord-opties
const LEVELS = [
  { op: 'plus', max: 5,  label: 'Tellen met plaatjes',   visual: 'full' },
  { op: 'plus', max: 5,  label: 'Plaatjes en cijfers',   visual: 'half' },
  { op: 'plus', max: 5,  label: 'Optellen tot 5' },
  { op: 'plus', max: 10, label: 'Optellen tot 10' },
  { op: 'min',  max: 5,  label: 'Aftrekken tot 5' },
  { op: 'min',  max: 10, label: 'Aftrekken tot 10' },
  { op: 'plus', max: 20, label: 'Optellen tot 20' },
  { op: 'min',  max: 20, label: 'Aftrekken tot 20' },
  { op: 'mix',  max: 20, label: 'Optellen én aftrekken tot 20' },
]

const VISUAL_EMOJIS = ['🍎', '🍋', '🍊', '🍓', '🍇', '🐸', '🐱', '🐶', '🐰', '⭐', '🌟', '💫']

function pickEmoji() {
  return VISUAL_EMOJIS[Math.floor(Math.random() * VISUAL_EMOJIS.length)]
}

// Toont N emojis in rijen van max 5
function EmojiGroup({ count, emoji }) {
  const rows = []
  for (let i = 0; i < count; i += 5) {
    rows.push(Math.min(5, count - i))
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
      {rows.map((rowCount, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: rowCount }, (_, j) => (
            <span key={j} style={{ fontSize: '1.5rem', lineHeight: 1 }}>{emoji}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

function pickOp(levelDef) {
  if (levelDef.op === 'mix') return Math.random() < 0.5 ? 'plus' : 'min'
  return levelDef.op
}

function generateSum(levelDef) {
  const op = pickOp(levelDef)
  const max = levelDef.max
  if (op === 'plus') {
    const a = Math.floor(Math.random() * (max - 1)) + 1
    const b = Math.floor(Math.random() * (max - a)) + 1
    return { a, b, op, answer: a + b }
  } else {
    const answer = Math.floor(Math.random() * (max - 1)) + 1
    const b = Math.floor(Math.random() * (max - answer)) + 1
    const a = answer + b
    return { a, b, op, answer }
  }
}

function generateOptions(correct, max, isVisual) {
  const opts = new Set([correct])
  let tries = 0
  // Visueel: kleinere delta zodat het niet te veel emoji's worden
  const maxDelta = isVisual ? 2 : 4
  while (opts.size < 3 && tries < 50) {
    tries++
    const delta = Math.floor(Math.random() * maxDelta) + 1
    const candidate = correct + (Math.random() < 0.5 ? delta : -delta)
    if (candidate >= 1 && candidate <= max + (isVisual ? 3 : 5) && candidate !== correct) {
      opts.add(candidate)
    }
  }
  const arr = [...opts]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function speakSum(a, b, op) {
  stopAll()
  const operatorId   = op === 'plus' ? 'rekenen-plus' : 'rekenen-min'
  const operatorText = op === 'plus' ? 'plus' : 'min'
  speakItem(`getal-${a}`, String(a), {
    onEnd: () => {
      speakItem(operatorId, operatorText, {
        onEnd: () => speakItem(`getal-${b}`, String(b)),
      })
    },
  })
}

export default function RekenGame({ savedProgress, onProgressUpdate, onBack }) {
  const [level, setLevel]               = useState(() => Math.min(savedProgress?.current_level ?? 0, LEVELS.length - 1))
  const [consecutiveCorrect, setCC]     = useState(() => savedProgress?.consecutive_correct ?? 0)
  const [consecutiveWrong, setCW]       = useState(() => savedProgress?.consecutive_wrong ?? 0)
  const [totalStars, setTotalStars]     = useState(() => savedProgress?.total_stars ?? 0)
  const [sessionStars, setSessionStars] = useState(0)
  const [samiState, setSamiState]       = useState('idle')
  const [currentSum, setCurrentSum]     = useState(null)
  const [options, setOptions]           = useState([])
  const [selectedOpt, setSelectedOpt]   = useState(null)
  const [answerResult, setAnswerResult] = useState(null)
  const [currentEmoji, setCurrentEmoji] = useState(() => pickEmoji())

  const levelDef = LEVELS[level]
  const isVisual = !!levelDef.visual

  const nextQuestion = useCallback(() => {
    const sum = generateSum(levelDef)
    const opts = generateOptions(sum.answer, levelDef.max, isVisual)
    debugLog('RekenGame som', `${sum.a} ${sum.op === 'plus' ? '+' : '-'} ${sum.b} = ${sum.answer} (${levelDef.label})`)
    setCurrentSum(sum)
    setOptions(opts)
    setSelectedOpt(null)
    setAnswerResult(null)
    setSamiState('thinking')
    if (isVisual) setCurrentEmoji(pickEmoji())

    setTimeout(() => {
      setSamiState('idle')
      if (isVisual) {
        speakItem('rekenen-tellen', 'Hoeveel zijn het samen?')
      } else {
        speakItem('rekenen-intro', 'Hoeveel is...', {
          onEnd: () => speakSum(sum.a, sum.b, sum.op),
        })
      }
    }, 400)
  }, [levelDef, isVisual])

  useEffect(() => {
    stopAll()
    speakItem('rekenen-start', 'Leren optellen en aftrekken!', {
      onEnd: () => nextQuestion(),
    })
    return () => stopAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSamiPress = () => {
    stopAll()
    if (isVisual) {
      speakItem('uitleg-tellen', 'Tel de plaatjes! Hoeveel zijn het samen? Tik op het goede antwoord!')
    } else {
      speakItem('uitleg-rekenen', 'Luister naar de som! Hoeveel is het antwoord? Tik op het juiste getal!')
    }
    setSamiState('happy')
    setTimeout(() => setSamiState('idle'), 2000)
  }

  const handleAnswer = (opt) => {
    if (answerResult) return
    stopAll()
    playClick()
    setSelectedOpt(opt)

    if (opt === currentSum.answer) {
      debugLog('RekenGame antwoord', `correct: ${opt}`)
      setSamiState('happy')
      setAnswerResult('correct')

      const newCC = consecutiveCorrect + 1
      setCC(newCC)
      setCW(0)

      let newLevel = level
      let newStars = totalStars

      if (newCC >= 5 && level < LEVELS.length - 1) {
        newLevel = level + 1
        setLevel(newLevel)
        setCC(0)
        debugLog('Level', `${LEVELS[level].label} → ${LEVELS[newLevel].label}`)
      }

      if (newCC % 5 === 0) {
        newStars = totalStars + 1
        setTotalStars(newStars)
        setSessionStars(s => s + 1)
        playStar()
        playCombo()
        setSamiState('celebrating')
        debugLog('Sami state', 'celebrating')
      } else {
        playCorrect()
      }

      speakItem('rekenen-goed', 'Helemaal goed!')
      onProgressUpdate?.({
        current_level: newLevel,
        total_stars: newStars,
        consecutive_correct: newCC >= 5 ? 0 : newCC,
        consecutive_wrong: 0,
      })
      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 1400)

    } else {
      debugLog('RekenGame antwoord', `fout: gekozen ${opt}, correct: ${currentSum.answer}`)
      setSamiState('sad')
      setAnswerResult('wrong')
      playWrong()

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
      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 1800)
    }
  }

  const opSymbol = currentSum?.op === 'plus' ? '+' : '−'

  return (
    <div style={{
      height: '100%',
      background: '#FFF3E0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
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

      {/* Vraag */}
      {currentSum && (
        <div style={{
          background: 'white',
          borderRadius: '2rem',
          padding: '1.5rem 2rem',
          margin: '1rem 0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: 380,
        }}>
          {isVisual ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <div style={{ background: '#FFF8E1', borderRadius: '1rem', padding: '0.6rem 0.8rem' }}>
                <EmojiGroup count={currentSum.a} emoji={currentEmoji} />
              </div>
              <span style={{ fontSize: '2rem', color: '#E65100', fontWeight: 'bold' }}>+</span>
              <div style={{ background: '#FFF8E1', borderRadius: '1rem', padding: '0.6rem 0.8rem' }}>
                <EmojiGroup count={currentSum.b} emoji={currentEmoji} />
              </div>
              <span style={{ fontSize: '2rem', color: '#555' }}>=</span>
              <span style={{ fontSize: '2.5rem' }}>❓</span>
            </div>
          ) : (
            <p style={{ ...font, fontSize: '3rem', fontWeight: 'bold', color: '#3E2009', margin: 0, textAlign: 'center' }}>
              {currentSum.a} {opSymbol} {currentSum.b} = ?
            </p>
          )}
        </div>
      )}

      {/* Herhaal knop */}
      {currentSum && !answerResult && (
        <button
          onClick={() => {
            if (isVisual) {
              speakItem('rekenen-tellen', 'Hoeveel zijn het samen?')
            } else {
              speakSum(currentSum.a, currentSum.b, currentSum.op)
            }
          }}
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
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: '5rem' }}>
        {options.map((opt, i) => {
          const isCorrect = currentSum && opt === currentSum.answer
          const isSelected = selectedOpt === opt

          let bg = 'white'
          let border = '2px solid #FFCC80'
          if (answerResult && isCorrect)       { bg = '#C8E6C9'; border = '2px solid #4CAF50' }
          else if (answerResult && isSelected) { bg = '#FFCDD2'; border = '2px solid #F44336' }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!answerResult}
              style={{
                ...font,
                minWidth: levelDef.visual === 'full' ? 110 : 100,
                minHeight: levelDef.visual === 'full' ? 110 : 100,
                background: bg,
                border,
                borderRadius: '1.5rem',
                fontSize: levelDef.visual === 'full' ? '1rem' : '2rem',
                fontWeight: 'bold',
                color: '#3E2009',
                cursor: answerResult ? 'default' : 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                transition: 'transform 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: levelDef.visual === 'full' ? '0.6rem' : '0',
              }}
              onMouseDown={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.93)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.93)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {levelDef.visual === 'full'
                ? <EmojiGroup count={opt} emoji={currentEmoji} />
                : opt
              }
            </button>
          )
        })}
      </div>

      {/* Sami rechtsonder */}
      <div
        style={{ position: 'fixed', bottom: 16, right: 16, cursor: 'pointer', textAlign: 'center' }}
        onClick={handleSamiPress}
        title="Tik op Sami voor uitleg"
      >
        <Salamander state={samiState} size="sm" />
        <div style={{ color: '#555', fontSize: '0.65rem', marginTop: 2, ...font }}>❓ uitleg</div>
      </div>
    </div>
  )
}
