// ============================================================
// KlokGame.jsx — Module 6: Klokkijken
// Uitgebreide 4-staps intro + mini-klokken als antwoorden
// Fase 1: uren 1-6 | Fase 2: uren 1-12 | Fase 3: halve uren
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import Salamander from './Salamander'
import { speakItem, stopAll } from './speech'
import { playClick, playCorrect, playWrong, playStar, playCombo } from './sounds'
import { debugLog } from './debugLogger'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

const PHASE_LABELS = {
  1: 'Uren 1–6',
  2: 'Alle uren',
  3: 'Halve uren',
}

// Juist getal correct antwoorden (niet op rij) om naar volgende fase te gaan
const PHASE_THRESHOLD = { 1: 8, 2: 10, 3: Infinity }

// ---- SVG Klok ----
// glowHour / glowMinute: markeer de betreffende wijzer met kleur en dikte
function AnalogClock({ hour, minute, size = 220, glowHour = false, glowMinute = false }) {
  const cx = size / 2, cy = size / 2
  const r  = size / 2 - Math.max(4, size * 0.025)

  const toRad = (deg) => (deg * Math.PI) / 180

  const hourAngle   = ((hour % 12) + minute / 60) * 30 - 90
  const minuteAngle = minute * 6 - 90

  const hourLen   = r * 0.55
  const minuteLen = r * 0.8

  const hourX   = cx + hourLen   * Math.cos(toRad(hourAngle))
  const hourY   = cy + hourLen   * Math.sin(toRad(hourAngle))
  const minuteX = cx + minuteLen * Math.cos(toRad(minuteAngle))
  const minuteY = cy + minuteLen * Math.sin(toRad(minuteAngle))

  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    const angle = n * 30 - 90
    const nr = r * 0.82
    return { n, x: cx + nr * Math.cos(toRad(angle)), y: cy + nr * Math.sin(toRad(angle)) }
  })

  const tickStroke = Math.max(0.5, size * 0.006)
  const thickStroke = Math.max(1.5, size * 0.012)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#FFF9E6" stroke="#C4550F" strokeWidth={Math.max(2, size * 0.02)} />

      {Array.from({ length: 60 }, (_, i) => {
        const angle = i * 6 - 90
        const inner = r * (i % 5 === 0 ? 0.88 : 0.93)
        const outer = r * 0.97
        return (
          <line
            key={i}
            x1={cx + inner * Math.cos(toRad(angle))} y1={cy + inner * Math.sin(toRad(angle))}
            x2={cx + outer * Math.cos(toRad(angle))} y2={cy + outer * Math.sin(toRad(angle))}
            stroke={i % 5 === 0 ? '#8B4513' : '#CCC'}
            strokeWidth={i % 5 === 0 ? thickStroke : tickStroke}
          />
        )
      })}

      {numbers.map(({ n, x, y }) => (
        <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(8, size * 0.075)} fontWeight="bold" fill="#5D3A1A"
          fontFamily="OpenDyslexic, sans-serif">
          {n}
        </text>
      ))}

      {/* Minuutwijzer (groot, dun — blauw als gemarkeerd) */}
      <line
        x1={cx} y1={cy} x2={minuteX} y2={minuteY}
        stroke={glowMinute ? '#1565C0' : '#C4550F'}
        strokeWidth={glowMinute ? size * 0.038 : size * 0.022}
        strokeLinecap="round"
        style={{ transition: 'all 0.7s ease' }}
      />

      {/* Uurwijzer (klein, dik — rood als gemarkeerd) */}
      <line
        x1={cx} y1={cy} x2={hourX} y2={hourY}
        stroke={glowHour ? '#C62828' : '#3E2009'}
        strokeWidth={glowHour ? size * 0.065 : size * 0.04}
        strokeLinecap="round"
        style={{ transition: 'all 0.7s ease' }}
      />

      <circle cx={cx} cy={cy} r={Math.max(3, size * 0.04)} fill="#C4550F" />
    </svg>
  )
}

