import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { BenchChat } from '@/components/game/BenchChat'
import { Celebration } from '@/components/game/Celebration'
import { CityScreen, FADE_MS } from '@/components/game/CityScreen'
import { Notebook } from '@/components/game/Notebook'
import { Shop } from '@/components/game/Shop'
import { PlaceScreen } from '@/components/game/PlaceScreen'
import { StartScreen } from '@/components/game/StartScreen'
import { LandingScreen } from '@/components/landing/LandingScreen'
import { GameShell } from '@/components/game/ui'
import { CITY, benchOf, doorOf, type Pos } from '@/game/map'
import { outfitEmojis } from '@/game/shop'
import {
  COINS_PER_CORRECT,
  benchPayouts,
  benchStatus,
  canLevelUp,
  gameReducer,
  keptLook,
  newGame,
  pickBenchTargets,
  today,
  type BenchStatus,
  type GameAction,
  type GameState,
} from '@/game/state'
import { clearGame, loadGame, saveGame } from '@/game/storage'
import { DebugBadge, DebugProvider, readDebugFlag, saveDebugFlag, useDebugShortcut } from '@/lib/debug'
import type { BenchId, BenchTarget, BenchVerdict } from '@/shared/bench'
import type { Level } from '@/shared/types'

type AppAction = GameAction | { type: 'newGame'; level: Level }

function appReducer(state: GameState | null, action: AppAction): GameState | null {
  if (action.type === 'newGame') {
    // A new game keeps the words learned, today's bench limits, and the shop items and character.
    const fresh = newGame(action.level, state?.lastWords, state?.learnedWords, state?.benchDay ?? null)
    return state ? { ...fresh, ...keptLook(state) } : fresh
  }
  return state ? gameReducer(state, action) : state
}

type Screen = { name: 'home' } | { name: 'start' } | { name: 'city'; startPos: Pos; visit: number } | { name: 'place'; placeId: string; viaDoor?: boolean }
  | { name: 'bench'; benchId: BenchId; targets: BenchTarget[]; status: BenchStatus }

/**
 * Wraps the game in debug mode (Alt+Shift+D or ?debug=1): every Vietnamese string also shows its English version.
 */
function App() {
  const [debug, setDebug] = useState(() => readDebugFlag())
  const setAndSaveDebug = useCallback((on: boolean) => {
    saveDebugFlag(on)
    setDebug(on)
  }, [])
  useDebugShortcut(useCallback(() => setAndSaveDebug(!debug), [debug, setAndSaveDebug]))
  return (
    <DebugProvider value={debug}>
      <Game />
      {debug && (
        <DebugBadge onTurnOff={() => setAndSaveDebug(false)} />
      )}
    </DebugProvider>
  )
}

