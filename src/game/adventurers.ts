/**
 * Adventurer presets and DiceBear API integration for adventure avatar faces.
 */

export interface AdventurerProfile {
  id: string;
  name: string;
  seed: string;
  title: string;
  quote: string;
  shirtColor: number;
  vestColor: number;
  pantsColor: number;
  perk: string;
}

export const ADVENTURER_ROSTER: AdventurerProfile[] = [
  {
    id: 'guy',
    name: 'Guy Dangerous',
    seed: 'GuyDangerous',
    title: 'The Intrepid Explorer',
    quote: 'Just another day avoiding ancient curses!',
    shirtColor: 0x3d6b82, // teal
    vestColor: 0x8a5b30, // leather
    pantsColor: 0xb09868, // khaki
    perk: 'Balanced Agility',
  },
  {
    id: 'scarlett',
    name: 'Scarlett Fox',
    seed: 'ScarlettFox',
    title: 'Cunning Escape Artist',
    quote: 'You cannot catch what you cannot see!',
    shirtColor: 0xc43d2b, // crimson
    vestColor: 0x3d2015, // dark leather
    pantsColor: 0x2e2722, // dark brown
    perk: '+15% Coin Magnet Pull',
  },
  {
    id: 'barry',
    name: 'Barry Bones',
    seed: 'BarryBones',
    title: 'City Cop on Vacation',
    quote: 'I definitely should have stayed in Brooklyn.',
    shirtColor: 0x294970, // navy blue
    vestColor: 0x1c2430, // charcoal
    pantsColor: 0x252a33, // dark slate
    perk: 'Reinforced Temple Shield',
  },
  {
    id: 'karma',
    name: 'Karma Lee',
    seed: 'KarmaLee',
    title: 'Swift Shadow Runner',
    quote: 'Swift as the mountain wind.',
    shirtColor: 0x882c82, // royal purple
    vestColor: 0x381236, // deep plum
    pantsColor: 0xd6bf78, // gold silk
    perk: '+10% Speed Recovery',
  },
  {
    id: 'montana',
    name: 'Montana Smith',
    seed: 'MontanaSmith',
    title: 'Legendary Archaeologist',
    quote: 'That idol belongs in a museum!',
    shirtColor: 0xcc9b52, // sand gold
    vestColor: 0x693f1c, // rugged brown
    pantsColor: 0x473829, // earth
    perk: '+20% Score Multiplier',
  },
  {
    id: 'zack',
    name: 'Zack Wonder',
    seed: 'ZackWonder',
    title: 'Adrenaline Daredevil',
    quote: 'If you are not living on the edge, you take up too much room!',
    shirtColor: 0x1f9185, // aqua emerald
    vestColor: 0xd95f43, // blaze orange
    pantsColor: 0x263e47, // deep forest
    perk: 'Turbo Boost Duration',
  },
];

/**
 * Returns high-resolution SVG avatar URL from DiceBear API Adventurer collection.
 */
