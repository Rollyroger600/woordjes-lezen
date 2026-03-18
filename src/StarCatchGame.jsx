import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { speakItem } from './speech'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }
const TOTAL = 8
const TIME_LIMIT = 20

const ITEMS = ['⭐', '🌟', '💫', '✨']

let nextId = 0
function makeStar() {
  return {
    id: nextId++,
    x: 8 + Math.random() * 80,
    emoji: ITEMS[Math.floor(Math.random() * ITEMS.length)],
    duration: 4 + Math.random() * 3, // 4-7s to fall
    delay: Math.random() * 0.5,
    size: 40 + Math.floor(Math.random() * 24),
    caught: false,
  }
}

export default function StarCatchGame({ onFinish, onBack }) {
  const [phase, setPhase] = useState('intro')
  const [countdown, setCountdown] = useState(3)
  const [caught, setCaught] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [stars, setStars] = useState([])
  const timerRef = useRef(null)
  const spawnRef = useRef(null)
  const doneRef = useRef(false)

  // Intro
  useEffect(() => {
    if (phase !== 'intro') return
    speakItem('instr-sterren', 'Vang de sterren! Tik erop voordat ze vallen!')
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

  // Game timer
  useEffect(() => {
    if (phase !== 'game') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          clearInterval(spawnRef.current)
          if (!doneRef.current) { doneRef.current = true; setPhase('done') }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  // Spawn stars
  useEffect(() => {
    if (phase !== 'game') return
    // Initial batch
    setStars([makeStar(), makeStar(), makeStar()])
    // Spawn new ones periodically
    spawnRef.current = setInterval(() => {
      if (doneRef.current) return
      setStars(prev => {
        // Remove stars that have fallen (older than their duration + 1s buffer)
        const cleaned = prev.filter(s => s.caught || Date.now() - (s.spawnTime || 0) < (s.duration + 1) * 1000)
        return [...cleaned, { ...makeStar(), spawnTime: Date.now() }]
      })
    }, 1200)
    return () => clearInterval(spawnRef.current)
  }, [phase])

  function catchStar(id) {
    if (doneRef.current || phase !== 'game') return
    if (navigator.vibrate) navigator.vibrate(25)

    setStars(prev => prev.map(s => s.id === id ? { ...s, caught: true } : s))
    setCaught(prev => {
      const next = prev + 1
      if (next >= TOTAL) {
        clearInterval(timerRef.current)
        clearInterval(spawnRef.current)
        doneRef.current = true
        confetti({
          particleCount: 180, spread: 110, origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FFE66D'],
        })
        setTimeout(() => setPhase('done'), 1000)
      }
      return next
    })
  }

  // Intro
  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        <div className="text-8xl mb-6 animate-pulse-gentle">⭐</div>
        <h2 className="text-white text-2xl font-bold text-center mb-3" style={font}>
          Vang de sterren!
        </h2>
        <p className="text-white/70 text-base text-center mb-10" style={font}>
          Tik op de sterren voordat ze naar beneden vallen
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
        <div className="text-7xl mb-4">{caught >= TOTAL ? '🏆' : '⭐'}</div>
        <h2 className="text-white text-2xl font-bold text-center mb-2" style={font}>
          {caught >= TOTAL ? 'Alle sterren gevangen!' : `${caught} van ${TOTAL} gevangen!`}
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
          <span className="text-white font-bold text-lg" style={font}>Vang de sterren! ⭐</span>
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
          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < caught ? 'bg-yellow-300 scale-125' : 'bg-white/30'}`} />
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(25,25,112,0.3) 0%, rgba(75,0,130,0.2) 100%)' }}>
        {stars.filter(s => !s.caught).map(s => (
          <button
            key={s.id}
            onClick={() => catchStar(s.id)}
            className="absolute cursor-pointer border-0 bg-transparent p-0 leading-none active:scale-150"
            style={{
              left: `${s.x}%`,
              fontSize: `${s.size}px`,
              animation: `star-fall ${s.duration}s linear ${s.delay}s forwards`,
              zIndex: 10,
            }}
          >
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
