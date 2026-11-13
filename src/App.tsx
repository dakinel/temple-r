import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { AdventurerSelector } from './components/AdventurerSelector';
import { AdventurerProfile, ADVENTURER_ROSTER } from './game/adventurers';
import { sound } from './game/audio';
import { CornerStatus, CrashType } from './game/characterController';
import { MARKET_QUERIES, MarketQuery, fetchLiveMarketQueries } from './game/queries';

const STARTING_CAPITAL = 0;

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Adventurer Character
  const [adventurer, setAdventurer] = useState<AdventurerProfile>(() => {
    try {
      const saved = localStorage.getItem('templerun_adventurer');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ADVENTURER_ROSTER[0];
  });
  const [isAdventurerSelectOpen, setIsAdventurerSelectOpen] = useState(false);

  // Game UI State
  const [gamePhase, setGamePhase] = useState<'start' | 'playing' | 'gameover'>('start');
  const [isCrashCinematic, setIsCrashCinematic] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const crashTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const powerupTimeoutRef = useRef<number | null>(null);
  const [stats, setStats] = useState<{
    distance: number;
    coins: number;
    score: number;
    reason?: string;
    crashType?: CrashType;
  }>({ distance: 0, coins: 0, score: 0, crashType: 'candlestick' });
  const [cornerStatus, setCornerStatus] = useState<CornerStatus | null>(null);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('templerun_3d_highscore_v3');
    return saved ? parseInt(saved, 10) : 50;
  });
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [powerupMessage, setPowerupMessage] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'rear' | 'front' | 'side'>('rear');
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  // Stock Market Trading Screen & Decision State
  const [marketQueries, setMarketQueries] = useState<MarketQuery[]>(MARKET_QUERIES);
  const [activeForkQuery, setActiveForkQuery] = useState<MarketQuery | null>(null);
  const [queryIndex, setQueryIndex] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(STARTING_CAPITAL);
  const [streak, setStreak] = useState(0);
  const [currentLaneX, setCurrentLaneX] = useState(0);
  const [decisionFeedback, setDecisionFeedback] = useState<{
    text: string;
    profit: number;
    isYes: boolean;
  } | null>(null);
  const [tradeHistory, setTradeHistory] = useState<
    Array<{ ticker: string; action: string; profit: number }>
  >([]);

  const marketQueriesRef = useRef(marketQueries);
  marketQueriesRef.current = marketQueries;
  const adventurerRef = useRef(adventurer);
  adventurerRef.current = adventurer;

  const handleForkDecision = useCallback((result: {
    survived: boolean;
    profit: number;
    feedback: string;
    query: MarketQuery;
    chosenSide: 'left' | 'right';
  }) => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    if (result.survived) {
      setStreak((s) => s + 1);
      setPortfolioValue((prev) => prev + result.profit);

      setDecisionFeedback({
        text: result.feedback,
        profit: result.profit,
        isYes: result.chosenSide === 'left',
      });
      feedbackTimeoutRef.current = window.setTimeout(() => {
        feedbackTimeoutRef.current = null;
        setDecisionFeedback(null);
      }, 1500);

      setTradeHistory((prev) => [
        ...prev.slice(-3),
        {
          ticker: result.query.ticker,
          action: result.chosenSide === 'left' ? result.query.leftLabel : result.query.rightLabel,
          profit: result.profit,
        },
      ]);

      // Sync immediately to the exact next upcoming fork's randomized query
      const upcoming = engineRef.current?.getNextForkQuery();
      if (upcoming) {
        setActiveForkQuery(upcoming.query);
        setQueryIndex(upcoming.queryIndex);
      } else {
        setActiveForkQuery(null);
        setQueryIndex((prev) => prev + 1);
      }
    } else {
      setStreak(0);
      setPortfolioValue((prev) => Math.max(0, prev + result.profit));
      setDecisionFeedback({
        text: result.feedback,
        profit: result.profit,
        isYes: result.chosenSide === 'left',
      });
    }
  }, []);

  const handleForkDecisionRef = useRef(handleForkDecision);
  handleForkDecisionRef.current = handleForkDecision;

  // Initialize GameEngine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onScoreUpdate: (newStats) => {
        setStats((prev) => ({ ...prev, ...newStats }));
        if (engineRef.current) {
          const p = engineRef.current.player;
          setCurrentLaneX(p.currentLaneX);
          const nextCorner = p.getUpcomingCornerStatus();
          setCornerStatus((prev) => {
            if (!nextCorner && !prev) return prev;
            if (
              nextCorner &&
              prev &&
              nextCorner.turnDir === prev.turnDir &&
              nextCorner.inTurnWindow === prev.inTurnWindow &&
              Math.floor(nextCorner.distToPivot) === Math.floor(prev.distToPivot)
            ) {
              return prev;
            }
            return nextCorner;
          });
        }
      },
      onForkApproaching: (fork) => {
        if (feedbackTimeoutRef.current !== null) {
          window.clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = null;
        }
        setDecisionFeedback(null);
        setQueryIndex(fork.queryIndex);
        setActiveForkQuery(fork.query);
      },
      onForkDecision: (result) => {
        handleForkDecisionRef.current(result);
      },
      onCornerCleared: (turnDir) => {
        if (powerupTimeoutRef.current !== null) {
          window.clearTimeout(powerupTimeoutRef.current);
        }
        setPowerupMessage(`PRECISION ${turnDir.toUpperCase()} TURN! +$3`);
        powerupTimeoutRef.current = window.setTimeout(() => {
          powerupTimeoutRef.current = null;
          setPowerupMessage(null);
        }, 1600);
      },
      onGameOver: (finalStats) => {
        setIsPaused(false);
        setCornerStatus(null);
        setStats(finalStats);
        setIsCrashCinematic(true);

        setHighScore((prevHigh) => {
          if (finalStats.score > prevHigh) {
            localStorage.setItem('templerun_3d_highscore_v3', finalStats.score.toString());
            setIsNewHigh(true);
            return finalStats.score;
          }
          setIsNewHigh(false);
          return prevHigh;
        });

        if (crashTimeoutRef.current) {
          window.clearTimeout(crashTimeoutRef.current);
        }
        crashTimeoutRef.current = window.setTimeout(() => {
          crashTimeoutRef.current = null;
          setIsCrashCinematic(false);
          setGamePhase('gameover');
        }, 1450);
      },
      onPowerupMessage: (msg) => {
        if (powerupTimeoutRef.current !== null) {
          window.clearTimeout(powerupTimeoutRef.current);
        }
        setPowerupMessage(msg);
        powerupTimeoutRef.current = window.setTimeout(() => {
          powerupTimeoutRef.current = null;
          setPowerupMessage(null);
        }, 2800);
      },
    });

    engine.setAdventurer(adventurerRef.current);
    engine.setMarketQueries(marketQueriesRef.current);
    const initialFork = engine.getNextForkQuery();
    if (initialFork) {
      setActiveForkQuery(initialFork.query);
      setQueryIndex(initialFork.queryIndex);
    }
    engineRef.current = engine;

    let cancelled = false;
    fetchLiveMarketQueries().then(({ queries }) => {
      if (cancelled || queries.length === 0) return;
      setMarketQueries(queries);
      engine.setMarketQueries(queries);
      const syncedFork = engine.getNextForkQuery();
      if (syncedFork) {
        setActiveForkQuery(syncedFork.query);
        setQueryIndex(syncedFork.queryIndex);
      }
    });

    return () => {
      cancelled = true;
      if (crashTimeoutRef.current) {
        window.clearTimeout(crashTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      if (powerupTimeoutRef.current !== null) {
        window.clearTimeout(powerupTimeoutRef.current);
      }
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSelectAdventurer = (profile: AdventurerProfile) => {
    setAdventurer(profile);
    try {
      localStorage.setItem('templerun_adventurer', JSON.stringify(profile));
    } catch {}
    if (engineRef.current) {
      engineRef.current.setAdventurer(profile);
    }
  };

  const handleToggleCamera = useCallback(() => {
    if (!engineRef.current) return;
    const nextMode = engineRef.current.toggleCameraView() as 'rear' | 'front' | 'side';
    setCameraMode(nextMode);
  }, []);

  // 1. SCROLL WHEEL CONTROLS (Vertical Scroll = Speed Up/Down, Horizontal Scroll = Steer Left/Right)
  useEffect(() => {
    let lastWheelTime = 0;

    const handleWheel = (e: WheelEvent) => {
      if (gamePhase !== 'playing' || isPaused || isCrashCinematic || !engineRef.current) return;
      e.preventDefault();

      const player = engineRef.current.player;
      const now = performance.now();

      // Normalize wheel delta across pixel/line/page modes
      const scaleFactor = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 240 : 1;
      const dx = e.deltaX * scaleFactor;
      const dy = e.deltaY * scaleFactor;

      if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) > 1) {
        // Scroll Up (dy < 0) -> Increase Speed; Scroll Down (dy > 0) -> Decrease Speed
        const speedDelta = Math.max(-0.22, Math.min(0.22, -dy * 0.0012));
        player.adjustSpeed(speedDelta);
        setSpeedMultiplier(player.speedMultiplier);
      } else if (Math.abs(dx) > 3) {
        // Reversed horizontal scroll so scrolling right (deltaX < 0) steers right and vice versa
        const reversedDx = -dx;
        player.steer(reversedDx * 0.016);
        if (Math.abs(reversedDx) > 22 && now - lastWheelTime > 160) {
          if (reversedDx > 0) player.moveRight();
          else player.moveLeft();
          lastWheelTime = now;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [gamePhase, isPaused, isCrashCinematic]);

  // 2. TAP / CLICK TO JUMP
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gamePhase !== 'playing' || !engineRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest('button, [data-interactive="true"], a, input')) {
      return;
    }

    engineRef.current.player.jump();
  };

  // 3. KEYBOARD CONTROLS (A / Left = YES, D / Right = NO, Space / Up = Jump)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gamePhase !== 'playing' || !engineRef.current) return;

      const player = engineRef.current.player;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          player.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          player.moveRight();
          break;

        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          player.jump();
          break;

        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          player.slide();
          break;

        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          togglePause();
          break;

        case 'KeyM':
          sound.toggleMute();
          break;

        case 'KeyC':
          handleToggleCamera();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, isPaused, handleToggleCamera]);

  // 4. TOUCH CONTROLS
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0 || !engineRef.current || gamePhase !== 'playing') {
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button, [data-interactive="true"], a, input')) {
      touchStartRef.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const duration = Date.now() - touchStartRef.current.time;

    const player = engineRef.current.player;

    if (duration < 250 && Math.max(absX, absY) < 18) {
      player.jump();
    } else if (Math.max(absX, absY) > 24) {
      if (absX > absY) {
        if (dx > 0) player.moveRight();
        else player.moveLeft();
      } else {
        if (dy < 0) player.jump();
        else player.slide();
      }
    }

    touchStartRef.current = null;
  };

  // Direct Button Handlers for Left / Right Tunnel Selection
  const handleChooseYesButton = () => {
    engineRef.current?.selectTunnel('left');
  };

  const handleChooseNoButton = () => {
    engineRef.current?.selectTunnel('right');
  };

  // Start / Restart Game
  const startGame = () => {
    if (crashTimeoutRef.current) {
      window.clearTimeout(crashTimeoutRef.current);
      crashTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (powerupTimeoutRef.current !== null) {
      window.clearTimeout(powerupTimeoutRef.current);
      powerupTimeoutRef.current = null;
    }
    setIsCrashCinematic(false);
    let nextFork: { query: MarketQuery; queryIndex: number } | null = null;
    if (engineRef.current) {
      engineRef.current.restart();
      engineRef.current.setAdventurer(adventurer);
      engineRef.current.start();
      nextFork = engineRef.current.getNextForkQuery();
      sound.playTradingBell();
    }
    setStats({ distance: 0, coins: 0, score: 0, crashType: 'candlestick' });
    setSpeedMultiplier(1.0);
    setCornerStatus(null);
    setPowerupMessage(null);
    setPortfolioValue(STARTING_CAPITAL);
    setStreak(0);
    setTradeHistory([]);
    setDecisionFeedback(null);
    setActiveForkQuery(nextFork?.query ?? null);
    setQueryIndex(nextFork?.queryIndex ?? 0);
    setIsNewHigh(false);
    setIsPaused(false);
    setGamePhase('playing');
  };

  const togglePause = useCallback(() => {
    if (!engineRef.current || gamePhase !== 'playing' || isCrashCinematic) return;
    engineRef.current.pause();
    setIsPaused(engineRef.current.isPaused);
  }, [gamePhase, isCrashCinematic]);

  const restartGame = useCallback(() => {
    if (crashTimeoutRef.current) {
      window.clearTimeout(crashTimeoutRef.current);
      crashTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (powerupTimeoutRef.current !== null) {
      window.clearTimeout(powerupTimeoutRef.current);
      powerupTimeoutRef.current = null;
    }
    setIsCrashCinematic(false);
    let nextFork: { query: MarketQuery; queryIndex: number } | null = null;
    if (engineRef.current) {
      engineRef.current.restart();
      engineRef.current.setAdventurer(adventurer);
      nextFork = engineRef.current.getNextForkQuery();
      sound.playTradingBell();
    }
    setStats({ distance: 0, coins: 0, score: 0, crashType: 'candlestick' });
    setSpeedMultiplier(1.0);
    setCornerStatus(null);
    setPowerupMessage(null);
    setPortfolioValue(STARTING_CAPITAL);
    setStreak(0);
    setTradeHistory([]);
    setDecisionFeedback(null);
    setActiveForkQuery(nextFork?.query ?? null);
    setQueryIndex(nextFork?.queryIndex ?? 0);
    setIsNewHigh(false);
    setIsPaused(false);
    setGamePhase('playing');
  }, [adventurer]);

  const goToMenu = () => {
    if (crashTimeoutRef.current) {
      window.clearTimeout(crashTimeoutRef.current);
      crashTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (powerupTimeoutRef.current !== null) {
      window.clearTimeout(powerupTimeoutRef.current);
      powerupTimeoutRef.current = null;
    }
    setIsCrashCinematic(false);
    setDecisionFeedback(null);
    setPowerupMessage(null);
    setGamePhase('start');
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const currentQ =
    activeForkQuery ??
    marketQueries[queryIndex % marketQueries.length] ??
    MARKET_QUERIES[0];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans cursor-pointer select-none"
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Viewport (Keith Clark CSS FPS Corridor, 100% full screen) */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full pointer-events-none" />

      {/* In-Game HUD & In-Front Trading Screen */}
      {gamePhase === 'playing' && !isCrashCinematic && (
        <GameHUD
          score={stats.score}
          coins={stats.coins}
          distance={stats.distance}
          speedMultiplier={speedMultiplier}
          isPaused={isPaused}
          powerupMessage={powerupMessage}
          hasShield={engineRef.current?.player.powerups.shieldActive ?? false}
          hasMagnet={(engineRef.current?.player.powerups.magnetTimer ?? 0) > 0}
          adventurer={adventurer}
          cameraMode={cameraMode}
          // Stock Market Query Screen
          currentQuery={currentQ}
          portfolioValue={portfolioValue}
          startingCapital={STARTING_CAPITAL}
          streak={streak}
          currentLaneX={currentLaneX}
          decisionFeedback={decisionFeedback}
          tradeHistory={tradeHistory}
          cornerStatus={cornerStatus}
          onChooseYes={handleChooseYesButton}
          onChooseNo={handleChooseNoButton}
          // Handlers
          onOpenAdventurerSelect={() => setIsAdventurerSelectOpen(true)}
          onToggleCamera={handleToggleCamera}
          onPauseToggle={togglePause}
          onRestart={restartGame}
          onTurnLeft={() => engineRef.current?.player.moveLeft()}
          onTurnRight={() => engineRef.current?.player.moveRight()}
          onMoveLeft={() => engineRef.current?.player.moveLeft()}
          onMoveRight={() => engineRef.current?.player.moveRight()}
          onJump={() => engineRef.current?.player.jump()}
          onSlide={() => engineRef.current?.player.slide()}
        />
      )}

      {/* Cinematic Crash Vignette Overlay (Distinct Corner-Wall Amber/Cyan vs Market Candlestick Crimson) */}
      {isCrashCinematic && (
        <div
          aria-hidden="true"
          className={
            stats.crashType === 'corner_wall'
              ? 'pointer-events-none absolute inset-0 z-30 border-8 border-cyan-400/80 shadow-[inset_0_0_130px_rgba(245,158,11,0.6)] flex items-end justify-center pb-10'
              : 'pointer-events-none absolute inset-0 z-30 border-8 border-rose-600/75 shadow-[inset_0_0_120px_rgba(220,38,38,0.65)] flex items-end justify-center pb-10'
          }
        >
          <div
            className={
              stats.crashType === 'corner_wall'
                ? 'bg-slate-950/90 border-2 border-amber-400/85 px-5 py-2 rounded-xl shadow-2xl'
                : 'bg-slate-950/88 border border-rose-500/80 px-5 py-2 rounded-xl shadow-2xl'
            }
          >
            <span
              className={
                stats.crashType === 'corner_wall'
                  ? 'text-cyan-300 font-mono font-black text-sm sm:text-base tracking-[0.22em] uppercase'
                  : 'text-rose-400 font-mono font-black text-sm sm:text-base tracking-[0.25em] uppercase'
              }
            >
              {stats.crashType === 'corner_wall'
                ? '◆ TEMPLE WALL IMPACT · MISSED CORNER TURN ◆'
                : '▼ MARKET CRASH · LIQUIDATED ▼'}
            </span>
          </div>
        </div>
      )}

      {/* Start Game Screen */}
      {gamePhase === 'start' && (
        <StartScreen
          highScore={highScore}
          adventurer={adventurer}
          marketQueries={marketQueries}
          onOpenAdventurerSelect={() => setIsAdventurerSelectOpen(true)}
          onStartGame={startGame}
        />
      )}

      {/* Game Over Screen */}
      {gamePhase === 'gameover' && (
        <GameOverModal
          stats={{
            distance: stats.distance,
            coins: stats.coins,
            score: stats.score,
            reason: stats.reason,
            crashType: stats.crashType,
          }}
          highScore={highScore}
          isNewHigh={isNewHigh}
          adventurer={adventurer}
          onPlayAgain={startGame}
          onHome={goToMenu}
        />
      )}

      {/* Adventurer Face & Character Selector Modal */}
      {isAdventurerSelectOpen && (
        <AdventurerSelector
          currentAdventurer={adventurer}
          onSelectAdventurer={handleSelectAdventurer}
          onClose={() => setIsAdventurerSelectOpen(false)}
        />
      )}
    </div>
  );
}
