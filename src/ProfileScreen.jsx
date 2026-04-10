import { useState, useEffect, useRef } from 'react'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import { speakItem, stopAll } from './speech'

const AVATARS = ['🐸', '🐼', '🦊', '🐨', '🦁', '🐯', '🐧', '🦋', '🐬', '🦄']
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#7EC8E3', '#C3AED6', '#FFB347']
const font = { fontFamily: 'OpenDyslexic, sans-serif' }

function PinDots({ length, filled }) {
  return (
    <div className="flex justify-center gap-4 mb-6">
      {Array.from({ length }, (_, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-full transition-all duration-150 ${
            i < filled ? 'bg-purple-600 scale-110' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

function PinPad({ onDigit, onDelete }) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del']
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {digits.map((d, i) => {
        if (d === null) return <div key={i} />
        if (d === 'del') return (
          <button
            key={i}
            onClick={onDelete}
            className="w-full h-20 rounded-2xl bg-gray-100 text-gray-500 font-bold text-2xl active:scale-90 transition-transform shadow"
          >
            ⌫
          </button>
        )
        return (
          <button
            key={i}
            onClick={() => onDigit(String(d))}
            className="w-full h-20 rounded-2xl bg-purple-100 text-purple-700 font-bold text-2xl active:scale-90 transition-transform shadow"
            style={font}
          >
            {d}
          </button>
        )
      })}
    </div>
  )
}

export default function ProfileScreen({ onSelect }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [screen, setScreen] = useState('list')
  const [activeProfile, setActiveProfile] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState(AVATARS[0])
  const [newPin, setNewPin] = useState('')
  const longPressRef = useRef(null)
  const vibrationRef = useRef(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  // Spraak bij schermwissel
  const speechRef = useRef(null)
  useEffect(() => {
    if (loading) return
    clearTimeout(speechRef.current)
    stopAll()
    if (screen === 'list') {
      speechRef.current = setTimeout(() => speakItem('profile-select', 'Wie gaat er spelen? Klik je eigen naam aan of maak een nieuw account aan door op het plusje te klikken'), 400)
    } else if (screen === 'create-name') {
      speechRef.current = setTimeout(() => speakItem('profile-create-name', 'Hoe heet je? Typ je naam en klik op volgende'), 300)
    } else if (screen === 'create-avatar') {
      speechRef.current = setTimeout(() => speakItem('profile-create-avatar', 'Kies een plaatje dat je leuk vindt!'), 300)
    } else if (screen === 'create-pin') {
      speechRef.current = setTimeout(() => speakItem('profile-pin-create', 'Vul hier een pincode in met 3 cijfers en onthoud deze goed'), 300)
    }
    return () => { clearTimeout(speechRef.current); stopAll() }
  }, [screen, loading])

  // Login spraak apart — activeProfile moet gezet zijn
  function startLogin(prof) {
    setActiveProfile(prof)
    setPinInput('')
    setPinError(false)
    setShaking(false)
    setScreen('login')
    stopAll()
    setTimeout(() => speakItem('profile-pin-login', 'Vul hier je pincode in'), 300)
  }

  async function loadProfiles() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setProfiles(data || [])
    setLoading(false)
  }

  // ---- Login ----
  async function handleLoginDigit(d) {
    if (pinInput.length >= 3) return
    const next = pinInput + d
    setPinInput(next)
    if (next.length < 3) return

    if (!activeProfile.pin_hash) {
      // No PIN yet — set it now
      const hash = await bcrypt.hash(next, 6)
      await supabase.from('profiles').update({ pin_hash: hash }).eq('id', activeProfile.id)
      doSelect({ ...activeProfile, pin_hash: hash })
      return
    }
    const ok = await bcrypt.compare(next, activeProfile.pin_hash)
    if (ok) {
      doSelect(activeProfile)
    } else {
      setShaking(true)
      setTimeout(() => {
        setShaking(false)
        setPinInput('')
        setPinError(true)
      }, 500)
    }
  }

  function doSelect(prof) {
    localStorage.setItem('lastProfileId', prof.id)
    onSelect(prof)
  }

  // ---- Create ----
  async function handleCreateProfile() {
    setSaving(true)
    try {
      const color = COLORS[profiles.length % COLORS.length]
      const hash = await bcrypt.hash(newPin, 6)
      const { data } = await supabase
        .from('profiles')
        .insert({ child_name: newName.trim(), avatar: newAvatar, color, pin_hash: hash })
        .select()
        .single()
      if (data) {
        localStorage.setItem('lastProfileId', data.id)
        onSelect(data)
      }
    } finally {
      setSaving(false)
    }
  }

  // ---- Long press delete ----
  function startLongPress(prof) {
    vibrationRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(80)
    }, 1500)
    longPressRef.current = setTimeout(() => {
      setActiveProfile(prof)
      setPinInput('')
      setPinError(false)
      setScreen('delete1')
    }, 3000)
  }

  function cancelLongPress() {
    clearTimeout(longPressRef.current)
    clearTimeout(vibrationRef.current)
    longPressRef.current = null
    vibrationRef.current = null
  }

  async function handleDeletePinDigit(d) {
    if (pinInput.length >= 3) return
    const next = pinInput + d
    setPinInput(next)
    if (next.length < 3) return

    const ok = activeProfile.pin_hash
      ? await bcrypt.compare(next, activeProfile.pin_hash)
      : false
    if (ok) {
      setPinInput('')
      setScreen('delete2')
    } else {
      setShaking(true)
      setTimeout(() => {
        setShaking(false)
        setPinInput('')
        setPinError(true)
      }, 500)
    }
  }

  async function confirmDelete() {
    await supabase.from('profiles').delete().eq('id', activeProfile.id)
    setProfiles(prev => prev.filter(p => p.id !== activeProfile.id))
    setActiveProfile(null)
    setScreen('list')
  }

  // ---- Screens ----
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-white text-xl" style={font}>Laden...</span>
      </div>
    )
  }

  if (screen === 'login') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl text-center">
          <div className="text-6xl mb-2">{activeProfile?.avatar}</div>
          <div className="font-bold text-xl text-gray-700 mb-1" style={font}>{activeProfile?.child_name}</div>
          {activeProfile?.streak_count > 1 && (
            <div className="flex items-center justify-center gap-1 mb-3">
              <span className="animate-flame">🔥</span>
              <span className="text-orange-500 font-bold text-sm" style={font}>
                {activeProfile.streak_count} dagen op rij!
              </span>
            </div>
          )}
          <p className="text-gray-400 text-sm mb-5" style={font}>
            {activeProfile?.pin_hash ? 'Voer je code in' : 'Kies een geheime code'}
          </p>
          <PinDots length={3} filled={pinInput.length} />
          <div className={shaking ? 'animate-shake' : ''}>
            <PinPad
              pin={pinInput}
              onDigit={handleLoginDigit}
              onDelete={() => setPinInput(p => p.slice(0, -1))}
            />
          </div>
          {pinError && (
            <p className="text-red-500 text-sm mt-4" style={font}>Probeer nog een keer! 🙈</p>
          )}
          <button
            onClick={() => setScreen('list')}
            className="mt-5 text-gray-400 text-sm"
            style={font}
          >
            ← Terug
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'create-name') {
    return (
      <div className="h-full flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
          <h2 className="text-xl font-bold text-gray-700 mb-6 text-center" style={font}>Hoe heet je?</h2>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newName.trim() && setScreen('create-avatar')}
            placeholder="Naam"
            className="w-full border-2 border-gray-300 rounded-xl p-3 text-xl mb-6 outline-none focus:border-purple-400"
            style={font}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setScreen('list'); setNewName('') }}
              className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold"
              style={font}
            >
              Terug
            </button>
            <button
              onClick={() => newName.trim() && setScreen('create-avatar')}
              disabled={!newName.trim()}
              className="flex-1 py-4 rounded-2xl bg-purple-600 text-white font-bold disabled:opacity-40"
              style={font}
            >
              Volgende →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'create-avatar') {
    return (
      <div className="h-full flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
          <h2 className="text-xl font-bold text-gray-700 mb-1 text-center" style={font}>Kies een plaatje!</h2>
          <p className="text-gray-400 text-sm text-center mb-5" style={font}>{newName}</p>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => setNewAvatar(a)}
                className={`text-3xl p-2 rounded-2xl transition-all active:scale-90 ${newAvatar === a ? 'bg-purple-200 scale-110 shadow' : 'bg-gray-100'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setScreen('create-name')}
              className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold"
              style={font}
            >
              Terug
            </button>
            <button
              onClick={() => { setNewPin(''); setScreen('create-pin') }}
              className="flex-1 py-4 rounded-2xl bg-purple-600 text-white font-bold"
              style={font}
            >
              Volgende →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'create-pin') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl text-center">
          <div className="text-5xl mb-2">{newAvatar}</div>
          <h2 className="text-lg font-bold text-gray-700 mb-1" style={font}>{newName}</h2>
          <p className="text-gray-400 text-sm mb-5" style={font}>Kies een geheime code van 3 cijfers</p>
          <PinDots length={3} filled={newPin.length} />
          <PinPad
            pin={newPin}
            onDigit={d => setNewPin(p => p.length < 3 ? p + d : p)}
            onDelete={() => setNewPin(p => p.slice(0, -1))}
          />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setScreen('create-avatar')}
              className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold"
              style={font}
            >
              Terug
            </button>
            <button
              onClick={handleCreateProfile}
              disabled={newPin.length < 3 || saving}
              className="flex-1 py-4 rounded-2xl bg-purple-600 text-white font-bold disabled:opacity-40 transition-opacity"
              style={font}
            >
              {saving ? 'Even wachten...' : 'Opslaan ✓'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'delete1') {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #e53e3e, #c53030)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-8xl mb-6">{activeProfile?.avatar}</div>
          <h2 className="text-white text-2xl font-bold mb-3" style={font}>
            Wil je {activeProfile?.child_name} verwijderen?
          </h2>
          <p className="text-white/70 text-sm mb-10" style={font}>
            Dit kan niet ongedaan worden gemaakt
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setScreen('list')}
              className="w-full py-5 rounded-3xl bg-green-400 text-white font-bold text-xl shadow-lg active:scale-95 transition-transform"
              style={font}
            >
              Nee, ga terug! 😊
            </button>
            <button
              onClick={() => { setPinInput(''); setPinError(false); setScreen('delete-pin') }}
              className="w-full py-3 rounded-2xl bg-white/20 text-white font-bold active:scale-95 transition-transform"
              style={font}
            >
              Ja →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'delete-pin') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl text-center">
          <div className="text-5xl mb-2">{activeProfile?.avatar}</div>
          <p className="text-gray-500 text-sm mb-5" style={font}>
            Voer de code van {activeProfile?.child_name} in
          </p>
          <PinDots length={3} filled={pinInput.length} />
          <div className={shaking ? 'animate-shake' : ''}>
            <PinPad
              pin={pinInput}
              onDigit={handleDeletePinDigit}
              onDelete={() => setPinInput(p => p.slice(0, -1))}
            />
          </div>
          {pinError && (
            <p className="text-red-500 text-sm mt-4" style={font}>Verkeerde code, probeer opnieuw</p>
          )}
          <button
            onClick={() => setScreen('delete1')}
            className="mt-5 text-gray-400 text-sm"
            style={font}
          >
            ← Terug
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'delete2') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-8xl mb-4 opacity-60">{activeProfile?.avatar}</div>
          <div className="text-5xl mb-4">😢</div>
          <h2 className="text-white text-xl font-bold mb-3" style={font}>
            {activeProfile?.child_name}'s sterren en voortgang zijn dan voor altijd weg...
          </h2>
          <div className="flex flex-col gap-4 mt-8">
            <button
              onClick={() => setScreen('list')}
              className="w-full py-5 rounded-3xl bg-green-400 text-white font-bold text-xl shadow-lg active:scale-95 transition-transform"
              style={font}
            >
              Nee, ga terug! 😊
            </button>
            <button
              onClick={confirmDelete}
              className="w-full py-3 rounded-2xl bg-white/15 text-white/60 font-bold text-sm active:scale-95 transition-transform"
              style={font}
            >
              Toch verwijderen
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Profile list ----
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <h1 className="text-white text-2xl font-bold text-center mt-6 mb-8" style={font}>
        Wie gaat spelen?
      </h1>
      <div className="grid grid-cols-2 gap-4">
        {profiles.map(prof => (
          <button
            key={prof.id}
            onClick={() => startLogin(prof)}
            onMouseDown={() => startLongPress(prof)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={() => startLongPress(prof)}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
            className="flex flex-col items-center justify-center rounded-3xl p-6 shadow-lg active:scale-95 transition-transform select-none relative"
            style={{ backgroundColor: prof.color, minHeight: '150px' }}
          >
            {prof.streak_count > 1 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/20 rounded-full px-2 py-1">
                <span className="text-sm animate-flame">🔥</span>
                <span className="text-white text-xs font-bold" style={font}>{prof.streak_count}</span>
              </div>
            )}
            <span className="text-5xl mb-2">{prof.avatar}</span>
            <span
              className="font-bold text-lg text-white text-center"
              style={{ ...font, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              {prof.child_name}
            </span>
          </button>
        ))}
        <button
          onClick={() => { setNewName(''); setNewAvatar(AVATARS[0]); setNewPin(''); setScreen('create-name') }}
          className="flex flex-col items-center justify-center rounded-3xl p-6 bg-white/20 border-2 border-dashed border-white/40 active:scale-95 transition-transform"
          style={{ minHeight: '150px' }}
        >
          <span className="text-4xl text-white mb-2">+</span>
          <span className="text-white/80 text-sm" style={font}>Nieuw kind</span>
        </button>
      </div>
      <p className="text-white/40 text-xs text-center mt-8" style={font}>
        3 seconden indrukken om te verwijderen
      </p>
    </div>
  )
}
