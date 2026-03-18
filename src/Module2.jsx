import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { pickMiniGame } from './MiniGamePicker'
import { speakLetter, speakItem } from './speech'

// Volgorde groep 3 curriculum:
// 1. Klinkers → 2. Makkelijke medeklinkers → 3. Meer medeklinkers
// 4. Resterende medeklinkers → 5. Lange klinkers → 6. Tweetekenklanken
const LETTER_GROUPS = [
  { id: 'A', name: 'Klinkers',           letters: ['a', 'e', 'i', 'o', 'u'] },
  { id: 'B', name: 'Medeklinkers 1',     letters: ['m', 's', 'p', 't', 'n'] },
  { id: 'C', name: 'Medeklinkers 2',     letters: ['b', 'd', 'r', 'l', 'f'] },
  { id: 'D', name: 'Medeklinkers 3',     letters: ['k', 'v', 'g'] },
  { id: 'E', name: 'Lange klinkers',     letters: ['aa', 'ee', 'oo', 'uu'] },
  { id: 'F', name: 'Tweetekenklanken',   letters: ['ie', 'oe', 'ui', 'ei', 'au', 'ou'] },
]

// current_level is encoded as groupIndex * 3 + phase (0–14)
// phase 0 = Leren, phase 1 = Oefenen, phase 2 = Herhalen
const PHASE_NAMES = ['Leren', 'Oefenen', 'Herhalen']

const PALETTE = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94',
  '#7EC8E3', '#C3AED6', '#FFB347', '#87CEEB', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#F1948A', '#82E0AA', '#AED6F1',
  '#FFB6C1', '#D4E6F1', '#FAD7A0', '#A9DFBF', '#F9E79F',
]
const LETTER_COLORS = {}
const DARK_LETTERS = new Set()
LETTER_GROUPS.flatMap(g => g.letters).forEach((l, i) => {
  LETTER_COLORS[l] = PALETTE[i % PALETTE.length]
})
const LIGHT_COLORS = new Set(['#FFE66D', '#A8E6CF', '#FFB347', '#87CEEB', '#98D8C8', '#F7DC6F', '#AED6F1', '#FFB6C1', '#D4E6F1', '#FAD7A0', '#A9DFBF', '#F9E79F'])
LETTER_GROUPS.flatMap(g => g.letters).forEach(l => {
  if (LIGHT_COLORS.has(LETTER_COLORS[l])) DARK_LETTERS.add(l)
})

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// All letters from groups 0..gIdx
function getAllLettersUpTo(gIdx) {
  return LETTER_GROUPS.slice(0, gIdx + 1).flatMap(g => g.letters)
}

// Max visible letters for this phase
function getPhaseMaxCount(gIdx, phase) {
  if (phase < 2) return LETTER_GROUPS[gIdx].letters.length
  return Math.min(5, getAllLettersUpTo(gIdx).length)
}

// Pick target + distractors based on phase
function pickLettersForRound(gIdx, phase, count) {
  const currentLetters = LETTER_GROUPS[gIdx].letters
  const allLearned = getAllLettersUpTo(gIdx)

  const targetPool = phase < 2 ? currentLetters : allLearned
  const distractorPool = phase === 0 ? currentLetters : allLearned

  const target = targetPool[Math.floor(Math.random() * targetPool.length)]
  const distractors = shuffleArray(distractorPool.filter(l => l !== target))
  const letters = shuffleArray([target, ...distractors.slice(0, count - 1)])
  return { target, letters }
}

// Decode current_level → { groupIndex, phase }
function decodeLevel(encoded) {
  const g = Math.floor((encoded ?? 0) / 3)
  const p = (encoded ?? 0) % 3
  return { groupIndex: Math.min(g, LETTER_GROUPS.length - 1), phase: Math.min(p, 2) }
}

// Encode back
function encodeLevel(groupIndex, phase) {
  return groupIndex * 3 + phase
}

// How many phases to step back given days since last play
function warmupStepsBack(lastPlayedDate) {
  if (!lastPlayedDate) return 0
  const today = new Date().toISOString().split('T')[0]
  if (lastPlayedDate === today) return 0
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  return lastPlayedDate === yesterday ? 1 : 2
}


