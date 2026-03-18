import ButterflyGame from './ButterflyGame'
import FrogGame from './FrogGame'
import StarCatchGame from './StarCatchGame'

const GAMES = [ButterflyGame, FrogGame, StarCatchGame]

let lastGameIndex = -1

export function pickMiniGame() {
  // Pick a different game than last time
  let idx
  do {
    idx = Math.floor(Math.random() * GAMES.length)
  } while (idx === lastGameIndex && GAMES.length > 1)
  lastGameIndex = idx
  return GAMES[idx]
}
