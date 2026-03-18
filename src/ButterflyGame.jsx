import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { speakItem } from './speech'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }
const TOTAL = 5
const TIME_LIMIT = 15

function makeButterfly(id) {
  return {
    id,
    top: 10 + Math.random() * 65,
    duration: 8 + Math.random() * 6,   // 8–14 seconds to cross — slow enough to tap
    delay: Math.random() * 4,
    reverse: Math.random() < 0.5,
    size: 52 + Math.floor(Math.random() * 20),
  }
}

export default function ButterflyGame({ onFinish, onBack }) {
  const [phase, setPhase] = useState('intro') // 'intro' | 'game' | 'done'
  const [countdown, setCountdown] = useState(3)
  const [butterflies] = useState(() => Array.from({ length: TOTAL }, (_, i) => makeButterfly(i)))
  const [caught, setCaught] = useState(new Set())
  const [caughtCount, setCaughtCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef(null)
  const doneRef = useRef(false)

  // Intro phase: speak instruction + countdown
  useEffect(() => {
    if (phase !== 'intro') return
    speakItem('instr-vlinders', 'Tik de vlinders zo snel mogelijk!')

    let count = 3
    const interval = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(interval)
        setPhase('game')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Game phase: countdown timer
  useEffect(() => {
    if (phase !== 'game') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          if (!doneRef.current) {
            doneRef.current = true
            setPhase('done')
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  function catchButterfly(id) {
    if (caught.has(id) || doneRef.current || phase !== 'game') return
    if (navigator.vibrate) navigator.vibrate(25)

    setCaught(prev => {
      const next = new Set([...prev, id])
      const count = next.size
      setCaughtCount(count)
      if (count === TOTAL) {
        clearInterval(timerRef.current)
        doneRef.current = true
        confetti({
          particleCount: 180,
          spread: 110,
          origin: { y: 0.5 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94'],
        })
        setTimeout(() => setPhase('done'), 1000)
      }
      return next
    })
  }

  // ---- Intro screen ----
  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        <div className="text-8xl mb-6 animate-pulse-gentle">🦋</div>
        <h2 className="text-white text-2xl font-bold text-center mb-3" style={font}>
          Tik de vlinders!
        </h2>
        <p className="text-white/70 text-base text-center mb-10" style={font}>
          Tik zo snel mogelijk op alle vlinders
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

  // ---- Done screen ----
  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        <div className="text-7xl mb-4">
          {caughtCount === TOTAL ? '🏆' : '🎉'}
        </div>
        <h2 className="text-white text-2xl font-bold text-center mb-2" style={font}>
          {caughtCount === TOTAL
            ? 'Alle vlinders gevangen!'
            : `${caughtCount} van ${TOTAL} gevangen!`}
        </h2>
        <p className="text-white/70 text-base mb-8 text-center" style={font}>
          {caughtCount === TOTAL ? 'Geweldig! 🌟' : 'Goed gedaan! 🌟'}
        </p>
        <button
          onClick={onFinish}
          className="animate-pulse-gentle bg-white text-purple-700 font-bold py-5 px-12 rounded-3xl text-xl shadow-lg active:scale-95 transition-transform"
          style={font}
        >
          Verder spelen! ▶
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 bg-white/20 text-white font-bold py-3 px-8 rounded-2xl active:scale-95 transition-transform"
            style={font}
          >
            🏠 Ander spelletje
          </button>
        )}
      </div>
    )
  }

  // ---- Game screen ----
  return (
    <div className="h-full flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <div>
          <span className="text-white font-bold text-lg" style={font}>Tik de vlinders! 🦋</span>
          <div className="text-white/60 text-sm" style={font}>
            {caughtCount}/{TOTAL} gevangen
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2">
          <span className="text-xl">⏱</span>
          <span
            className={`font-bold text-xl ${timeLeft <= 5 ? 'text-red-300' : 'text-white'}`}
            style={font}
          >
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pb-2 flex-shrink-0">
        {Array.from({ length: TOTAL }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < caughtCount ? 'bg-yellow-300 scale-125' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Play area */}
      <div className="flex-1 relative overflow-hidden">
        {butterflies.map(b => (
          !caught.has(b.id) && (
            <button
              key={b.id}
              onClick={() => catchButterfly(b.id)}
              className="absolute cursor-pointer border-0 bg-transparent p-2 leading-none active:scale-125 transition-transform duration-75"
              style={{
                top: `${b.top}%`,
                fontSize: `${b.size}px`,
                animation: `butterfly-fly ${b.duration}s linear ${b.delay}s infinite`,
                ...(b.reverse && {
                  transform: 'scaleX(-1)',
                  animation: `butterfly-fly ${b.duration}s linear ${b.delay}s infinite reverse`,
                }),
              }}
            >
              🦋
            </button>
          )
        ))}
      </div>
    </div>
  )
}