export default function Module2({ profile = null, savedProgress = null, onProgressUpdate = null, onBack = null }) {
  const [gameStarted, setGameStarted] = useState(false)
  const [groupIndex, setGroupIndex] = useState(0)
  const [phase, setPhase] = useState(0)
  const [visibleCount, setVisibleCount] = useState(2)
  const [targetLetter, setTargetLetter] = useState('')
  const [displayLetters, setDisplayLetters] = useState([])
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
  const [roundCount, setRoundCount] = useState(0)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [MiniGameComponent, setMiniGameComponent] = useState(null)

  const hintTimerRef = useRef(null)
  const hint2TimerRef = useRef(null)
  const hintCallbackRef = useRef(null)
  const nextRoundAfterGameRef = useRef(null)

  const clearHintTimers = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    if (hint2TimerRef.current) clearTimeout(hint2TimerRef.current)
    hintTimerRef.current = null
    hint2TimerRef.current = null
  }, [])

  const startHintTimers = useCallback((onHint) => {
    clearHintTimers()
    setHintLevel(0)
    hintCallbackRef.current = onHint
    hintTimerRef.current = setTimeout(() => {
      setHintLevel(1)
      hint2TimerRef.current = setTimeout(() => {
        setHintLevel(2)
        if (hintCallbackRef.current) hintCallbackRef.current()
      }, 5000)
    }, 5000)
  }, [clearHintTimers])

  const startNewRound = useCallback((gIdx, ph, count) => {
    const { target, letters } = pickLettersForRound(gIdx, ph, count)
    setTargetLetter(target)
    setDisplayLetters(letters)
    setHintLevel(0)
    setShakeWord(null)
    setPopWord(null)
    setTimeout(() => {
      speakLetter(target)
      startHintTimers(() => speakLetter(target))
    }, 300)
  }, [startHintTimers])

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
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
    } catch (_) {}

    const startStars = savedProgress?.total_stars ?? 0
    let { groupIndex: startGroup, phase: startPhase } = decodeLevel(savedProgress?.current_level)
    let startCount = savedProgress?.words_visible ?? 2

    // Warmup: go back phases based on days since last play of THIS module
    const lastPlayed = savedProgress?.updated_at?.split('T')[0] ?? null
    const steps = warmupStepsBack(lastPlayed)
    if (steps > 0) {
      let totalPhase = encodeLevel(startGroup, startPhase)
      totalPhase = Math.max(0, totalPhase - steps)
      startGroup = Math.floor(totalPhase / 3)
      startPhase = totalPhase % 3
      startCount = 2  // reset count when stepping back
    }

    setGameStarted(true)
    setGroupIndex(startGroup)
    setPhase(startPhase)
    setVisibleCount(startCount)
    setStreak(0)
    setErrorStreak(0)
    setStars(startStars)
    setStarProgress(0)
    setAllDone(false)
    setRoundCount(0)
    setShowMiniGame(false)

    setTimeout(() => {
      speakItem('instr-module2-start', 'Welke letter hoor je? Tik op de goede letter!', {
        onEnd: () => setTimeout(() => startNewRound(startGroup, startPhase, startCount), 300),
      })
    }, 200)
  }

  const resetHints = useCallback(() => {
    clearHintTimers()
    setHintLevel(0)
    if (hintCallbackRef.current) startHintTimers(hintCallbackRef.current)
  }, [clearHintTimers, startHintTimers])

  const handleTap = (answer) => {
    if (transitioning) return
    resetHints()

    if (answer === targetLetter) {
      clearHintTimers()
      setPopWord(answer)
      setTransitioning(true)
      confetti({
        particleCount: 80, spread: 70, origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'],
      })

      const newStreak = streak + 1
      setStreak(newStreak)
      setErrorStreak(0)
      const newRoundCount = roundCount + 1
      setRoundCount(newRoundCount)

      // Star progress
      const newStarProgress = starProgress + 1
      let newStars = stars
      if (newStarProgress >= 10) {
        newStars = stars + 1
        setStars(newStars)
        setStarProgress(0)
        setNewStar(true)
        setTimeout(() => setNewStar(false), 600)
      } else {
        setStarProgress(newStarProgress)
      }

      // Determine next state
      const maxCount = getPhaseMaxCount(groupIndex, phase)
      let nextGroup = groupIndex
      let nextPhase = phase
      let nextCount = visibleCount

      if (newStreak > 0 && newStreak % 5 === 0) {
        if (visibleCount < maxCount) {
          nextCount = visibleCount + 1
          setVisibleCount(nextCount)
        } else {
          // Phase complete — advance
          setStreak(0)
          if (phase < 2) {
            nextPhase = phase + 1
            nextCount = 2
            setPhase(nextPhase)
            setVisibleCount(nextCount)
          } else if (groupIndex < LETTER_GROUPS.length - 1) {
            nextGroup = groupIndex + 1
            nextPhase = 0
            nextCount = 2
            setGroupIndex(nextGroup)
            setPhase(nextPhase)
            setVisibleCount(nextCount)
          } else {
            // All groups done!
            setAllDone(true)
            setTransitioning(false)
            clearHintTimers()
            confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } })
            if (onProgressUpdate) onProgressUpdate({
              current_level: encodeLevel(groupIndex, phase),
              words_visible: visibleCount,
              total_stars: newStars,
              consecutive_correct: 0,
              consecutive_wrong: 0,
            })
            return
          }
        }
      }

      if (onProgressUpdate) onProgressUpdate({
        current_level: encodeLevel(nextGroup, nextPhase),
        words_visible: nextCount,
        total_stars: newStars,
        consecutive_correct: newStreak,
        consecutive_wrong: 0,
      })

      setTimeout(() => {
        setPopWord(null)
        setTransitioning(false)
        if (newRoundCount % 10 === 0) {
          nextRoundAfterGameRef.current = { group: nextGroup, phase: nextPhase, count: nextCount }
          setMiniGameComponent(() => pickMiniGame())
          setShowMiniGame(true)
        } else {
          startNewRound(nextGroup, nextPhase, nextCount)
        }
      }, 1000)

    } else {
      // Fout
      setShakeWord(answer)
      const newErrorStreak = errorStreak + 1
      setErrorStreak(newErrorStreak)
      setStreak(0)

      let nextCount = visibleCount
      let nextGroup = groupIndex
      let nextPhase = phase
      let didChange = false

      if (newErrorStreak >= 3 && visibleCount <= 2) {
        // 3+ errors at minimum size → step back a phase
        const totalPhase = encodeLevel(groupIndex, phase)
        if (totalPhase > 0) {
          const prev = totalPhase - 1
          nextGroup = Math.floor(prev / 3)
          nextPhase = prev % 3
          nextCount = 2
          setGroupIndex(nextGroup)
          setPhase(nextPhase)
          setVisibleCount(nextCount)
          setErrorStreak(0)
          didChange = true
        }
      } else if (newErrorStreak >= 2 && visibleCount > 2) {
        nextCount = visibleCount - 1
        setVisibleCount(nextCount)
        setErrorStreak(0)
        didChange = true
      }

      setTimeout(() => speakLetter(targetLetter), 700)
      setTimeout(() => setShakeWord(null), 500)

      if (onProgressUpdate) onProgressUpdate({
        current_level: encodeLevel(nextGroup, nextPhase),
        words_visible: nextCount,
        total_stars: stars,
        consecutive_correct: 0,
        consecutive_wrong: newErrorStreak,
      })

      if (didChange) {
        setTransitioning(true)
        setTimeout(() => {
          setTransitioning(false)
          startNewRound(nextGroup, nextPhase, nextCount)
        }, 1200)
      }
    }
  }

  const handleBackgroundTap = (e) => {
    if (e.target === e.currentTarget && !transitioning) {
      resetHints()
      speakLetter(targetLetter)
    }
  }

  const getAnimation = (letter) => {
    if (shakeWord === letter) return 'animate-shake'
    if (popWord === letter) return 'animate-pop'
    if (letter === targetLetter && hintLevel === 1) return 'animate-wobble-subtle'
    if (letter === targetLetter && hintLevel === 2) return 'animate-wobble-strong'
    return ''
  }

  // ---- Start scherm ----
  if (!gameStarted) {
    const resumeGroup = decodeLevel(savedProgress?.current_level).groupIndex
    const resumePhase = decodeLevel(savedProgress?.current_level).phase
    const hasProgress = (savedProgress?.total_stars ?? 0) > 0

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        {profile && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-5xl">{profile.avatar}</span>
            <span className="text-white text-2xl font-bold" style={font}>{profile.child_name}</span>
          </div>
        )}
        <div className="text-6xl mb-4">🔤</div>
        <h1 className="text-white text-3xl font-bold mb-3 text-center" style={font}>Klanken</h1>
        {hasProgress ? (
          <p className="text-white/80 text-base mb-8 text-center" style={font}>
            Groep {LETTER_GROUPS[resumeGroup].id} — {PHASE_NAMES[resumePhase]}
          </p>
        ) : (
          <p className="text-white/80 text-lg mb-8 text-center" style={font}>Klank en letter koppelen</p>
        )}
        <button
          onClick={handleStart}
          className="animate-pulse-gentle bg-white text-purple-700 font-bold py-6 px-12 rounded-3xl text-2xl shadow-lg active:scale-95 transition-transform"
          style={font}
        >
          {hasProgress ? 'Verder spelen!' : 'Start!'}
        </button>
        {onBack && (
          <button onClick={onBack} className="mt-8 text-white/50 text-sm" style={font}>
            ← terug
          </button>
        )}
      </div>
    )
  }

  // ---- Mini-game ----
  if (showMiniGame && MiniGameComponent) {
    const GameComp = MiniGameComponent
    return (
      <GameComp
        onFinish={() => {
          setShowMiniGame(false)
          const next = nextRoundAfterGameRef.current
          if (next) startNewRound(next.group, next.phase, next.count)
        }}
        onBack={onBack}
      />
    )
  }

  // ---- All done ----
  if (allDone) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-white text-3xl font-bold mb-4 text-center" style={font}>Super goed!</h1>
        <div className="text-4xl mb-6">
          {Array.from({ length: stars }, (_, i) => (
            <span key={i} className="animate-star" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
          ))}
        </div>
        <p className="text-white/80 text-lg mb-8 text-center" style={font}>Je kent alle klanken!</p>
        <button
          onClick={handleStart}
          className="animate-pulse-gentle bg-white text-purple-700 font-bold py-6 px-12 rounded-3xl text-2xl shadow-lg active:scale-95 transition-transform"
          style={font}
        >
          Opnieuw!
        </button>
        {onBack && (
          <button onClick={onBack} className="mt-6 text-white/50 text-sm" style={font}>
            ← terug
          </button>
        )}
      </div>
    )
  }

  // ---- Main game ----
  return (
    <div className="h-full flex flex-col select-none" onClick={handleBackgroundTap}>
      {/* Star bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1 text-2xl">
          {Array.from({ length: stars }, (_, i) => (
            <span key={i} className={i === stars - 1 && newStar ? 'animate-star' : ''}>⭐</span>
          ))}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${i < starProgress ? 'bg-yellow-300' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Groep + fase indicator */}
      <div className="text-center mb-1">
        <span className="text-white/60 text-sm" style={font}>
          Groep {LETTER_GROUPS[groupIndex].id} — {LETTER_GROUPS[groupIndex].name} · {PHASE_NAMES[phase]}
        </span>
      </div>

      {onBack && (
        <button
          className="absolute top-2 left-3 text-2xl opacity-40 active:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onBack() }}
        >
          🏠
        </button>
      )}

      {/* Play area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6" onClick={handleBackgroundTap}>
        <div className="text-center">
          <p className="text-white/70 text-sm mb-2" style={font}>Welke letter hoor je?</p>
          <button
            onClick={(e) => { e.stopPropagation(); speakLetter(targetLetter) }}
            className="bg-white/20 hover:bg-white/30 rounded-2xl px-6 py-3 text-white text-lg transition-colors"
            style={font}
          >
            🔊 Herhaal klank
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4" style={{ maxWidth: '500px' }}>
          {displayLetters.map((letter) => (
            <button
              key={letter}
              onClick={(e) => { e.stopPropagation(); handleTap(letter) }}
              className={`rounded-2xl shadow-lg flex items-center justify-center cursor-pointer select-none transition-transform duration-100 active:scale-95 ${getAnimation(letter)}`}
              style={{
                backgroundColor: LETTER_COLORS[letter],
                color: DARK_LETTERS.has(letter) ? '#2D3436' : '#ffffff',
                fontFamily: 'OpenDyslexic, sans-serif',
                fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                minWidth: '120px',
                minHeight: '80px',
                padding: '16px 32px',
                border: 'none',
                textShadow: DARK_LETTERS.has(letter) ? 'none' : '1px 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center pb-4">
        <span className="text-white/40 text-xs" style={font}>tik hier om te herhalen</span>
      </div>
    </div>
  )
}
