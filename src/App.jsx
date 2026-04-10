import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { pickMiniGame } from './MiniGamePicker'
import { speakItem, speakWord } from './speech'

const LEVELS = [
  ['de', 'het', 'een'],
  ['de', 'het', 'een', 'en', 'is', 'in'],
  ['de', 'het', 'een', 'en', 'is', 'in', 'op', 'aan', 'of', 'bij', 'dit', 'dat', 'ik', 'je', 'wij'],
]

const WORD_COLORS = {
  de: '#FF6B6B', het: '#4ECDC4', een: '#FFE66D', en: '#A8E6CF',
  is: '#FF8B94', in: '#7EC8E3', op: '#C3AED6', aan: '#FFB347',
  of: '#87CEEB', bij: '#DDA0DD', dit: '#98D8C8', dat: '#F7DC6F',
  ik: '#F1948A', je: '#82E0AA', wij: '#AED6F1',
}

// Darker text colors for light backgrounds
const DARK_BG_WORDS = new Set(['een', 'en', 'of', 'dat', 'je', 'wij', 'dit'])

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWords(level, count, mustInclude) {
  const pool = LEVELS[level]
  const picked = new Set([mustInclude])
  const shuffled = shuffleArray(pool)
  for (const w of shuffled) {
    if (picked.size >= count) break
    picked.add(w)
  }
  return shuffleArray([...picked])
}

// How many levels to step back given days since last play
function warmupStepsBack(lastPlayedDate) {
  if (!lastPlayedDate) return 0
  const today = new Date().toISOString().split('T')[0]
  if (lastPlayedDate === today) return 0
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  return lastPlayedDate === yesterday ? 1 : 2
}


