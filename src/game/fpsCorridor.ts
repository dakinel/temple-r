import * as THREE from 'three';

/**
 * Keith Clark CSS FPS 3D Corridor Environment.
 * Faithfully ports the iconic perspective corridor (wall.jpg, ceil.jpg, floor.jpg,
 * with rgb(10, 25, 10) dark green shadows and atmospheric fog).
 */

// Procedural high-fidelity fallback for wall.jpg (weathered dungeon bunker stone)
function createProceduralWallCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base stone tone
  ctx.fillStyle = '#423f38';
  ctx.fillRect(0, 0, 512, 512);

  // Stone block grid (resembles classic Wolfenstein / Keith Clark wall.jpg)
  const rows = 8;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const cols = 4;
    const colW = 512 / cols;
    const offsetX = (r % 2) * (colW * 0.5);
    const y = r * rowH;

    for (let c = 0; c <= cols; c++) {
      const x = ((c * colW + offsetX) % 512);
      const tone = 50 + Math.floor(Math.random() * 30);

      // Varied earthy stone block
      ctx.fillStyle = `rgb(${tone + 8}, ${tone + 14}, ${tone})`;
      ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

      // Deep dark mortar lines
      ctx.strokeStyle = '#181b16';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, colW, rowH);

      // Weathered cracks
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + rowH * 0.4);
      ctx.lineTo(x + colW * 0.4, y + rowH * 0.5);
      ctx.lineTo(x + colW * 0.7, y + rowH * 0.3);
      ctx.stroke();

      // Damp moss green splotches
      if (Math.random() > 0.4) {
        ctx.fillStyle = 'rgba(20, 48, 20, 0.45)';
        ctx.beginPath();
        ctx.arc(x + colW * 0.5, y + rowH * 0.6, 14 + Math.random() * 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Linear shadow overlay matching CSS: linear-gradient(90deg, rgba(0,0,0,0), rgba(10,25,10,0.7) 100%)
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.5, 'rgba(10, 25, 10, 0.25)');
  grad.addColorStop(1, 'rgba(10, 25, 10, 0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return canvas;
}

// Procedural fallback for ceil.jpg (dungeon beamed concrete ceiling)
function createProceduralCeilCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#262420';
  ctx.fillRect(0, 0, 512, 512);

  // Cross beams
  for (let y = 0; y < 512; y += 64) {
    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(0, y, 512, 16);
    ctx.fillStyle = '#3a3832';
    ctx.fillRect(0, y + 2, 512, 4);

    // Rivets
    ctx.fillStyle = '#0a0a08';
    for (let x = 16; x < 512; x += 32) {
      ctx.beginPath();
      ctx.arc(x, y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dark green shadow overlay
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(10, 25, 10, 0.6)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(10, 25, 10, 0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return canvas;
}

// Procedural fallback for floor.jpg (flagstone dungeon tiles)
function createProceduralFloorCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#282924';
  ctx.fillRect(0, 0, 512, 512);

  // Large square flagstones
  const tileSize = 64;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      const shade = 35 + Math.floor(Math.random() * 20);
      ctx.fillStyle = `rgb(${shade + 4}, ${shade + 8}, ${shade})`;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      ctx.strokeStyle = '#121410';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  // Dark green atmospheric shadow
  const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(10, 25, 10, 0.55)');
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

    // 1. Wall texture
    const wallProceduralTex = new THREE.CanvasTexture(createProceduralWallCanvas());
    wallProceduralTex.wrapS = THREE.RepeatWrapping;
    wallProceduralTex.wrapT = THREE.RepeatWrapping;
    wallProceduralTex.repeat.set(4, 1);
    this.textures.push(wallProceduralTex);

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallProceduralTex,
      roughness: 0.85,
      metalness: 0.15,
      color: 0xbed6be, // Subtle green tint matching rgb(10,25,10)
    });

    loader.load(
      'https://keithclark.co.uk/labs/css-fps/wall.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 1);
        this.wallMaterial.map = tex;
        this.wallMaterial.needsUpdate = true;
        this.textures.push(tex);
      },
      undefined,
      () => {
        // Fallback already active
      }
    );

    // 2. Ceiling texture
    const ceilProceduralTex = new THREE.CanvasTexture(createProceduralCeilCanvas());
    ceilProceduralTex.wrapS = THREE.RepeatWrapping;
    ceilProceduralTex.wrapT = THREE.RepeatWrapping;
    ceilProceduralTex.repeat.set(2, 4);
    this.textures.push(ceilProceduralTex);

    this.ceilMaterial = new THREE.MeshStandardMaterial({
      map: ceilProceduralTex,
      roughness: 0.9,
      metalness: 0.1,
      color: 0x98b898,
    });

    loader.load(
      'https://keithclark.co.uk/labs/css-fps/ceil.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 4);
        this.ceilMaterial.map = tex;
        this.ceilMaterial.needsUpdate = true;
        this.textures.push(tex);
      },
      undefined,
      () => {}
    );

    // 3. Floor texture
    const floorProceduralTex = new THREE.CanvasTexture(createProceduralFloorCanvas());
    floorProceduralTex.wrapS = THREE.RepeatWrapping;
    floorProceduralTex.wrapT = THREE.RepeatWrapping;
    floorProceduralTex.repeat.set(2, 4);
    this.textures.push(floorProceduralTex);

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: floorProceduralTex,
      roughness: 0.8,
      metalness: 0.2,
      color: 0xa8c4a8,
    });

    loader.load(
      'https://keithclark.co.uk/labs/css-fps/floor.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 4);
        this.floorMaterial.map = tex;
        this.floorMaterial.needsUpdate = true;
        this.textures.push(tex);
      },
      undefined,
      () => {}
    );

    // 4. Build Modular Corridor Sections
    for (let i = 0; i < this.sectionCount; i++) {
      const sectionGroup = this.createCorridorSection();
      sectionGroup.position.set(0, 0, i * this.sectionLength);
      this.sections.push(sectionGroup);
      this.group.add(sectionGroup);
    }

    // 5. Environmental Lighting Rig matching Keith Clark CSS FPS
    // Atmospheric green ambient
    const ambientLight = new THREE.AmbientLight(0x163016, 2.0);
    this.group.add(ambientLight);

    // Overhead directional light
    const overheadLight = new THREE.DirectionalLight(0xdcf0dc, 1.8);
    overheadLight.position.set(0, 8, 10);
    this.group.add(overheadLight);

    // Subtle front corridor rim light
    const frontRim = new THREE.DirectionalLight(0x60a060, 0.9);
    frontRim.position.set(0, 2, -15);
    this.group.add(frontRim);

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

    // Inset Corner Shadow Beams (Emulating the CSS inset box-shadow 0 0 10px 2px rgba(10,25,10,1))
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x0a190a,
      transparent: true,
      opacity: 0.65,
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
