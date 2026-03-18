import { useState, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { pickMiniGame } from './MiniGamePicker'
import { speakItem, speakWord } from './speech'

// Spreek "Welk plaatje rijmt op" + [woord] achter elkaar uit
function speakRhymeQuestion(word) {
  speakItem('rijm-q-prefix', 'Welk plaatje rijmt op', {
    onEnd: () => speakWord(word),
  })
}

const RHYME_SETS = [
  { question: 'huis',  qEmoji: '🏠', correct: 'muis',  cEmoji: '🐭', wrong: 'boot',  wEmoji: '⛵' },
  { question: 'auto',  qEmoji: '🚗', correct: 'foto',  cEmoji: '📷', wrong: 'trein', wEmoji: '🚂' },
  { question: 'paard', qEmoji: '🐴', correct: 'kaart', cEmoji: '🗺️', wrong: 'hond',  wEmoji: '🐶' },
  { question: 'lamp',  qEmoji: '💡', correct: 'kamp',  cEmoji: '⛺', wrong: 'stoel', wEmoji: '🪑' },
  { question: 'brood', qEmoji: '🍞', correct: 'rood',  cEmoji: '🔴', wrong: 'gras',  wEmoji: '🌿' },
  { question: 'nacht', qEmoji: '🌙', correct: 'acht',  cEmoji: '8️⃣', wrong: 'dag',   wEmoji: '☀️' },
  { question: 'deur',  qEmoji: '🚪', correct: 'kleur', cEmoji: '🎨', wrong: 'raam',  wEmoji: '🪟' },
  { question: 'man',   qEmoji: '👨', correct: 'pan',   cEmoji: '🍳', wrong: 'stoel', wEmoji: '🪑' },
  { question: 'dag',   qEmoji: '☀️', correct: 'vlag',  cEmoji: '🚩', wrong: 'nacht', wEmoji: '🌙' },
  { question: 'boom',  qEmoji: '🌳', correct: 'room',  cEmoji: '🍦', wrong: 'deur',  wEmoji: '🚪' },
  { question: 'kat',   qEmoji: '🐱', correct: 'rat',   cEmoji: '🐀', wrong: 'fiets', wEmoji: '🚲' },
  { question: 'spin',  qEmoji: '🕷️', correct: 'pin',   cEmoji: '📌', wrong: 'vlieg', wEmoji: '🪰' },
  { question: 'beer',  qEmoji: '🐻', correct: 'peer',  cEmoji: '🍐', wrong: 'vis',   wEmoji: '🐟' },
  { question: 'ring',  qEmoji: '💍', correct: 'ding',  cEmoji: '🔔', wrong: 'tafel', wEmoji: '🪑' },
  { question: 'steen', qEmoji: '🪨', correct: 'been',  cEmoji: '🦵', wrong: 'bloem', wEmoji: '🌸' },
]

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Module3({ profile = null, savedProgress = null, onProgressUpdate = null, onBack = null }) {
  const [gameStarted, setGameStarted] = useState(false)
  const [rijmSet, setRijmSet] = useState(null)
  const [targetWord, setTargetWord] = useState('')
  const [stars, setStars] = useState(0)
  const [starProgress, setStarProgress] = useState(0)
  const [newStar, setNewStar] = useState(false)
  const [shakeWord, setShakeWord] = useState(null)
  const [popWord, setPopWord] = useState(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [roundCount, setRoundCount] = useState(0)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [MiniGameComponent, setMiniGameComponent] = useState(null)

  const hintTimerRef = useRef(null)
  const hint2TimerRef = useRef(null)
  const hintCallbackRef = useRef(null)
  const nextRoundAfterGameRef = useRef(null)
  const usedSetsRef = useRef(new Set())

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

  const pickNextSet = useCallback(() => {
    // Cycle through all sets before repeating
    const available = RHYME_SETS.filter((_, i) => !usedSetsRef.current.has(i))
    if (available.length === 0) {
      usedSetsRef.current.clear()
      return RHYME_SETS[Math.floor(Math.random() * RHYME_SETS.length)]
    }
    const idx = Math.floor(Math.random() * available.length)
    const set = available[idx]
    usedSetsRef.current.add(RHYME_SETS.indexOf(set))
    return set
  }, [])

  const startNewRound = useCallback(() => {
    const set = pickNextSet()
    const options = shuffleArray([
      { word: set.correct, emoji: set.cEmoji },
      { word: set.wrong,   emoji: set.wEmoji },
    ])
    const newRijmSet = { question: set.question, qEmoji: set.qEmoji, correct: set.correct, options }
    setRijmSet(newRijmSet)
    setTargetWord(set.correct)
    setHintLevel(0)
    setShakeWord(null)
    setPopWord(null)

    const speakQ = () => speakRhymeQuestion(set.question)
    setTimeout(() => {
      speakQ()
      startHintTimers(speakQ)
    }, 300)
  }, [pickNextSet, startHintTimers])

  const handleStart = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf; src.connect(ctx.destination); src.start(0)
    } catch (_) {}

    const startStars = savedProgress?.total_stars ?? 0
    setGameStarted(true)
    setStars(startStars)
    setStarProgress(0)
    setAllDone(false)
    setRoundCount(0)
    setShowMiniGame(false)
    usedSetsRef.current.clear()

    setTimeout(() => {
      speakItem('instr-rijmen-start', 'Welk plaatje rijmt? Tik op het goede plaatje!', {
        onEnd: () => setTimeout(() => startNewRound(), 300),
      })
    }, 200)
  }

  const resetHints = useCallback(() => {
    clearHintTimers()
    setHintLevel(0)
    if (hintCallbackRef.current) startHintTimers(hintCallbackRef.current)
  }, [clearHintTimers, startHintTimers])

  const handleTap = (word) => {
    if (transitioning) return
    resetHints()

    if (word === targetWord) {
      clearHintTimers()
      setPopWord(word)
      setTransitioning(true)
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'] })

      const newRoundCount = roundCount + 1
      setRoundCount(newRoundCount)

      const newProgress = starProgress + 1
      let newStars = stars
      if (newProgress >= 10) {
        newStars = stars + 1
        setStars(newStars)
        setStarProgress(0)
        setNewStar(true)
        setTimeout(() => setNewStar(false), 600)
        if (newStars >= 5) {
          setAllDone(true)
          setTransitioning(false)
          clearHintTimers()
          confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } })
          if (onProgressUpdate) onProgressUpdate({ total_stars: newStars, current_level: 0, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0 })
          return
        }
      } else {
        setStarProgress(newProgress)
      }

      if (onProgressUpdate) onProgressUpdate({ total_stars: newStars, current_level: 0, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0 })

      setTimeout(() => {
        setPopWord(null)
        setTransitioning(false)
        if (newRoundCount % 10 === 0) {
          nextRoundAfterGameRef.current = true
          setMiniGameComponent(() => pickMiniGame())
          setShowMiniGame(true)
        } else {
          startNewRound()
        }
      }, 1000)

    } else {
      setShakeWord(word)
      setTimeout(() => speakRhymeQuestion(rijmSet.question), 600)
      setTimeout(() => setShakeWord(null), 500)
    }
  }

  const handleBackgroundTap = (e) => {
    if (e.target === e.currentTarget && !transitioning && rijmSet) {
      resetHints()
      speakRhymeQuestion(rijmSet.question)
    }
  }

  const getAnimation = (word) => {
    if (shakeWord === word) return 'animate-shake'
    if (popWord === word) return 'animate-pop'
    if (word === targetWord && hintLevel === 1) return 'animate-wobble-subtle'
    if (word === targetWord && hintLevel === 2) return 'animate-wobble-strong'
    return ''
  }

  // ---- Start scherm ----
  if (!gameStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 select-none">
        {profile && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-5xl">{profile.avatar}</span>
            <span className="text-white text-2xl font-bold" style={font}>{profile.child_name}</span>
          </div>
        )}
        <div className="text-6xl mb-4">🎵</div>
        <h1 className="text-white text-3xl font-bold mb-3 text-center" style={font}>Rijmen</h1>
        <p className="text-white/80 text-lg mb-8 text-center" style={font}>
          Welk plaatje rijmt?
        </p>
        <button
          onClick={handleStart}
          className="animate-pulse-gentle bg-white text-purple-700 font-bold py-6 px-12 rounded-3xl text-2xl shadow-lg active:scale-95 transition-transform"
          style={font}
        >
          {savedProgress?.total_stars > 0 ? 'Verder spelen!' : 'Start!'}
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
        onFinish={() => { setShowMiniGame(false); startNewRound() }}
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
        <p className="text-white/80 text-lg mb-8 text-center" style={font}>Je kan super goed rijmen!</p>
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

  // ---- Spel ----
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
            <div key={i} className={`w-3 h-3 rounded-full transition-colors duration-300 ${i < starProgress ? 'bg-yellow-300' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      <div className="text-center mb-1">
        <span className="text-white/60 text-sm" style={font}>Rijmen 🎵</span>
      </div>

      {onBack && (
        <button
          className="absolute top-2 left-3 text-2xl opacity-40 active:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onBack() }}
        >
          🏠
        </button>
      )}

      {/* Speelgebied */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6" onClick={handleBackgroundTap}>
        {rijmSet && (
          <>
            {/* Vraag */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-white/80 text-sm" style={font}>Welk plaatje rijmt op...</p>
              <div className="flex flex-col items-center bg-white/20 rounded-3xl p-5 shadow-lg">
                <span style={{ fontSize: '5rem', lineHeight: 1 }}>{rijmSet.qEmoji}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  speakRhymeQuestion(rijmSet.question)
                }}
                className="bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-white text-sm transition-colors active:scale-95"
                style={font}
              >
                🔊 Herhaal
              </button>
            </div>

            {/* Antwoorden */}
            <div className="flex justify-center gap-6">
              {rijmSet.options.map((opt) => (
                <button
                  key={opt.word}
                  onClick={(e) => {
                    e.stopPropagation()
                    speakItem(`woord-${opt.word}`, opt.word)
                    handleTap(opt.word)
                  }}
                  className={`rounded-3xl shadow-lg flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-100 active:scale-95 bg-white ${getAnimation(opt.word)}`}
                  style={{ minWidth: '130px', minHeight: '130px', padding: '16px' }}
                >
                  <span style={{ fontSize: '4rem', lineHeight: 1 }}>{opt.emoji}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="text-center pb-4">
        <span className="text-white/40 text-xs" style={font}>tik hier om te herhalen</span>
      </div>
    </div>
  )
}
