import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { AdventurerSelector } from './components/AdventurerSelector';
import { AdventurerProfile, ADVENTURER_ROSTER } from './game/adventurers';
import { sound } from './game/audio';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Adventurer Character & DiceBear Avatar Face State
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
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [powerupMessage, setPowerupMessage] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'rear' | 'front' | 'side'>('rear');

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onScoreUpdate: (newStats) => {
        setStats(newStats);
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

    // Apply active adventurer face texture and colors
    engine.setAdventurer(adventurer);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update 3D model whenever adventurer changes
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gamePhase !== 'playing' || !engineRef.current) return;

      const player = engineRef.current.player;

      switch (e.code) {
        // 90-Degree Turns at Junctions
        case 'ArrowLeft':
          e.preventDefault();
          player.turnLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.turnRight();
          break;

        // Lane Shifting
        case 'KeyA':
          player.moveLeft();
          break;
        case 'KeyD':
          player.moveRight();
          break;

        // Jump
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          player.jump();
          break;

        // Slide
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          player.slide();
          break;

        // Pause
        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          togglePause();
          break;

        // Mute
        case 'KeyM':
          sound.toggleMute();
          break;

        // Toggle Camera Perspective (Rear / Front Face / Action)
        case 'KeyC':
          handleToggleCamera();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, isPaused, handleToggleCamera]);

  // Touch Swipe controls for mobile
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

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const duration = Date.now() - touchStartRef.current.time;

    // Minimum swipe threshold (px)
    if (Math.max(absX, absY) > 28 && duration < 500) {
      const player = engineRef.current.player;
      if (absX > absY) {
        // Horizontal swipe: check if fast big swipe -> turn 90 deg, otherwise lane change
        if (absX > 60) {
          if (dx > 0) {
            player.turnRight();
          } else {
            player.turnLeft();
          }
        } else {
          if (dx > 0) {
            player.moveRight();
          } else {
            player.moveLeft();
          }
        }
      } else {
        // Vertical swipe
        if (dy < 0) {
          player.jump();
        } else {
          player.slide();
        }
      }
    }
    touchStartRef.current = null;
  };

  // Actions
  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.restart();
      engineRef.current.setAdventurer(adventurer);
      engineRef.current.start();
    }
    setStats({ distance: 0, coins: 0, score: 0 });
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
    }
    setStats({ distance: 0, coins: 0, score: 0 });
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

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Viewport (100% Unobstructed) */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* In-Game HUD overlay */}
      {gamePhase === 'playing' && (
        <GameHUD
          score={stats.score}
          coins={stats.coins}
          distance={stats.distance}
          isPaused={isPaused}
          powerupMessage={powerupMessage}
          hasShield={engineRef.current?.player.powerups.shieldActive ?? false}
          hasMagnet={(engineRef.current?.player.powerups.magnetTimer ?? 0) > 0}
          adventurer={adventurer}
          cameraMode={cameraMode}
          onOpenAdventurerSelect={() => setIsAdventurerSelectOpen(true)}
          onToggleCamera={handleToggleCamera}
          onPauseToggle={togglePause}
          onRestart={restartGame}
          onTurnLeft={() => engineRef.current?.player.turnLeft()}
          onTurnRight={() => engineRef.current?.player.turnRight()}
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
          stats={stats}
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
