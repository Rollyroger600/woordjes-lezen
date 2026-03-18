import { useState } from 'react'
import { supabase } from './supabase'
import ProfileScreen from './ProfileScreen'
import ModuleSelect from './ModuleSelect'
import App from './App'
import Module2 from './Module2'
import Module3 from './Module3'

export default function Root() {
  const [screen, setScreen] = useState('profiles')
  const [profile, setProfile] = useState(null)
  const [progressMap, setProgressMap] = useState({})

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
      // Already played today — no change
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

    // Load progress for all modules
    const { data } = await supabase
      .from('progress')
      .select('*')
      .eq('profile_id', prof.id)
    const map = {}
    if (data) data.forEach(p => { map[p.module] = p })
    setProgressMap(map)
    setScreen('modules')
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
    } catch (_) {
      // Netwerk-fout: ga door met lokale state
    }
  }

  if (screen === 'profiles') {
    return <ProfileScreen onSelect={handleProfileSelect} />
  }
  if (screen === 'modules') {
    return (
      <ModuleSelect
        profile={profile}
        onSelect={(mod) => setScreen(`game${mod}`)}
        onBack={() => { setScreen('profiles'); setProfile(null); setProgressMap({}) }}
      />
    )
  }
  if (screen === 'game1') {
    return (
      <App
        profile={profile}
        savedProgress={progressMap[1] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(1, u)}
        onBack={() => setScreen('modules')}
      />
    )
  }
  if (screen === 'game2') {
    return (
      <Module2
        profile={profile}
        savedProgress={progressMap[2] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(2, u)}
        onBack={() => setScreen('modules')}
      />
    )
  }
  if (screen === 'game3') {
    return (
      <Module3
        profile={profile}
        savedProgress={progressMap[3] ?? null}
        onProgressUpdate={(u) => handleProgressUpdate(3, u)}
        onBack={() => setScreen('modules')}
      />
    )
  }
  return null
}
