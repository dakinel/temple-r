import * as THREE from 'three';

/**
 * Procedural texture generator for Stock Market Ticker Tape Runner.
 * Generates high-resolution canvas textures entirely in code with zero external assets.
 */

// Live Stock Market Ticker Tape texture with ticker symbols, green/red ticks, and matrix perforations
export function createStockMarketTapeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Sleek Egyptian dark basalt & gold-leaf terminal background
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 512);
  bgGrad.addColorStop(0, '#120d08');
  bgGrad.addColorStop(0.5, '#1a140d');
  bgGrad.addColorStop(1, '#120d08');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // 2. Micro Dot-Matrix & Chart Grid
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 0; x < 1024; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // 3. Ticker Tape Perforated Tractor-Feed Margins (Pharaoh's gold accented sprocket holes)
  ctx.fillStyle = '#2d2012';
  for (let x = 16; x < 1024; x += 32) {
    // Top sprocket hole
    ctx.beginPath();
    ctx.arc(x, 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bottom sprocket hole
    ctx.beginPath();
    ctx.arc(x, 498, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 4. Glowing Gold & Emerald Horizontal Ticker Rails
  // Top gold leaf rail
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(1024, 28);
  ctx.stroke();

  // Bottom gold leaf rail
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, 484);
  ctx.lineTo(1024, 484);
  ctx.stroke();

  // Center Lane Dividers (Dashed cyan & gold)
  ctx.shadowBlur = 0;
  ctx.setLineDash([16, 12]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 180);
  ctx.lineTo(1024, 180);
  ctx.moveTo(0, 332);
  ctx.lineTo(1024, 332);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // 5. Procedural Candlestick Mini-Chart Background Behind Tape
  for (let col = 0; col < 32; col++) {
    const cx = col * 32 + 16;
    const isBull = (col * 7 + 3) % 5 !== 0;
    const bodyHeight = 18 + ((col * 13) % 36);
    const bodyY = 220 + ((col * 29) % 80);

    ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = isBull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 1.5;

    // Wick
    ctx.beginPath();
    ctx.moveTo(cx, bodyY - 14);
    ctx.lineTo(cx, bodyY + bodyHeight + 14);
    ctx.stroke();

    // Candle Body
    ctx.fillRect(cx - 6, bodyY, 12, bodyHeight);
  }

  // 6. High-Contrast Stock Market Ticker Typography
  ctx.font = 'bold 22px "JetBrains Mono", "Courier New", monospace';
  ctx.textBaseline = 'middle';

  // Band 1: Tech & Growth Titans (Top Lane)
  const tickersBand1 = [
    { sym: 'NVDA', price: '$145.20', chg: '+4.8%', up: true },
    { sym: 'AAPL', price: '$238.10', chg: '+1.9%', up: true },
    { sym: 'MSFT', price: '$446.50', chg: '+1.4%', up: true },
    { sym: 'TSLA', price: '$282.10', chg: '-2.4%', up: false },
    { sym: 'AMZN', price: '$206.50', chg: '+3.1%', up: true },
  ];

  let curX = 24;
  const yBand1 = 104;
  for (let loop = 0; loop < 2; loop++) {
    for (const item of tickersBand1) {
      // Symbol
      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.sym, curX, yBand1);
      curX += ctx.measureText(item.sym).width + 8;

      // Arrow & Delta
      ctx.fillStyle = item.up ? '#10b981' : '#ef4444';
      const arrow = item.up ? '▲' : '▼';
      ctx.fillText(`${arrow} ${item.price}`, curX, yBand1);
      curX += ctx.measureText(`${arrow} ${item.price}`).width + 8;

      // Percentage Change in pill highlight
      ctx.fillStyle = item.up ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      const chgWidth = ctx.measureText(item.chg).width + 12;
      ctx.fillRect(curX - 4, yBand1 - 12, chgWidth, 24);
      ctx.fillStyle = item.up ? '#34d399' : '#f87171';
      ctx.fillText(item.chg, curX + 2, yBand1);
      curX += chgWidth + 24;
    }
  }

  // Band 2: Crypto, Commodities & Global Indices (Center Lane)
  const tickersBand2 = [
    { sym: 'BTC', price: '$94,800', chg: '+6.2%', up: true },
    { sym: 'SPY', price: '$598.40', chg: '+0.9%', up: true },
    { sym: 'ETH', price: '$3,480', chg: '+4.1%', up: true },
    { sym: 'QQQ', price: '$512.20', chg: '+1.5%', up: true },
    { sym: 'SOL', price: '$218.00', chg: '+8.4%', up: true },
    { sym: 'DOW', price: '$43,910', chg: '-0.3%', up: false },
  ];

  curX = 16;
  const yBand2 = 256;
  for (let loop = 0; loop < 2; loop++) {
    for (const item of tickersBand2) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(item.sym, curX, yBand2);
      curX += ctx.measureText(item.sym).width + 8;

      ctx.fillStyle = item.up ? '#10b981' : '#ef4444';
      const arrow = item.up ? '▲' : '▼';
      ctx.fillText(`${arrow} ${item.price}`, curX, yBand2);
      curX += ctx.measureText(`${arrow} ${item.price}`).width + 8;

      ctx.fillStyle = item.up ? '#34d399' : '#f87171';
      ctx.fillText(item.chg, curX, yBand2);
      curX += ctx.measureText(item.chg).width + 24;
    }
  }

  // Band 3: Wall Street Tickers & Volume (Bottom Lane)
  const tickersBand3 = [
    { sym: 'GOOGL', price: '$182.90', chg: '+2.2%', up: true },
    { sym: 'META', price: '$580.30', chg: '+2.7%', up: true },
    { sym: 'AMD', price: '$148.60', chg: '-1.6%', up: false },
    { sym: 'BULL', price: 'INDEX', chg: '+99.9%', up: true },
    { sym: 'NYSE', price: 'VOL 5.2B', chg: 'ACTIVE', up: true },
  ];

  curX = 32;
  const yBand3 = 408;
  for (let loop = 0; loop < 2; loop++) {
    for (const item of tickersBand3) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(item.sym, curX, yBand3);
      curX += ctx.measureText(item.sym).width + 8;

      ctx.fillStyle = item.up ? '#10b981' : '#ef4444';
      const arrow = item.up ? '▲' : '▼';
      ctx.fillText(`${arrow} ${item.price}`, curX, yBand3);
      curX += ctx.measureText(`${arrow} ${item.price}`).width + 8;

      ctx.fillStyle = item.up ? '#34d399' : '#f87171';
      ctx.fillText(item.chg, curX, yBand3);
      curX += ctx.measureText(item.chg).width + 24;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Gold bullion dollar coin texture ($ symbol and reeded edges)
export function createCoinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Outer gold rim
  const grad = ctx.createRadialGradient(100, 100, 10, cx, cy, 120);
  grad.addColorStop(0, '#fff478');
  grad.addColorStop(0.4, '#f59e0b');
  grad.addColorStop(0.8, '#d97706');
  grad.addColorStop(1, '#78350f');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();

  // Outer milled coin rim
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner beveled circle
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 104, 0, Math.PI * 2);
  ctx.stroke();

  // Inner metallic coin face
  const innerGrad = ctx.createRadialGradient(110, 110, 20, cx, cy, 100);
  innerGrad.addColorStop(0, '#fef08a');
  innerGrad.addColorStop(0.6, '#f59e0b');
  innerGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 100, 0, Math.PI * 2);
  ctx.fill();

  // Embossed Bold Dollar Sign ($)
  ctx.font = '900 115px "JetBrains Mono", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Emboss shadow
  ctx.fillStyle = '#78350f';
  ctx.fillText('$', cx + 4, cy + 4);

  // Emboss highlight
  ctx.fillStyle = '#ffffff';
  ctx.fillText('$', cx - 2, cy - 2);

  // Gold surface fill
  ctx.fillStyle = '#ffd700';
  ctx.fillText('$', cx, cy);

  // Rim stars / dots
  ctx.fillStyle = '#78350f';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const sx = cx + Math.cos(a) * 88;
    const sy = cy + Math.sin(a) * 88;
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Financial Candlestick barrier texture (green & red market candles with wicks)
export function createCandlestickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 256);

  // Draw vertical candle stripes
  const candleW = 32;
  for (let c = 0; c < 8; c++) {
    const x = c * candleW + 4;
    const isBull = c % 2 === 0;
    const bodyY = 60 + ((c * 17) % 80);
    const bodyH = 80 + ((c * 23) % 60);

    // Wick
    ctx.strokeStyle = isBull ? '#34d399' : '#f87171';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + candleW / 2, 20);
    ctx.lineTo(x + candleW / 2, 236);
    ctx.stroke();

    // Body
    ctx.fillStyle = isBull ? '#10b981' : '#ef4444';
    ctx.fillRect(x + 4, bodyY, candleW - 8, bodyH);

    ctx.strokeStyle = isBull ? '#6ee7b7' : '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 4, bodyY, candleW - 8, bodyH);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Red Market Crash Barrier warning texture