// ---- Wijzer-hint strip (altijd zichtbaar tijdens spel) ----
function WijzerHint() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '0.4rem 0' }}>
      <span style={{ ...font, fontSize: '0.72rem', color: '#B71C1C', background: '#FFEBEE', borderRadius: '2rem', padding: '0.15rem 0.55rem' }}>
        ● klein = uren
      </span>
      <span style={{ ...font, fontSize: '0.72rem', color: '#0D47A1', background: '#E3F2FD', borderRadius: '2rem', padding: '0.15rem 0.55rem' }}>
        ● groot = minuten
      </span>
    </div>
  )
}

// ---- Uitgebreide intro (4 stappen) ----
const INTRO_STEPS = [
  {
    title: 'Dit is een klok! 🕐',
    hour: 12, minute: 0,
    glowHour: false, glowMinute: false,
    text: 'Met een klok zie je hoe laat het is. Op de klok staan de cijfers 1 tot 12.',
    speechId: 'klok-intro-1',
    speechText: 'Kijk, dit is een klok! Op de klok staan de cijfers 1 tot 12.',
  },
  {
    title: '🔴 De kleine wijzer',
    hour: 3, minute: 0,
    glowHour: true, glowMinute: false,
    text: 'De kleine dikke rode wijzer wijst de uren. Kijk, hij wijst naar 3. Het is 3 uur!',
    speechId: 'klok-intro-klein',
    speechText: 'De kleine dikke rode wijzer wijst de uren. Hij wijst naar 3. Het is 3 uur!',
    badge: { color: '#C62828', bg: '#FFEBEE', text: '🔴  kleine wijzer = uren' },
  },
  {
    title: '🔵 De grote wijzer',
    hour: 9, minute: 0,
    glowHour: false, glowMinute: true,
    text: 'De grote dunne blauwe wijzer wijst de minuten. Bij hele uren staat hij altijd op de 12!',
    speechId: 'klok-intro-groot',
    speechText: 'De grote dunne blauwe wijzer wijst de minuten. Bij hele uren staat hij altijd op de 12.',
    badge: { color: '#0D47A1', bg: '#E3F2FD', text: '🔵  grote wijzer = minuten' },
  },
  {
    title: 'Hoe lees je de klok?',
    hour: 7, minute: 0,
    glowHour: false, glowMinute: false,
    text: 'Kijk naar de kleine wijzer. Hij wijst naar 7. De grote wijzer staat op 12. Het is 7 uur!',
    speechId: 'klok-intro-oefen',
    speechText: 'Kijk naar de kleine wijzer. Hij wijst naar 7. De grote wijzer staat op de 12. Het is 7 uur!',
    badge: { color: '#2E7D32', bg: '#E8F5E9', text: '✅  kleine wijzer → dat uur is het!' },
    isLast: true,
  },
]

