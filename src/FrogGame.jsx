import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { speakItem } from './speech'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }
const TOTAL = 6
const TIME_LIMIT = 18

// Lily pad positions (percentage based)
const PADS = [
  { x: 12, y: 20 }, { x: 55, y: 15 }, { x: 82, y: 25 },
  { x: 25, y: 50 }, { x: 60, y: 48 }, { x: 88, y: 55 },
  { x: 10, y: 75 }, { x: 45, y: 78 }, { x: 75, y: 80 },
]

function pickRandomPad(exclude) {
  const available = PADS.filter((_, i) => i !== exclude)
  const idx = Math.floor(Math.random() * available.length)
  return PADS.indexOf(available[idx])
}

export default function FrogGame({ onFinish, onBack }) {
  const [phase, setPhase] = useState('intro')
  const [countdown, setCountdown] = useState(3)
  const [caught, setCaught] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [frogs, setFrogs] = useState([])
  const timerRef = useRef(null)
  const jumpRef = useRef(null)
  const doneRef = useRef(false)

  // Create frogs with initial positions
  const initFrogs = useCallback(() => {
    const f = []
    const usedPads = new Set()
    for (let i = 0; i < 3; i++) {
      let pad
      do { pad = Math.floor(Math.random() * PADS.length) } while (usedPads.has(pad))
      usedPads.add(pad)
      f.push({ id: i, pad, visible: true, jumping: false })
    }
    return f
  }, [])

  // Intro
  useEffect(() => {
    if (phase !== 'intro') return
    speakItem('instr-kikkers', 'Tik op de kikkers! Zo snel mogelijk!')
    let count = 3
    const interval = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(interval)
        setFrogs(initFrogs())
        setPhase('game')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, initFrogs])

  // Game timer
  useEffect(() => {
    if (phase !== 'game') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          if (!doneRef.current) { doneRef.current = true; setPhase('done') }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  // Frogs jump every 2-3 seconds
  useEffect(() => {
    if (phase !== 'game') return
    const jump = () => {
      setFrogs(prev => prev.map(f => {
        if (!f.visible) return f
        if (Math.random() < 0.4) return f // 60% chance to jump
        const newPad = pickRandomPad(f.pad)
        return { ...f, pad: newPad, jumping: true }
      }))
      // Reset jumping flag after animation
      setTimeout(() => {
        setFrogs(prev => prev.map(f => ({ ...f, jumping: false })))
      }, 400)
    }
    jumpRef.current = setInterval(jump, 2000 + Math.random() * 1000)
    return () => clearInterval(jumpRef.current)
  }, [phase])

  function catchFrog(id) {
    if (doneRef.current || phase !== 'game') return
    if (navigator.vibrate) navigator.vibrate(25)

    setFrogs(prev => {
      const next = prev.map(f => f.id === id ? { ...f, visible: false } : f)
      const newCaught = next.filter(f => !f.visible).length
      setCaught(newCaught)

      if (newCaught >= TOTAL) {
        clearInterval(timerRef.current)
        clearInterval(jumpRef.current)
        doneRef.current = true
        confetti({
          particleCount: 180, spread: 110, origin: { y: 0.5 },
          colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFE66D'],
        })
        setTimeout(() => setPhase('done'), 1000)
      } else if (newCaught % 3 === 0) {
        // Spawn new batch of frogs
        const usedPads = new Set(next.filter(f => f.visible).map(f => f.pad))
        const newFrogs = []
        const remaining = TOTAL - newCaught
        const toSpawn = Math.min(3, remaining)
        for (let i = 0; i < toSpawn; i++) {
          let pad
          do { pad = Math.floor(Math.random() * PADS.length) } while (usedPads.has(pad))
          usedPads.add(pad)
          newFrogs.push({ id: Date.now() + i, pad, visible: true, jumping: false })
        }
        return [...next, ...newFrogs]
      }
      return next
    })
  }

  // Intro
  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        <div className="text-8xl mb-6 animate-pulse-gentle">🐸</div>
        <h2 className="text-white text-2xl font-bold text-center mb-3" style={font}>
          Vang de kikkers!
        </h2>
        <p className="text-white/70 text-base text-center mb-10" style={font}>
          Tik op de kikkers voordat ze wegspringen
        </p>
        <div
          className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center"
          style={{ border: '4px solid rgba(255,255,255,0.5)' }}
        >
          <span className="text-white font-bold" style={{ ...font, fontSize: '4rem' }}>
            {countdown}
          </span>
        </div>
      </div>
    )
  }

  // Done
  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        <div className="text-7xl mb-4">{caught >= TOTAL ? '🏆' : '🐸'}</div>
        <h2 className="text-white text-2xl font-bold text-center mb-2" style={font}>
          {caught >= TOTAL ? 'Alle kikkers gevangen!' : `${caught} van ${TOTAL} gevangen!`}
        </h2>
        <p className="text-white/70 text-base mb-8 text-center" style={font}>
          {caught >= TOTAL ? 'Geweldig! 🌟' : 'Goed gedaan! 🌟'}
        </p>
        <button
          onClick={onFinish}
          className="animate-pulse-gentle bg-white text-purple-700 font-bold py-5 px-12 rounded-3xl text-xl shadow-lg active:scale-95 transition-transform"
          style={font}
        >
          Verder spelen! ▶
        </button>
        {onBack && (
          <button onClick={onBack} className="mt-4 bg-white/20 text-white font-bold py-3 px-8 rounded-2xl active:scale-95 transition-transform" style={font}>
            🏠 Ander spelletje
          </button>
        )}
      </div>
    )
  }

  // Game
  return (
    <div className="h-full flex flex-col select-none overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <div>
          <span className="text-white font-bold text-lg" style={font}>Vang de kikkers! 🐸</span>
          <div className="text-white/60 text-sm" style={font}>{caught}/{TOTAL} gevangen</div>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2">
          <span className="text-xl">⏱</span>
          <span className={`font-bold text-xl ${timeLeft <= 5 ? 'text-red-300' : 'text-white'}`} style={font}>
            {timeLeft}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-2 pb-2 flex-shrink-0">
        {Array.from({ length: TOTAL }, (_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < caught ? 'bg-green-300 scale-125' : 'bg-white/30'}`} />
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(76,175,80,0.15) 0%, rgba(76,175,80,0.3) 100%)' }}>
        {/* Lily pads */}
        {PADS.map((pad, i) => (
          <div
            key={`pad-${i}`}
            className="absolute"
            style={{
              left: `${pad.x - 6}%`,
              top: `${pad.y - 3}%`,
              fontSize: '48px',
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          >
            🍃
          </div>
        ))}

        {/* Frogs */}
        {frogs.filter(f => f.visible).map(f => {
          const pad = PADS[f.pad]
          return (
            <button
              key={f.id}
              onClick={() => catchFrog(f.id)}
              className="absolute cursor-pointer border-0 bg-transparent p-0 leading-none active:scale-125"
              style={{
                left: `${pad.x - 4}%`,
                top: `${pad.y - 4}%`,
                fontSize: '56px',
                transition: f.jumping ? 'none' : 'left 0.4s ease-out, top 0.4s ease-out',
                animation: f.jumping ? 'frog-jump 0.4s ease-out' : undefined,
                zIndex: 10,
              }}
            >
              🐸
            </button>
          )
        })}
      </div>
    </div>
  )
}
