// ============================================================
// HomeScreen.jsx — De wereld van Sami
// Vervangt ModuleSelect. Toont wereld-kaarten met module-groepen.
// Kaarten ontgrendelen op basis van totaal sterren.
// ============================================================

import { useState, useEffect } from 'react'
import Salamander from './Salamander'
import { WORLD_CARDS } from './moduleConfig'
import { stopAll } from './speech'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

// Bereken totale sterren over alle modules
function getTotalStars(progressMap) {
  return Object.values(progressMap).reduce((sum, p) => sum + (p?.total_stars ?? 0), 0)
}

export default function HomeScreen({ profile, progressMap, onSelectModule, onBack }) {
  const [samiState, setSamiState] = useState('idle')
  const totalStars = getTotalStars(progressMap)

  useEffect(() => {
    stopAll()
    // Geen setSamiState hier nodig - 'idle' is de beginstate
    return () => stopAll()
  }, [])

  const handleCardPress = (card, isLocked) => {
    if (isLocked) {
      setSamiState('sad')
      setTimeout(() => setSamiState('idle'), 1500)
      return
    }
    setSamiState('happy')
    setTimeout(() => setSamiState('idle'), 1000)
    // Als er maar één module is, ga er direct naartoe
    if (card.moduleIds.length === 1) {
      onSelectModule(card.moduleIds[0])
    } else {
      // Toon sub-menu voor deze kaart
      onSelectModule(`world:${card.id}`)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        background: '#FFFBF0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '2rem',
      }}
    >
      {/* Wissel-speler knop */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
        <button
          onClick={() => { stopAll(); onBack() }}
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: 'none',
            borderRadius: '1rem',
            padding: '0.4rem 0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '1.1rem',
          }}
        >
          <span>{profile.avatar}</span>
          <span style={{ ...font, color: '#888', fontSize: '0.85rem' }}>↩</span>
        </button>
      </div>

      {/* Sami bovenaan */}
      <div style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
        <Salamander state={samiState} size="lg" />
      </div>

      {/* Profielnaam + sterren */}
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <p style={{ ...font, fontSize: '1.3rem', fontWeight: 'bold', color: '#5D3A1A', margin: 0 }}>
          {profile.child_name}
        </p>
        <p style={{ ...font, fontSize: '1rem', color: '#8B6914', margin: '0.2rem 0 0' }}>
          ⭐ {totalStars} sterren
        </p>
        {profile.streak_count > 1 && (
          <p style={{ ...font, fontSize: '0.9rem', color: '#E65100', margin: '0.2rem 0 0' }}>
            <span className="animate-flame" style={{ display: 'inline-block' }}>🔥</span>{' '}
            {profile.streak_count} dagen op rij!
          </p>
        )}
      </div>

      {/* Wereld-kaarten */}
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {WORLD_CARDS.map(card => {
          const isLocked = totalStars < card.unlockStars
          const starsNeeded = card.unlockStars - totalStars

          return (
            <WorldCard
              key={card.id}
              card={card}
              isLocked={isLocked}
              starsNeeded={starsNeeded}
              progressMap={progressMap}
              onPress={() => handleCardPress(card, isLocked)}
            />
          )
        })}
      </div>
    </div>
  )
}

function WorldCard({ card, isLocked, starsNeeded, progressMap, onPress }) {
  const [pressed, setPressed] = useState(false)

  // Bereken sterren voor deze kaart
  const cardStars = card.moduleIds.reduce((sum, id) => sum + (progressMap[id]?.total_stars ?? 0), 0)

  return (
    <button
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: isLocked ? '#F5F5F5' : card.bgColor,
        border: isLocked ? '2px solid #E0E0E0' : `2px solid ${card.accentColor}40`,
        borderRadius: '1.5rem',
        padding: '1.2rem 1.5rem',
        textAlign: 'left',
        cursor: isLocked ? 'default' : 'pointer',
        transform: pressed && !isLocked ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: isLocked
          ? 'none'
          : '0 4px 15px rgba(0,0,0,0.08)',
        filter: isLocked ? 'grayscale(0.6) opacity(0.7)' : 'none',
        position: 'relative',
        minHeight: 100,
      }}
    >
      {/* Slotje bij vergrendeld */}
      {isLocked && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 14,
          fontSize: '1.4rem',
        }}>
          🔒
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '2rem' }}>{card.icon}</span>
        <div>
          <p style={{
            ...font,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: isLocked ? '#9E9E9E' : '#3E2009',
            margin: 0,
          }}>
            {card.name}
          </p>
          {!isLocked && cardStars > 0 && (
            <p style={{ ...font, fontSize: '0.8rem', color: '#8B6914', margin: '0.1rem 0 0' }}>
              ⭐ {cardStars} sterren
            </p>
          )}
        </div>
      </div>

      {isLocked ? (
        <p style={{ ...font, fontSize: '0.85rem', color: '#BDBDBD', margin: 0 }}>
          Nog {starsNeeded} ster{starsNeeded !== 1 ? 'ren' : ''} nodig
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {card.moduleIds.map(id => (
            <ModulePill key={id} moduleId={id} progress={progressMap[id]} accentColor={card.accentColor} />
          ))}
        </div>
      )}
    </button>
  )
}

// Module-namen voor de pills
const MODULE_NAMES = {
  1: '📖 Woordjes',
  2: '🔤 Klanken',
  3: '🎵 Rijmen',
  4: '🧩 Patroon',
  5: '🎨 Reeks',
  6: '🕐 Klok',
  7: '🔢 Rekenen',
}

function ModulePill({ moduleId, progress, accentColor }) {
  const name = MODULE_NAMES[moduleId] ?? `Module ${moduleId}`
  const stars = progress?.total_stars ?? 0

  return (
    <span style={{
      background: `${accentColor}20`,
      border: `1px solid ${accentColor}40`,
      borderRadius: '1rem',
      padding: '0.2rem 0.6rem',
      fontSize: '0.78rem',
      color: '#5D3A1A',
      fontFamily: 'OpenDyslexic, sans-serif',
    }}>
      {name}{stars > 0 ? ` · ⭐${stars}` : ''}
    </span>
  )
}