export function getDiceBearAvatarUrl(seed: string, isBack: boolean = false): string {
  const cleanSeed = encodeURIComponent(seed.trim() || 'Adventurer');
  const bg = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
  if (isBack) {
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${cleanSeed}&flip=true&eyes=&mouth=&eyebrows=&glassesProbability=0&featuresProbability=0&backgroundColor=${bg}`;
  }
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${cleanSeed}&backgroundColor=${bg}`;
}

export interface AvatarPalette {
  skinColor: string;
  skinShadow: string;
  hairColor: string;
  hairHighlight: string;
  hairShadow: string;
  accessoryColor?: string;
  hasHat?: boolean;
  hasBandana?: boolean;
}

// Color math helpers
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const num = parseInt(hex, 16) || 0;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

function adjustBrightness(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

/**
 * Extracts authentic skin, hair, and accessory colors from a DiceBear Adventurer SVG.
 */
export function extractAvatarPalette(svgText: string, seed: string = ''): AvatarPalette {
  // Extract skin fill
  const skinMatch = svgText.match(/clip-rule="evenodd"[^>]*fill="([^"]+)"/i);
  let skinColor = skinMatch ? skinMatch[1] : '';

  // Extract all fills
  const fills = Array.from(svgText.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/gi)).map((m) => m[1]);
  const nonBlackFills = Array.from(
    new Set(
      fills
        .map((f) => f.toLowerCase())
        .filter(
          (f) =>
            !['#000', '#000000', '#fff', '#ffffff', '#8f2e45', '#ea869e'].includes(f)
        )
    )
  );

  if (!skinColor) {
    skinColor = nonBlackFills[0] || '#ecad80';
  }

  const remaining = nonBlackFills.filter((f) => f !== skinColor.toLowerCase());

  let hairColor = '#4a2d18';
  let accessoryColor: string | undefined = undefined;

  if (remaining.length > 0) {
    hairColor = remaining[remaining.length - 1];
    if (remaining.length > 1) {
      accessoryColor = remaining[0];
    }
  }

  // Fallbacks by seed if SVG text was empty/fallback
  if (seed.toLowerCase().includes('montana')) {
    hairColor = '#592454';
  } else if (seed.toLowerCase().includes('scarlett')) {
    hairColor = '#e5d7a3';
    accessoryColor = '#d31e1e';
  } else if (seed.toLowerCase().includes('zack')) {
    hairColor = '#85c2c6';
    accessoryColor = '#1f9185';
  } else if (seed.toLowerCase().includes('guy')) {
    hairColor = '#e5d7a3';
  } else if (seed.toLowerCase().includes('barry')) {
    hairColor = '#592454';
  } else if (seed.toLowerCase().includes('karma')) {
    hairColor = '#e5d7a3';
  }

  const hasHat =
    seed.toLowerCase().includes('montana') ||
    svgText.toLowerCase().includes('#592454') ||
    svgText.includes('fill="#000"><path d="M534 131');
  const hasBandana =
    seed.toLowerCase().includes('scarlett') ||
    seed.toLowerCase().includes('zack') ||
    Boolean(accessoryColor);

  return {
    skinColor,
    skinShadow: adjustBrightness(skinColor, 0.76),
    hairColor,
    hairHighlight: adjustBrightness(hairColor, 1.30),
    hairShadow: adjustBrightness(hairColor, 0.68),
    accessoryColor,
    hasHat,
    hasBandana,
  };
}

/**
 * In-engine Generator Mechanic:
 * Synthesizes the authentic BACK OF THE HEAD for any DiceBear Adventurer avatar.
 * Renders the back skull cranium, styled hair mass, nape hairline, back ears,
 * neck cervical contour, comic cel-shading highlights, and engraved medallion border.
 */
