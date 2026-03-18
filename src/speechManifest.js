// ============================================================
// SPEECH MANIFEST — alle teksten die kunnen worden ingesproken
// Voeg nieuwe items toe wanneer je nieuwe tekst toevoegt aan de app.
// De studio toont items zonder opname als "nog in te spreken".
// ============================================================

export const SPEECH_ITEMS = [

  // ---- Profiel scherm ----
  {
    id: 'profile-select',
    text: 'Wie gaat er spelen? Klik je eigen naam aan of maak een nieuw account aan door op het plusje te klikken',
    category: 'Instructies',
    usedIn: 'Profiel keuze — welkomstscherm',
  },
  {
    id: 'profile-create-name',
    text: 'Hoe heet je? Typ je naam en klik op volgende',
    category: 'Instructies',
    usedIn: 'Profiel aanmaken — naam invoeren',
  },
  {
    id: 'profile-create-avatar',
    text: 'Kies een plaatje dat je leuk vindt!',
    category: 'Instructies',
    usedIn: 'Profiel aanmaken — avatar kiezen',
  },
  {
    id: 'profile-pin-login',
    text: 'Vul hier je pincode in',
    category: 'Instructies',
    usedIn: 'Profiel keuze — pin invoeren (bestaand)',
  },
  {
    id: 'profile-pin-create',
    text: 'Vul hier een pincode in met 3 cijfers en onthoud deze goed',
    category: 'Instructies',
    usedIn: 'Profiel keuze — pin kiezen (nieuw)',
  },

  // ---- Instructies ----
  {
    id: 'instr-module1-start',
    text: 'Welk woord hoor je? Tik op het goede woord!',
    category: 'Instructies',
    usedIn: 'Module 1 — start',
  },
  {
    id: 'instr-module2-start',
    text: 'Welke letter hoor je? Tik op de goede letter!',
    category: 'Instructies',
    usedIn: 'Module 2 — start',
  },
  {
    id: 'instr-vlinders',
    text: 'Tik de vlinders zo snel mogelijk!',
    category: 'Instructies',
    usedIn: 'Vlinderspelletje — intro',
  },
  {
    id: 'instr-rijmen-start',
    text: 'Welk plaatje rijmt? Tik op het goede plaatje!',
    category: 'Instructies',
    usedIn: 'Module 3 — rijmen start',
  },
  {
    id: 'module-select-intro',
    text: 'Hallo! Wat wil je doen?',
    category: 'Instructies',
    usedIn: 'Module keuze — begroeting',
  },
  {
    id: 'module-select-woordjes',
    text: 'Woordjes lezen',
    category: 'Instructies',
    usedIn: 'Module keuze — woordjes button',
  },
  {
    id: 'module-select-klanken',
    text: 'Klanken oefenen',
    category: 'Instructies',
    usedIn: 'Module keuze — klanken button',
  },
  {
    id: 'module-select-rijmen',
    text: 'Rijmen',
    category: 'Instructies',
    usedIn: 'Module keuze — rijmen button',
  },

  // ---- Module 1 woorden ----
  { id: 'woord-de',   text: 'de',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-het',  text: 'het',  category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-een',  text: 'een',  category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-en',   text: 'en',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-is',   text: 'is',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-in',   text: 'in',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-op',   text: 'op',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-aan',  text: 'aan',  category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-of',   text: 'of',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-bij',  text: 'bij',  category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-dit',  text: 'dit',  category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-dat',  text: 'dat',  category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-ik',   text: 'ik',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-je',   text: 'je',   category: 'Module 1 — woorden', usedIn: 'Module 1' },
  { id: 'woord-wij',  text: 'wij',  category: 'Module 1 — woorden', usedIn: 'Module 1' },

  // ---- Module 2 letters (volgorde groep 3 curriculum) ----
  // Groep A — Klinkers
  { id: 'letter-a',  text: 'a',  category: 'Module 2 — letters', usedIn: 'Groep A — klinkers' },
  { id: 'letter-e',  text: 'e',  category: 'Module 2 — letters', usedIn: 'Groep A — klinkers' },
  { id: 'letter-i',  text: 'i',  category: 'Module 2 — letters', usedIn: 'Groep A — klinkers' },
  { id: 'letter-o',  text: 'o',  category: 'Module 2 — letters', usedIn: 'Groep A — klinkers' },
  { id: 'letter-u',  text: 'u',  category: 'Module 2 — letters', usedIn: 'Groep A — klinkers' },
  // Groep B — Medeklinkers 1
  { id: 'letter-m',  text: 'm',  category: 'Module 2 — letters', usedIn: 'Groep B — medeklinkers 1' },
  { id: 'letter-s',  text: 's',  category: 'Module 2 — letters', usedIn: 'Groep B — medeklinkers 1' },
  { id: 'letter-p',  text: 'p',  category: 'Module 2 — letters', usedIn: 'Groep B — medeklinkers 1' },
  { id: 'letter-t',  text: 't',  category: 'Module 2 — letters', usedIn: 'Groep B — medeklinkers 1' },
  { id: 'letter-n',  text: 'n',  category: 'Module 2 — letters', usedIn: 'Groep B — medeklinkers 1' },
  // Groep C — Medeklinkers 2
  { id: 'letter-b',  text: 'b',  category: 'Module 2 — letters', usedIn: 'Groep C — medeklinkers 2' },
  { id: 'letter-d',  text: 'd',  category: 'Module 2 — letters', usedIn: 'Groep C — medeklinkers 2' },
  { id: 'letter-r',  text: 'r',  category: 'Module 2 — letters', usedIn: 'Groep C — medeklinkers 2' },
  { id: 'letter-l',  text: 'l',  category: 'Module 2 — letters', usedIn: 'Groep C — medeklinkers 2' },
  { id: 'letter-f',  text: 'f',  category: 'Module 2 — letters', usedIn: 'Groep C — medeklinkers 2' },
  // Groep D — Medeklinkers 3
  { id: 'letter-k',  text: 'k',  category: 'Module 2 — letters', usedIn: 'Groep D — medeklinkers 3' },
  { id: 'letter-v',  text: 'v',  category: 'Module 2 — letters', usedIn: 'Groep D — medeklinkers 3' },
  { id: 'letter-g',  text: 'g',  category: 'Module 2 — letters', usedIn: 'Groep D — medeklinkers 3' },
  // Groep E — Lange klinkers
  { id: 'letter-aa', text: 'aa', category: 'Module 2 — letters', usedIn: 'Groep E — lange klinkers' },
  { id: 'letter-ee', text: 'ee', category: 'Module 2 — letters', usedIn: 'Groep E — lange klinkers' },
  { id: 'letter-oo', text: 'oo', category: 'Module 2 — letters', usedIn: 'Groep E — lange klinkers' },
  { id: 'letter-uu', text: 'uu', category: 'Module 2 — letters', usedIn: 'Groep E — lange klinkers' },
  // Groep F — Tweetekenklanken
  { id: 'letter-ie', text: 'ie', category: 'Module 2 — letters', usedIn: 'Groep F — tweetekenklanken' },
  { id: 'letter-oe', text: 'oe', category: 'Module 2 — letters', usedIn: 'Groep F — tweetekenklanken' },
  { id: 'letter-ui', text: 'ui', category: 'Module 2 — letters', usedIn: 'Groep F — tweetekenklanken' },
  { id: 'letter-ei', text: 'ei', category: 'Module 2 — letters', usedIn: 'Groep F — tweetekenklanken' },
  { id: 'letter-au', text: 'au', category: 'Module 2 — letters', usedIn: 'Groep F — tweetekenklanken' },
  { id: 'letter-ou', text: 'ou', category: 'Module 2 — letters', usedIn: 'Groep F — tweetekenklanken' },

  // ---- Rijmen — vraag-prefix (1x inspreken, wordt hergebruikt) ----
  { id: 'rijm-q-prefix', text: 'Welk plaatje rijmt op', category: 'Rijmen — prefix', usedIn: 'Module 3 rijmen — voor elk vraagwoord' },

  // ---- Rijmen — vraagwoorden (worden na de prefix afgespeeld) ----
  { id: 'woord-huis',  text: 'huis',  category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag + antwoord' },
  { id: 'woord-auto',  text: 'auto',  category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-paard', text: 'paard', category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-lamp',  text: 'lamp',  category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-brood', text: 'brood', category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-man',   text: 'man',   category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag + antwoord' },
  { id: 'woord-boom',  text: 'boom',  category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-kat',   text: 'kat',   category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-spin',  text: 'spin',  category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-beer',  text: 'beer',  category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-ring',  text: 'ring',  category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },
  { id: 'woord-steen', text: 'steen', category: 'Rijmen — vraagwoorden', usedIn: 'Rijmvraag' },

  // ---- Rijmen — antwoordwoorden ----
  { id: 'woord-muis',  text: 'muis',  category: 'Rijmen — woorden', usedIn: 'huis/muis' },
  { id: 'woord-boot',  text: 'boot',  category: 'Rijmen — woorden', usedIn: 'huis/boot' },
  { id: 'woord-foto',  text: 'foto',  category: 'Rijmen — woorden', usedIn: 'auto/foto' },
  { id: 'woord-trein', text: 'trein', category: 'Rijmen — woorden', usedIn: 'auto/trein' },
  { id: 'woord-kaart', text: 'kaart', category: 'Rijmen — woorden', usedIn: 'paard/kaart' },
  { id: 'woord-hond',  text: 'hond',  category: 'Rijmen — woorden', usedIn: 'paard/hond' },
  { id: 'woord-kamp',  text: 'kamp',  category: 'Rijmen — woorden', usedIn: 'lamp/kamp' },
  { id: 'woord-stoel', text: 'stoel', category: 'Rijmen — woorden', usedIn: 'lamp/stoel' },
  { id: 'woord-rood',  text: 'rood',  category: 'Rijmen — woorden', usedIn: 'brood/rood' },
  { id: 'woord-gras',  text: 'gras',  category: 'Rijmen — woorden', usedIn: 'brood/gras' },
  { id: 'woord-acht',  text: 'acht',  category: 'Rijmen — woorden', usedIn: 'nacht/acht' },
  { id: 'woord-dag',   text: 'dag',   category: 'Rijmen — woorden', usedIn: 'nacht/dag' },
  { id: 'woord-kleur', text: 'kleur', category: 'Rijmen — woorden', usedIn: 'deur/kleur' },
  { id: 'woord-raam',  text: 'raam',  category: 'Rijmen — woorden', usedIn: 'deur/raam' },
  { id: 'woord-pan',   text: 'pan',   category: 'Rijmen — woorden', usedIn: 'man/pan' },
  { id: 'woord-nacht', text: 'nacht', category: 'Rijmen — woorden', usedIn: 'dag/nacht' },
  { id: 'woord-vlag',  text: 'vlag',  category: 'Rijmen — woorden', usedIn: 'dag/vlag' },
  { id: 'woord-room',  text: 'room',  category: 'Rijmen — woorden', usedIn: 'boom/room' },
  { id: 'woord-deur',  text: 'deur',  category: 'Rijmen — woorden', usedIn: 'boom/deur' },
  { id: 'woord-rat',   text: 'rat',   category: 'Rijmen — woorden', usedIn: 'kat/rat' },
  { id: 'woord-fiets', text: 'fiets', category: 'Rijmen — woorden', usedIn: 'kat/fiets' },
  { id: 'woord-pin',   text: 'pin',   category: 'Rijmen — woorden', usedIn: 'spin/pin' },
  { id: 'woord-vlieg', text: 'vlieg', category: 'Rijmen — woorden', usedIn: 'spin/vlieg' },
  { id: 'woord-peer',  text: 'peer',  category: 'Rijmen — woorden', usedIn: 'beer/peer' },
  { id: 'woord-vis',   text: 'vis',   category: 'Rijmen — woorden', usedIn: 'beer/vis' },
  { id: 'woord-ding',  text: 'ding',  category: 'Rijmen — woorden', usedIn: 'ring/ding' },
  { id: 'woord-tafel', text: 'tafel', category: 'Rijmen — woorden', usedIn: 'ring/tafel' },
  { id: 'woord-been',  text: 'been',  category: 'Rijmen — woorden', usedIn: 'steen/been' },
  { id: 'woord-bloem', text: 'bloem', category: 'Rijmen — woorden', usedIn: 'steen/bloem' },
]