export function createCrashBarrierTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Red and black warning stripes
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#111827';
  const stripeW = 32;
  for (let x = -128; x < 512 + 128; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW + 48, 128);
    ctx.lineTo(x + 48, 128);
    ctx.closePath();
    ctx.fill();
  }

  // Center badge: "MARKET CRASH ▼ JUMP!"
  ctx.fillStyle = '#000000';
  ctx.fillRect(64, 28, 384, 72);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.strokeRect(64, 28, 384, 72);

  ctx.font = '900 28px "JetBrains Mono", sans-serif';
  ctx.fillStyle = '#f87171';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CRASH DIP ▼ JUMP!', 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Margin Call Laser Overhead Bar
export function createMarginCallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#450a0a';
  ctx.fillRect(0, 0, 512, 128);

  // Caution neon borders
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.font = '900 32px "JetBrains Mono", sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠ MARGIN CALL ⚠', 256, 50);

  ctx.font = 'bold 20px "JetBrains Mono", sans-serif';
  ctx.fillStyle = '#fca5a5';
  ctx.fillText('SLIDE UNDER TO LIQUIDATE DEBT', 256, 88);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Diamond Hands 💎 token texture
export function createDiamondTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Cyan glowing outer circle
  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 118);
  grad.addColorStop(0, '#a5f3fc');
  grad.addColorStop(0.5, '#06b6d4');
  grad.addColorStop(1, '#083344');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Diamond shape
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 60);
  ctx.lineTo(cx + 60, cy - 10);
  ctx.lineTo(cx, cy + 70);
  ctx.lineTo(cx - 60, cy - 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Diamond facets
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 60);
  ctx.lineTo(cx, cy + 70);
  ctx.lineTo(cx + 60, cy - 10);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Particle spark texture