function App({ profile = null, savedProgress = null, onProgressUpdate = null, onBack = null }) {
  const [gameStarted, setGameStarted] = useState(false)
  const [level, setLevel] = useState(0)
  const [visibleCount, setVisibleCount] = useState(2)
  const [targetWord, setTargetWord] = useState('')
  const [displayWords, setDisplayWords] = useState([])
  const [streak, setStreak] = useState(0)
  const [errorStreak, setErrorStreak] = useState(0)
  const [stars, setStars] = useState(0)
  const [starProgress, setStarProgress] = useState(0)
  const [shakeWord, setShakeWord] = useState(null)
  const [popWord, setPopWord] = useState(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [newStar, setNewStar] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [allDone, setAllDone] = useState(false)

  // Blok van 10 vragen
  const [roundCount, setRoundCount] = useState(0)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [MiniGameComponent, setMiniGameComponent] = useState(null)
  const nextRoundAfterGameRef = useRef(null)

  const hintTimerRef = useRef(null)
  const hint2TimerRef = useRef(null)
  const interactionRef = useRef(false)

  const clearHintTimers = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    if (hint2TimerRef.current) clearTimeout(hint2TimerRef.current)
    hintTimerRef.current = null
    hint2TimerRef.current = null
  }, [])

  const startHintTimers = useCallback((word) => {
    clearHintTimers()
    setHintLevel(0)
    hintTimerRef.current = setTimeout(() => {
      setHintLevel(1)
      hint2TimerRef.current = setTimeout(() => {
        setHintLevel(2)
        speakWord(word)
      }, 5000)
    }, 5000)
  }, [clearHintTimers])

  const startNewRound = useCallback((lvl, count) => {
    const pool = LEVELS[lvl]
    const target = pool[Math.floor(Math.random() * pool.length)]
    const words = pickWords(lvl, count, target)
    setTargetWord(target)
    setDisplayWords(words)
    setHintLevel(0)
    setShakeWord(null)
    setPopWord(null)
    // Speak after a brief delay so the UI updates first
    setTimeout(() => {
      speakWord(target)
      startHintTimers(target)
    }, 300)
  }, [startHintTimers])

  // Preload voices
  useEffect(() => {
    window.speechSynthesis.getVoices()
    const onVoices = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', onVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      clearHintTimers()
    }
  }, [clearHintTimers])

  const handleStart = () => {
    // iOS Safari requires user interaction to unlock audio context
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
    } catch { /* ignore */ }

    // Laad voortgang uit savedProgress als beschikbaar
    let startLevel = savedProgress?.current_level ?? 0
    let startCount = savedProgress?.words_visible ?? 2
    const startStars = savedProgress?.total_stars ?? 0

    // Warmup: stap terug op basis van dagen sinds laatste sessie
    const lastPlayed = savedProgress?.updated_at?.split('T')[0] ?? null
    const steps = warmupStepsBack(lastPlayed)
    if (steps > 0 && startStars > 0) {
      startLevel = Math.max(0, startLevel - steps)
      startCount = 2
    }

    setGameStarted(true)
    setLevel(startLevel)
    setVisibleCount(startCount)
    setStreak(0)
    setErrorStreak(0)
    setStars(startStars)
    setStarProgress(0)
    setAllDone(false)
    setRoundCount(0)
    setShowMiniGame(false)

    setTimeout(() => {
      speakItem('instr-module1-start', 'Welk woord hoor je? Tik op het goede woord!', {
        onEnd: () => setTimeout(() => startNewRound(startLevel, startCount), 300),
      })
    }, 200)
  }

  const resetInteraction = () => {
    interactionRef.current = true
    clearHintTimers()
    setHintLevel(0)
    startHintTimers(targetWord)
  }

  const handleWordTap = (word) => {
    if (transitioning) return
    resetInteraction()

    if (word === targetWord) {
      // Correct!
      clearHintTimers()
      setPopWord(word)
      setTransitioning(true)

      // Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#7EC8E3'],
      })

      const newStreak = streak + 1
      const newErrorStreak = 0
      setStreak(newStreak)
      setErrorStreak(newErrorStreak)

      // Blok van 10 vragen
      const newRoundCount = roundCount + 1
      setRoundCount(newRoundCount)

      // Star progress
      const newProgress = starProgress + 1
      let newStars = stars
      if (newProgress >= 10) {
        newStars = stars + 1
        setStars(newStars)
        setStarProgress(0)
        setNewStar(true)
        setTimeout(() => setNewStar(false), 600)
      } else {
        setStarProgress(newProgress)
      }

      // Adaptive: after 5 consecutive correct, add a word
      let nextCount = visibleCount
      let nextLevel = level
      if (newStreak > 0 && newStreak % 5 === 0) {
        const maxForLevel = LEVELS[nextLevel].length
        if (visibleCount < maxForLevel) {
          nextCount = visibleCount + 1
        } else if (nextLevel < LEVELS.length - 1) {
          // All words mastered in this level, go to next
          nextLevel = nextLevel + 1
          nextCount = 2
          setLevel(nextLevel)
          setStreak(0)
        } else {
          // Completed all levels!
          setAllDone(true)
          setTransitioning(false)
          clearHintTimers()
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
          })
          if (onProgressUpdate) {
            onProgressUpdate({
              current_level: nextLevel,
              words_visible: nextCount,
              total_stars: newStars,
              consecutive_correct: 0,
              consecutive_wrong: 0,
            })
          }
          return
        }
        setVisibleCount(nextCount)
      }

      // Voortgang opslaan
      if (onProgressUpdate) {
        onProgressUpdate({
          current_level: nextLevel,
          words_visible: nextCount,
          total_stars: newStars,
          consecutive_correct: newStreak,
          consecutive_wrong: 0,
        })
      }

      setTimeout(() => {
        setPopWord(null)
        setTransitioning(false)
        if (newRoundCount > 0 && newRoundCount % 10 === 0) {
          // Mini-game na 10 vragen — kies random
          nextRoundAfterGameRef.current = { level: nextLevel, count: nextCount }
          setMiniGameComponent(() => pickMiniGame())
          setShowMiniGame(true)
        } else {
          startNewRound(nextLevel, nextCount)
        }
      }, 1000)

    } else {
      // Wrong
      setShakeWord(word)
      const newErrorStreak = errorStreak + 1
      setErrorStreak(newErrorStreak)
      setStreak(0)

      // Step-back logica (zelfde patroon als Module 2)
      let nextCount = visibleCount
      let nextLevel = level
      let didChange = false

      if (newErrorStreak >= 3 && visibleCount <= 2) {
        // 3+ fouten op minimum → level terug
        if (level > 0) {
          nextLevel = level - 1
          nextCount = 2
          setLevel(nextLevel)
          setVisibleCount(nextCount)
          setErrorStreak(0)
          didChange = true
        }
      } else if (newErrorStreak >= 2 && visibleCount > 2) {
        // 2 fouten → woord minder
        nextCount = visibleCount - 1
        setVisibleCount(nextCount)
        setErrorStreak(0)
        didChange = true
      }

      // Repeat the word
      setTimeout(() => speakWord(targetWord), 500)
      setTimeout(() => setShakeWord(null), 500)

      // Voortgang opslaan
      if (onProgressUpdate) {
        onProgressUpdate({
          current_level: nextLevel,
          words_visible: nextCount,
          total_stars: stars,
          consecutive_correct: 0,
          consecutive_wrong: newErrorStreak,
        })
      }

      // If difficulty changed, start new round
      if (didChange) {
        setTransitioning(true)
        setTimeout(() => {
          setTransitioning(false)
          startNewRound(nextLevel, nextCount)
        }, 1200)
      }
    }
  }

  const handleBackgroundTap = (e) => {
    if (e.target === e.currentTarget && targetWord && !transitioning) {
      resetInteraction()
      speakWord(targetWord)
    }
  }

  const getWordAnimation = (word) => {
    if (shakeWord === word) return 'animate-shake'
    if (popWord === word) return 'animate-pop'
    if (word === targetWord && hintLevel === 1) return 'animate-wobble-subtle'
    if (word === targetWord && hintLevel === 2) return 'animate-wobble-strong'
    return ''
  }

  // Start scherm
  if (!gameStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        {profile && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-5xl">{profile.avatar}</span>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
              {profile.child_name}
            </span>
          </div>
        )}
        {!profile && <div className="text-6xl mb-6">📚</div>}
        <h1 className="text-white text-3xl font-bold mb-4 text-center" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
          Woordjes Lezen
        </h1>
        <p className="text-white/80 text-lg mb-8 text-center" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
          Tik op het juiste woord!
        </p>
        <button
          onClick={handleStart}
          className="animate-pulse-gentle bg-white text-purple-700 font-bold py-6 px-12 rounded-3xl text-2xl shadow-lg active:scale-95 transition-transform"
          style={{ fontFamily: 'OpenDyslexic, sans-serif' }}
        >
          {savedProgress?.total_stars > 0 ? 'Verder spelen!' : 'Start!'}
        </button>
        {onBack && (
          <button onClick={onBack} className="mt-8 text-white/50 text-sm" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
            ← terug
          </button>
        )}
      </div>
    )
  }

  // Mini-game na 10 vragen
  if (showMiniGame && MiniGameComponent) {
    const GameComp = MiniGameComponent
    return (
      <GameComp
        onFinish={() => {
          setShowMiniGame(false)
          const next = nextRoundAfterGameRef.current
          if (next) {
            startNewRound(next.level, next.count)
          }
        }}
        onBack={onBack}
      />
    )
  }

  if (allDone) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-white text-3xl font-bold mb-4 text-center" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
          Super goed!
        </h1>
        <div className="text-4xl mb-6">
          {Array.from({ length: stars }, (_, i) => (
            <span key={i} className="animate-star" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
          ))}
        </div>
        <p className="text-white/80 text-lg mb-8 text-center" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
          Je kent alle woordjes!
        </p>
        <button
          onClick={handleStart}
          className="animate-pulse-gentle bg-white text-purple-700 font-bold py-6 px-12 rounded-3xl text-2xl shadow-lg active:scale-95 transition-transform"
          style={{ fontFamily: 'OpenDyslexic, sans-serif' }}
        >
          Opnieuw!
        </button>
        {onBack && (
          <button onClick={onBack} className="mt-6 text-white/50 text-sm" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
            ← terug
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="h-full flex flex-col select-none"
      onClick={handleBackgroundTap}
    >
      {/* Star bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1 text-2xl">
          {Array.from({ length: stars }, (_, i) => (
            <span key={i} className={i === stars - 1 && newStar ? 'animate-star' : ''}>
              ⭐
            </span>
          ))}
        </div>
        {/* Star progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                i < starProgress ? 'bg-yellow-300' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Level indicator */}
      <div className="text-center">
        <span className="text-white/60 text-sm" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
          Level {level + 1}
        </span>
      </div>

      {/* Home knop */}
      {onBack && (
        <button
          className="absolute top-2 left-3 text-2xl opacity-40 active:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onBack() }}
        >
          🏠
        </button>
      )}

      {/* Word blocks */}
      <div
        className="flex-1 flex items-center justify-center p-4"
        onClick={handleBackgroundTap}
      >
        <div className="flex flex-wrap items-center justify-center gap-4" style={{ maxWidth: '500px' }}>
          {displayWords.map((word) => (
            <button
              key={word}
              onClick={(e) => {
                e.stopPropagation()
                handleWordTap(word)
              }}
              className={`
                rounded-2xl shadow-lg
                flex items-center justify-center
                cursor-pointer select-none
                transition-transform duration-100
                active:scale-95
                ${getWordAnimation(word)}
              `}
              style={{
                backgroundColor: WORD_COLORS[word],
                color: DARK_BG_WORDS.has(word) ? '#2D3436' : '#FFFFFF',
                fontFamily: 'OpenDyslexic, sans-serif',
                fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                minWidth: '120px',
                minHeight: '80px',
                padding: '16px 32px',
                border: 'none',
                textShadow: DARK_BG_WORDS.has(word) ? 'none' : '1px 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Tap hint at bottom */}
      <div className="text-center pb-4">
        <span className="text-white/40 text-xs" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
          tik hier om het woord te herhalen
        </span>
      </div>
    </div>
  )
}

export default App
