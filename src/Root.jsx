import { useState } from 'react'
import { supabase } from './supabase'
import { debugLog } from './debugLogger'
import ProfileScreen from './ProfileScreen'
import HomeScreen from './HomeScreen'
import WorldSubSelect from './WorldSubSelect'
import SamiIntro from './SamiIntro'
import App from './App'
import Module2 from './Module2'
import Module3 from './Module3'
import PatroonGame from './PatroonGame'
import SimonGame from './SimonGame'
import KlokGame from './KlokGame'
import RekenGame from './RekenGame'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

export default function Root() {
  const [screen, setScreen]           = useState('splash')
  const [profile, setProfile]         = useState(null)
  const [progressMap, setProgressMap] = useState({})
  const [activeWorld, setActiveWorld] = useState(null) // world card id voor sub-select

  const handleProfileSelect = async (prof) => {
    // Streak tracking
    const today = new Date().toISOString().split('T')[0]
    const lastPlayed = prof.last_played_date
    let newStreak = prof.streak_count || 0
    let shouldUpdate = false

    if (!lastPlayed) {
      newStreak = 1
      shouldUpdate = true
    } else if (lastPlayed === today) {
      // Al vandaag gespeeld — geen wijziging
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (lastPlayed === yesterday) {
        newStreak = (prof.streak_count || 0) + 1
      } else {
        newStreak = 1
      }
      shouldUpdate = true
    }

    if (shouldUpdate) {
      await supabase
        .from('profiles')
        .update({ streak_count: newStreak, last_played_date: today })
        .eq('id', prof.id)
    }

    const updatedProfile = { ...prof, streak_count: newStreak, last_played_date: today }
    setProfile(updatedProfile)

    // Laad voortgang voor alle modules
    const { data } = await supabase
      .from('progress')
      .select('*')
      .eq('profile_id', prof.id)
    const map = {}
    if (data) data.forEach(p => { map[p.module] = p })
    setProgressMap(map)

    // Sami intro eenmalig tonen
    if (!prof.sami_introduced) {
      debugLog('Scherm', 'sami-intro (eerste keer)')
      setScreen('sami-intro')
    } else {
      debugLog('Scherm', 'home')
      setScreen('home')
    }
  }

  const handleSamiIntroDone = async () => {
    // Sla op dat intro gezien is
    await supabase
      .from('profiles')
      .update({ sami_introduced: true })
      .eq('id', profile.id)
    setProfile(prev => ({ ...prev, sami_introduced: true }))
    debugLog('Sami intro', 'voltooid → home')
    setScreen('home')
  }

  const handleProgressUpdate = async (module, updates) => {
    setProgressMap(prev => ({
      ...prev,
      [module]: { ...prev[module], ...updates }
    }))
    try {
      await supabase.from('progress').upsert(
        { profile_id: profile.id, module, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id,module' }
      )
    } catch {
      // Netwerk-fout: ga door met lokale state
    }
  }

  const handleSelectFromHome = (target) => {
    // target = module ID (number) of 'world:cardId' string
    if (typeof target === 'string' && target.startsWith('world:')) {
      const cardId = target.replace('world:', '')
      debugLog('Scherm', `world-sub: ${cardId}`)
      setActiveWorld(cardId)
      setScreen('world-sub')
    } else {
      debugLog('Scherm', `game${target}`)
      setScreen(`game${target}`)
    }
  }

  const handleBack = () => {
    setActiveWorld(null)
    setProfile(null)
    setProgressMap({})
    setScreen('profiles')
  }

  const handleBackToHome = () => {
    setActiveWorld(null)
    setScreen('home')
  }

  // ---- Screens ----

  if (screen === 'splash') {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6 select-none cursor-pointer"
        onClick={() => setScreen('profiles')}
        onTouchEnd={() => setScreen('profiles')}
      >
        <div className="text-8xl mb-6">📖</div>
        <h1 className="text-white text-4xl font-bold mb-3 text-center" style={font}>
          Woordjes Lezen
        </h1>
        <p className="text-white/60 text-lg mb-12" style={font}>Leren lezen is leuk!</p>
        <div className="bg-white/20 hover:bg-white/30 rounded-3xl px-10 py-5 transition-colors">
          <span className="text-white text-xl font-bold" style={font}>Tik om te starten</span>
        </div>
      </div>
    )
  }

  if (screen === 'profiles') {
    return <ProfileScreen onSelect={handleProfileSelect} />
  }

  if (screen === 'sami-intro') {
    return (
      <SamiIntro
        childName={profile?.child_name ?? ''}
        onDone={handleSamiIntroDone}
      />
    )
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        profile={profile}
        progressMap={progressMap}
        onSelectModule={handleSelectFromHome}
        onBack={handleBack}
      />
    )
  }

  if (screen === 'world-sub') {
    return (
      <WorldSubSelect
        worldCardId={activeWorld}
        progressMap={progressMap}
        onSelect={(moduleId) => setScreen(`game${moduleId}`)}
        onBack={handleBackToHome}
      />
    )
  }

  if (screen === 'game1') {
    return (
      <App
        profile={profile}
        savedProgress={progressMap[1] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(1, u)}
        onBack={handleBackToHome}
      />
    )
  }
  if (screen === 'game2') {
    return (
      <Module2
        profile={profile}
        savedProgress={progressMap[2] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(2, u)}
        onBack={handleBackToHome}
      />
    )
  }
  if (screen === 'game3') {
    return (
      <Module3
        profile={profile}
        savedProgress={progressMap[3] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(3, u)}
        onBack={handleBackToHome}
      />
    )
  }
  if (screen === 'game4') {
    return (
      <PatroonGame
        profile={profile}
        savedProgress={progressMap[4] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(4, u)}
        onBack={handleBackToHome}
      />
    )
  }
  if (screen === 'game5') {
    return (
      <SimonGame
        profile={profile}
        savedProgress={progressMap[5] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(5, u)}
        onBack={handleBackToHome}
      />
    )
  }
  if (screen === 'game6') {
    return (
      <KlokGame
        profile={profile}
        savedProgress={progressMap[6] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(6, u)}
        onBack={handleBackToHome}
      />
    )
  }
  if (screen === 'game7') {
    return (
      <RekenGame
        profile={profile}
        savedProgress={progressMap[7] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(7, u)}
        onBack={handleBackToHome}
      />
    )
  }

  return null
}
