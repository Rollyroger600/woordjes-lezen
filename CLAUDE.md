# Woordjes Lezen

Interactieve Nederlandse taal-leer-app voor kinderen (groep 3). Gebouwd met React + Vite + Tailwind. Deployed via Vercel.

## Tech Stack
- **Frontend:** React 19 + Vite 7 + Tailwind CSS 4 (JIT)
- **Database:** Supabase (PostgreSQL) — profielen + voortgang
- **Speech:** Studio-opnames (.wav) → legacy (.m4a) → browser TTS fallback
- **Font:** OpenDyslexic (dyslexie-vriendelijk)
- **Deploy:** Vercel (auto-deploy vanuit git)
- **Branches:** `develop` (werk), `main` (productie/Vercel)

## Bestandsstructuur
```
src/
├── main.jsx              # React entry point
├── Root.jsx              # Navigatie: splash → profiel → modules → games
├── App.jsx               # Module 1: Woordjes Lezen (woordherkenning)
├── Module2.jsx           # Module 2: Klanken (letter/klankherkenning)
├── Module3.jsx           # Module 3: Rijmen (rijmparen matchen)
├── ProfileScreen.jsx     # Profielbeheer (naam, avatar, 3-cijfer PIN)
├── ModuleSelect.jsx      # Module-kiezer met spraak
├── ButterflyGame.jsx     # Mini-game: vlinders vangen (15s, 5 stuks)
├── FrogGame.jsx          # Mini-game: kikkers tikken (18s, 6 stuks)
├── StarCatchGame.jsx     # Mini-game: sterren vangen (20s, 8 stuks)
├── MiniGamePicker.jsx    # Kiest willekeurig mini-game (geen herhaling)
├── speech.js             # Spraaksysteem (3-tier fallback)
├── speechManifest.js     # Manifest van ~203 spraakitems
├── supabase.js           # Supabase client config
├── index.css             # Animaties + basisstijlen
studio-server.js          # Voice studio backend (Express, port 3333)
studio-client/index.html  # Voice studio recorder UI
public/audio/studio/      # ~100 WAV opnames
public/audio/*.m4a        # 15 legacy Module 1 woorden
```

## Modules

### Module 1: Woordjes (App.jsx)
- **Levels:** 0 (`de/het/een`), 1 (+`en/is/in`), 2 (+`op/aan/of/bij/dit/dat/ik/je/wij`)
- **Progressie:** elke 5 goed → meer woorden zichtbaar of level omhoog
- **Fout-terugval:** 2 fouten → minder woorden; 3+ fouten op minimum → level terug
- **Warmup:** 1 level terug als gisteren gespeeld, 2 levels terug als langer geleden
- **Hints:** 5s → subtiel wiebelen, 10s → sterk wiebelen + herhaling

### Module 2: Klanken (Module2.jsx)
- **6 groepen:** A (klinkers), B-D (medeklinkers), E (lange klinkers), F (tweeklanken)
- **3 fases per groep:** Leren → Oefenen → Herhalen
- **Level-encoding:** `groupIndex * 3 + phase` (0-17)
- **Zelfde fout-terugval en warmup als Module 1**

### Module 3: Rijmen (Module3.jsx)
- **15 rijmparen** (huis↔muis, auto↔foto, etc.)
- **Plat** (geen levels), klaar bij 5 sterren (50 goed)
- **Hints:** 5s wiebelen, 10s wiebelen + prefix + woord spreken

## Mini-games
- Verschijnen na elke **10 goede antwoorden** in alle modules
- `MiniGamePicker` kiest willekeurig uit 3 games, herhaalt niet direct
- Component wordt in state opgeslagen via `setMiniGameComponent(() => pickMiniGame())`

## Spraaksysteem (speech.js)
- **3-tier fallback:** studio WAV → legacy M4A → browser TTS (nl-NL, rate 0.85)
- **Content-type check:** voorkomt dat Vite SPA fallback als audio wordt behandeld
- **Functies:** `speakItem(id, text)`, `speakWord(word)`, `speakLetter(letter)`, `stopAll()`
- **Cache:** blob URLs + Audio elementen worden hergebruikt
- **Generation counter:** voorkomt dat verouderde async speech afspeelt

## Voice Studio
- `npm run studio` → http://localhost:3333
- Opnames in `public/audio/studio/` (WAV format)
- Manifest in `speechManifest.js` definieert alle ~203 items

## Database (Supabase)
- **profiles:** id, child_name, avatar, color, streak_count, last_played_date, pin_hash
- **progress:** profile_id, module (1/2/3), current_level, words_visible, total_stars, consecutive_correct, consecutive_wrong

## Profiel Systeem
- 10 avatars (emoji dieren), 3-cijfer PIN (bcryptjs), auto-kleur
- Streak tracking (🔥) met dagelijkse check
- Long-press (3s) om te verwijderen

## Stijl & Animaties (index.css)
- Elke Module 1 woord heeft een vaste kleur (CSS vars + WORD_COLORS)
- Animaties: shake, wobble-subtle/strong, pop, star-appear, pulse-gentle, butterfly-fly, frog-jump, star-fall, flame-pulse

## Debug Logging (Cowork / handmatig testen)

`src/debugLogger.js` bevat een schakelaar voor console-logging. **Logt nooit in productie** (Vercel) — alleen in `npm run dev`.

**Aan/uit zetten:** open `debugLogger.js` en zet `DEBUG_ENABLED`:
```js
const DEBUG_ENABLED = true   // aan: logs zichtbaar in browser-console
const DEBUG_ENABLED = false  // uit: volledig stil, klaar voor productie
```

**Wat wordt gelogd:**
- Schermwisselingen (`[tijd] Scherm: home`)
- Audio: studio-bestand of TTS fallback (`[tijd] Audio gestart: studio: sami-welkom`)
- Sami state (`[tijd] Sami state: celebrating`)
- Antwoorden per module (`[tijd] RekenGame antwoord: fout: gekozen 8, correct: 7`)
- Level-transities (`[tijd] Level: Optellen tot 5 → Optellen tot 10`)

**Bestanden met debugLog-aanroepen:**
`speech.js`, `Root.jsx`, `PatroonGame.jsx`, `SimonGame.jsx`, `KlokGame.jsx`, `RekenGame.jsx`

**Nieuwe modules toevoegen:**
```js
import { debugLog } from './debugLogger'
debugLog('MijnModule antwoord', isCorrect ? 'correct' : 'fout')
debugLog('Sami state', newState)
debugLog('Level', `${oudLevel} → ${nieuwLevel}`)
```

## Commands
- `npm run dev` — development server
- `npm run build` — productie build
- `npm run studio` — voice studio starten
- `npm run lint` — ESLint check
