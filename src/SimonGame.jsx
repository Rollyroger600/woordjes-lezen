// ============================================================
// SimonGame.jsx — Module 5: Kleurenreeks (Simon Says)
// Reeks licht op → kind herhaalt → reeks groeit.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import Salamander from './Salamander'
import { speakItem, stopAll } from './speech'
import { playTone, playCorrect, playWrong, playStar, playCombo, playClick } from './sounds'
import { debugLog } from './debugLogger'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

const ALL_COLORS = [
  { id: 'blauw', label: 'Blauw',  bg: '#1565C0', light: '#42A5F5', freq: 261 },
  { id: 'rood',  label: 'Rood',   bg: '#C62828', light: '#EF5350', freq: 329 },
  { id: 'groen', label: 'Groen',  bg: '#2E7D32', light: '#66BB6A', freq: 392 },
  { id: 'geel',  label: 'Geel',   bg: '#F57F17', light: '#FFEE58', freq: 523 },
]

function randomColor(numColors) {
  return ALL_COLORS[Math.floor(Math.random() * numColors)]
}

export default function SimonGame({ savedProgress, onProgressUpdate, onBack }) {
  const [numColors, setNumColors]         = useState(() => savedProgress?.words_visible ?? 2)
  const [highscore, setHighscore]         = useState(() => savedProgress?.simon_highscore ?? 0)
  const [totalStars, setTotalStars]       = useState(() => savedProgress?.total_stars ?? 0)
  const [consecutiveWrong, setConsecutiveWrong] = useState(0)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)

  const [samiStateVal, setSamiStateVal]   = useState('idle')
  const [comboText, setComboText]         = useState(null)

  const [sequence, setSequence]           = useState([])
  const [phase, setPhase]                 = useState('intro')
  const [litColor, setLitColor]           = useState(null)
  const [inputIndex, setInputIndex]       = useState(0)
  const [sessionStars, setSessionStars]   = useState(0)
  const [errorAnim, setErrorAnim]         = useState(false)

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const colors = ALL_COLORS.slice(0, numColors)

  const showCombo = (text) => {
    setComboText(text)
    setTimeout(() => setComboText(null), 1500)
  }

  // ---- Uitleg herhalen via Sami ----
  const handleSamiPress = () => {
    stopAll()
    speakItem('uitleg-reeks', 'Kijk welke kleuren oplichten! Onthoud de volgorde en doe de reeks daarna zelf na!')
    setSamiStateVal('happy')
    setTimeout(() => setSamiStateVal('idle'), 2000)
  }

  // ---- Speel de reeks af ----
  // Gebruik gedeelde AudioContext via sounds.js → geen suspend-problemen
  const playSequence = useCallback((seq) => {
    setPhase('playing')
    setSamiStateVal('thinking')
    stopAll()

    speakItem('reeks-kijk', 'Kijk goed...', {
      onEnd: () => {
        let i = 0
        function showNext() {
          if (i >= seq.length) {
            setLitColor(null)
            setTimeout(() => {
              setInputIndex(0)
              setPhase('input')
              setSamiStateVal('idle')
              speakItem('reeks-jij', 'Nu jij!')
            }, 300)
            return
          }
          const color = ALL_COLORS.find(c => c.id === seq[i])
          setLitColor(color.id)
          playTone(color.freq, 450)   // ← gedeelde context, werkt altijd
          setTimeout(() => {
            setLitColor(null)
            i++
            setTimeout(showNext, 200)
          }, 500)
        }
        setTimeout(showNext, 400)
      },
    })
  }, [])

  // ---- Start nieuwe ronde ----
  const startRound = useCallback((prevSeq, prevNumColors) => {
    const nc = prevNumColors ?? numColors
    const newSeq = [...(prevSeq ?? []), randomColor(nc).id]
    debugLog('SimonGame ronde', `reeks lengte ${newSeq.length}, ${nc} kleuren`)
    setSequence(newSeq)
    setInputIndex(0)
    setTimeout(() => playSequence(newSeq), 600)
  }, [numColors, playSequence])

  useEffect(() => {
    stopAll()
    speakItem('reeks-intro', 'Doe de reeks na!', {
      onEnd: () => startRound([], numColors),
    })
    return () => stopAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Kind tikt een kleur ----
  const handleColorPress = (colorId) => {
    if (phase !== 'input') return

    const color = ALL_COLORS.find(c => c.id === colorId)
    setLitColor(colorId)
    playTone(color.freq, 300)
    playClick()
    setTimeout(() => setLitColor(null), 300)

    const expected = sequence[inputIndex]
    if (colorId === expected) {
      const nextIndex = inputIndex + 1
      if (nextIndex >= sequence.length) {
        // Hele reeks goed!
        debugLog('SimonGame antwoord', `correct — reeks van ${sequence.length}`)
        const newCC = consecutiveCorrect + 1
        setConsecutiveCorrect(newCC)
        setConsecutiveWrong(0)

        let newNumColors = numColors
        let newStars = totalStars
        const newHighscore = Math.max(highscore, sequence.length)

        // Combo feedback
        if (newCC > 0 && newCC % 3 === 0) {
          playCombo()
          showCombo('🔥 Super!')
          setSamiStateVal('celebrating')
        } else {
          playCorrect()
          setSamiStateVal('happy')
        }

        // Ster elke 5 goed
        if (sequence.length > 0 && sequence.length % 5 === 0) {
          newStars = totalStars + 1
          setTotalStars(newStars)
          setSessionStars(s => s + 1)
          playStar()
          setSamiStateVal('celebrating')
          debugLog('Sami state', 'celebrating')
        }

        // Meer kleuren na reeks van 5 (max 4)
        if (sequence.length >= 5 && newNumColors < 4) {
          newNumColors = numColors + 1
          setNumColors(newNumColors)
          debugLog('SimonGame kleuren', `${numColors} → ${newNumColors}`)
          speakItem('reeks-goed', 'Helemaal goed!', {
            onEnd: () => speakItem('reeks-nieuw', 'Er komt een nieuwe kleur bij!'),
          })
        } else {
          speakItem('reeks-goed', 'Helemaal goed!')
        }

        if (newHighscore > highscore) setHighscore(newHighscore)
        onProgressUpdate?.({
          total_stars: newStars,
          words_visible: newNumColors,
          simon_highscore: newHighscore,
          consecutive_wrong: 0,
        })

        setPhase('feedback')
        setTimeout(() => {
          setSamiStateVal('idle')
          startRound(sequence, newNumColors)
        }, 1200)
      } else {
        setInputIndex(nextIndex)
      }
    } else {
      debugLog('SimonGame antwoord', `fout — verwacht: ${expected}, gekozen: ${colorId}`)
      playWrong()
      setSamiStateVal('sad')
      setErrorAnim(true)
      setConsecutiveCorrect(0)
      setTimeout(() => setErrorAnim(false), 600)

      const newWrong = consecutiveWrong + 1
      setConsecutiveWrong(newWrong)

      let newSeq = sequence
      if (newWrong >= 2 && sequence.length > 2) {
        newSeq = sequence.slice(0, sequence.length - 1)
      }

      speakItem('sami-probeer', 'Probeer het nog eens!')
      onProgressUpdate?.({
        total_stars: totalStars,
        words_visible: numColors,
        simon_highscore: highscore,
        consecutive_wrong: newWrong,
      })

      setPhase('feedback')
      setTimeout(() => {
        setSamiStateVal('idle')
        setSequence(newSeq)
        setTimeout(() => playSequence(newSeq), 400)
      }, 1200)
    }
  }

  const getGridStyle = () => {
    if (numColors <= 2) return { display: 'flex', gap: '1rem', justifyContent: 'center' }
    if (numColors === 3) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: '0.75rem',
      maxWidth: 320,
    }
    return { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxWidth: 320 }
  }

  const btnSize = numColors <= 2 ? 150 : 140

  return (
    <div style={{
      minHeight: '100%',
      background: '#1A237E',
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
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '1rem', padding: '0.4rem 0.9rem', cursor: 'pointer', ...font, color: 'white' }}
        >
          ← Terug
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ ...font, color: 'white', fontSize: '0.85rem', margin: 0 }}>Reeks van</p>
          <p style={{ ...font, color: '#FFEE58', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            {sequence.length}
          </p>
        </div>
        <span style={{ ...font, fontSize: '1rem', color: '#FFEE58' }}>⭐ {sessionStars}</span>
      </div>

      {/* Highscore */}
      {highscore > 0 && (
        <p style={{ ...font, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
          Beste reeks: {highscore}
        </p>
      )}

      {/* Fase-label + combo */}
      <div style={{ minHeight: '2.5em', textAlign: 'center', marginBottom: '0.75rem' }}>
        {comboText && (
          <p style={{ ...font, color: '#FFEE58', fontSize: '1.4rem', fontWeight: 'bold', margin: 0, animation: 'pop 0.3s ease' }}>
            {comboText}
          </p>
        )}
        {!comboText && (
          <p style={{ ...font, color: 'rgba(255,255,255,0.8)', fontSize: '1rem', margin: 0 }}>
            {phase === 'playing' && '👀 Kijk goed...'}
            {phase === 'input'   && '👆 Nu jij!'}
          </p>
        )}
      </div>

      {/* Kleuren-blokken */}
      <div style={getGridStyle()}>
        {colors.map((color, i) => {
          const isLit = litColor === color.id
          const extraStyle = numColors === 3 && i === 2
            ? { gridColumn: '1 / -1', justifySelf: 'center' }
            : {}
          return (
            <button
              key={color.id}
              onClick={() => handleColorPress(color.id)}
              disabled={phase !== 'input'}
              style={{
                width: btnSize,
                height: btnSize,
                borderRadius: '1.5rem',
                background: isLit ? color.light : color.bg,
                border: isLit ? `4px solid white` : '4px solid transparent',
                cursor: phase === 'input' ? 'pointer' : 'default',
                transform: isLit ? 'scale(1.08)' : errorAnim ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.1s, background 0.08s, box-shadow 0.08s',
                boxShadow: isLit
                  ? `0 0 35px ${color.light}, 0 0 70px ${color.light}80`
                  : '0 4px 15px rgba(0,0,0,0.3)',
                ...extraStyle,
              }}
            />
          )
        })}
      </div>

      {/* Sami rechtsonder — klikbaar voor uitleg */}
      <div
        style={{ position: 'fixed', bottom: 16, right: 16, cursor: 'pointer' }}
        onClick={handleSamiPress}
        title="Tik op Sami voor uitleg"
      >
        <Salamander state={samiStateVal} size="sm" />
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', marginTop: 2, ...font }}>
          ❓ uitleg
        </div>
      </div>
    </div>
  )
}
