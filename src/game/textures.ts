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
