import * as THREE from 'three';

/**
 * Keith Clark CSS FPS 3D Corridor Environment.
 * Faithfully ports the iconic perspective corridor (wall.jpg, ceil.jpg, floor.jpg,
 * with rgb(10, 25, 10) dark green shadows and atmospheric fog).
 */

// Authentic Egyptian Tomb Hieroglyphic Sandstone Wall
function createProceduralWallCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Warm Egyptian Desert Sandstone Base
  ctx.fillStyle = '#9e7436';
  ctx.fillRect(0, 0, 512, 512);

  // 2. Sandstone Stone Block Masonry
  const rows = 6;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const cols = 3;
    const colW = 512 / cols;
    const offsetX = (r % 2) * (colW * 0.5);
    const y = r * rowH;

    for (let c = 0; c <= cols; c++) {
      const x = ((c * colW + offsetX) % 512);
      const shade = 145 + Math.floor(Math.sin(r * 3 + c * 7) * 25);
      const rVal = Math.min(235, shade + 35);
      const gVal = Math.min(200, shade + 5);
      const bVal = Math.max(30, shade - 65);

      // Sandstone block face
      ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
      ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

      // Deep weathered mortar groove
      ctx.strokeStyle = '#4a3212';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, colW, rowH);

      // Chiseled stone texture & sand grain
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = 'rgba(74, 50, 18, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 8 + i * 16);
        ctx.lineTo(x + colW - 6, y + 8 + i * 16 + (Math.sin(i) * 3));
        ctx.stroke();
      }

      // --- CARVED HIEROGLYPHS ---
      const centerX = x + colW * 0.5;
      const centerY = y + rowH * 0.5;
      const glyphType = (r * 3 + c) % 5;

      ctx.save();
      // Recessed relief shadow
      ctx.shadowColor = 'rgba(40, 25, 8, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      if (glyphType === 0) {
        // --- The Ankh (☥ Key of Life) ---
        ctx.strokeStyle = '#d4af37'; // Gold leaf inlay
        ctx.lineWidth = 3;
        // Loop
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 14, 9, 13, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Crossbar
        ctx.beginPath();
        ctx.moveTo(centerX - 14, centerY);
        ctx.lineTo(centerX + 14, centerY);
        ctx.stroke();
        // Stem
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY + 24);
        ctx.stroke();
      } else if (glyphType === 1) {
        // --- Eye of Horus (𓂀 Wedjat) ---
        ctx.strokeStyle = '#1e3a8a'; // Lapis lazuli blue pigment
        ctx.lineWidth = 2.5;
        // Eye almond
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY);
        ctx.bezierCurveTo(centerX - 10, centerY - 12, centerX + 10, centerY - 12, centerX + 20, centerY);
        ctx.bezierCurveTo(centerX + 10, centerY + 12, centerX - 10, centerY + 12, centerX - 20, centerY);
        ctx.stroke();
        // Iris (gold)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Eyebrow
        ctx.beginPath();
        ctx.moveTo(centerX - 18, centerY - 15);
        ctx.quadraticCurveTo(centerX, centerY - 20, centerX + 20, centerY - 14);
        ctx.stroke();
        // Teardrop curl
        ctx.beginPath();
        ctx.moveTo(centerX - 4, centerY + 12);
        ctx.lineTo(centerX - 4, centerY + 24);
        ctx.arc(centerX - 10, centerY + 24, 6, 0, Math.PI);
        ctx.stroke();
      } else if (glyphType === 2) {
        // --- Sacred Scarab Beetle ---
        ctx.fillStyle = '#b45309'; // Terracotta
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        // Body oval
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 12, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Center wing seam
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 16);
        ctx.lineTo(centerX, centerY + 16);
        ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.arc(centerX, centerY - 18, 6, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Legs
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY - 8);
        ctx.lineTo(centerX - 22, centerY - 14);
        ctx.moveTo(centerX + 12, centerY - 8);
        ctx.lineTo(centerX + 22, centerY - 14);
        ctx.moveTo(centerX - 12, centerY + 8);
        ctx.lineTo(centerX - 22, centerY + 16);
        ctx.moveTo(centerX + 12, centerY + 8);
        ctx.lineTo(centerX + 22, centerY + 16);
        ctx.stroke();
      } else if (glyphType === 3) {
        // --- Royal Pharaonic Cartouche ---
        ctx.strokeStyle = '#d4af37'; // Gold
        ctx.lineWidth = 3;
        // Pill cartouche frame
        ctx.beginPath();
        ctx.roundRect(centerX - 16, centerY - 24, 32, 48, 12);
        ctx.stroke();
        // Bottom tie-bar
        ctx.fillRect(centerX - 18, centerY + 23, 36, 4);
        // Inner glyphs (sun disc & water ripple)
        ctx.fillStyle = '#dc2626'; // Ochre red
        ctx.beginPath();
        ctx.arc(centerX, centerY - 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 9, centerY + 2);
        ctx.lineTo(centerX - 3, centerY + 7);
        ctx.lineTo(centerX + 3, centerY + 2);
        ctx.lineTo(centerX + 9, centerY + 7);
        ctx.stroke();
      } else {
        // --- Winged Solar Disc of Horus ---
        ctx.fillStyle = '#f59e0b'; // Sun disc
        ctx.beginPath();
        ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 9, centerY);
        ctx.quadraticCurveTo(centerX - 24, centerY - 8, centerX - 36, centerY + 6);
        ctx.moveTo(centerX + 9, centerY);
        ctx.quadraticCurveTo(centerX + 24, centerY - 8, centerX + 36, centerY + 6);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Ancient tomb shadow wash along top and bottom
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(40, 24, 8, 0.7)');
  grad.addColorStop(0.2, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(1, 'rgba(40, 24, 8, 0.75)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return canvas;
}

// Authentic Egyptian Astronomical Tomb Ceiling (Royal Valley of the Kings Star Ceiling)
function createProceduralCeilCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep Lapis Lazuli Midnight Blue Sky (Sacred Egyptian Tomb Sky)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Heavy Sandstone Architraves & Megalithic Beams
  for (let y = 0; y < 512; y += 128) {
    ctx.fillStyle = '#855b27';
    ctx.fillRect(0, y, 512, 32);

    // Gold leaf hieroglyphic border along the beams
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, y + 4, 512, 3);
    ctx.fillRect(0, y + 25, 512, 3);

    ctx.strokeStyle = '#452b0f';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, y, 512, 32);
  }

  // Golden Five-Pointed Egyptian Stars Across the Vault
  ctx.fillStyle = '#fde047';
  for (let sx = 24; sx < 512; sx += 48) {
    for (let sy = 48; sy < 512; sy += 64) {
      if (sy % 128 < 36) continue; // Skip beams

      // 5-point star
      const cx = sx + ((sy % 3) * 12);
      const cy = sy;
      const spikes = 5;
      const outerR = 6;
      const innerR = 2.5;

      ctx.beginPath();
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerR;
        y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Soft atmospheric vignette
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(25, 14, 4, 0.7)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
  grad.addColorStop(1, 'rgba(25, 14, 4, 0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return canvas;
}

// Ancient Egyptian Temple Limestone Flagstone Floor
function createProceduralFloorCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm Desert Quartzite & Limestone Base
  ctx.fillStyle = '#a1793e';
  ctx.fillRect(0, 0, 512, 512);

  // Large Weathered Temple Flagstone Slabs
  const tileSize = 64;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      const shade = 145 + Math.floor(Math.sin(x * 0.05 + y * 0.05) * 20);
      ctx.fillStyle = `rgb(${shade + 20}, ${shade}, ${shade - 40})`;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Desert sand drifts in stone cracks
      ctx.strokeStyle = '#5a3d16';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, tileSize, tileSize);

      // Gold dust particles & wear
      ctx.fillStyle = 'rgba(253, 224, 71, 0.08)';
      ctx.fillRect(x + 4, y + 4, tileSize - 8, 4);
    }
  }

  // Soft torchlight depth gradient
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255, 180, 50, 0.08)');
  grad.addColorStop(1, 'rgba(35, 20, 6, 0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return canvas;
}

