// ============================================================
// SamiIntro.jsx — Eenmalige introductie van Sami de Salamander
// Wordt getoond na profielaanmaken, vóór het homescreen.
// Opgeslagen in profiles.sami_introduced
// ============================================================

import { useState, useEffect } from 'react'
import Salamander from './Salamander'
import { speakItem, stopAll } from './speech'

const font = { fontFamily: 'OpenDyslexic, sans-serif' }

const STEPS = [
  {
    samiState: 'idle',
    text: 'Hallo! Ik ben Sami!',
    audioIds: ['sami-welkom', 'sami-naam'],
    audioTexts: ['Hallo! Ik ben Sami!', 'Mijn naam is Sami de Salamander'],
  },
  {
    samiState: 'happy',
    text: 'Ik ben jouw maatje en help je leren!',
    audioIds: ['sami-maatje', 'sami-helpen'],
    audioTexts: ['Ik ben jouw maatje in deze app', 'Ik help je leren lezen en rekenen'],
  },
  {
    samiState: 'excited',
    text: 'Ben je er klaar voor?',
    audioIds: ['sami-klaar'],
    audioTexts: ['Ben je er klaar voor? Laten we beginnen!'],
    showButton: true,
  },
]

export default function SamiIntro({ childName, onDone }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const step = STEPS[stepIndex]

  // Speel audio af bij elke stap
  useEffect(() => {
    const ids = step.audioIds
    const texts = step.audioTexts

    // Chain meerdere audios
    let cancelled = false
    function playChain(i) {
      if (cancelled || i >= ids.length) return
      speakItem(ids[i], texts[i], {
        onEnd: () => {
          if (!cancelled) playChain(i + 1)
        },
      })
    }
    const t = setTimeout(() => playChain(0), 600)
    return () => {
      cancelled = true
      clearTimeout(t)
      stopAll()
    }
  }, [stepIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    stopAll()
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = () => {
    setLeaving(true)
    setTimeout(onDone, 600)
  }

  return (
    <div
      className={`sami-intro-screen ${leaving ? 'sami-intro-leaving' : 'sami-intro-entering'}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(160deg, #FFF8E7 0%, #FFE0B2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        zIndex: 50,
      }}
    >
      {/* Naam bovenaan */}
      <p style={{ ...font, fontSize: '1.1rem', color: '#8B6914', marginBottom: '0.5rem', opacity: 0.8 }}>
        Welkom, {childName}!
      </p>

      {/* Sami groot gecentreerd */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Salamander state={step.samiState} size="lg" />
      </div>

      {/* Tekst */}
      <div
        style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '1rem 1.5rem',
          maxWidth: '320px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
        }}
      >
        <p style={{ ...font, fontSize: '1.25rem', color: '#5D3A1A', margin: 0 }}>
          {step.text}
        </p>
      </div>

      {/* Stap-indicator dots */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: i === stepIndex ? '#F0821E' : '#FFCC80',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Knop */}
      {step.showButton ? (
        <button
          onClick={handleFinish}
          style={{
            ...font,
            background: '#F0821E',
            color: 'white',
            border: 'none',
            borderRadius: '2rem',
            padding: '1rem 2.5rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(240,130,30,0.4)',
            transform: 'scale(1)',
            transition: 'transform 0.1s',
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          Ja! Laten we gaan! 🦎
        </button>
      ) : (
        <button
          onClick={handleNext}
          style={{
            ...font,
            background: 'transparent',
            color: '#F0821E',
            border: '2px solid #F0821E',
            borderRadius: '2rem',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Verder →
        </button>
      )}
    </div>
  )
}
