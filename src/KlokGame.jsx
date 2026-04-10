// ============================================================
// KlokGame.jsx — Module 6: Klokkijken
// Analoge SVG klok → kind kiest uit 3 tijdopties.
// Fase 1: alleen hele uren; Fase 2: hele + halve uren.
// Eenmalig uitlegscherm (clock_intro_seen in progress).
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import Salamander from './Salamander'
import { speakItem, stopAll } from './speech'
import { debugLog } from './debugLogger'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

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

function playStarSound() {
  [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 200), i * 200))
}

// ---- SVG Klok component ----
function AnalogClock({ hour, minute, size = 220, animateIntro = false }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 8

  // Wijzer-hoeken (graden, 0 = boven)
  const hourAngle  = ((hour % 12) + minute / 60) * 30 - 90  // 30° per uur
  const minuteAngle = minute * 6 - 90                         // 6° per minuut

  const toRad = (deg) => (deg * Math.PI) / 180

  // Eindpunten wijzers
  const hourLen   = r * 0.55
  const minuteLen = r * 0.8

  const hourX   = cx + hourLen   * Math.cos(toRad(hourAngle))
  const hourY   = cy + hourLen   * Math.sin(toRad(hourAngle))
  const minuteX = cx + minuteLen * Math.cos(toRad(minuteAngle))
  const minuteY = cy + minuteLen * Math.sin(toRad(minuteAngle))

  // Uur-cijfers op de klok
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    const angle = n * 30 - 90
    const nr = r * 0.82
    return {
      n,
      x: cx + nr * Math.cos(toRad(angle)),
      y: cy + nr * Math.sin(toRad(angle)),
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Klok-gezicht */}
      <circle cx={cx} cy={cy} r={r} fill="#FFF9E6" stroke="#C4550F" strokeWidth={4} />
      {/* Minuut-tikjes */}
      {Array.from({ length: 60 }, (_, i) => {
        const angle = i * 6 - 90
        const inner = r * (i % 5 === 0 ? 0.88 : 0.92)
        const outer = r * 0.97
        return (
          <line
            key={i}
            x1={cx + inner * Math.cos(toRad(angle))}
            y1={cy + inner * Math.sin(toRad(angle))}
            x2={cx + outer * Math.cos(toRad(angle))}
            y2={cy + outer * Math.sin(toRad(angle))}
            stroke={i % 5 === 0 ? '#8B4513' : '#CCC'}
            strokeWidth={i % 5 === 0 ? 2.5 : 1}
          />
        )
      })}
      {/* Uur-nummers */}
      {numbers.map(({ n, x, y }) => (
        <text
          key={n}
          x={x} y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.075}
          fontWeight="bold"
          fill="#5D3A1A"
          fontFamily="OpenDyslexic, sans-serif"
        >
          {n}
        </text>
      ))}
      {/* Uurwijzer */}
      <line
        x1={cx} y1={cy}
        x2={hourX} y2={hourY}
        stroke="#3E2009"
        strokeWidth={size * 0.038}
        strokeLinecap="round"
        style={animateIntro ? { transition: 'x2 0.8s ease, y2 0.8s ease' } : {}}
      />
      {/* Minuutwijzer */}
      <line
        x1={cx} y1={cy}
        x2={minuteX} y2={minuteY}
        stroke="#C4550F"
        strokeWidth={size * 0.025}
        strokeLinecap="round"
        style={animateIntro ? { transition: 'x2 0.8s ease, y2 0.8s ease' } : {}}
      />
      {/* Middelpunt */}
      <circle cx={cx} cy={cy} r={size * 0.04} fill="#C4550F" />
    </svg>
  )
}

