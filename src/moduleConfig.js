// ============================================================
// MODULE REGISTRY — centrale registratie van alle modules
// Voeg toekomstige modules hier toe met status: 'coming_soon'
// ============================================================

export const MODULE_REGISTRY = [
  {
    id: 1,
    name: 'Woordjes Lezen',
    icon: '📖',
    worldCard: 'woordentuin',
    unlockStars: 0,
    status: 'active',
  },
  {
    id: 2,
    name: 'Klanken & Letters',
    icon: '🔤',
    worldCard: 'woordentuin',
    unlockStars: 0,
    status: 'active',
  },
  {
    id: 3,
    name: 'Rijmen',
    icon: '🎵',
    worldCard: 'woordentuin',
    unlockStars: 0,
    status: 'active',
  },
  {
    id: 4,
    name: 'Patroon Herkennen',
    icon: '🧩',
    worldCard: 'geheugenpaleis',
    unlockStars: 10,
    status: 'active',
  },
  {
    id: 5,
    name: 'Kleurenreeks',
    icon: '🎨',
    worldCard: 'geheugenpaleis',
    unlockStars: 10,
    status: 'active',
  },
  {
    id: 6,
    name: 'Klokkijken',
    icon: '🕐',
    worldCard: 'klokkentoren',
    unlockStars: 20,
    status: 'active',
  },
  {
    id: 7,
    name: 'Optellen & Aftrekken',
    icon: '🔢',
    worldCard: 'rekenhuis',
    unlockStars: 30,
    status: 'active',
  },
  // ---- Fase 2 — later toe te voegen ----
  {
    id: 8,
    name: 'Getallen & Tellen',
    icon: '🔢',
    worldCard: 'rekenhuis',
    unlockStars: 40,
    status: 'coming_soon',
  },
  {
    id: 9,
    name: 'Rekenen met Geld',
    icon: '🪙',
    worldCard: 'rekenhuis',
    unlockStars: 50,
    status: 'coming_soon',
  },
  {
    id: 10,
    name: 'Splitsen & Halveren',
    icon: '✂️',
    worldCard: 'rekenhuis',
    unlockStars: 60,
    status: 'coming_soon',
  },
  {
    id: 11,
    name: 'Tafels',
    icon: '✖️',
    worldCard: 'rekenhuis',
    unlockStars: 70,
    status: 'coming_soon',
  },
]

// Wereld-kaarten voor het homescreen
export const WORLD_CARDS = [
  {
    id: 'woordentuin',
    name: 'De Woordentuin',
    icon: '🌱',
    unlockStars: 0,
    moduleIds: [1, 2, 3],
    accentColor: '#4CAF50',
    bgColor: '#F1F8E9',
  },
  {
    id: 'geheugenpaleis',
    name: 'Het Geheugenpaleis',
    icon: '🧠',
    unlockStars: 10,
    moduleIds: [4, 5],
    accentColor: '#9C27B0',
    bgColor: '#F3E5F5',
  },
  {
    id: 'klokkentoren',
    name: 'De Klokkentoren',
    icon: '🕐',
    unlockStars: 20,
    moduleIds: [6],
    accentColor: '#00796B',
    bgColor: '#E0F2F1',
  },
  {
    id: 'rekenhuis',
    name: 'Het Rekenhuis',
    icon: '🔢',
    unlockStars: 30,
    moduleIds: [7],
    accentColor: '#E65100',
    bgColor: '#FFF3E0',
  },
]