export function createSparkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(16, 185, 129, 0.9)');
  grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.4)');
  grad.addColorStop(1, 'rgba(6, 182, 212, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Matte Stacked Dollar Bundles Floor Textures (Color + Roughness + Bump).
 * Renders overlapping, layered stacks of green $100 bills with visible stacked
 * paper-sheet edges, fanned top bills, currency straps, and completely matte
 * cotton-linen paper roughness (zero shine).
 */
export function createPremiumDollarFloorTextures(maxAnisotropy = 8): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  // Base deep dark forest crevice between stacks (matte, recessed)
  ctx.fillStyle = '#07140c';
  ctx.fillRect(0, 0, size, size);

  // Entire roughness map stays strictly matte (238..255) so floor has zero shine
  rctx.fillStyle = 'rgb(252, 252, 252)';
  rctx.fillRect(0, 0, size, size);

  bctx.fillStyle = 'rgb(18, 18, 18)';
  bctx.fillRect(0, 0, size, size);

  // Draw one engraved matte green $100 bill centered at (0, 0) in local transform
  const drawBillFace = (
    targetCtx: CanvasRenderingContext2D,
    targetBump: CanvasRenderingContext2D,
    w: number,
    h: number,
    shadeBoost: number,
    serialNum: string,
    hasStrap: boolean
  ) => {
    const x = -w / 2;
    const y = -h / 2;

    // 1. Matte cotton-linen green bill paper
    const g1 = Math.round(92 * shadeBoost);
    const g2 = Math.round(118 * shadeBoost);
    const r1 = Math.round(30 * shadeBoost);
    const b1 = Math.round(52 * shadeBoost);
    const paperGrad = targetCtx.createLinearGradient(x, y, x + w, y + h);
    paperGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
    paperGrad.addColorStop(0.5, `rgb(${Math.round(r1 * 1.25)}, ${g2}, ${Math.round(b1 * 1.15)})`);
    paperGrad.addColorStop(1, `rgb(${Math.round(r1 * 0.85)}, ${Math.round(g1 * 0.88)}, ${Math.round(b1 * 0.88)})`);
    targetCtx.fillStyle = paperGrad;
    targetCtx.fillRect(x, y, w, h);

    // Subtle crisp bill border & inner parchment tint
    targetCtx.fillStyle = 'rgba(210, 240, 216, 0.14)';
    targetCtx.fillRect(x + 12, y + 10, w - 24, h - 20);

    // Paper fiber crosshatch
    targetCtx.strokeStyle = 'rgba(190, 235, 200, 0.08)';
    targetCtx.lineWidth = 1;
    for (let lx = x + 10; lx < x + w; lx += 14) {
      targetCtx.beginPath();
      targetCtx.moveTo(lx, y);
      targetCtx.lineTo(lx, y + h);
      targetCtx.stroke();
    }
    for (let ly = y + 10; ly < y + h; ly += 14) {
      targetCtx.beginPath();
      targetCtx.moveTo(x, ly);
      targetCtx.lineTo(x + w, ly);
      targetCtx.stroke();
    }

    // Top bill elevation on bump map
    targetBump.fillStyle = 'rgb(205, 205, 205)';
    targetBump.fillRect(x, y, w, h);

    // 2. Engraved outer frame
    targetCtx.strokeStyle = '#9cd9ad';
    targetCtx.lineWidth = 3.5;
    targetCtx.strokeRect(x + 7, y + 7, w - 14, h - 14);

    targetCtx.strokeStyle = '#143d24';
    targetCtx.lineWidth = 2;
    targetCtx.strokeRect(x + 12, y + 12, w - 24, h - 24);

    targetBump.strokeStyle = 'rgb(225, 225, 225)';
    targetBump.lineWidth = 3;
    targetBump.strokeRect(x + 7, y + 7, w - 14, h - 14);

    // 3. Four corner "100" medallions
    const cxOff = w / 2 - 32;
    const cyOff = h / 2 - 22;
    const corners: [number, number][] = [
      [-cxOff, -cyOff],
      [cxOff, -cyOff],
      [-cxOff, cyOff],
      [cxOff, cyOff],
    ];
    for (const [cx, cy] of corners) {
      targetCtx.fillStyle = '#0f331d';
      targetCtx.beginPath();
      targetCtx.ellipse(cx, cy, 20, 11, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.strokeStyle = '#8fd4a4';
      targetCtx.lineWidth = 1.5;
      targetCtx.stroke();

      targetCtx.font = '900 13px Georgia, "Times New Roman", serif';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillStyle = '#dcfce7';
      targetCtx.fillText('100', cx, cy + 0.5);
    }

    // 4. Center Treasury Oval Medallion & Bold "$"
    targetCtx.fillStyle = '#144427';
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, 44, 34, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.strokeStyle = '#9cd9ad';
    targetCtx.lineWidth = 2.5;
    targetCtx.stroke();

    targetCtx.font = '900 44px Georgia, "Times New Roman", serif';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillStyle = 'rgba(6, 20, 11, 0.55)';
    targetCtx.fillText('$', 2, 2);
    targetCtx.fillStyle = '#d4f5dd';
    targetCtx.fillText('$', 0, 0);

    // 5. Left & Right Treasury Stamps + Serial Number
    targetCtx.strokeStyle = '#7ac48f';
    targetCtx.lineWidth = 1.5;
    targetCtx.beginPath();
    targetCtx.arc(-w * 0.25, 0, 18, 0, Math.PI * 2);
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.arc(w * 0.25, 0, 18, 0, Math.PI * 2);
    targetCtx.stroke();

    targetCtx.font = 'bold 9px "JetBrains Mono", monospace';
    targetCtx.fillStyle = '#bbf7d0';
    targetCtx.fillText(serialNum, -w * 0.25, -cyOff + 4);
    targetCtx.fillText('USA 100', w * 0.25, cyOff - 4);

    // 6. Optional Kraft-Paper Currency Strap ($10,000 Bank Band) around center of bundle
    if (hasStrap) {
      const strapW = 46;
      targetCtx.fillStyle = '#cbb37d';
      targetCtx.fillRect(-strapW / 2, y - 1, strapW, h + 2);

      // Matte paper edge stripes on currency band
      targetCtx.fillStyle = '#8b6f38';
      targetCtx.fillRect(-strapW / 2, y - 1, 4, h + 2);
      targetCtx.fillRect(strapW / 2 - 4, y - 1, 4, h + 2);

      // Band denomination print
      targetCtx.save();
      targetCtx.rotate(-Math.PI / 2);
      targetCtx.font = '900 13px "JetBrains Mono", monospace';
      targetCtx.fillStyle = '#2d210b';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText('$10,000', 0, 0);
      targetCtx.restore();

      targetBump.fillStyle = 'rgb(245, 245, 245)';
      targetBump.fillRect(-strapW / 2, y - 1, strapW, h + 2);
    }

    // Crisp outer paper edge border of top bill
    targetCtx.strokeStyle = '#cde8d3';
    targetCtx.lineWidth = 1.4;
    targetCtx.strokeRect(x, y, w, h);
  };

  // Draw a thick stacked bundle of dollar bills at center (cx, cy)
  const drawDollarStackAt = (
    cx: number,
    cy: number,
    w: number,
    h: number,
    angleRad: number,
    layers: number,
    hasStrap: boolean,
    hasFannedTop: boolean,
    serialNum: string
  ) => {
    const stepX = 3.2;
    const stepY = -3.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    bctx.save();
    bctx.translate(cx, cy);
    bctx.rotate(angleRad);

    // Deep ambient cast shadow underneath the entire stack
    ctx.fillStyle = 'rgba(2, 8, 4, 0.72)';
    ctx.fillRect(-w / 2 - 8, -h / 2 + 10, w + 18, h + 14);
    ctx.fillStyle = 'rgba(2, 8, 4, 0.48)';
    ctx.fillRect(-w / 2 - 14, -h / 2 + 16, w + 28, h + 20);

    // Draw stacked lower dollar bill layers (thick visible deck edges!)
    for (let l = 0; l < layers; l++) {
      const ox = l * stepX;
      const oy = l * stepY;
      const sx = -w / 2 + ox;
      const sy = -h / 2 + oy;
      const shade = 0.62 + (l / layers) * 0.34;
      const edgeLight = l % 2 === 0 ? '#a8ccb0' : '#739c7d';

      // Dark separation line below each bill sheet
      ctx.fillStyle = '#0e2616';
      ctx.fillRect(sx - 1, sy + 2, w + 2, h + 2);

      // Visible stacked paper sheet edge
      ctx.fillStyle = edgeLight;
      ctx.fillRect(sx, sy, w, h);

      // Matte green edge tint along the bill body
      ctx.fillStyle = `rgb(${Math.round(26 * shade)}, ${Math.round(86 * shade)}, ${Math.round(46 * shade)})`;
      ctx.fillRect(sx + 2, sy + 2, w - 4, h - 4);

      // If strapped, wrap the currency band down across the stacked bill edges too
      if (hasStrap) {
        const strapW = 46;
        ctx.fillStyle = l % 2 === 0 ? '#b69d67' : '#9c834f';
        ctx.fillRect(ox - strapW / 2, sy, strapW, h + 2);
      }

      const bumpVal = Math.round(65 + (l / layers) * 120);
      bctx.fillStyle = `rgb(${bumpVal}, ${bumpVal}, ${bumpVal})`;
      bctx.fillRect(sx, sy, w, h);
    }

    // Move to top of stack for the hero top bill
    const topOx = layers * stepX;
    const topOy = layers * stepY;
    ctx.translate(topOx, topOy);
    bctx.translate(topOx, topOy);

    drawBillFace(ctx, bctx, w, h, 1.0, serialNum, hasStrap);

    // Optional slightly fanned extra top dollar bill peeking out
    if (hasFannedTop) {
      ctx.save();
      ctx.translate(8, -6);
      ctx.rotate(0.08);
      ctx.fillStyle = 'rgba(2, 10, 5, 0.5)';
      ctx.fillRect(-w / 2 - 3, -h / 2 + 4, w + 6, h + 4);
      bctx.save();
      bctx.translate(8, -6);
      bctx.rotate(0.08);
      drawBillFace(ctx, bctx, w, h, 1.06, serialNum, false);
      bctx.restore();
      ctx.restore();
    }

    ctx.restore();
    bctx.restore();
  };

  // Draw a stack with seamless horizontal/vertical wrap-around copies
  const drawWrappedStack = (
    cx: number,
    cy: number,
    w: number,
    h: number,
    angleRad: number,
    layers: number,
    hasStrap: boolean,
    hasFannedTop: boolean,
    serialNum: string
  ) => {
    for (let dx = -size; dx <= size; dx += size) {
      for (let dy = -size; dy <= size; dy += size) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx + w < -80 || tx - w > size + 80 || ty + h < -80 || ty - h > size + 80) {
          continue;
        }
        drawDollarStackAt(tx, ty, w, h, angleRad, layers, hasStrap, hasFannedTop, serialNum);
      }
    }
  };

  // Arrange a dense 3x4 staggered bed of stacked dollar bundles (lower stacks first, taller stacks on top)
  const cols = 3;
  const rows = 4;
  const cellW = size / cols;
  const cellH = size / rows;
  const billW = 308;
  const billH = 190;

  // Pass 1: Under-layer filler stacks so no bare empty floor gaps remain
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cx = (c + 0.5) * cellW + ((r % 2 === 0) ? 24 : -24);
      const cy = (r + 0.5) * cellH + ((c % 2 === 0) ? 18 : -18);
      const angle = (((idx * 17) % 11) - 5) * 0.025;
      drawWrappedStack(
        cx,
        cy,
        billW,
        billH,
        angle,
        6,
        false,
        false,
        `B${10 + idx}88`
      );
    }
  }

  // Pass 2: Main prominent stacked bundles with thick sheet edges & bank straps
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const staggerX = (r % 2) * (cellW * 0.5);
      const cx = (c * cellW + staggerX + cellW * 0.5) % size;
      const cy = r * cellH + cellH * 0.48;
      const angle = (((idx * 13) % 9) - 4) * 0.022;
      const hasStrap = (idx % 2 === 0);
      const hasFanned = (idx % 3 === 1);
      const layers = 7 + (idx % 3);
      drawWrappedStack(
        cx,
        cy,
        billW,
        billH,
        angle,
        layers,
        hasStrap,
        hasFanned,
        `WS${800 + idx * 17}`
      );
    }
  }

  // Subtle cotton-paper matte roughness variation (staying within 235..255 = zero shine)
  const rData = rctx.getImageData(0, 0, size, size);
  const px = rData.data;
  for (let i = 0; i < px.length; i += 4) {
    const grain = 238 + ((i * 13) % 17);
    px[i] = grain;
    px[i + 1] = grain;
    px[i + 2] = grain;
    px[i + 3] = 255;
  }
  rctx.putImageData(rData, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap, bumpMap };
}