// ---- Uitleg-scherm ----
function ClockIntroScreen({ onDone }) {
  const [demoHour, setDemoHour] = useState(12)
  const [demoMin, setDemoMin]   = useState(0)

  useEffect(() => {
    // Animeer naar 3 uur om de wijzers te demonstreren
    stopAll()
    const t1 = setTimeout(() => {
      speakItem('klok-uitleg-groot', 'De grote wijzer wijst de minuten', {
        onEnd: () => {
          setDemoMin(0)
          speakItem('klok-uitleg-klein', 'De kleine wijzer wijst de uren', {
            onEnd: () => {
              setDemoHour(3)
            },
          })
        },
      })
    }, 600)
    return () => { clearTimeout(t1); stopAll() }
  }, [])

  return (
    <div style={{
      minHeight: '100%',
      background: '#E0F2F1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <p style={{ ...font, fontSize: '1.5rem', fontWeight: 'bold', color: '#00574B', marginBottom: '1rem' }}>
        🕐 Klokkijken leren!
      </p>

      <AnalogClock hour={demoHour} minute={demoMin} size={200} animateIntro />

      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '1rem 1.5rem',
        margin: '1.25rem 0',
        maxWidth: 300,
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      }}>
        <p style={{ ...font, color: '#5D3A1A', fontSize: '1rem', margin: '0 0 0.5rem' }}>
          🔴 <strong>Kleine wijzer</strong> = uren
        </p>
        <p style={{ ...font, color: '#5D3A1A', fontSize: '1rem', margin: 0 }}>
          🟠 <strong>Grote wijzer</strong> = minuten
        </p>
      </div>

      <button
        onClick={onDone}
        style={{
          ...font,
          background: '#00796B',
          color: 'white',
          border: 'none',
          borderRadius: '2rem',
          padding: '1rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,121,107,0.4)',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
        onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        Ik snap het! Oefenen →
      </button>
    </div>
  )
}

// ---- Helpers voor tijden genereren ----
function generateTime(phase) {
  // Fase 1: alleen hele uren; Fase 2: hele + halve uren
  const hour = Math.floor(Math.random() * 12) + 1
  const minute = phase === 1 ? 0 : (Math.random() < 0.5 ? 0 : 30)
  return { hour, minute }
}

function timeLabel(hour, minute) {
  if (minute === 0) return `${hour} uur`
  return `half ${hour + 1 > 12 ? 1 : hour + 1}`
}

function generateOptions(correct) {
  const opts = [correct]
  let attempts = 0
  while (opts.length < 3 && attempts < 50) {
    attempts++
    const h = Math.floor(Math.random() * 12) + 1
    const m = correct.minute === 30 ? (Math.random() < 0.5 ? 0 : 30) : 0
    const lbl = timeLabel(h, m)
    if (lbl !== timeLabel(correct.hour, correct.minute) && !opts.some(o => timeLabel(o.hour, o.minute) === lbl)) {
      opts.push({ hour: h, minute: m })
    }
  }
  // shuffle
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return opts
}

// ---- Hoofd-spel component ----
export default function KlokGame({ savedProgress, onProgressUpdate, onBack }) {
  const introSeen = savedProgress?.clock_intro_seen ?? false

  const [showIntro, setShowIntro]     = useState(!introSeen)
  const [klokPhase, setKlokPhase]     = useState(() => savedProgress?.current_level ?? 1) // 1 of 2
  const klokPhaseRef = useRef(klokPhase)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(() => savedProgress?.consecutive_correct ?? 0)
  const [totalStars, setTotalStars]   = useState(() => savedProgress?.total_stars ?? 0)
  const [sessionStars, setSessionStars] = useState(0)
  const [samiState, setSamiState]     = useState('idle')

  const [currentTime, setCurrentTime] = useState(null)
  const [options, setOptions]         = useState([])
  const [selectedOpt, setSelectedOpt] = useState(null)
  const [answerResult, setAnswerResult] = useState(null) // null | 'correct' | 'wrong'
  const lastTimeRef = useRef(null)

  const handleIntroDone = () => {
    stopAll()
    setShowIntro(false)
    onProgressUpdate?.({ clock_intro_seen: true })
  }

  useEffect(() => { klokPhaseRef.current = klokPhase }, [klokPhase])

  // ---- Genereer nieuwe vraag ----
  const nextQuestion = useCallback(() => {
    const phase = klokPhaseRef.current
    let time
    let tries = 0
    do {
      time = generateTime(phase)
      tries++
    } while (
      tries < 10 &&
      lastTimeRef.current &&
      timeLabel(time.hour, time.minute) === timeLabel(lastTimeRef.current.hour, lastTimeRef.current.minute)
    )
    lastTimeRef.current = time
    const opts = generateOptions(time)
    debugLog('KlokGame vraag', `${timeLabel(time.hour, time.minute)} (fase ${klokPhaseRef.current})`)
    setCurrentTime(time)
    setOptions(opts)
    setSelectedOpt(null)
    setAnswerResult(null)
    setSamiState('thinking')

    setTimeout(() => {
      setSamiState('idle')
      speakItem('klok-vraag', 'Hoe laat is het?')
    }, 400)
  }, []) // klokPhaseRef is een ref — stabiel, geen dep nodig

  useEffect(() => {
    if (!showIntro) {
      const t = setTimeout(nextQuestion, 0)
      return () => { clearTimeout(t); stopAll() }
    }
    return () => stopAll()
  }, [showIntro]) // eslint-disable-line react-hooks/exhaustive-deps

  // Introdueer halve uren
  const halfIntroShownRef = useRef(false)
  useEffect(() => {
    if (klokPhase === 2 && !halfIntroShownRef.current) {
      halfIntroShownRef.current = true
      speakItem('klok-half', 'Nu leren we ook de halve uren!')
    }
  }, [klokPhase])

  const handleAnswer = (opt) => {
    if (answerResult) return
    stopAll()
    setSelectedOpt(opt)

    const correctLabel = timeLabel(currentTime.hour, currentTime.minute)
    const chosenLabel  = timeLabel(opt.hour, opt.minute)

    if (chosenLabel === correctLabel) {
      debugLog('KlokGame antwoord', `correct: ${chosenLabel}`)
      setSamiState('happy')
      setAnswerResult('correct')
      playTone(880, 150)
      const newCorrect = consecutiveCorrect + 1
      setConsecutiveCorrect(newCorrect)

      let newStars = totalStars
      let newPhase = klokPhase

      // Ster elke 5 goed
      if (newCorrect % 5 === 0) {
        newStars = totalStars + 1
        setTotalStars(newStars)
        setSessionStars(s => s + 1)
        playStarSound()
        setSamiState('celebrating')
        debugLog('Sami state', 'celebrating')
      }

      // Naar fase 2 na 10x goed fase 1
      if (klokPhase === 1 && newCorrect >= 10) {
        newPhase = 2
        setKlokPhase(2)
        debugLog('Level', 'fase 1 → fase 2 (halve uren)')
      }

      speakItem('klok-goed', 'Dat klopt!')
      onProgressUpdate?.({
        current_level: newPhase,
        total_stars: newStars,
        consecutive_correct: newCorrect,
        consecutive_wrong: 0,
        clock_intro_seen: true,
      })

      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 1800)
    } else {
      debugLog('KlokGame antwoord', `fout: gekozen ${chosenLabel}, correct: ${correctLabel}`)
      setSamiState('sad')
      setAnswerResult('wrong')
      playTone(220, 300, 'square')
      setConsecutiveCorrect(0)

      speakItem('klok-fout', 'Dat klopt niet, probeer het nog eens!')
      onProgressUpdate?.({
        current_level: klokPhase,
        total_stars: totalStars,
        consecutive_correct: 0,
        consecutive_wrong: 1,
        clock_intro_seen: true,
      })

      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 2500)
    }
  }

  if (showIntro) {
    return <ClockIntroScreen onDone={handleIntroDone} />
  }

  return (
    <div style={{
      minHeight: '100%',
      background: '#E0F2F1',
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
        <span style={{ ...font, fontSize: '0.9rem', color: '#00574B' }}>
          {klokPhase === 1 ? 'Hele uren 🕐' : 'Hele + halve uren 🕧'}
        </span>
        <span style={{ ...font, fontSize: '1rem', color: '#00574B' }}>⭐ {sessionStars}</span>
      </div>

      {/* Vraag */}
      <p style={{ ...font, fontSize: '1.2rem', color: '#00574B', fontWeight: 'bold', margin: '0.5rem 0 1rem' }}>
        Hoe laat is het?
      </p>

      {/* Klok */}
      {currentTime && (
        <AnalogClock hour={currentTime.hour} minute={currentTime.minute} size={220} />
      )}

      {/* Antwoord-opties */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt, i) => {
          const label = timeLabel(opt.hour, opt.minute)
          const isCorrect = currentTime && timeLabel(currentTime.hour, currentTime.minute) === label
          const isSelected = selectedOpt && timeLabel(selectedOpt.hour, selectedOpt.minute) === label

          let bg = 'white'
          let border = '2px solid #B2DFDB'
          if (answerResult && isCorrect) { bg = '#C8E6C9'; border = '2px solid #4CAF50' }
          else if (answerResult && isSelected && !isCorrect) { bg = '#FFCDD2'; border = '2px solid #F44336' }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!answerResult}
              style={{
                ...font,
                width: 110,
                minHeight: 80,
                background: bg,
                border,
                borderRadius: '1.25rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#00574B',
                cursor: answerResult ? 'default' : 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.95)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.95)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {label}
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
