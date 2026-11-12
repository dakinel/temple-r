import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { AdventurerSelector } from './components/AdventurerSelector';
import { AdventurerProfile, ADVENTURER_ROSTER } from './game/adventurers';
import { sound } from './game/audio';
import { MARKET_QUERIES, MarketQuery } from './game/queries';

const STARTING_CAPITAL = 100000;

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
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ distance: 0, coins: 0, score: 0 });
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('templerun_3d_highscore');
    return saved ? parseInt(saved, 10) : 150000;
  });
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [powerupMessage, setPowerupMessage] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'rear' | 'front' | 'side'>('rear');

  // Stock Market Trading Screen & Decision State
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

  const queryIndexRef = useRef(queryIndex);
  queryIndexRef.current = queryIndex;
  const handleForkDecision = useCallback((result: {
    survived: boolean;
    profit: number;
    feedback: string;
    query: MarketQuery;
    chosenSide: 'left' | 'right';
  }) => {
    if (result.survived) {
      setStreak((s) => s + 1);
      setPortfolioValue((prev) => {
        const updated = prev + result.profit;
        setHighScore((h) => {
          if (updated > h) {
            localStorage.setItem('templerun_3d_highscore', updated.toString());
            setIsNewHigh(true);
            return updated;
          }
          return h;
        });
        return updated;
      });

      setStats((prev) => ({
        ...prev,
        score: Math.max(0, prev.score + result.profit),
      }));

      setDecisionFeedback({
        text: result.feedback,
        profit: result.profit,
        isYes: result.chosenSide === 'left',
      });
      setTimeout(() => {
        setDecisionFeedback(null);
      }, 3200);

      setTradeHistory((prev) => [
        ...prev.slice(-3),
        {
          ticker: result.query.ticker,
          action: result.chosenSide === 'left' ? result.query.leftLabel : result.query.rightLabel,
          profit: result.profit,
        },
      ]);

      // Advance to next stock query
      setQueryIndex((prev) => (prev + 1) % MARKET_QUERIES.length);
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

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onScoreUpdate: (newStats) => {
        setStats(newStats);
        if (engineRef.current) {
          const p = engineRef.current.player;
          setCurrentLaneX(p.currentLaneX);
        }
      },
      onForkApproaching: (fork) => {
        setQueryIndex(fork.queryIndex);
      },
      onForkDecision: (result) => {
        handleForkDecision(result);
      },
      onGameOver: (finalStats) => {
        setGamePhase('gameover');
        setIsPaused(false);
        setStats(finalStats);

        setHighScore((prevHigh) => {
          if (finalStats.score > prevHigh) {
            localStorage.setItem('templerun_3d_highscore', finalStats.score.toString());
            setIsNewHigh(true);
            return finalStats.score;
          }
          setIsNewHigh(false);
          return prevHigh;
        });
      },
      onPowerupMessage: (msg) => {
        setPowerupMessage(msg);
        setTimeout(() => setPowerupMessage(null), 2800);
      },
    });

    engine.setAdventurer(adventurer);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleForkDecision, adventurer]);

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

  // 1. SCROLL WHEEL CONTROLS (Scroll Left / Right to Steer & Choose YES/NO)
  useEffect(() => {
    let wheelAccumulator = 0;
    let lastWheelTime = 0;

    const handleWheel = (e: WheelEvent) => {
      if (gamePhase !== 'playing' || !engineRef.current) return;
      e.preventDefault();

      const player = engineRef.current.player;
      const now = performance.now();

      const dx = e.deltaX;
      const dy = e.deltaY;

      if (Math.abs(dx) > 3) {
        player.steer(dx * 0.016);
        if (Math.abs(dx) > 22 && now - lastWheelTime > 160) {
          if (dx > 0) player.moveRight();
          else player.moveLeft();
          lastWheelTime = now;
        }
      } else if (Math.abs(dy) > 12) {
        wheelAccumulator += dy;
        if (Math.abs(wheelAccumulator) > 35 && now - lastWheelTime > 160) {
          if (wheelAccumulator > 0) {
            player.moveRight();
          } else {
            player.moveLeft();
          }
          wheelAccumulator = 0;
          lastWheelTime = now;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [gamePhase]);

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
    if (engineRef.current) {
      engineRef.current.restart();
      engineRef.current.setAdventurer(adventurer);
      engineRef.current.start();
      sound.playTradingBell();
    }
    setStats({ distance: 0, coins: 0, score: 0 });
    setPortfolioValue(STARTING_CAPITAL);
    setStreak(0);
    setTradeHistory([]);
    setDecisionFeedback(null);
    setQueryIndex(0);
    setIsNewHigh(false);
    setIsPaused(false);
    setGamePhase('playing');
  };

  const togglePause = useCallback(() => {
    if (!engineRef.current || gamePhase !== 'playing') return;
    engineRef.current.pause();
    setIsPaused(engineRef.current.isPaused);
  }, [gamePhase]);

  const restartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restart();
      engineRef.current.setAdventurer(adventurer);
      sound.playTradingBell();
    }
    setStats({ distance: 0, coins: 0, score: 0 });
    setPortfolioValue(STARTING_CAPITAL);
    setStreak(0);
    setTradeHistory([]);
    setDecisionFeedback(null);
    setQueryIndex(0);
    setIsNewHigh(false);
    setIsPaused(false);
    setGamePhase('playing');
  }, [adventurer]);

  const goToMenu = () => {
    setGamePhase('start');
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const currentQ = MARKET_QUERIES[queryIndex];

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
      {gamePhase === 'playing' && (
        <GameHUD
          score={portfolioValue - STARTING_CAPITAL}
          coins={stats.coins}
          distance={stats.distance}
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

      {/* Start Game Screen */}
      {gamePhase === 'start' && (
        <StartScreen
          highScore={highScore}
          adventurer={adventurer}
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
            score: portfolioValue,
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