function ClockIntroScreen({ onDone }) {
  const [step, setStep] = useState(0)
  const current = INTRO_STEPS[step]

  useEffect(() => {
    stopAll()
    const t = setTimeout(() => {
      speakItem(current.speechId, current.speechText)
    }, 300)
    return () => { clearTimeout(t); stopAll() }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => {
    if (current.isLast) { stopAll(); onDone() }
    else setStep(s => s + 1)
  }

  return (
    <div style={{
      height: '100%',
      background: '#E0F2F1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem 1.25rem',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Voortgang + overslaan */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {INTRO_STEPS.map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i <= step ? '#00796B' : '#B2DFDB',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <button
          onClick={() => { stopAll(); onDone() }}
          style={{ ...font, background: 'transparent', border: 'none', color: '#80CBC4', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Overslaan →
        </button>
      </div>

      {/* Titel */}
      <p style={{ ...font, fontSize: '1.3rem', fontWeight: 'bold', color: '#00574B', margin: '0 0 0.75rem', textAlign: 'center' }}>
        {current.title}
      </p>

      {/* Klok */}
      <AnalogClock
        hour={current.hour}
        minute={current.minute}
        size={190}
        glowHour={current.glowHour}
        glowMinute={current.glowMinute}
      />

      {/* Badge */}
      {current.badge && (
        <div style={{
          marginTop: '0.6rem',
          background: current.badge.bg,
          border: `2px solid ${current.badge.color}`,
          borderRadius: '1.5rem',
          padding: '0.4rem 1rem',
        }}>
          <span style={{ ...font, fontSize: '0.9rem', color: current.badge.color, fontWeight: 'bold' }}>
            {current.badge.text}
          </span>
        </div>
      )}

      {/* Uitleg tekst */}
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '0.9rem 1.25rem',
        margin: '0.75rem 0',
        maxWidth: 340,
        textAlign: 'center',
        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
      }}>
        <p style={{ ...font, color: '#5D3A1A', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
          {current.text}
        </p>
      </div>

      {/* Navigatie knoppen */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              ...font,
              background: 'white',
              border: '2px solid #B2DFDB',
              borderRadius: '2rem',
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              color: '#00574B',
              cursor: 'pointer',
            }}
          >
            ← Terug
          </button>
        )}
        <button
          onClick={goNext}
          style={{
            ...font,
            background: '#00796B',
            border: 'none',
            borderRadius: '2rem',
            padding: '0.8rem 2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,121,107,0.35)',
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {current.isLast ? 'Oefenen! →' : 'Volgende →'}
        </button>
      </div>
    </div>
  )
}

// ---- Tijden genereren ----
function generateTime(phase) {
  const maxHour = phase === 1 ? 6 : 12
  const hour = Math.floor(Math.random() * maxHour) + 1
  const minute = phase >= 3 ? (Math.random() < 0.5 ? 0 : 30) : 0
  return { hour, minute }
}

function timeLabel(hour, minute) {
  if (minute === 0) return `${hour} uur`
  return `half ${hour + 1 > 12 ? 1 : hour + 1}`
}

function generateOptions(correct, phase) {
  const maxHour = phase === 1 ? 6 : 12
  const opts = [correct]
  let attempts = 0
  while (opts.length < 3 && attempts < 60) {
    attempts++
    const h = Math.floor(Math.random() * maxHour) + 1
    const m = phase >= 3 ? (Math.random() < 0.5 ? 0 : 30) : 0
    const isDup = opts.some(o => o.hour === h && o.minute === m)
    if (!isDup) opts.push({ hour: h, minute: m })
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return opts
}

// ---- Hoofd-spel ----
export default function KlokGame({ savedProgress, onProgressUpdate, onBack }) {
  const introSeen = savedProgress?.clock_intro_seen ?? false

  const [showIntro, setShowIntro] = useState(!introSeen)

  // words_visible = 3 → nieuw 3-fase schema. null/anders → oud schema (fase 1 of 2).
  const [phase, setPhase] = useState(() => {
    const saved = savedProgress?.current_level ?? 1
    const isOldScheme = !savedProgress || (savedProgress.words_visible ?? 0) < 3
    if (isOldScheme) {
      // Oud: fase 1 (hele uren) → nieuw fase 2, oud fase 2 (halve uren) → nieuw fase 3
      return Math.min(saved + 1, 3)
    }
    return Math.min(Math.max(saved, 1), 3)
  })

  const phaseRef = useRef(phase)
  useEffect(() => { phaseRef.current = phase }, [phase])

  // Bewaar hoeveel correct in huidige fase (voor fase-overgang, niet op rij)
  const [phaseCorrect, setPhaseCorrect]     = useState(0)
  const [consecutiveCorrect, setCC]         = useState(() => savedProgress?.consecutive_correct ?? 0)
  const [totalStars, setTotalStars]         = useState(() => savedProgress?.total_stars ?? 0)
  const [sessionStars, setSessionStars]     = useState(0)
  const [samiState, setSamiState]           = useState('idle')

  const [currentTime, setCurrentTime]       = useState(null)
  const [options, setOptions]               = useState([])
  const [selectedOpt, setSelectedOpt]       = useState(null)
  const [answerResult, setAnswerResult]     = useState(null)
  const [feedbackLabel, setFeedbackLabel]   = useState('')
  const lastTimeRef = useRef(null)

  const handleIntroDone = () => {
    stopAll()
    setShowIntro(false)
    onProgressUpdate?.({ clock_intro_seen: true, words_visible: 3 })
  }

  const nextQuestion = useCallback(() => {
    const p = phaseRef.current
    let time, tries = 0
    do {
      time = generateTime(p)
      tries++
    } while (
      tries < 10 &&
      lastTimeRef.current &&
      time.hour === lastTimeRef.current.hour &&
      time.minute === lastTimeRef.current.minute
    )
    lastTimeRef.current = time
    const opts = generateOptions(time, p)
    debugLog('KlokGame vraag', `${timeLabel(time.hour, time.minute)} (fase ${p})`)

    setCurrentTime(time)
    setOptions(opts)
    setSelectedOpt(null)
    setAnswerResult(null)
    setFeedbackLabel('')
    setSamiState('thinking')

    setTimeout(() => {
      setSamiState('idle')
      speakItem('klok-vraag', 'Hoe laat is het?')
    }, 400)
  }, [])

  useEffect(() => {
    if (!showIntro) {
      const t = setTimeout(nextQuestion, 0)
      return () => { clearTimeout(t); stopAll() }
    }
    return () => stopAll()
  }, [showIntro]) // eslint-disable-line react-hooks/exhaustive-deps

  const halfIntroShownRef = useRef(false)
  useEffect(() => {
    if (phase === 3 && !halfIntroShownRef.current) {
      halfIntroShownRef.current = true
      speakItem('klok-half', 'Nu leren we ook de halve uren!')
    }
  }, [phase])

  const handleSamiPress = () => {
    stopAll()
    speakItem('uitleg-klok', 'Kijk goed naar de klok! De kleine rode wijzer wijst de uren. De grote blauwe wijzer staat bij hele uren op de 12.')
    setSamiState('happy')
    setTimeout(() => setSamiState('idle'), 2000)
  }

  const handleAnswer = (opt) => {
    if (answerResult) return
    stopAll()
    playClick()
    setSelectedOpt(opt)

    const correct = opt.hour === currentTime.hour && opt.minute === currentTime.minute

    if (correct) {
      debugLog('KlokGame antwoord', `correct: ${timeLabel(opt.hour, opt.minute)}`)
      setSamiState('happy')
      setAnswerResult('correct')

      const newCC = consecutiveCorrect + 1
      setCC(newCC)
      const newPhaseCorrect = phaseCorrect + 1
      setPhaseCorrect(newPhaseCorrect)

      let newStars = totalStars
      let newPhase = phase

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

      // Fase omhoog?
      const threshold = PHASE_THRESHOLD[phase]
      if (newPhaseCorrect >= threshold && phase < 3) {
        newPhase = phase + 1
        setPhase(newPhase)
        setPhaseCorrect(0)
        debugLog('Level', `klok fase ${phase} → fase ${newPhase}`)
      }

      setFeedbackLabel(`✓ Het is ${timeLabel(currentTime.hour, currentTime.minute)}!`)
      speakItem('klok-goed', 'Dat klopt!')
      onProgressUpdate?.({
        current_level: newPhase,
        total_stars: newStars,
        consecutive_correct: newCC,
        consecutive_wrong: 0,
        clock_intro_seen: true,
        words_visible: 3,
      })
      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 1500)

    } else {
      debugLog('KlokGame antwoord', `fout: ${timeLabel(opt.hour, opt.minute)}, correct: ${timeLabel(currentTime.hour, currentTime.minute)}`)
      setSamiState('sad')
      setAnswerResult('wrong')
      playWrong()
      setCC(0)
      setPhaseCorrect(Math.max(0, phaseCorrect - 1))

      setFeedbackLabel(`Het is ${timeLabel(currentTime.hour, currentTime.minute)}`)
      speakItem('klok-fout', 'Dat klopt niet, probeer het nog eens!')
      onProgressUpdate?.({
        current_level: phase,
        total_stars: totalStars,
        consecutive_correct: 0,
        consecutive_wrong: 1,
        clock_intro_seen: true,
        words_visible: 3,
      })
      setTimeout(() => { setSamiState('idle'); nextQuestion() }, 2000)
    }
  }

  if (showIntro) {
    return <ClockIntroScreen onDone={handleIntroDone} />
  }

  return (
    <div style={{
      height: '100%',
      background: '#E0F2F1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <button
          onClick={() => { stopAll(); onBack() }}
          style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '1rem', padding: '0.4rem 0.9rem', cursor: 'pointer', ...font, color: '#555' }}
        >
          ← Terug
        </button>
        <span style={{ ...font, fontSize: '0.85rem', color: '#00574B', fontWeight: 'bold' }}>
          {PHASE_LABELS[phase]}
        </span>
        <span style={{ ...font, fontSize: '1rem', color: '#00574B' }}>⭐ {sessionStars}</span>
      </div>

      {/* Vraag */}
      <p style={{ ...font, fontSize: '1.2rem', color: '#00574B', fontWeight: 'bold', margin: '0.25rem 0' }}>
        Hoe laat is het?
      </p>

      {/* Grote klok */}
      {currentTime && (
        <AnalogClock hour={currentTime.hour} minute={currentTime.minute} size={200} />
      )}

      {/* Wijzer-hint */}
      <WijzerHint />

      {/* Feedback label */}
      <div style={{ height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {feedbackLabel && (
          <span style={{
            ...font,
            fontSize: '1rem',
            fontWeight: 'bold',
            color: answerResult === 'correct' ? '#2E7D32' : '#B71C1C',
          }}>
            {feedbackLabel}
          </span>
        )}
      </div>

      {/* Mini-klok antwoord knoppen */}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: '4rem' }}>
        {options.map((opt, i) => {
          const isCorrect  = currentTime && opt.hour === currentTime.hour && opt.minute === currentTime.minute
          const isSelected = selectedOpt  && selectedOpt.hour === opt.hour  && selectedOpt.minute === opt.minute

          let border = '3px solid #B2DFDB'
          let bg = 'white'
          let shadow = '0 3px 10px rgba(0,0,0,0.08)'
          if (answerResult && isCorrect)               { bg = '#E8F5E9'; border = '3px solid #4CAF50'; shadow = '0 0 0 4px #A5D6A7' }
          else if (answerResult && isSelected && !isCorrect) { bg = '#FFEBEE'; border = '3px solid #F44336' }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!answerResult}
              style={{
                background: bg,
                border,
                borderRadius: '1.25rem',
                padding: '0.4rem',
                cursor: answerResult ? 'default' : 'pointer',
                boxShadow: shadow,
                transition: 'transform 0.1s, box-shadow 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.93)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { if (!answerResult) e.currentTarget.style.transform = 'scale(0.93)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <AnalogClock hour={opt.hour} minute={opt.minute} size={95} />
            </button>
          )
        })}
      </div>

      {/* Sami rechtsonder */}
      <div
        style={{ position: 'fixed', bottom: 16, right: 16, cursor: 'pointer', textAlign: 'center' }}
        onClick={handleSamiPress}
      >
        <Salamander state={samiState} size="sm" />
        <div style={{ color: '#555', fontSize: '0.65rem', marginTop: 2, ...font }}>❓ uitleg</div>
      </div>
    </div>
  )
}