function Game() {
  const [game, dispatch] = useReducer(appReducer, null, () => loadGame())
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  /** A place picked on the homepage, opened right after the level choice. */
  const [pendingPlace, setPendingPlace] = useState<string | undefined>()
  const [showHint, setShowHint] = useState(true)
  const [visit, setVisit] = useState(0)
  const [notebookOpen, setNotebookOpen] = useState(false)
  const closeNotebook = useCallback(() => setNotebookOpen(false), [])
  const [shopOpen, setShopOpen] = useState(false)
  const closeShop = useCallback(() => setShopOpen(false), [])

  useEffect(() => {
    if (game) saveGame(game)
  }, [game])

  // Latest state for callbacks that fire after earlier dispatches (bench payouts).
  const gameRef = useRef(game)
  gameRef.current = game

  const enterGame = () => {
    if (pendingPlace) {
      setScreen({ name: 'place', placeId: pendingPlace })
      setPendingPlace(undefined)
    } else {
      goToCity(CITY.start)
    }
  }

  const goToCity = (startPos: Pos) => {
    setVisit((v) => v + 1)
    setScreen({ name: 'city', startPos, visit: visit + 1 })
  }

  if (screen.name === 'home') {
    return (
      <LandingScreen
        onStart={(placeId) => {
          setPendingPlace(placeId)
          setScreen({ name: 'start' })
        }}
      />
    )
  }

  return (
    <GameShell wide={screen.name === 'city'}>
      {(screen.name === 'start' || !game) && (
        <StartScreen
          hasSave={game !== null}
          onContinue={enterGame}
          onNewGame={(level) => {
            clearGame()
            dispatch({ type: 'newGame', level })
            setShowHint(true)
            enterGame()
          }}
        />
      )}

      {game && screen.name === 'city' && (
        <>
          <CityScreen
            key={screen.visit}
            state={game}
            startPos={screen.startPos}
            showHint={showHint}
            paused={game.celebrationOpen || notebookOpen || shopOpen}
            onMoved={() => setShowHint(false)}
            onEnterPlace={(placeId) => setScreen({ name: 'place', placeId, viaDoor: true })}
            onEnterBench={(benchId) => {
              const date = today()
              setScreen({ name: 'bench', benchId, status: benchStatus(game, date), targets: pickBenchTargets(game, date) })
            }}
            onOpenCelebration={() => dispatch({ type: 'openCelebration' })}
            onOpenNotebook={() => setNotebookOpen(true)}
            onOpenShop={() => setShopOpen(true)}
          />
          {notebookOpen && <Notebook words={game.learnedWords} onClose={closeNotebook} />}
          {shopOpen && (
            <Shop
              coins={game.coins}
              owned={game.owned}
              outfit={game.outfit}
              gender={game.gender}
              onGender={(gender) => dispatch({ type: 'setGender', gender })}
              onBuy={(itemId) => dispatch({ type: 'buyItem', itemId })}
              onToggle={(itemId) => dispatch({ type: 'toggleItem', itemId })}
              onClose={closeShop}
            />
          )}
          {game.celebrationOpen && (
            <Celebration
              level={game.level}
              coins={game.coins}
              onPlayAgain={() => {
                dispatch({ type: 'playAgain' })
                goToCity(CITY.start)
              }}
              onLevelUp={
                canLevelUp(game)
                  ? () => {
                      dispatch({ type: 'levelUp' })
                      goToCity(CITY.start)
                    }
                  : undefined
              }
              onKeepExploring={() => dispatch({ type: 'dismissCelebration' })}
            />
          )}
        </>
      )}

      {game && screen.name === 'place' && screen.viaDoor && (
        // Picks up from the city's fade to black and fades into the place.
        <div
          key={`fade-${screen.placeId}`}
          data-testid="door-fade-in"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 bg-black"
          style={{ animation: `fade-from-black ${FADE_MS}ms ease-out forwards` }}
        />
      )}

      {game && screen.name === 'place' && (
        <PlaceScreen
          playerAvatar={outfitEmojis(game.outfit, game.gender).face}
          key={screen.placeId}
          placeId={screen.placeId}
          level={game.level}
          initialWords={game.lastWords[screen.placeId] ?? []}
          learnedWords={game.learnedWords}
          onLearned={(vocab) => dispatch({ type: 'learnWords', placeId: screen.placeId, vocab })}
          onWordsChosen={(words) => dispatch({ type: 'rememberWords', placeId: screen.placeId, words })}
          onCorrect={() => dispatch({ type: 'earnCoins', amount: COINS_PER_CORRECT })}
          onFinish={() => {
            dispatch({ type: 'finishPlace', placeId: screen.placeId })
            goToCity(doorOf(CITY, screen.placeId).outside)
          }}
          onLeave={() => goToCity(doorOf(CITY, screen.placeId).outside)}
        />
      )}

      {game && screen.name === 'bench' && (
        <BenchChat
          key={screen.benchId}
          benchId={screen.benchId}
          level={game.level}
          status={screen.status}
          targets={screen.targets}
          onStart={() => dispatch({ type: 'startBenchChat', date: today(), words: screen.targets.map((t) => t.word) })}
          onVerdicts={(verdicts: BenchVerdict[]) => {
            const date = today()
            const payouts = gameRef.current ? benchPayouts(gameRef.current, date, verdicts) : []
            dispatch({ type: 'awardBench', date, verdicts })
            return payouts
          }}
          onLeave={() => goToCity(benchOf(CITY, screen.benchId).outside)}
        />
      )}
    </GameShell>
  )
}

export { App as VocabApp }