/**
 * Crisp Single $100 Banknote Texture for 3D Fluttering Money Trail & 3D Cash Bricks.
 */
export function createDollarBillTrailTexture(maxAnisotropy = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Matte US Treasury green paper
  const grad = ctx.createLinearGradient(0, 0, 256, 128);
  grad.addColorStop(0, '#226d40');
  grad.addColorStop(0.5, '#2e8851');
  grad.addColorStop(1, '#1b5833');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  // Inner parchment field
  ctx.fillStyle = 'rgba(216, 245, 222, 0.16)';
  ctx.fillRect(10, 8, 236, 112);

  // Crisp double banknote border
  ctx.strokeStyle = '#a7e3b7';
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, 246, 118);

  ctx.strokeStyle = '#133d24';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(10, 10, 236, 108);

  // Four corner "100" ovals
  const corners: [number, number][] = [
    [28, 22],
    [228, 22],
    [28, 106],
    [228, 106],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = '#0e331c';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#97dbab';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '900 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dcfce7';
    ctx.fillText('100', cx, cy + 0.5);
  }

  // Center oval medallion & "$" emblem
  ctx.fillStyle = '#134427';
  ctx.beginPath();
  ctx.ellipse(128, 64, 34, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9cd9ad';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '900 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(5, 20, 10, 0.55)';
  ctx.fillText('$', 130, 66);
  ctx.fillStyle = '#d9f99d';
  ctx.fillText('$', 128, 64);

  // Left/right stamps
  ctx.strokeStyle = '#7ec994';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(62, 64, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(194, 64, 15, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Stacked Dollar Bill Side-Edge Texture (for 3D uneven cash stacks on the floor).
 */
export function createStackedEdgeTexture(maxAnisotropy = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#537b5b';
  ctx.fillRect(0, 0, 128, 64);

  // Crisp horizontal stacked bill paper layers
  for (let y = 0; y < 64; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? '#a9cdb0' : '#739c7b';
    ctx.fillRect(0, y, 128, 2);
    ctx.fillStyle = '#13311c';
    ctx.fillRect(0, y + 2, 128, 2);
  }

  // Center kraft currency strap band wrapping the side edge
  ctx.fillStyle = '#c8b07a';
  ctx.fillRect(46, 0, 36, 64);
  ctx.fillStyle = '#826832';
  ctx.fillRect(46, 0, 3, 64);
  ctx.fillRect(79, 0, 3, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}



