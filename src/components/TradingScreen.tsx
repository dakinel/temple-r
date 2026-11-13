import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { MarketQuery } from '../game/queries';

interface TradingScreenProps {
  currentQuery: MarketQuery;
  portfolioValue: number;
  startingCapital: number;
  streak: number;
  currentLaneX: number;
  decisionFeedback: {
    text: string;
    profit: number;
    isYes: boolean;
  } | null;
  tradeHistory?: Array<{
    ticker: string;
    action: string;
    profit: number;
  }>;
  onChooseYes?: () => void;
  onChooseNo?: () => void;
}

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  age: number;
  maxAge: number;
  phase: number;
  kind: 'flame' | 'ember';
  stretchY: number;
}

interface BurnParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  age: number;
  maxAge: number;
  kind: 'flame' | 'ash' | 'spark';
  emberHot: boolean;
}

type CardContentSnapshot =
  | { kind: 'query'; query: MarketQuery }
  | {
      kind: 'feedback';
      feedback: NonNullable<TradingScreenProps['decisionFeedback']>;
    };

const BURN_DURATION_MS = 520;
const ENTER_DURATION_MS = 350;

export const TradingScreen: React.FC<TradingScreenProps> = ({
  currentQuery,
  streak,
  decisionFeedback,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerCardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fireCanvasRef = useRef<HTMLCanvasElement>(null);
  const burnCanvasRef = useRef<HTMLCanvasElement>(null);

  const [shown, setShown] = useState<CardContentSnapshot>(() =>
    decisionFeedback
      ? { kind: 'feedback', feedback: decisionFeedback }
      : { kind: 'query', query: currentQuery }
  );
  const [phase, setPhase] = useState<'idle' | 'burning' | 'entering'>('idle');

  const latestPropsRef = useRef({ currentQuery, decisionFeedback });
  latestPropsRef.current = { currentQuery, decisionFeedback };

  const burnControlRef = useRef<{
    active: boolean;
    startTime: number;
    completed: boolean;
    flareUntil: number;
    onComplete: (() => void) | null;
  }>({
    active: false,
    startTime: 0,
    completed: true,
    flareUntil: 0,
    onComplete: null,
  });

  const enterTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  // Detect transitions to the next sentence and trigger burn-then-place sequence
  useEffect(() => {
    const clearTimers = () => {
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
      if (safetyTimerRef.current !== null) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };

    // Immediate feedback banner when clearing a fork
    if (decisionFeedback) {
      burnControlRef.current.active = false;
      burnControlRef.current.completed = true;
      burnControlRef.current.onComplete = null;
      if (contentRef.current) {
        contentRef.current.style.webkitMaskImage = '';
        contentRef.current.style.maskImage = '';
        contentRef.current.style.filter = '';
      }
      clearTimers();
      setShown({ kind: 'feedback', feedback: decisionFeedback });
      setPhase('idle');
      return;
    }

    // Check if we are moving from feedback -> new sentence OR old sentence -> new sentence
    const shouldBurnToNext =
      shown.kind === 'feedback' ||
      (shown.kind === 'query' &&
        (shown.query.id !== currentQuery.id ||
          shown.query.question !== currentQuery.question));

    if (!shouldBurnToNext) {
      return;
    }

    // If already burning toward a new sentence, let the current burn finish and place the latest query
    if (phase === 'burning') {
      return;
    }

    clearTimers();
    setPhase('burning');

    const finishBurnAndPlaceNext = () => {
      if (burnControlRef.current.completed) return;
      burnControlRef.current.completed = true;
      burnControlRef.current.active = false;
      burnControlRef.current.onComplete = null;

      if (safetyTimerRef.current !== null) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }

      if (contentRef.current) {
        contentRef.current.style.webkitMaskImage = '';
        contentRef.current.style.maskImage = '';
        contentRef.current.style.filter = '';
      }

      const latest = latestPropsRef.current;
      if (latest.decisionFeedback) {
        setShown({ kind: 'feedback', feedback: latest.decisionFeedback });
        setPhase('idle');
        return;
      }

      setShown({ kind: 'query', query: latest.currentQuery });
      setPhase('entering');
      enterTimerRef.current = window.setTimeout(() => {
        enterTimerRef.current = null;
        setPhase('idle');
      }, ENTER_DURATION_MS);
    };

    const now = performance.now();
    burnControlRef.current.active = true;
    burnControlRef.current.startTime = now;
    burnControlRef.current.completed = false;
    burnControlRef.current.flareUntil = now + BURN_DURATION_MS + 180;
    burnControlRef.current.onComplete = finishBurnAndPlaceNext;

    // Fallback safety completion in case requestAnimationFrame is throttled
    safetyTimerRef.current = window.setTimeout(
      finishBurnAndPlaceNext,
      BURN_DURATION_MS + 80
    );
  }, [currentQuery, decisionFeedback, shown, phase]);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current);
      if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
    };
  }, []);

  // Perimeter fire canvas + interior burn-to-ash overlay canvas
  useEffect(() => {
    const frameEl = frameRef.current;
    const innerEl = innerCardRef.current;
    const canvas = fireCanvasRef.current;
    const burnCanvas = burnCanvasRef.current;
    if (!frameEl || !innerEl || !canvas || !burnCanvas) return;

    const ctx = canvas.getContext('2d');
    const bCtx = burnCanvas.getContext('2d');
    if (!ctx || !bCtx) return;

    const padX = 28;
    const padTop = 32;
    const padBot = 24;

    let cardW = frameEl.clientWidth || 560;
    let cardH = frameEl.clientHeight || 86;
    let innerW = innerEl.clientWidth || 556;
    let innerH = innerEl.clientHeight || 82;

    const syncSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      cardW = Math.max(220, frameEl.clientWidth);
      cardH = Math.max(64, frameEl.clientHeight);
      const totalW = cardW + padX * 2;
      const totalH = cardH + padTop + padBot;
      canvas.width = Math.round(totalW * dpr);
      canvas.height = Math.round(totalH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      innerW = Math.max(216, innerEl.clientWidth);
      innerH = Math.max(60, innerEl.clientHeight);
      burnCanvas.width = Math.round(innerW * dpr);
      burnCanvas.height = Math.round(innerH * dpr);
      bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    syncSize();

    const ro = new ResizeObserver(syncSize);
    ro.observe(frameEl);
    ro.observe(innerEl);

    const particles: FlameParticle[] = [];
    const maxParticles = 165;
    const burnParticles: BurnParticle[] = [];
    const maxBurnParticles = 130;

    const spawnPerimeterParticle = (kind: 'flame' | 'ember', boost = 1) => {
      if (particles.length >= maxParticles) return;

      const edgeRoll = Math.random();
      let sx = padX;
      let sy = padTop;
      let vx = 0;
      let vy = 0;

      if (edgeRoll < 0.62) {
        sx = padX + 8 + Math.random() * (cardW - 16);
        sy = padTop + (Math.random() - 0.5) * 4;
        vx = (Math.random() - 0.5) * 22;
        vy = -(28 + Math.random() * 44) * boost;
      } else if (edgeRoll < 0.78) {
        sx = padX + (Math.random() - 0.5) * 4;
        sy = padTop + 6 + Math.random() * (cardH - 12);
        vx = -(10 + Math.random() * 18) * boost;
        vy = -(22 + Math.random() * 34) * boost;
      } else if (edgeRoll < 0.94) {
        sx = padX + cardW + (Math.random() - 0.5) * 4;
        sy = padTop + 6 + Math.random() * (cardH - 12);
        vx = (10 + Math.random() * 18) * boost;
        vy = -(22 + Math.random() * 34) * boost;
      } else {
        sx = padX + 12 + Math.random() * (cardW - 24);
        sy = padTop + cardH + (Math.random() - 0.5) * 4;
        vx = (Math.random() - 0.5) * 24;
        vy = (8 + Math.random() * 18) * boost;
      }

      if (kind === 'ember') {
        vy *= 1.45;
        vx += (Math.random() - 0.5) * 36;
      }

      particles.push({
        x: sx,
        y: sy,
        vx,
        vy,
        radius:
          kind === 'flame'
            ? (7 + Math.random() * 11) * (boost > 1 ? 1.15 : 1)
            : 1.5 + Math.random() * 2.1,
        age: 0,
        maxAge:
          kind === 'flame'
            ? 0.34 + Math.random() * 0.28
            : 0.45 + Math.random() * 0.42,
        phase: Math.random() * Math.PI * 2,
        kind,
        stretchY: kind === 'flame' ? 1.35 + Math.random() * 0.65 : 1.0,
      });
    };

    const spawnBurnFrontParticles = (frontX: number) => {
      if (burnParticles.length >= maxBurnParticles) return;

      // 3 interior flames along the burn front
      for (let i = 0; i < 3; i++) {
        if (burnParticles.length >= maxBurnParticles) break;
        const y = 6 + Math.random() * Math.max(12, innerH - 12);
        burnParticles.push({
          x: frontX + (Math.random() - 0.5) * 14,
          y,
          vx: -18 - Math.random() * 35,
          vy: -(32 + Math.random() * 58),
          size: 7 + Math.random() * 11,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 5,
          age: 0,
          maxAge: 0.24 + Math.random() * 0.22,
          kind: 'flame',
          emberHot: true,
        });
      }

      // 2 charred ash flakes peeling backward
      for (let i = 0; i < 2; i++) {
        if (burnParticles.length >= maxBurnParticles) break;
        const y = 6 + Math.random() * Math.max(12, innerH - 12);
        burnParticles.push({
          x: frontX - 4 - Math.random() * 16,
          y,
          vx: -38 - Math.random() * 68,
          vy: -14 - Math.random() * 44,
          size: 2.2 + Math.random() * 3.6,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 9,
          age: 0,
          maxAge: 0.36 + Math.random() * 0.32,
          kind: 'ash',
          emberHot: Math.random() < 0.48,
        });
      }

      // Bright flying spark
      if (Math.random() < 0.85 && burnParticles.length < maxBurnParticles) {
        burnParticles.push({
          x: frontX + (Math.random() - 0.5) * 8,
          y: 8 + Math.random() * Math.max(10, innerH - 16),
          vx: -25 + (Math.random() - 0.5) * 80,
          vy: -(45 + Math.random() * 75),
          size: 1.4 + Math.random() * 1.9,
          rot: 0,
          vRot: 0,
          age: 0,
          maxAge: 0.3 + Math.random() * 0.28,
          kind: 'spark',
          emberHot: true,
        });
      }
    };

    for (let i = 0; i < 60; i++) {
      spawnPerimeterParticle(i % 5 === 0 ? 'ember' : 'flame');
      const p = particles[particles.length - 1];
      if (p) p.age = Math.random() * p.maxAge * 0.7;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const tSec = now * 0.001;

      const burnCtrl = burnControlRef.current;
      const isFlaring = now < burnCtrl.flareUntil;
      const boost = isFlaring ? 1.32 : 1.0;

      // 1. Render perimeter fire canvas
      const totalW = cardW + padX * 2;
      const totalH = cardH + padTop + padBot;
      ctx.clearRect(0, 0, totalW, totalH);

      const spawnCount = isFlaring ? 8 : 5;
      for (let s = 0; s < spawnCount; s++) {
        spawnPerimeterParticle('flame', boost);
      }
      if (Math.random() < (isFlaring ? 0.95 : 0.7)) {
        spawnPerimeterParticle('ember', boost);
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.maxAge) {
          particles.splice(i, 1);
          continue;
        }

        const life = p.age / p.maxAge;
        const curl =
          Math.sin(tSec * 11 + p.phase + life * 6) *
          (p.kind === 'flame' ? 28 : 42);
        p.x += (p.vx + curl) * dt;
        p.y += p.vy * dt;
        p.vy *= 1 - dt * 0.55;

        if (p.kind === 'flame') {
          const r = p.radius * (1.0 - life * 0.58);
          const alpha =
            Math.sin(Math.min(1, life * 1.15) * Math.PI) * (1 - life * 0.35);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(0.74, p.stretchY);

          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, r));
          if (life < 0.24) {
            grad.addColorStop(0, `rgba(255, 252, 220, ${alpha * 0.92})`);
            grad.addColorStop(0.42, `rgba(255, 195, 55, ${alpha * 0.72})`);
            grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
          } else if (life < 0.62) {
            grad.addColorStop(0, `rgba(255, 175, 45, ${alpha * 0.78})`);
            grad.addColorStop(0.48, `rgba(245, 78, 12, ${alpha * 0.52})`);
            grad.addColorStop(1, 'rgba(185, 28, 28, 0)');
          } else {
            grad.addColorStop(0, `rgba(234, 65, 12, ${alpha * 0.55})`);
            grad.addColorStop(0.55, `rgba(153, 27, 27, ${alpha * 0.28})`);
            grad.addColorStop(1, 'rgba(69, 10, 10, 0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(1, r), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const alpha = (1 - life) * 0.95;
          ctx.fillStyle =
            life < 0.4
              ? `rgba(254, 240, 138, ${alpha})`
              : `rgba(249, 115, 22, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (1 - life * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 2. Render interior burn-sweep canvas when burning away previous sentence
      bCtx.clearRect(0, 0, innerW, innerH);

      if (burnCtrl.active) {
        const rawU = Math.min(
          1,
          Math.max(0, (now - burnCtrl.startTime) / BURN_DURATION_MS)
        );
        // Smooth ease-in-out sweep across the card text
        const p =
          rawU < 0.5
            ? 2 * rawU * rawU
            : 1 - Math.pow(-2 * rawU + 2, 2) / 2;

        const frontPct = -8 + p * 120;
        const frontX = (frontPct / 100) * innerW;

        // Sync outgoing sentence mask & thermal scorch to exact burn front
        if (contentRef.current) {
          const wipeStart = (frontPct - 6.5).toFixed(1);
          const wipeCenter = frontPct.toFixed(1);
          const wipeEnd = (frontPct + 5.5).toFixed(1);
          const mask = `linear-gradient(100deg, transparent ${wipeStart}%, rgba(0,0,0,0.28) ${wipeCenter}%, #000 ${wipeEnd}%)`;
          contentRef.current.style.webkitMaskImage = mask;
          contentRef.current.style.maskImage = mask;
          contentRef.current.style.filter = `contrast(${(1 + p * 0.38).toFixed(
            2
          )}) sepia(${(p * 0.45).toFixed(2)}) brightness(${(
            1 -
            p * 0.22
          ).toFixed(2)})`;
        }

        // Scorched charcoal haze trailing behind the ember line
        if (frontX > -20) {
          const hazeAlpha = (1 - rawU) * 0.55;
          const scorchGrad = bCtx.createLinearGradient(
            Math.max(0, frontX - 75),
            0,
            frontX + 18,
            0
          );
          scorchGrad.addColorStop(0, 'rgba(12, 10, 9, 0)');
          scorchGrad.addColorStop(0.55, `rgba(28, 25, 23, ${hazeAlpha})`);
          scorchGrad.addColorStop(0.88, `rgba(124, 45, 18, ${hazeAlpha * 0.75})`);
          scorchGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
          bCtx.fillStyle = scorchGrad;
          bCtx.fillRect(0, 0, innerW, innerH);
        }

        // Incandescent jagged glowing ember ribbon cutting across the text
        if (frontX > -12 && frontX < innerW + 16) {
          bCtx.save();
          bCtx.globalCompositeOperation = 'lighter';
          const buildBurnCurve = (offsetX: number) => {
            bCtx.beginPath();
            const steps = 16;
            for (let s = 0; s <= steps; s++) {
              const py = (s / steps) * innerH;
              const wobble =
                Math.sin(py * 0.17 + tSec * 28) * 5.2 +
                Math.cos(py * 0.34 - tSec * 19) * 3.1;
              const px = frontX + wobble + offsetX;
              if (s === 0) bCtx.moveTo(px, py);
              else bCtx.lineTo(px, py);
            }
          };

          // Wide red-orange heat halo
          buildBurnCurve(0);
          bCtx.strokeStyle = 'rgba(220, 38, 38, 0.55)';
          bCtx.lineWidth = 14;
          bCtx.lineCap = 'round';
          bCtx.stroke();

          // Bright orange flame core
          buildBurnCurve(1);
          bCtx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
          bCtx.lineWidth = 6;
          bCtx.stroke();

          // White-hot yellow ember seam
          buildBurnCurve(2);
          bCtx.strokeStyle = 'rgba(254, 249, 195, 0.92)';
          bCtx.lineWidth = 2;
          bCtx.stroke();
          bCtx.restore();

          spawnBurnFrontParticles(frontX);
        }

        if (rawU >= 1 && !burnCtrl.completed) {
          burnCtrl.onComplete?.();
        }
      }

      // Draw active interior burn flames, ash flakes, and sparks
      for (let i = burnParticles.length - 1; i >= 0; i--) {
        const bp = burnParticles[i];
        bp.age += dt;
        if (bp.age >= bp.maxAge) {
          burnParticles.splice(i, 1);
          continue;
        }
        const life = bp.age / bp.maxAge;
        bp.x += bp.vx * dt;
        bp.y += bp.vy * dt;
        bp.rot += bp.vRot * dt;

        if (bp.kind === 'flame') {
          const r = bp.size * (1 - life * 0.55);
          const alpha = Math.sin(Math.min(1, life * 1.15) * Math.PI) * 0.88;
          bCtx.save();
          bCtx.globalCompositeOperation = 'lighter';
          bCtx.translate(bp.x, bp.y);
          bCtx.scale(0.8, 1.4);
          const g = bCtx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, r));
          g.addColorStop(0, `rgba(255, 248, 210, ${alpha})`);
          g.addColorStop(0.45, `rgba(249, 115, 22, ${alpha * 0.72})`);
          g.addColorStop(1, 'rgba(185, 28, 28, 0)');
          bCtx.fillStyle = g;
          bCtx.beginPath();
          bCtx.arc(0, 0, Math.max(1, r), 0, Math.PI * 2);
          bCtx.fill();
          bCtx.restore();
        } else if (bp.kind === 'ash') {
          const alpha = (1 - life) * 0.85;
          bCtx.save();
          bCtx.translate(bp.x, bp.y);
          bCtx.rotate(bp.rot);
          bCtx.fillStyle = bp.emberHot && life < 0.45
            ? `rgba(234, 88, 12, ${alpha})`
            : `rgba(41, 37, 36, ${alpha})`;
          bCtx.strokeStyle = bp.emberHot && life < 0.6
            ? `rgba(251, 146, 60, ${alpha * 0.85})`
            : `rgba(87, 83, 78, ${alpha * 0.4})`;
          bCtx.lineWidth = 0.8;
          bCtx.beginPath();
          bCtx.moveTo(-bp.size, -bp.size * 0.5);
          bCtx.lineTo(bp.size * 0.9, -bp.size * 0.3);
          bCtx.lineTo(bp.size * 0.5, bp.size * 0.75);
          bCtx.lineTo(-bp.size * 0.7, bp.size * 0.4);
          bCtx.closePath();
          bCtx.fill();
          bCtx.stroke();
          bCtx.restore();
        } else {
          const alpha = (1 - life) * 0.95;
          bCtx.save();
          bCtx.globalCompositeOperation = 'lighter';
          bCtx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
          bCtx.beginPath();
          bCtx.arc(bp.x, bp.y, bp.size * (1 - life * 0.45), 0, Math.PI * 2);
          bCtx.fill();
          bCtx.restore();
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const displayedQuery = shown.kind === 'query' ? shown.query : null;
  const displayedFeedback = shown.kind === 'feedback' ? shown.feedback : null;
  const isUp = displayedQuery ? !displayedQuery.change.startsWith('-') : true;

  return (
    <div className="pointer-events-auto w-full max-w-2xl mx-auto pt-2 sm:pt-2.5">
      <div ref={frameRef} className="fire-stroke-frame shadow-2xl">
        {/* Real-time turbulent fire & rising ember sparks along all stroke edges */}
        <canvas
          ref={fireCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute -left-[28px] -top-[32px] z-0"
          style={{
            width: 'calc(100% + 56px)',
            height: 'calc(100% + 56px)',
          }}
        />

        <div
          ref={innerCardRef}
          className="relative z-10 overflow-hidden bg-slate-950/96 rounded-[11px] px-4 py-2.5 sm:px-5 sm:py-3 text-slate-100"
        >
          {/* Interior Burn-Sweep Overlay Canvas (burning ember edge, interior flames, drifting ash) */}
          <canvas
            ref={burnCanvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 w-full h-full"
          />

          <div
            ref={contentRef}
            key={
              displayedFeedback
                ? `fb-${displayedFeedback.text}`
                : `q-${displayedQuery?.id}`
            }
            className={phase === 'entering' ? 'sentence-ember-enter' : undefined}
          >
            {displayedFeedback ? (
              <div className="flex items-center justify-between gap-3 py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  {displayedFeedback.profit >= 0 ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                  )}
                  <span className="text-sm sm:text-lg font-bold text-white truncate">
                    {displayedFeedback.text}
                  </span>
                </div>
                <span
                  className={`font-mono tabular-nums text-sm sm:text-lg font-black shrink-0 ${
                    displayedFeedback.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {displayedFeedback.profit >= 0 ? '+' : ''}$
                  {displayedFeedback.profit.toLocaleString()}
                </span>
              </div>
            ) : displayedQuery ? (
              <div className="flex flex-col gap-1">
                {/* Minimal Metadata Row */}
                <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-mono tabular-nums">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-white tracking-wide truncate">
                      {displayedQuery.ticker}
                    </span>
                    <span className="text-slate-300 font-semibold">
                      {displayedQuery.price}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span
                      className={
                        isUp ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'
                      }
                    >
                      {displayedQuery.change}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {streak > 1 && (
                      <>
                        <span className="font-bold text-amber-400">{streak}x</span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                      </>
                    )}
                    <span className="font-bold text-amber-300">
                      +${displayedQuery.profit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Minimal Bigger Query Text */}
                <p className="text-base sm:text-xl font-bold text-white leading-snug tracking-tight">
                  {displayedQuery.question}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

