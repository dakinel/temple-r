import * as THREE from 'three';

/**
 * Procedural texture generator.
 * Creates rich, high-resolution canvas textures entirely in code with zero external assets.
 */

// Stone track texture with carved runes, flagstone blocks, and moss
export function createStoneTrackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base stone gray-brown
  ctx.fillStyle = '#4a443b';
  ctx.fillRect(0, 0, 512, 512);

  // Stone tiles grid
  const rows = 8;
  const cols = 4;
  const tileH = 512 / rows;
  const tileW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = (r % 2) * (tileW * 0.5);
      const x = ((c * tileW + offsetX) % 512);
      const y = r * tileH;

      // Slight color variance
      const stoneShade = 55 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${stoneShade + 10}, ${stoneShade + 6}, ${stoneShade})`;
      ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);

      // Cracks and bevel highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, tileW - 4, tileH - 4);

      // Deep mortar grooves
      ctx.strokeStyle = '#24201a';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, tileW, tileH);

      // Ancient temple carving / runes inside some tiles
      if ((r + c) % 3 === 0) {
        ctx.strokeStyle = 'rgba(20, 16, 12, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const cx = x + tileW * 0.5;
        const cy = y + tileH * 0.5;
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.moveTo(cx - 8, cy);
        ctx.lineTo(cx + 8, cy);
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx, cy + 8);
        ctx.stroke();
      }

      // Moss splotches
      if (Math.random() > 0.4) {
        ctx.fillStyle = 'rgba(38, 68, 28, 0.35)';
        ctx.beginPath();
        ctx.arc(x + Math.random() * tileW, y + Math.random() * tileH, 8 + Math.random() * 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Weathering noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 26;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Gold coin texture with embossed ancient skull/face
export function createCoinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Outer gold rim
  const grad = ctx.createRadialGradient(100, 100, 10, cx, cy, 120);
  grad.addColorStop(0, '#ffe853');
  grad.addColorStop(0.6, '#e5aa17');
  grad.addColorStop(1, '#986803');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();

  // Beaded rim
  ctx.strokeStyle = '#b8820c';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.strokeStyle = '#5a3d02';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 102, 0, Math.PI * 2);
  ctx.stroke();

  // Temple idol / skull face in center
  ctx.fillStyle = '#ffdf4d';
  ctx.strokeStyle = '#7c5404';
  ctx.lineWidth = 5;

  // Face contour
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#4e3300';
  ctx.beginPath();
  ctx.ellipse(cx - 16, cy - 12, 9, 13, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 16, cy - 12, 9, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Grinning teeth / mouth
  ctx.beginPath();
  ctx.rect(cx - 20, cy + 12, 40, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffe853';
  ctx.lineWidth = 2;
  for (let t = -12; t <= 12; t += 8) {
    ctx.moveTo(cx + t, cy + 12);
    ctx.lineTo(cx + t, cy + 26);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Tree bark / wood obstacle texture
export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#442d18';
  ctx.fillRect(0, 0, 256, 256);

  // Wood rings and grain
  for (let i = 0; i < 256; i += 4) {
    ctx.strokeStyle = (i % 8 === 0) ? '#2d1c0c' : '#573d22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.bezierCurveTo(80, i + Math.sin(i * 0.1) * 8, 160, i - Math.cos(i * 0.1) * 8, 256, i);
    ctx.stroke();
  }

  // Lichen/moss patches
  ctx.fillStyle = 'rgba(50, 80, 30, 0.4)';
  for (let k = 0; k < 6; k++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 12 + Math.random() * 15, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Fire billboard particle texture
export function createFireTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, 'rgba(255, 255, 230, 1)');
  grad.addColorStop(0.25, 'rgba(255, 170, 20, 0.9)');
  grad.addColorStop(0.65, 'rgba(230, 60, 5, 0.5)');
  grad.addColorStop(1, 'rgba(180, 20, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
