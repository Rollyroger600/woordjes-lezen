// ============================================================
// WorldSubSelect.jsx — Module-keuze binnen een wereld-kaart
// Getoond als de wereld-kaart meerdere modules bevat.
// ============================================================

import { useState, useEffect } from 'react'
import Salamander from './Salamander'
import { WORLD_CARDS, MODULE_REGISTRY } from './moduleConfig'
import { speakItem, stopAll } from './speech'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

const MODULE_LABELS = {
  1: { name: 'Woordjes',  icon: '📖', desc: 'Herken woordjes' },
  2: { name: 'Klanken',   icon: '🔤', desc: 'Letters en klanken' },
  3: { name: 'Rijmen',    icon: '🎵', desc: 'Rijmparen matchen' },
  4: { name: 'Patroon',   icon: '🧩', desc: 'Onthoud de vakjes' },
  5: { name: 'Reeks',     icon: '🎨', desc: 'Doe de reeks na' },
  6: { name: 'Klok',      icon: '🕐', desc: 'Leer klokkijken' },
  7: { name: 'Rekenen',   icon: '🔢', desc: 'Optellen & aftrekken' },
}

export default function WorldSubSelect({ worldCardId, progressMap, onSelect, onBack }) {
  const card = WORLD_CARDS.find(c => c.id === worldCardId)
  const [samiState, setSamiState] = useState('idle')

  useEffect(() => {
    const t = setTimeout(() => {
      speakItem('module-select-intro', 'Wat wil je doen?')
    }, 400)
    return () => { clearTimeout(t); stopAll() }
  }, [])

  if (!card) return null

  const handleSelect = (moduleId) => {
    stopAll()
    setSamiState('happy')
    setTimeout(() => onSelect(moduleId), 400)
  }

  return (
    <div style={{
      minHeight: '100%',
      background: card.bgColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.5rem 1rem',
      overflowY: 'auto',
    }}>
      {/* Terug-knop */}
      <div style={{ position: 'absolute', top: 12, left: 12 }}>
        <button
          onClick={() => { stopAll(); onBack() }}
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: 'none',
            borderRadius: '1rem',
            padding: '0.4rem 0.9rem',
            cursor: 'pointer',
            fontSize: '1.1rem',
            ...font,
            color: '#555',
          }}
        >
          ← Terug
        </button>
      </div>

      {/* Sami */}
      <div style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>
        <Salamander state={samiState} size="md" />
      </div>

      {/* Kaart-naam */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '2rem' }}>{card.icon}</span>
        <p style={{ ...font, fontSize: '1.3rem', fontWeight: 'bold', color: '#3E2009', margin: '0.25rem 0 0' }}>
          {card.name}
        </p>
        <p style={{ ...font, fontSize: '0.9rem', color: '#8B6914', margin: '0.2rem 0 0' }}>
          Wat wil je doen?
        </p>
      </div>

      {/* Module-knoppen */}
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {card.moduleIds.map(moduleId => {
          const label = MODULE_LABELS[moduleId]
          const progress = progressMap[moduleId]
          const stars = progress?.total_stars ?? 0

          return (
            <button
              key={moduleId}
              onClick={() => handleSelect(moduleId)}
              style={{
                background: 'white',
                border: `2px solid ${card.accentColor}30`,
                borderRadius: '1.5rem',
                padding: '1.1rem 1.4rem',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <span style={{ fontSize: '2rem' }}>{label?.icon ?? '🎮'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ ...font, fontSize: '1.1rem', fontWeight: 'bold', color: '#3E2009', margin: 0 }}>
                  {label?.name ?? `Module ${moduleId}`}
                </p>
                <p style={{ ...font, fontSize: '0.8rem', color: '#8B6914', margin: '0.1rem 0 0' }}>
                  {label?.desc ?? ''}
                </p>
              </div>
              {stars > 0 && (
                <span style={{ ...font, fontSize: '0.85rem', color: '#E6AC00' }}>
                  ⭐ {stars}
                </span>
              )}
              <span style={{ color: '#CCC', fontSize: '1.2rem' }}>›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