export function createBackHeadCanvas(
  palette: AvatarPalette,
  hairOverlaySvgImg?: HTMLImageElement
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = 256;
  const cy = 256;
  const radius = 244;

  ctx.clearRect(0, 0, 512, 512);

  // 1. Circular Medallion Clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // 2. Warm Adventurer Parchment Background Gradient
  const bgGrad = ctx.createRadialGradient(cx, cy - 40, 40, cx, cy, 260);
  bgGrad.addColorStop(0, '#fae1c3');
  bgGrad.addColorStop(0.7, '#e4b686');
  bgGrad.addColorStop(1, '#c99661');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle radial energy lines inside medallion
  ctx.strokeStyle = '#dfa872';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 250, cy + Math.sin(a) * 250);
    ctx.stroke();
  }

  // 3. Lower Head & Neck Silhouette (in avatar's authentic skin color)
  ctx.fillStyle = palette.skinColor;
  ctx.beginPath();
  ctx.moveTo(172, 310);
  ctx.bezierCurveTo(162, 400, 138, 460, 115, 512);
  ctx.lineTo(397, 512);
  ctx.bezierCurveTo(374, 460, 350, 400, 340, 310);
  ctx.closePath();
  ctx.fill();

  // Neck dark ink boundary outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(172, 310);
  ctx.bezierCurveTo(162, 400, 138, 460, 115, 512);
  ctx.moveTo(340, 310);
  ctx.bezierCurveTo(374, 460, 350, 400, 397, 512);
  ctx.stroke();

  // Nape central spinal furrow shadow (trapezius definition)
  ctx.fillStyle = palette.skinShadow;
  ctx.beginPath();
  ctx.moveTo(256, 335);
  ctx.bezierCurveTo(250, 380, 246, 440, 240, 512);
  ctx.lineTo(272, 512);
  ctx.bezierCurveTo(266, 440, 262, 380, 256, 335);
  ctx.fill();

  // Left & right neck tendon lines
  ctx.strokeStyle = palette.skinShadow;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(195, 340);
  ctx.quadraticCurveTo(205, 410, 185, 490);
  ctx.moveTo(317, 340);
  ctx.quadraticCurveTo(307, 410, 327, 490);
  ctx.stroke();

  // 4. Back of Ears (Left and Right)
  const drawBackEar = (isLeft: boolean) => {
    ctx.save();
    const earX = isLeft ? 142 : 370;
    const earY = 278;
    const rot = isLeft ? -0.15 : 0.15;

    // Outer ear cartilage lobe
    ctx.fillStyle = palette.skinColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(earX, earY, 26, 42, rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Back of ear concha groove & antihelix shadow
    ctx.fillStyle = palette.skinShadow;
    ctx.beginPath();
    ctx.ellipse(
      earX + (isLeft ? 6 : -6),
      earY - 2,
      14,
      24,
      rot,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Comic cartilage crease line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      earX + (isLeft ? 4 : -4),
      earY + 4,
      12,
      isLeft ? 0.3 : Math.PI - 0.3,
      isLeft ? Math.PI * 0.85 : Math.PI * 1.7
    );
    ctx.stroke();
    ctx.restore();
  };
  drawBackEar(true);
  drawBackEar(false);

  // 5. Full Back Cranium Hair Mass (Covers skull in avatar's authentic hair color)
  ctx.fillStyle = palette.hairColor;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;

  // Main cranial dome
  ctx.beginPath();
  ctx.ellipse(cx, 215, 148, 134, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Styled Nape Hairline & Base Hair Tufts (curves naturally at base of skull)
  ctx.fillStyle = palette.hairColor;
  ctx.beginPath();
  ctx.moveTo(140, 255);
  ctx.bezierCurveTo(160, 325, 195, 355, 222, 342);
  ctx.lineTo(234, 368); // Left nape tuft
  ctx.lineTo(248, 348);
  ctx.lineTo(256, 362); // Center nape tuft
  ctx.lineTo(264, 348);
  ctx.lineTo(278, 368); // Right nape tuft
  ctx.lineTo(290, 342);
  ctx.bezierCurveTo(317, 355, 352, 325, 372, 255);
  ctx.bezierCurveTo(385, 210, 380, 160, 360, 120);
  ctx.bezierCurveTo(320, 92, 192, 92, 152, 120);
  ctx.bezierCurveTo(132, 160, 127, 210, 140, 255);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6. Layer Avatar's Authentic Hair SVG (if provided)
  if (hairOverlaySvgImg) {
    ctx.save();
    // Horizontally mirrored overlay to maintain back perspective
    ctx.drawImage(hairOverlaySvgImg, 12, 12, 488, 488);
    ctx.restore();
  }

  // 7. Cel-Shaded Comic Hair Volume Highlights
  // Upper-left crown highlight glint
  ctx.fillStyle = palette.hairHighlight;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(225, 150, 85, 36, -0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Hair Cowlick / Crown Strands (comic ink detailing)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  // Center swirl
  ctx.arc(256, 175, 10, 0, Math.PI * 1.5);
  // Radiating hair strands
  ctx.moveTo(256, 175);
  ctx.quadraticCurveTo(220, 190, 190, 240);
  ctx.moveTo(256, 175);
  ctx.quadraticCurveTo(292, 190, 322, 240);
  ctx.moveTo(256, 175);
  ctx.quadraticCurveTo(256, 230, 256, 310);
  ctx.moveTo(240, 185);
  ctx.quadraticCurveTo(210, 240, 160, 280);
  ctx.moveTo(272, 185);
  ctx.quadraticCurveTo(302, 240, 352, 280);
  ctx.stroke();

  // Nape shadow crescent at base of hair
  ctx.fillStyle = palette.hairShadow;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(cx, 330, 115, 24, 0, 0, Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // 8. Headwear / Accessory Detailing
  if (palette.hasHat) {
    // Back of Fedora Hat (e.g., Montana Smith)
    ctx.fillStyle = palette.hairColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;

    // Curved back brim
    ctx.beginPath();
    ctx.ellipse(cx, 252, 182, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Brim dark underside shadow
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.ellipse(cx, 260, 172, 34, 0, 0, Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Crown of fedora rising above brim
    ctx.fillStyle = palette.hairColor;
    ctx.beginPath();
    ctx.moveTo(135, 245);
    ctx.bezierCurveTo(140, 145, 170, 115, 256, 115);
    ctx.bezierCurveTo(342, 115, 372, 145, 377, 245);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark leather hatband
    ctx.fillStyle = '#1c1815';
    ctx.beginPath();
    ctx.moveTo(140, 244);
    ctx.bezierCurveTo(180, 255, 332, 255, 372, 244);
    ctx.lineTo(373, 228);
    ctx.bezierCurveTo(332, 239, 180, 239, 139, 228);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (palette.hasBandana && palette.accessoryColor) {
    // Back of Bandana / Headband Wrap (e.g., Scarlett Fox, Zack Wonder)
    ctx.fillStyle = palette.accessoryColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(142, 250);
    ctx.bezierCurveTo(180, 270, 332, 270, 370, 250);
    ctx.lineTo(373, 224);
    ctx.bezierCurveTo(332, 244, 180, 244, 139, 224);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bandana knot & flowing tails at back of head
    ctx.beginPath();
    ctx.ellipse(256, 262, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flowing tails
    ctx.beginPath();
    ctx.moveTo(248, 268);
    ctx.quadraticCurveTo(230, 305, 218, 335);
    ctx.lineTo(232, 330);
    ctx.lineTo(256, 274);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(264, 268);
    ctx.quadraticCurveTo(282, 305, 294, 335);
    ctx.lineTo(280, 330);
    ctx.lineTo(256, 274);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore(); // restore circular clip

  // 9. Hand-Crafted Double Golden Medallion Frame
  // Outer burnished gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Dark engraved inner groove
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 13, 0, Math.PI * 2);
  ctx.strokeStyle = '#5a3d02';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 8 Explorer Compass Rivets / Studs around the rim
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const rx = cx + Math.cos(angle) * (radius - 8);
    const ry = cy + Math.sin(angle) * (radius - 8);

    ctx.fillStyle = '#ffdf78';
    ctx.beginPath();
    ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a2e05';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  return canvas;
}

/**
 * Renders the front avatar SVG inside the matching golden medallion.
 */
export function createFrontHeadCanvas(
  svgText: string,
  palette: AvatarPalette,
  callback: (canvas: HTMLCanvasElement) => void
) {
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const blobUrl = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const cx = 256;
      const cy = 256;
      const radius = 244;

      // Circular Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Background
      const bgGrad = ctx.createRadialGradient(cx, cy - 40, 40, cx, cy, 260);
      bgGrad.addColorStop(0, '#fae1c3');
      bgGrad.addColorStop(0.7, '#e4b686');
      bgGrad.addColorStop(1, '#c99661');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 512);

      // SVG Avatar Image
      ctx.drawImage(img, 12, 12, 488, 488);
      ctx.restore();

      // Double Gold Medallion Rim
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius - 13, 0, Math.PI * 2);
      ctx.strokeStyle = '#5a3d02';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 8 Rivets
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const rx = cx + Math.cos(angle) * (radius - 8);
        const ry = cy + Math.sin(angle) * (radius - 8);

        ctx.fillStyle = '#ffdf78';
        ctx.beginPath();
        ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4a2e05';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    URL.revokeObjectURL(blobUrl);
    callback(canvas);
  };

  img.onerror = () => {
    URL.revokeObjectURL(blobUrl);
    // Procedural front face fallback
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = palette.skinColor;
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fill();
    }
    callback(canvas);
  };

  img.src = blobUrl;
}

/**
 * Builds an authentic Back-Head SVG from the front SVG by:
 * 1. Stripping facial features (eyes, eyebrows, mouth, glasses).
 * 2. Inserting a solid cranium backing in hairColor to cover the face aperture.
 * 3. Preserving the avatar's authentic hair, hat, or bandana outline (Group 6).
 */
export function buildBackHeadSvg(svgText: string, palette: AvatarPalette): string {
  const parts = svgText.split('<g transform="translate(-161 -83)">');
  if (parts.length < 7) {
    return svgText;
  }

  const headPrefix = parts[0];
  const hairGroup = parts[6];
  const tail = parts[7] || '</g></g></svg>';

  // Solid cranium backing covering the facial opening
  const craniumBacking =
    `<ellipse cx="381" cy="350" rx="205" ry="195" fill="${palette.hairColor}" />` +
    `<path d="M210 420 Q381 510 552 420 Q381 445 210 420 Z" fill="${palette.hairColor}" />`;

  return `${headPrefix}${craniumBacking}<g transform="translate(-161 -83)">${hairGroup}${tail}`;
}

/**
 * Efficiently loads both Front and Back avatar canvases for any DiceBear avatar seed.
 * 1. Immediately produces high-fidelity initial procedural canvases (zero wait time).
 * 2. Fetches the official DiceBear SVG, runs the Back-Head Generator Mechanic,
 *    and delivers the fully synchronized pair to the 3D player model.
 */
export function loadAvatarPair(
  seed: string,
  onLoaded: (frontCanvas: HTMLCanvasElement, backCanvas: HTMLCanvasElement) => void
) {
  // Step 1: Immediate procedural canvas generation so player is instantly textured
  const initialPalette = extractAvatarPalette('', seed);
  const initialBackCanvas = createBackHeadCanvas(initialPalette);

  // Initial front canvas
  const initFrontCanvas = document.createElement('canvas');
  initFrontCanvas.width = 512;
  initFrontCanvas.height = 512;
  const ifctx = initFrontCanvas.getContext('2d');
  if (ifctx) {
    ifctx.drawImage(initialBackCanvas, 0, 0);
    // Draw basic front eyes/smile on initial fallback
    ifctx.fillStyle = '#221105';
    ifctx.beginPath();
    ifctx.arc(176, 210, 22, 0, Math.PI * 2);
    ifctx.arc(336, 210, 22, 0, Math.PI * 2);
    ifctx.fill();
    ifctx.strokeStyle = '#5a2d0c';
    ifctx.lineWidth = 10;
    ifctx.beginPath();
    ifctx.arc(256, 290, 56, 0.2, Math.PI - 0.2);
    ifctx.stroke();
  }

  // Fire initial pair immediately
  onLoaded(initFrontCanvas, initialBackCanvas);

  // Step 2: Fetch the primary DiceBear SVG once
  const cleanSeed = encodeURIComponent(seed.trim() || 'Adventurer');
  const bg = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
  const frontUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${cleanSeed}&backgroundColor=${bg}`;

  fetch(frontUrl)
    .then((r) => r.text())
    .then((frontSvg) => {
      const palette = extractAvatarPalette(frontSvg, seed);

      // Synthesize the back SVG using the mechanic
      const backSvg = buildBackHeadSvg(frontSvg, palette);
      const backBlob = new Blob([backSvg], { type: 'image/svg+xml' });
      const backBlobUrl = URL.createObjectURL(backBlob);
      const backImg = new Image();

      backImg.onload = () => {
        const authenticBackCanvas = createBackHeadCanvas(palette, backImg);
        URL.revokeObjectURL(backBlobUrl);

        // Render front canvas
        createFrontHeadCanvas(frontSvg, palette, (authenticFrontCanvas) => {
          onLoaded(authenticFrontCanvas, authenticBackCanvas);
        });
      };

      backImg.onerror = () => {
        URL.revokeObjectURL(backBlobUrl);
        const authenticBackCanvas = createBackHeadCanvas(palette);
        createFrontHeadCanvas(frontSvg, palette, (authenticFrontCanvas) => {
          onLoaded(authenticFrontCanvas, authenticBackCanvas);
        });
      };

      backImg.src = backBlobUrl;
    })
    .catch(() => {
      // Procedural fallback already active
    });
}

/**
 * Loads a single DiceBear SVG avatar onto an HTML Canvas (backward compatibility).
 */
export function loadAvatarToCanvas(
  url: string,
  onLoaded: (canvas: HTMLCanvasElement) => void
) {
  fetch(url)
    .then((res) => res.text())
    .then((svgText) => {
      const palette = extractAvatarPalette(svgText);
      createFrontHeadCanvas(svgText, palette, onLoaded);
    })
    .catch(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      onLoaded(canvas);
    });
}

