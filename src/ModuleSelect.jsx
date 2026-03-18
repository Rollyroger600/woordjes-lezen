import { useState, useEffect, useCallback } from 'react'
import { speakItem, stopAll } from './speech'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

export default function ModuleSelect({ profile, onSelect, onBack }) {
  const [highlighted, setHighlighted] = useState(null) // null | 'woordjes' | 'klanken' | 'rijmen'

  const playIntro = useCallback(() => {
    stopAll()
    setHighlighted(null)

    // Chain: "Hallo, wat wil je doen?" → highlight woordjes + "Woordjes lezen" → highlight klanken + "Klanken oefenen" → highlight rijmen + "Rijmen"
    speakItem('module-select-intro', 'Hallo! Wat wil je doen?', {
      onEnd: () => {
        setHighlighted('woordjes')
        speakItem('module-select-woordjes', 'Woordjes lezen', {
          onEnd: () => {
            setHighlighted('klanken')
            speakItem('module-select-klanken', 'Klanken oefenen', {
              onEnd: () => {
                setHighlighted('rijmen')
                speakItem('module-select-rijmen', 'Rijmen', {
                  onEnd: () => setHighlighted(null),
                })
              },
            })
          },
        })
      },
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(playIntro, 400)
    return () => {
      clearTimeout(t)
      stopAll()
      setHighlighted(null)
    }
  }, [playIntro])

  const highlightStyle = (key, color) => ({
    transform: highlighted === key ? 'scale(1.08)' : 'scale(1)',
    boxShadow: highlighted === key
      ? `0 0 0 4px ${color}, 0 8px 30px rgba(0,0,0,0.2)`
      : '0 4px 15px rgba(0,0,0,0.1)',
  })

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 select-none">
      {/* Wissel speler knop */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-2xl px-4 py-2 transition-colors active:scale-95"
        >
          <span className="text-xl">{profile.avatar}</span>
          <span className="text-white/80 text-sm" style={font}>↩</span>
        </button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-5xl">{profile.avatar}</span>
        <div className="flex flex-col">
          <span className="text-white text-2xl font-bold" style={font}>{profile.child_name}</span>
          {profile.streak_count > 1 && (
            <div className="flex items-center gap-1">
              <span className="text-sm animate-flame">🔥</span>
              <span className="text-orange-300 text-sm font-bold" style={font}>
                {profile.streak_count} dagen op rij!
              </span>
            </div>
          )}
        </div>
      </div>
      <p className="text-white/70 text-base mb-8" style={font}>Wat wil je doen?</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelect(1)}
          className="bg-white rounded-3xl p-5 text-center shadow-lg active:scale-95 transition-all duration-300"
          style={highlightStyle('woordjes', '#FFE66D')}
        >
          <div className="text-5xl mb-2">📖</div>
          <div className="text-purple-700 font-bold text-xl" style={font}>Woordjes</div>
        </button>

        <button
          onClick={() => onSelect(2)}
          className="bg-white rounded-3xl p-5 text-center shadow-lg active:scale-95 transition-all duration-300"
          style={highlightStyle('klanken', '#4ECDC4')}
        >
          <div className="text-5xl mb-2">🔤</div>
          <div className="text-purple-700 font-bold text-xl" style={font}>Klanken</div>
        </button>

        <button
          onClick={() => onSelect(3)}
          className="bg-white rounded-3xl p-5 text-center shadow-lg active:scale-95 transition-all duration-300"
          style={highlightStyle('rijmen', '#FF8B94')}
        >
          <div className="text-5xl mb-2">🎵</div>
          <div className="text-purple-700 font-bold text-xl" style={font}>Rijmen</div>
        </button>

        {/* Herhaal knop */}
        <button
          onClick={playIntro}
          className="flex items-center justify-center gap-3 bg-white/20 hover:bg-white/30 rounded-3xl p-4 transition-all active:scale-95"
        >
          <span className="text-4xl">🔊</span>
          <span className="text-white text-lg font-bold" style={font}>Nog een keer</span>
        </button>
      </div>
    </div>
  )
}
