import * as THREE from 'three';
import {
  createPremiumDollarFloorTextures,
  createDollarBillTrailTexture,
  createStackedEdgeTexture,
} from './textures';

/**
 * Non-Linear Egyptian Temple Corridor & 90-Degree Corner Architecture Builder.
 * Builds segment-local 3D geometry so TrackManager can assemble endless
 * looping circuits with 90-degree left/right corners, sculpted Egyptian
 * sandstone reliefs, papyrus colonnades, overhead architrave ribs, and
 * uneven stacked-dollar floors.
 */

function createEgyptianWallTextures(maxAnisotropy = 8): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 1024;
  const h = 512;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bctx = bumpCanvas.getContext('2d')!;

  // 1. Warm Weathered Desert Sandstone Base
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#5a3f1e');
  bg.addColorStop(0.18, '#926b39');
  bg.addColorStop(0.55, '#a87f47');
  bg.addColorStop(0.84, '#845f32');
  bg.addColorStop(1, '#493318');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  bctx.fillStyle = 'rgb(125, 125, 125)';
  bctx.fillRect(0, 0, w, h);

  // Subtle sandstone mineral grain & sediment strata
  for (let i = 0; i < 2400; i++) {
    const gx = (i * 197) % w;
    const gy = (i * 89) % h;
    const gw = 4 + (i % 18);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(232, 198, 134, 0.08)' : 'rgba(42, 26, 10, 0.1)';
    ctx.fillRect(gx, gy, gw, 2);

    const bVal = i % 2 === 0 ? 142 : 108;
    bctx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
    bctx.fillRect(gx, gy, gw, 2);
  }

  // 2. Ashlar Sandstone Masonry Block Course Lines
  const rowHeights = [72, 148, 232, 318, 404];
  for (let r = 0; r < rowHeights.length; r++) {
    const ry = rowHeights[r];
    ctx.fillStyle = 'rgba(32, 20, 8, 0.55)';
    ctx.fillRect(0, ry - 2, w, 4);
    bctx.fillStyle = 'rgb(42, 42, 42)';
    bctx.fillRect(0, ry - 2, w, 4);

    const offset = (r % 2) * 64;
    const prevY = r === 0 ? 72 : rowHeights[r - 1];
    for (let x = offset; x < w; x += 128) {
      ctx.fillStyle = 'rgba(32, 20, 8, 0.45)';
      ctx.fillRect(x, prevY, 3, ry - prevY);
      bctx.fillStyle = 'rgb(48, 48, 48)';
      bctx.fillRect(x, prevY, 3, ry - prevY);

      ctx.fillStyle = (r + x / 128) % 2 === 0 ? 'rgba(255, 224, 160, 0.045)' : 'rgba(20, 10, 2, 0.06)';
      ctx.fillRect(x + 4, prevY + 3, 122, ry - prevY - 6);
    }
  }

  // 3. Upper Cavetto Cornice Reed Fluting & Gold/Lapis Lotus Frieze
  ctx.fillStyle = '#3d2a13';
  ctx.fillRect(0, 0, w, 72);
  bctx.fillStyle = 'rgb(165, 165, 165)';
  bctx.fillRect(0, 0, w, 72);

  for (let x = 0; x < w; x += 32) {
    const col = x % 96 === 0 ? '#b45309' : x % 96 === 32 ? '#0f766e' : '#1e3a8a';
    ctx.fillStyle = col;
    ctx.fillRect(x + 3, 8, 26, 42);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, 8, 26, 42);

    bctx.fillStyle = 'rgb(215, 215, 215)';
    bctx.fillRect(x + 5, 10, 22, 38);
  }

  ctx.fillStyle = '#c89e46';
  ctx.fillRect(0, 58, w, 12);
  ctx.fillStyle = '#573b17';
  ctx.fillRect(0, 70, w, 4);
  bctx.fillStyle = 'rgb(245, 245, 245)';
  bctx.fillRect(0, 58, w, 12);

  // 4. Three Carved Temple Relief Bays per Tile
  const bayCenters = [170, 512, 854];

  const drawAnkh = (cx: number, cy: number, scale: number, targetCtx: CanvasRenderingContext2D, stroke: string) => {
    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.scale(scale, scale);
    targetCtx.strokeStyle = stroke;
    targetCtx.lineWidth = 6;
    targetCtx.lineCap = 'round';
    targetCtx.beginPath();
    targetCtx.ellipse(0, -24, 13, 17, 0, 0, Math.PI * 2);
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.moveTo(-24, -4);
    targetCtx.lineTo(24, -4);
    targetCtx.moveTo(0, -6);
    targetCtx.lineTo(0, 36);
    targetCtx.stroke();
    targetCtx.restore();
  };

  const drawEyeOfHorus = (cx: number, cy: number, scale: number, targetCtx: CanvasRenderingContext2D, stroke: string) => {
    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.scale(scale, scale);
    targetCtx.strokeStyle = stroke;
    targetCtx.lineWidth = 5;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.beginPath();
    targetCtx.moveTo(-36, -16);
    targetCtx.quadraticCurveTo(0, -34, 38, -14);
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.moveTo(-30, 0);
    targetCtx.quadraticCurveTo(0, -18, 32, 0);
    targetCtx.quadraticCurveTo(0, 16, -30, 0);
    targetCtx.stroke();
    targetCtx.fillStyle = stroke;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, 8, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.beginPath();
    targetCtx.moveTo(-2, 12);
    targetCtx.lineTo(-2, 34);
    targetCtx.moveTo(10, 11);
    targetCtx.quadraticCurveTo(22, 26, 34, 24);
    targetCtx.stroke();
    targetCtx.restore();
  };

  const drawWingedSun = (cx: number, cy: number, targetCtx: CanvasRenderingContext2D, stroke: string, fill: string) => {
    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.fillStyle = fill;
    targetCtx.strokeStyle = stroke;
    targetCtx.lineWidth = 2.5;
    for (const dir of [-1, 1]) {
      targetCtx.beginPath();
      targetCtx.moveTo(dir * 16, -4);
      targetCtx.quadraticCurveTo(dir * 68, -22, dir * 116, -8);
      targetCtx.lineTo(dir * 96, 12);
      targetCtx.quadraticCurveTo(dir * 52, 8, dir * 16, 8);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.stroke();
    }
    targetCtx.beginPath();
    targetCtx.arc(0, 0, 15, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();
    targetCtx.restore();
  };

  bayCenters.forEach((cx, bayIdx) => {
    drawWingedSun(cx, 108, ctx, '#78350f', '#d9a441');
    drawWingedSun(cx, 108, bctx, 'rgb(240,240,240)', 'rgb(210,210,210)');

    const px = cx - 122;
    const py = 142;
    const pw = 244;
    const ph = 244;
    ctx.fillStyle = 'rgba(46, 30, 12, 0.34)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);

    bctx.fillStyle = 'rgb(88, 88, 88)';
    bctx.fillRect(px, py, pw, ph);
    bctx.strokeStyle = 'rgb(228, 228, 228)';
    bctx.lineWidth = 4;
    bctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = '#6f4e25';
    ctx.beginPath();
    ctx.roundRect(cx - 56, py + 24, 112, 196, 54);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.stroke();

    bctx.fillStyle = 'rgb(175, 175, 175)';
    bctx.beginPath();
    bctx.roundRect(cx - 56, py + 24, 112, 196, 54);
    bctx.fill();
    bctx.strokeStyle = 'rgb(245, 245, 245)';
    bctx.lineWidth = 5;
    bctx.stroke();

    if (bayIdx === 0) {
      drawEyeOfHorus(cx, py + 95, 1.05, ctx, '#fde047');
      drawEyeOfHorus(cx, py + 95, 1.05, bctx, 'rgb(245, 245, 245)');
      drawAnkh(cx, py + 172, 0.72, ctx, '#2dd4bf');
      drawAnkh(cx, py + 172, 0.72, bctx, 'rgb(230, 230, 230)');
    } else if (bayIdx === 1) {
      drawAnkh(cx, py + 102, 1.15, ctx, '#facc15');
      drawAnkh(cx, py + 102, 1.15, bctx, 'rgb(245, 245, 245)');
      drawEyeOfHorus(cx, py + 182, 0.72, ctx, '#38bdf8');
      drawEyeOfHorus(cx, py + 182, 0.72, bctx, 'rgb(230, 230, 230)');
    } else {
      drawEyeOfHorus(cx, py + 110, 1.1, ctx, '#facc15');
      drawEyeOfHorus(cx, py + 110, 1.1, bctx, 'rgb(245, 245, 245)');
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, py + 150);
      ctx.lineTo(cx + 30, py + 198);
      ctx.lineTo(cx - 30, py + 198);
      ctx.closePath();
      ctx.stroke();

      bctx.strokeStyle = 'rgb(245, 245, 245)';
      bctx.lineWidth = 4;
      bctx.beginPath();
      bctx.moveTo(cx, py + 150);
      bctx.lineTo(cx + 30, py + 198);
      bctx.lineTo(cx - 30, py + 198);
      bctx.closePath();
      bctx.stroke();
    }

    for (const side of [-1, 1]) {
      const colX = cx + side * 88;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(colX - 20, py + 22, 40, ph - 44);

      for (let g = 0; g < 5; g++) {
        const gy = py + 44 + g * 38;
        ctx.fillStyle = g % 2 === 0 ? '#facc15' : '#2dd4bf';
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2.5;
        bctx.fillStyle = 'rgb(220, 220, 220)';
        bctx.strokeStyle = 'rgb(220, 220, 220)';
        bctx.lineWidth = 2.5;

        if (g % 3 === 0) {
          ctx.beginPath();
          ctx.arc(colX, gy, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(colX, gy, 3, 0, Math.PI * 2);
          ctx.fill();
          bctx.beginPath();
          bctx.arc(colX, gy, 8, 0, Math.PI * 2);
          bctx.stroke();
        } else if (g % 3 === 1) {
          for (const target of [ctx, bctx]) {
            target.beginPath();
            target.moveTo(colX - 12, gy - 4);
            target.lineTo(colX - 4, gy + 4);
            target.lineTo(colX + 4, gy - 4);
            target.lineTo(colX + 12, gy + 4);
            target.stroke();
          }
        } else {
          for (const target of [ctx, bctx]) {
            target.beginPath();
            target.moveTo(colX - 10, gy - 8);
            target.lineTo(colX + 10, gy - 8);
            target.moveTo(colX, gy - 8);
            target.lineTo(colX, gy + 10);
            target.stroke();
          }
        }
      }
    }
  });

  // 5. Lower Carved Egyptian Chevron & Stone Dado Band
  ctx.fillStyle = '#533818';
  ctx.fillRect(0, 412, w, 100);
  bctx.fillStyle = 'rgb(160, 160, 160)';
  bctx.fillRect(0, 412, w, 100);

  ctx.fillStyle = '#c89e46';
  ctx.fillRect(0, 408, w, 8);
  bctx.fillStyle = 'rgb(235, 235, 235)';
  bctx.fillRect(0, 408, w, 8);

  for (let x = 0; x < w; x += 48) {
    ctx.strokeStyle = x % 96 === 0 ? '#d9a441' : '#14b8a6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 496);
    ctx.lineTo(x + 24, 428);
    ctx.lineTo(x + 48, 496);
    ctx.stroke();

    bctx.strokeStyle = 'rgb(225, 225, 225)';
    bctx.lineWidth = 3;
    bctx.beginPath();
    bctx.moveTo(x, 496);
    bctx.lineTo(x + 24, 428);
    bctx.lineTo(x + 48, 496);
    bctx.stroke();
  }

  const shadowGrad = ctx.createLinearGradient(0, 0, 0, h);
  shadowGrad.addColorStop(0, 'rgba(16, 10, 4, 0.45)');
  shadowGrad.addColorStop(0.18, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(0.84, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(1, 'rgba(12, 8, 3, 0.65)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, w, h);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 1);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 1);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

function createProceduralCeilCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 128) {
    ctx.fillStyle = '#855b27';
    ctx.fillRect(0, y, 512, 32);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, y + 4, 512, 3);
    ctx.fillRect(0, y + 25, 512, 3);
    ctx.strokeStyle = '#452b0f';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, y, 512, 32);
  }

  ctx.fillStyle = '#fde047';
  for (let sx = 24; sx < 512; sx += 48) {
    for (let sy = 48; sy < 512; sy += 64) {
      if (sy % 128 < 36) continue;
      const cx = sx + ((sy % 3) * 12);
      const cy = sy;
      const spikes = 5;
      const outerR = 6;
      const innerR = 2.5;

      ctx.beginPath();
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.fill();
    }
  }

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(25, 14, 4, 0.72)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
  grad.addColorStop(1, 'rgba(25, 14, 4, 0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return canvas;
}

function createTurnWarningBannerTexture(turnDir: 'left' | 'right', maxAnisotropy = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1206';
  ctx.fillRect(0, 0, 512, 192);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 176);

  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 156);

  ctx.fillStyle = '#fde047';
  ctx.font = '900 54px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = turnDir === 'left' ? '◄ TURN LEFT' : 'TURN RIGHT ►';
  ctx.fillText(text, 256, 78);

  ctx.fillStyle = '#fb923c';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('TIME TURN IN GOLD ZONE!', 256, 138);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createTurnFloorZoneTexture(turnDir: 'left' | 'right', maxAnisotropy = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  // Glowing golden perimeter frame marking the exact Turn Timing Window
  ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
  ctx.fillRect(16, 16, 480, 480);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 14;
  ctx.strokeRect(16, 16, 480, 480);

  // Directional chevrons pointing left or right
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const dirSign = turnDir === 'left' ? 1 : -1;

  for (let row = 0; row < 3; row++) {
    const cy = 128 + row * 128;
    const cx = 256;
    ctx.beginPath();
    ctx.moveTo(cx - dirSign * 42, cy - 44);
    ctx.lineTo(cx + dirSign * 52, cy);
    ctx.lineTo(cx - dirSign * 42, cy + 44);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export class FpsCorridor {
  public readonly width: number = 6.3;
  public readonly height: number = 4.6;
  public readonly sectionLength: number = 24.0;
  public readonly cornerPivotZ: number = 16.0;
  public readonly cornerEndZ: number = 19.15; // cornerPivotZ + width * 0.5
  private readonly baysPerSection: number = 3;

  private wallMaterial: THREE.MeshStandardMaterial;
  private cornerWallMaterial: THREE.MeshStandardMaterial;
  private shortWallMaterial: THREE.MeshStandardMaterial;
  private baseWallMap: THREE.CanvasTexture;
  private baseWallBumpMap: THREE.CanvasTexture;
  private ceilMaterial: THREE.MeshStandardMaterial;
  private floorMaterial: THREE.MeshStandardMaterial;
  private sandstoneTrimMat: THREE.MeshStandardMaterial;
  private capitalGoldMat: THREE.MeshStandardMaterial;
  private bronzeBracketMat: THREE.MeshStandardMaterial;
  private flameGlowMat: THREE.MeshStandardMaterial;
  private turnLeftSignMat: THREE.MeshBasicMaterial;
  private turnRightSignMat: THREE.MeshBasicMaterial;
  private turnLeftFloorMat: THREE.MeshBasicMaterial;
  private turnRightFloorMat: THREE.MeshBasicMaterial;
  private cashBrickMaterials: THREE.MeshStandardMaterial[] = [];

  private wallGeom: THREE.PlaneGeometry;
  private cornerLongWallGeom: THREE.PlaneGeometry;
  private cornerShortWallGeom: THREE.PlaneGeometry;
  private cornerBackWallGeom: THREE.PlaneGeometry;
  private ceilGeom: THREE.PlaneGeometry;
  private cornerCeilGeom: THREE.PlaneGeometry;
  private floorGeom: THREE.PlaneGeometry;
  private cornerFloorGeom: THREE.PlaneGeometry;
  private turnSignGeom: THREE.PlaneGeometry;
  private turnZoneFloorGeom: THREE.PlaneGeometry;
  private cashBrickGeom: THREE.BoxGeometry;

  // Composite 3D Egyptian Wall Colonnade & Brazier Geometries
  private plinthGeom: THREE.BoxGeometry;
  private shaftGeom: THREE.CylinderGeometry;
  private capitalGeom: THREE.CylinderGeometry;
  private abacusGeom: THREE.BoxGeometry;
  private overheadRibGeom: THREE.BoxGeometry;
  private brazierBracketGeom: THREE.BoxGeometry;
  private brazierBowlGeom: THREE.CylinderGeometry;
  private brazierFlameGeom: THREE.OctahedronGeometry;

  private textures: THREE.Texture[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(_scene: THREE.Scene, maxAnisotropy = 8) {
    // 1. Carved Egyptian Sandstone Bas-Relief Wall Material (Color + Bump + Subtle Torch Emissive)
    const wallTex = createEgyptianWallTextures(maxAnisotropy);
    this.baseWallMap = wallTex.map;
    this.baseWallBumpMap = wallTex.bumpMap;
    this.textures.push(wallTex.map, wallTex.bumpMap);

    this.wallMaterial = this.createWallMaterialInstance(wallTex.map, wallTex.bumpMap);
    this.cornerWallMaterial = this.createWallMaterial(2.4, 1);
    this.shortWallMaterial = this.createWallMaterial(1.6, 1);
    const endWallMaterial = this.createWallMaterial(0.85, 1);

    this.sandstoneTrimMat = new THREE.MeshStandardMaterial({
      color: 0x9b7643,
      roughness: 0.86,
      metalness: 0.06,
      envMapIntensity: 0.35,
    });

    this.capitalGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a438,
      emissive: 0x452b08,
      emissiveIntensity: 0.22,
      roughness: 0.32,
      metalness: 0.82,
      envMapIntensity: 0.8,
    });

    this.bronzeBracketMat = new THREE.MeshStandardMaterial({
      color: 0x452b16,
      roughness: 0.48,
      metalness: 0.78,
    });

    this.flameGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.3,
      roughness: 0.25,
      metalness: 0.0,
    });

    const leftSignTex = createTurnWarningBannerTexture('left', maxAnisotropy);
    const rightSignTex = createTurnWarningBannerTexture('right', maxAnisotropy);
    const leftFloorTex = createTurnFloorZoneTexture('left', maxAnisotropy);
    const rightFloorTex = createTurnFloorZoneTexture('right', maxAnisotropy);
    this.textures.push(leftSignTex, rightSignTex, leftFloorTex, rightFloorTex);

    this.turnLeftSignMat = new THREE.MeshBasicMaterial({ map: leftSignTex });
    this.turnRightSignMat = new THREE.MeshBasicMaterial({ map: rightSignTex });
    this.turnLeftFloorMat = new THREE.MeshBasicMaterial({
      map: leftFloorTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.turnRightFloorMat = new THREE.MeshBasicMaterial({
      map: rightFloorTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });

    this.materials.push(
      this.wallMaterial,
      this.sandstoneTrimMat,
      this.capitalGoldMat,
      this.bronzeBracketMat,
      this.flameGlowMat,
      this.turnLeftSignMat,
      this.turnRightSignMat,
      this.turnLeftFloorMat,
      this.turnRightFloorMat
    );

    // 2. Ceiling texture - Royal Egyptian Astronomical Star Ceiling
    const ceilProceduralTex = new THREE.CanvasTexture(createProceduralCeilCanvas());
    ceilProceduralTex.colorSpace = THREE.SRGBColorSpace;
    ceilProceduralTex.wrapS = THREE.RepeatWrapping;
    ceilProceduralTex.wrapT = THREE.RepeatWrapping;
    ceilProceduralTex.repeat.set(2, 4);
    ceilProceduralTex.anisotropy = maxAnisotropy;
    this.textures.push(ceilProceduralTex);

    this.ceilMaterial = new THREE.MeshStandardMaterial({
      map: ceilProceduralTex,
      emissiveMap: ceilProceduralTex,
      emissive: 0x3b2f18,
      emissiveIntensity: 0.38,
      roughness: 0.72,
      metalness: 0.2,
      envMapIntensity: 0.55,
      color: 0x9c824c,
    });
    this.materials.push(this.ceilMaterial);

    // 3. Floor texture - Matte Stacked $100 Dollar Bundles
    const dollarFloor = createPremiumDollarFloorTextures(maxAnisotropy);
    dollarFloor.map.repeat.set(2, 8);
    dollarFloor.roughnessMap.repeat.set(2, 8);
    dollarFloor.bumpMap.repeat.set(2, 8);
    this.textures.push(dollarFloor.map, dollarFloor.roughnessMap, dollarFloor.bumpMap);

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: dollarFloor.map,
      roughnessMap: dollarFloor.roughnessMap,
      bumpMap: dollarFloor.bumpMap,
      bumpScale: 0.055,
      roughness: 1.0,
      metalness: 0.0,
      envMapIntensity: 0.05,
      color: 0xffffff,
    });
    this.materials.push(this.floorMaterial);

    // 3D Stacked Cash Brick Materials
    const billTopTex = createDollarBillTrailTexture(maxAnisotropy);
    const billEdgeTex = createStackedEdgeTexture(maxAnisotropy);
    this.textures.push(billTopTex, billEdgeTex);

    const topMat = new THREE.MeshStandardMaterial({
      map: billTopTex,
      roughness: 1.0,
      metalness: 0.0,
      envMapIntensity: 0.05,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      map: billEdgeTex,
      roughness: 1.0,
      metalness: 0.0,
      envMapIntensity: 0.05,
    });
    this.cashBrickMaterials = [edgeMat, edgeMat, topMat, topMat, edgeMat, edgeMat];
    this.materials.push(topMat, edgeMat);

    // 4. Shared Sculpted Wall & Uneven Floor Geometries (Straight + 90° Corner)
    this.wallGeom = new THREE.PlaneGeometry(this.sectionLength, this.height, 96, 20);
    this.sculptEgyptianWallGeometry(this.wallGeom, this.sectionLength, this.baysPerSection);

    const cornerClosedLen = this.cornerEndZ; // 19.15
    this.cornerLongWallGeom = new THREE.PlaneGeometry(cornerClosedLen, this.height, 72, 20);
    this.sculptEgyptianWallGeometry(this.cornerLongWallGeom, cornerClosedLen, 2.4);

    const cornerOpenLen = this.cornerPivotZ - this.width * 0.5; // 12.85
    this.cornerShortWallGeom = new THREE.PlaneGeometry(cornerOpenLen, this.height, 48, 20);
    this.sculptEgyptianWallGeometry(this.cornerShortWallGeom, cornerOpenLen, 1.6);

    this.cornerBackWallGeom = new THREE.PlaneGeometry(this.width, this.height, 28, 20);
    this.sculptEgyptianWallGeometry(this.cornerBackWallGeom, this.width, 1);

    this.ceilGeom = new THREE.PlaneGeometry(this.width, this.sectionLength);
    this.cornerCeilGeom = new THREE.PlaneGeometry(this.width, cornerClosedLen);

    this.floorGeom = new THREE.PlaneGeometry(this.width, this.sectionLength, 32, 64);
    this.sculptDollarFloorGeometry(this.floorGeom, this.sectionLength);

    this.cornerFloorGeom = new THREE.PlaneGeometry(this.width, cornerClosedLen, 32, 48);
    this.sculptDollarFloorGeometry(this.cornerFloorGeom, cornerClosedLen);

    this.turnSignGeom = new THREE.PlaneGeometry(4.2, 1.45);
    this.turnZoneFloorGeom = new THREE.PlaneGeometry(4.4, 5.2);

    this.cashBrickGeom = new THREE.BoxGeometry(0.68, 0.14, 0.36);

    // Composite Egyptian Papyrus Column, Architrave Beam & Torch Sconce Geometries
    this.plinthGeom = new THREE.BoxGeometry(0.76, 0.42, 0.78);
    this.shaftGeom = new THREE.CylinderGeometry(0.24, 0.32, 3.15, 10);
    this.capitalGeom = new THREE.CylinderGeometry(0.42, 0.24, 0.52, 10);
    this.abacusGeom = new THREE.BoxGeometry(0.72, 0.26, 0.72);
    this.overheadRibGeom = new THREE.BoxGeometry(this.width + 0.1, 0.34, 0.56);
    this.brazierBracketGeom = new THREE.BoxGeometry(0.66, 0.1, 0.14);
    this.brazierBowlGeom = new THREE.CylinderGeometry(0.2, 0.09, 0.22, 8);
    this.brazierFlameGeom = new THREE.OctahedronGeometry(0.16, 0);

    this.geometries.push(
      this.wallGeom,
      this.cornerLongWallGeom,
      this.cornerShortWallGeom,
      this.cornerBackWallGeom,
      this.ceilGeom,
      this.cornerCeilGeom,
      this.floorGeom,
      this.cornerFloorGeom,
      this.turnSignGeom,
      this.turnZoneFloorGeom,
      this.cashBrickGeom,
      this.plinthGeom,
      this.shaftGeom,
      this.capitalGeom,
      this.abacusGeom,
      this.overheadRibGeom,
      this.brazierBracketGeom,
      this.brazierBowlGeom,
      this.brazierFlameGeom
    );

    // Store endWallMaterial ref on corner back wall via userData or class field
    this.endWallMat = endWallMaterial;
  }

  private endWallMat: THREE.MeshStandardMaterial;

  private createWallMaterialInstance(map: THREE.Texture, bumpMap: THREE.Texture): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.11,
      emissiveMap: map,
      emissive: 0x5c3e18,
      emissiveIntensity: 0.34,
      roughness: 0.82,
      metalness: 0.08,
      envMapIntensity: 0.45,
      color: 0xffffff,
    });
  }

  /**
   * Creates a wall material sharing the carved Egyptian sandstone bas-relief
   * texture & bump map with custom UV repeat/offset so divider walls match
   * the left and right corridor walls seamlessly.
   */
  public createWallMaterial(
    repeatX: number,
    repeatY = 1,
    offsetX = 0,
    offsetY = 0
  ): THREE.MeshStandardMaterial {
    const map = this.baseWallMap.clone();
    map.needsUpdate = true;
    map.repeat.set(repeatX, repeatY);
    map.offset.set(offsetX, offsetY);

    const bumpMap = this.baseWallBumpMap.clone();
    bumpMap.needsUpdate = true;
    bumpMap.repeat.set(repeatX, repeatY);
    bumpMap.offset.set(offsetX, offsetY);

    const mat = this.createWallMaterialInstance(map, bumpMap);
    this.textures.push(map, bumpMap);
    this.materials.push(mat);
    return mat;
  }

  /**
   * Returns cropped bas-relief wall face materials sampled directly from the
   * Egyptian temple wall textures, plus a rough raw-sandstone interior core
   * material for fractured cross-section edges.
   */
  public createWallDebrisMaterialSet(): {
    carvedFaces: THREE.MeshStandardMaterial[];
    innerCore: THREE.MeshStandardMaterial;
  } {
    const carvedFaces = [
      this.createWallMaterial(0.26, 0.25, 0.37, 0.72), // Upper gold/lapis reed frieze & winged sun
      this.createWallMaterial(0.24, 0.34, 0.38, 0.34), // Carved cartouche & temple relief bay
      this.createWallMaterial(0.28, 0.32, 0.08, 0.28), // Weathered ashlar masonry joints
      this.createWallMaterial(0.26, 0.24, 0.56, 0.03), // Lower chevron dado & gold trim band
    ];

    const coreBump = this.baseWallBumpMap.clone();
    coreBump.needsUpdate = true;
    coreBump.repeat.set(0.45, 0.45);
    coreBump.offset.set(0.15, 0.2);

    const innerCore = new THREE.MeshStandardMaterial({
      color: 0x7b582c,
      bumpMap: coreBump,
      bumpScale: 0.16,
      roughness: 0.96,
      metalness: 0.02,
      envMapIntensity: 0.18,
    });

    this.textures.push(coreBump);
    this.materials.push(innerCore);
    return { carvedFaces, innerCore };
  }

  public getTrimMaterial(): THREE.MeshStandardMaterial {
    return this.sandstoneTrimMat;
  }

  private sculptEgyptianWallGeometry(geom: THREE.PlaneGeometry, wallLen: number, bays: number) {
    const pos = geom.attributes.position;
    const halfLen = wallLen * 0.5;
    const halfH = this.height * 0.5;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);

      const u = (vx + halfLen) / wallLen;
      const v = (vy + halfH) / this.height;
      const bayPhase = u * Math.PI * 2 * bays;

      const bayWave = Math.cos(bayPhase);
      const steppedButtress = Math.tanh(bayWave * 2.8) * 0.34;
      const harmonicCarve = Math.sin(bayPhase * 2) * 0.08 + Math.cos(bayPhase * 3 + v * 3.14) * 0.04;

      const batterSlope = Math.sin(v * Math.PI * 0.85) * 0.22;
      const cavettoFlare = v > 0.8 ? -Math.pow((v - 0.8) / 0.2, 1.8) * 0.26 : 0;

      const lowerPlinth = v < 0.18 ? (1 - v / 0.18) * 0.22 : 0;
      const midTorusRoll = Math.exp(-Math.pow((v - 0.78) / 0.04, 2)) * 0.12;

      // Taper relief smoothly near ends so corner edges join cleanly
      const endFade = Math.min(1, Math.min(u, 1 - u) * 8);
      const reliefDepth = (steppedButtress + harmonicCarve) * endFade + batterSlope + cavettoFlare + lowerPlinth + midTorusRoll;
      pos.setZ(i, reliefDepth);
    }

    pos.needsUpdate = true;
    geom.computeVertexNormals();
  }

  private sampleDollarFloorOffset(x: number, zInSection: number, lengthRef = this.sectionLength): number {
    const phaseZ = (zInSection / lengthRef) * Math.PI * 2;
    const mounds =
      Math.sin(phaseZ * 2 + x * 0.95) * 0.042 +
      Math.cos(phaseZ * 3 - x * 1.35) * 0.03 +
      Math.sin(phaseZ * 5 + x * 2.05) * 0.018;
    const steps = Math.tanh(Math.sin(phaseZ * 4 + x * 1.15) * 2.4) * 0.028;

    const edgeRatio = Math.min(1, Math.abs(x) / (this.width * 0.5));
    const edgeBank =
      Math.pow(edgeRatio, 2.0) *
      (0.14 +
        0.11 * Math.sin(phaseZ * 3 + Math.sign(x) * 1.1) +
        0.05 * Math.cos(phaseZ * 5 + x * 1.8));

    return mounds + steps + edgeBank;
  }

  private sculptDollarFloorGeometry(geom: THREE.PlaneGeometry, floorLen: number) {
    const pos = geom.attributes.position;
    const halfLen = floorLen * 0.5;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const zInSection = halfLen - vy;
      const heightOffset = this.sampleDollarFloorOffset(vx, zInSection, floorLen);
      pos.setZ(i, heightOffset);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
  }

  private addColumnPair(parent: THREE.Group, zPos: number, includeLeft: boolean, includeRight: boolean, includeRib: boolean) {
    const halfW = this.width * 0.5;
    for (const side of [-1, 1] as const) {
      if (side === 1 && !includeLeft) continue;
      if (side === -1 && !includeRight) continue;
      const colX = side * (halfW - 0.36);

      const plinth = new THREE.Mesh(this.plinthGeom, this.sandstoneTrimMat);
      plinth.position.set(colX, 0.0, zPos);
      parent.add(plinth);

      const shaft = new THREE.Mesh(this.shaftGeom, this.sandstoneTrimMat);
      shaft.position.set(colX, 1.78, zPos);
      parent.add(shaft);

      const capital = new THREE.Mesh(this.capitalGeom, this.capitalGoldMat);
      capital.position.set(colX, 3.6, zPos);
      parent.add(capital);

      const abacus = new THREE.Mesh(this.abacusGeom, this.sandstoneTrimMat);
      abacus.position.set(colX, 3.98, zPos);
      parent.add(abacus);
    }

    if (includeRib) {
      const rib = new THREE.Mesh(this.overheadRibGeom, this.sandstoneTrimMat);
      rib.position.set(0, this.height - 0.36, zPos);
      parent.add(rib);
    }
  }

  private addBrazierOnWall(parent: THREE.Group, side: -1 | 1, zPos: number) {
    const halfW = this.width * 0.5;
    const bracket = new THREE.Mesh(this.brazierBracketGeom, this.bronzeBracketMat);
    bracket.position.set(side * (halfW - 0.02), 2.05, zPos);
    parent.add(bracket);

    const bowlX = side * (halfW - 0.30);
    const bowl = new THREE.Mesh(this.brazierBowlGeom, this.capitalGoldMat);
    bowl.position.set(bowlX, 2.18, zPos);
    parent.add(bowl);

    const flame = new THREE.Mesh(this.brazierFlameGeom, this.flameGlowMat);
    flame.scale.set(0.85, 1.45, 0.85);
    flame.position.set(bowlX, 2.42, zPos);
    parent.add(flame);
  }

  private addCashStacks(parent: THREE.Group, sectionIndex: number, floorLen: number, count: number) {
    const cashStacks = new THREE.InstancedMesh(
      this.cashBrickGeom,
      this.cashBrickMaterials,
      count
    );
    cashStacks.receiveShadow = true;
    cashStacks.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const seed = sectionIndex * 97 + i * 31;
      const pseudoA = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
      const pseudoB = Math.abs(Math.sin((seed + 7) * 78.233) * 43758.5453) % 1;
      const pseudoC = Math.abs(Math.sin((seed + 19) * 39.425) * 43758.5453) % 1;

      const zPos = 0.6 + ((i + 0.5) / count) * (floorLen - 1.2);
      const isFlank = i % 3 !== 0;
      const sideSign = i % 2 === 0 ? -1 : 1;
      const bx = isFlank
        ? sideSign * (1.45 + pseudoA * 1.15)
        : (pseudoA - 0.5) * 2.2;

      const scaleY = isFlank ? 0.75 + pseudoB * 1.85 : 0.32 + pseudoB * 0.42;
      const scaleXZ = 0.85 + pseudoC * 0.45;
      const floorY = -0.21 + this.sampleDollarFloorOffset(bx, zPos, floorLen);

      dummy.position.set(bx, floorY + 0.07 * scaleY - 0.02, zPos);
      dummy.rotation.set(
        (pseudoB - 0.5) * 0.14,
        (pseudoA - 0.5) * 1.1,
        (pseudoC - 0.5) * 0.14
      );
      dummy.scale.set(scaleXZ, scaleY, scaleXZ);
      dummy.updateMatrix();
      cashStacks.setMatrixAt(i, dummy.matrix);
    }
    cashStacks.instanceMatrix.needsUpdate = true;
    cashStacks.computeBoundingSphere();
    parent.add(cashStacks);
  }

  /**
   * Build a 24m straight Egyptian temple corridor section in segment-local space (+Z forward).
   */
  public buildStraightSection(sectionIndex: number): THREE.Group {
    const section = new THREE.Group();
    const halfW = this.width * 0.5;
    const len = this.sectionLength;

    const leftWall = new THREE.Mesh(this.wallGeom, this.wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-halfW, this.height * 0.5 - 0.2, len * 0.5);
    leftWall.receiveShadow = true;
    section.add(leftWall);

    const rightWall = new THREE.Mesh(this.wallGeom, this.wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(halfW, this.height * 0.5 - 0.2, len * 0.5);
    rightWall.receiveShadow = true;
    section.add(rightWall);

    const ceiling = new THREE.Mesh(this.ceilGeom, this.ceilMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, this.height - 0.2, len * 0.5);
    ceiling.receiveShadow = true;
    section.add(ceiling);

    const floorMesh = new THREE.Mesh(this.floorGeom, this.floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -0.21, len * 0.5);
    floorMesh.receiveShadow = true;
    section.add(floorMesh);

    const bayStep = len / this.baysPerSection;
    for (let b = 0; b < this.baysPerSection; b++) {
      const colZ = b * bayStep;
      this.addColumnPair(section, colZ, true, true, true);
      const alcoveZ = colZ + bayStep * 0.5;
      this.addBrazierOnWall(section, -1, alcoveZ);
      this.addBrazierOnWall(section, 1, alcoveZ);
    }

    this.addCashStacks(section, sectionIndex, len, 36);
    return section;
  }

  /**
   * Build a 90-degree Egyptian temple corner hub (z: 0..19.15, open exit on +X for 'left' or -X for 'right').
   * Note: in segment-local coords facing +Z, +X is screen-left and -X is screen-right.
   */
  public buildCornerSection(sectionIndex: number, turnDir: 'left' | 'right'): THREE.Group {
    const section = new THREE.Group();
    const halfW = this.width * 0.5; // 3.15
    const closedLen = this.cornerEndZ; // 19.15
    const openLen = this.cornerPivotZ - halfW; // 12.85

    // Floor & ceiling extending cleanly through the corner hub (0..19.15)
    const floorMesh = new THREE.Mesh(this.cornerFloorGeom, this.floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -0.21, closedLen * 0.5);
    floorMesh.receiveShadow = true;
    section.add(floorMesh);

    const ceiling = new THREE.Mesh(this.cornerCeilGeom, this.ceilMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, this.height - 0.2, closedLen * 0.5);
    ceiling.receiveShadow = true;
    section.add(ceiling);

    // Closed outer side wall (opposite to the turn direction) runs full 0..19.15
    // Open side wall stops cleanly at 12.85 to open into the 90-deg corridor!
    const isLeftTurn = turnDir === 'left';

    if (isLeftTurn) {
      // +X is open (left on screen); -X is closed wall (right on screen)
      const closedRightWall = new THREE.Mesh(this.cornerLongWallGeom, this.cornerWallMaterial);
      closedRightWall.rotation.y = Math.PI / 2;
      closedRightWall.position.set(-halfW, this.height * 0.5 - 0.2, closedLen * 0.5);
      section.add(closedRightWall);

      const openLeftWall = new THREE.Mesh(this.cornerShortWallGeom, this.shortWallMaterial);
      openLeftWall.rotation.y = -Math.PI / 2;
      openLeftWall.position.set(halfW, this.height * 0.5 - 0.2, openLen * 0.5);
      section.add(openLeftWall);
    } else {
      // -X is open (right on screen); +X is closed wall (left on screen)
      const openRightWall = new THREE.Mesh(this.cornerShortWallGeom, this.shortWallMaterial);
      openRightWall.rotation.y = Math.PI / 2;
      openRightWall.position.set(-halfW, this.height * 0.5 - 0.2, openLen * 0.5);
      section.add(openRightWall);

      const closedLeftWall = new THREE.Mesh(this.cornerLongWallGeom, this.cornerWallMaterial);
      closedLeftWall.rotation.y = -Math.PI / 2;
      closedLeftWall.position.set(halfW, this.height * 0.5 - 0.2, closedLen * 0.5);
      section.add(closedLeftWall);
    }

    // Dead-End Sculpted Egyptian Sandstone Wall Straight Ahead (z = 19.15)
    const deadEndWall = new THREE.Mesh(this.cornerBackWallGeom, this.endWallMat);
    deadEndWall.rotation.y = Math.PI; // Faces back toward incoming runner (-Z_local)
    deadEndWall.position.set(0, this.height * 0.5 - 0.2, closedLen);
    deadEndWall.receiveShadow = true;
    section.add(deadEndWall);

    // Monumental Directional Turn Warning Banner mounted on the dead-end wall
    const signMat = isLeftTurn ? this.turnLeftSignMat : this.turnRightSignMat;
    const signMesh = new THREE.Mesh(this.turnSignGeom, signMat);
    signMesh.rotation.y = Math.PI;
    signMesh.position.set(0, 2.35, closedLen - 0.26);
    section.add(signMesh);

    // Glowing Golden Turn-Timing Zone Floor Marker (z = 12.0 .. 17.2)
    const zoneMat = isLeftTurn ? this.turnLeftFloorMat : this.turnRightFloorMat;
    const zoneMesh = new THREE.Mesh(this.turnZoneFloorGeom, zoneMat);
    zoneMesh.rotation.x = -Math.PI / 2;
    zoneMesh.position.set(0, -0.02, 14.6);
    section.add(zoneMesh);

    // Entry colonnade columns & glowing warning braziers
    this.addColumnPair(section, 0, true, true, true);
    this.addColumnPair(section, 8.0, true, true, true);
    // Corner exit gateway column at the open doorway edge (z = 12.85)
    this.addColumnPair(section, openLen, isLeftTurn, !isLeftTurn, false);
    this.addBrazierOnWall(section, -1, 4.0);
    this.addBrazierOnWall(section, 1, 4.0);

    // Warm torchlight filling the 90° intersection hub and spilling down the turn exit corridor
    const hubLight = new THREE.PointLight(0xffbe6b, 2.6, 22, 1.15);
    hubLight.position.set(0, 3.55, this.cornerPivotZ);
    section.add(hubLight);

    const exitLight = new THREE.PointLight(0xfde68a, 2.2, 24, 1.15);
    exitLight.position.set(isLeftTurn ? 6.5 : -6.5, 2.95, this.cornerPivotZ);
    section.add(exitLight);

    this.addCashStacks(section, sectionIndex, closedLen - 1.0, 22);
    return section;
  }

  public dispose() {
    this.textures.forEach((t) => t.dispose());
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