export class FpsCorridor {
  public group: THREE.Group;
  private wallMaterial: THREE.MeshStandardMaterial;
  private ceilMaterial: THREE.MeshStandardMaterial;
  private floorMaterial: THREE.MeshStandardMaterial;
  private textures: THREE.Texture[] = [];
  private geometries: THREE.BufferGeometry[] = [];

  // Corridor Dimensions
  public readonly width: number = 5.6; // Width between left & right walls
  public readonly height: number = 4.4; // Height from floor to ceiling
  private readonly sectionLength: number = 24.0;
  private readonly sectionCount: number = 10;
  private sections: THREE.Group[] = [];
  private totalLength: number;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.totalLength = this.sectionLength * this.sectionCount;

    // Load textures with graceful procedural fallback
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    // 1. Wall texture - Egyptian Hieroglyphic Sandstone
    const wallProceduralTex = new THREE.CanvasTexture(createProceduralWallCanvas());
    wallProceduralTex.wrapS = THREE.RepeatWrapping;
    wallProceduralTex.wrapT = THREE.RepeatWrapping;
    wallProceduralTex.repeat.set(4, 1);
    this.textures.push(wallProceduralTex);

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallProceduralTex,
      roughness: 0.75,
      metalness: 0.15,
      color: 0xdeb887, // Warm Egyptian sandstone
    });

    // 2. Ceiling texture - Royal Egyptian Astronomical Star Ceiling
    const ceilProceduralTex = new THREE.CanvasTexture(createProceduralCeilCanvas());
    ceilProceduralTex.wrapS = THREE.RepeatWrapping;
    ceilProceduralTex.wrapT = THREE.RepeatWrapping;
    ceilProceduralTex.repeat.set(2, 4);
    this.textures.push(ceilProceduralTex);

    this.ceilMaterial = new THREE.MeshStandardMaterial({
      map: ceilProceduralTex,
      roughness: 0.65,
      metalness: 0.25,
      color: 0xb8860b, // Dark golden sandstone beam with lapis vault
    });

    // 3. Floor texture - Ancient Egyptian Temple Flagstone
    const floorProceduralTex = new THREE.CanvasTexture(createProceduralFloorCanvas());
    floorProceduralTex.wrapS = THREE.RepeatWrapping;
    floorProceduralTex.wrapT = THREE.RepeatWrapping;
    floorProceduralTex.repeat.set(2, 4);
    this.textures.push(floorProceduralTex);

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: floorProceduralTex,
      roughness: 0.5,
      metalness: 0.25,
      color: 0xd2b48c, // Weathered tan quartzite temple floor
    });

    // 4. Build Modular Corridor Sections
    for (let i = 0; i < this.sectionCount; i++) {
      const sectionGroup = this.createCorridorSection();
      sectionGroup.position.set(0, 0, i * this.sectionLength);
      this.sections.push(sectionGroup);
      this.group.add(sectionGroup);
    }

    // 5. Environmental Lighting Rig - Warm Ancient Egyptian Tomb Torchlight Atmosphere
    const ambientLight = new THREE.AmbientLight(0x2a180a, 0.35);
    this.group.add(ambientLight);

    scene.add(this.group);
  }

  private createCorridorSection(): THREE.Group {
    const section = new THREE.Group();
    const halfW = this.width * 0.5;
    const len = this.sectionLength;

    // Left Wall
    const wallGeom = new THREE.PlaneGeometry(len, this.height);
    this.geometries.push(wallGeom);

    const leftWall = new THREE.Mesh(wallGeom, this.wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-halfW, this.height * 0.5 - 0.2, len * 0.5);
    leftWall.receiveShadow = true;
    section.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(wallGeom, this.wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(halfW, this.height * 0.5 - 0.2, len * 0.5);
    rightWall.receiveShadow = true;
    section.add(rightWall);

    // Ceiling
    const ceilGeom = new THREE.PlaneGeometry(this.width, len);
    this.geometries.push(ceilGeom);

    const ceiling = new THREE.Mesh(ceilGeom, this.ceilMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, this.height - 0.2, len * 0.5);
    ceiling.receiveShadow = true;
    section.add(ceiling);

    // Floor Base (Under the ticker tape)
    const floorMesh = new THREE.Mesh(ceilGeom, this.floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -0.21, len * 0.5);
    floorMesh.receiveShadow = true;
    section.add(floorMesh);

    // Inset Corner Architrave Beams (carved ancient Egyptian sandstone moldings)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x4d3215,
      transparent: true,
      opacity: 0.85,
    });
    const cornerBeamGeom = new THREE.BoxGeometry(0.12, 0.12, len);
    this.geometries.push(cornerBeamGeom);

    // Left floor corner
    const beamLF = new THREE.Mesh(cornerBeamGeom, beamMat);
    beamLF.position.set(-halfW + 0.06, -0.15, len * 0.5);
    section.add(beamLF);

    // Right floor corner
    const beamRF = new THREE.Mesh(cornerBeamGeom, beamMat);
    beamRF.position.set(halfW - 0.06, -0.15, len * 0.5);
    section.add(beamRF);

    // Left ceiling corner
    const beamLC = new THREE.Mesh(cornerBeamGeom, beamMat);
    beamLC.position.set(-halfW + 0.06, this.height - 0.26, len * 0.5);
    section.add(beamLC);

    // Right ceiling corner
    const beamRC = new THREE.Mesh(cornerBeamGeom, beamMat);
    beamRC.position.set(halfW - 0.06, this.height - 0.26, len * 0.5);
    section.add(beamRC);

    return section;
  }

  /**
   * Keep corridor sections continuously wrapping around the runner along Z.
   */
  public update(playerZ: number, _time: number) {
    const behindMargin = 20; // Keep 20m behind player visible in chase camera

    for (const section of this.sections) {
      // If a section is far behind the player, wrap it ahead!
      while (section.position.z + this.sectionLength < playerZ - behindMargin) {
        section.position.z += this.totalLength;
      }
      while (section.position.z > playerZ - behindMargin + this.totalLength) {
        section.position.z -= this.totalLength;
      }
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.group);
    this.textures.forEach((t) => t.dispose());
    this.geometries.forEach((g) => g.dispose());
    this.wallMaterial.dispose();
    this.ceilMaterial.dispose();
    this.floorMaterial.dispose();
  }
}
