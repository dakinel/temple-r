import * as THREE from 'three';
import { createCandlestickTexture } from './textures';
import {
  createFallenTreeObstacle,
  createGoldCoin,
} from './models';
import { MARKET_QUERIES, MarketQuery } from './queries';

export type ObstacleType = 'none' | 'crash_dip';

export interface CoinInstance {
  mesh: THREE.Mesh;
  worldPos: THREE.Vector3;
  lane: number;
  collected: boolean;
}

export interface ObstacleInstance {
  group: THREE.Group;
  type: 'tree';
  worldPos: THREE.Vector3;
  lane: number;
  boundingSphere: THREE.Sphere;
  cleared: boolean;
}

export interface ForkInstance {
  id: number;
  forkZ: number;
  decisionLineZ: number;
  query: MarketQuery;
  queryIndex: number;
  cleared: boolean;
  group: THREE.Group;
}

export interface TrackSegment {
  id: number;
  group: THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  headingAngle: number;
  length: number;
  coins: CoinInstance[];
  obstacles: ObstacleInstance[];
  fork?: ForkInstance;
}

/**
 * Caution Hazard Stripe Texture for Center Fork Dividing Barrier.
 */
function createHazardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eab308'; // Caution yellow
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#0f172a'; // Deep slate
  const stripeW = 32;
  for (let i = -256; i < 512; i += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeW, 0);
    ctx.lineTo(i + stripeW + 256, 256);
    ctx.lineTo(i + 256, 256);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return tex;
}

export class TrackManager {
  public scene: THREE.Scene;
  public segments: TrackSegment[] = [];
  public coins: CoinInstance[] = [];
  public obstacles: ObstacleInstance[] = [];
  public forks: ForkInstance[] = [];
  private segmentCounter: number = 0;
  private queryCounter: number = 0;

  // Materials
  private candlestickTexture: THREE.CanvasTexture;
  private hazardTexture: THREE.CanvasTexture;
  private neonGreenMat: THREE.MeshStandardMaterial;
  private neonRoseMat: THREE.MeshStandardMaterial;
  private stoneDividerMat: THREE.MeshStandardMaterial;
  private hazardMat: THREE.MeshStandardMaterial;
  private tunnelRoadMat: THREE.MeshStandardMaterial;
  private frameMat: THREE.MeshStandardMaterial;
  // Egyptian Tomb Materials
  private egyptianSandstoneMat: THREE.MeshStandardMaterial;
  private egyptianGoldMat: THREE.MeshStandardMaterial;
  private egyptianTorchFlameMat: THREE.MeshStandardMaterial;
  private egyptianBronzeMat: THREE.MeshStandardMaterial;

  // Dimensions
  public readonly trackWidth: number = 4.2;
  public readonly laneOffset: number = 1.85; // Allows clean steering into Left (-1.85) or Right (+1.85) road
  public readonly segmentLength: number = 28.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.candlestickTexture = createCandlestickTexture();
    this.hazardTexture = createHazardTexture();

    this.neonGreenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    this.neonRoseMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    this.egyptianGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0x855b27,
      emissiveIntensity: 0.3,
      metalness: 0.85,
      roughness: 0.25,
    });

    this.egyptianTorchFlameMat = new THREE.MeshStandardMaterial({
      color: 0xff7700,
      emissive: 0xffaa00,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });

    this.egyptianBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x78481d,
      metalness: 0.75,
      roughness: 0.35,
    });

    this.egyptianSandstoneMat = new THREE.MeshStandardMaterial({
      color: 0xc89e62,
      roughness: 0.75,
      metalness: 0.15,
    });

    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x8c6230,
      roughness: 0.6,
      metalness: 0.3,
    });

    this.stoneDividerMat = new THREE.MeshStandardMaterial({
      color: 0xa67a3e,
      roughness: 0.75,
      metalness: 0.15,
    });

    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTexture,
      roughness: 0.6,
      metalness: 0.2,
    });

    this.tunnelRoadMat = new THREE.MeshStandardMaterial({
      color: 0xba8c50,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.reset();
  }

  public reset() {
    for (const seg of this.segments) {
      this.scene.remove(seg.group);
    }
    this.segments = [];
    this.coins = [];
    this.obstacles = [];
    this.forks = [];
    this.segmentCounter = 0;
    this.queryCounter = 0;

    // Start origin
    let curPos = new THREE.Vector3(0, 0, -10);
    const curAngle = 0;

    // Runway: first 2 segments straight, 3rd segment has the first tunnel fork!
    for (let i = 0; i < 4; i++) {
      const isFork = (i === 2);
      const seg = this.createSegment(curPos, curAngle, i === 0 ? 'none' : undefined, i > 1, isFork);
      this.segments.push(seg);
      this.scene.add(seg.group);
      curPos = seg.endPos.clone();
    }

    // Append forward segments
    for (let i = 0; i < 5; i++) {
      this.appendNextSegment();
    }
  }

  public appendNextSegment() {
    const lastSeg = this.segments[this.segments.length - 1];
    // A tunnel fork occurs regularly every 3 segments
    const isFork = (this.segmentCounter % 3 === 0);
    const newSeg = this.createSegment(lastSeg.endPos, 0, undefined, true, isFork);
    this.segments.push(newSeg);
    this.scene.add(newSeg.group);
  }

  private createSegment(
    startPos: THREE.Vector3,
    headingAngle: number,
    forceObstacle?: ObstacleType,
    spawnCoins: boolean = true,
    spawnFork: boolean = false
  ): TrackSegment {
    const id = ++this.segmentCounter;
    const group = new THREE.Group();
    group.position.copy(startPos);
    group.rotation.y = headingAngle;

    const coins: CoinInstance[] = [];
    const obstacles: ObstacleInstance[] = [];
    const length = this.segmentLength;

    const dir = new THREE.Vector3(Math.sin(headingAngle), 0, Math.cos(headingAngle));
    const endPos = startPos.clone().add(dir.clone().multiplyScalar(length));

    // Subtle candlestick sconces along straight sections
    for (let z = 4; z < length - 2; z += 8) {
      this.addCandlestickSconces(group, z);
    }

    let forkInstance: ForkInstance | undefined;

    // --- TUNNEL FORK & END-OF-TUNNEL QUERY BOARD ---
    // (Doors completely removed! Open Left & Right road tunnels with End-of-Tunnel query wall)
    if (spawnFork) {
      const qIdx = this.queryCounter % MARKET_QUERIES.length;
      const query = MARKET_QUERIES[qIdx];
      this.queryCounter++;

      const forkZ = length * 0.45;
      const worldForkZ = startPos.z + forkZ;

      // Build the 3D Fork with End-of-Tunnel Query Board, Left Road, Right Road, and Center Divider
      this.addTunnelFork(group, forkZ, query);

      forkInstance = {
        id,
        forkZ: worldForkZ,
        decisionLineZ: worldForkZ + 1.2, // Point where tunnel selection is evaluated
        query,
        queryIndex: qIdx,
        cleared: false,
        group,
      };
      this.forks.push(forkInstance);
    }

    // Obstacle Placement (only when not on a fork segment so player can focus on reading query)
    let obsType = forceObstacle;
    if (!obsType && !spawnFork && this.segmentCounter > 2) {
      const rnd = Math.random();
      if (rnd < 0.35) {
        obsType = 'crash_dip';
      }
    }

    if (obsType === 'crash_dip') {
      const hurdle = createFallenTreeObstacle();
      const obsZ = length * 0.5;
      hurdle.position.set(0, 0, obsZ);
      group.add(hurdle);

      const worldObsPos = startPos.clone().add(dir.clone().multiplyScalar(obsZ));
      const obsInst: ObstacleInstance = {
        group: hurdle,
        type: 'tree',
        worldPos: worldObsPos,
        lane: 0,
        boundingSphere: new THREE.Sphere(worldObsPos, 1.4),
        cleared: false,
      };
      obstacles.push(obsInst);
      this.obstacles.push(obsInst);
    }

    // Gold Bullion Coins ($) along Corridor Floor
    if (spawnCoins && !spawnFork) {
      const coinLane = Math.floor(Math.random() * 3) - 1;
      const coinCount = 3;
      const startZ = length * 0.25;
      const spacing = 2.0;

      for (let c = 0; c < coinCount; c++) {
        const coinZ = startZ + c * spacing;
        if (obsType === 'crash_dip' && Math.abs(coinZ - length * 0.5) < 2.2) continue;

        const coinMesh = createGoldCoin();
        const coinX = coinLane * 1.3;
        coinMesh.position.set(coinX, 0.45, coinZ);
        group.add(coinMesh);

        const localPos = new THREE.Vector3(coinX, 0.45, coinZ);
        const worldPos = localPos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), headingAngle).add(startPos);

        const coinInst: CoinInstance = {
          mesh: coinMesh,
          worldPos,
          lane: coinLane,
          collected: false,
        };
        coins.push(coinInst);
        this.coins.push(coinInst);
      }
    }

    return {
      id,
      group,
      startPos,
      endPos,
      headingAngle,
      length,
      coins,
      obstacles,
      fork: forkInstance,
    };
  }

  /**
   * 3D EGYPTIAN TEMPLE FORK:
   * (End-of-tunnel query billboard completely REMOVED as requested!)
   * 1. Left Egyptian Tomb Portal: Open sandstone arch with Golden Ankh relief (YES/BUY option).
   * 2. Right Egyptian Tomb Portal: Open sandstone arch with Golden Eye of Horus relief (NO/PASS option).
   * 3. Center Divider: Monumental Egyptian Sandstone Obelisk with Golden Pyramidion apex.
   * 4. Lethal Trap: In the wrong passage, lethal bronze spike barricade is active!
   */
  private addTunnelFork(parent: THREE.Group, forkZ: number, query: MarketQuery) {
    const forkGroup = new THREE.Group();
    forkGroup.position.set(0, 0, forkZ);

    const branchLen = 22.0;

    // ========================================================
    // 1. LEFT EGYPTIAN TOMB PORTAL (YES / BUY Selection)
    // Completely OPEN! Runner steers left into it.
    // ========================================================
    // Left road ancient temple flagstone floor
    const leftRoadGeom = new THREE.PlaneGeometry(2.4, branchLen);
    const leftRoad = new THREE.Mesh(leftRoadGeom, this.tunnelRoadMat);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.position.set(-1.85, 0.01, branchLen * 0.5);
    leftRoad.receiveShadow = true;
    forkGroup.add(leftRoad);

    // Left Road Outer Sandstone Relief Wall
    const leftWallGeom = new THREE.PlaneGeometry(branchLen, 4.2);
    const leftOuterWall = new THREE.Mesh(leftWallGeom, this.stoneDividerMat);
    leftOuterWall.rotation.y = Math.PI / 2;
    leftOuterWall.position.set(-3.05, 2.1, branchLen * 0.5);
    forkGroup.add(leftOuterWall);

    // Left Egyptian Temple Colonnade Pillars
    const colGeom = new THREE.CylinderGeometry(0.22, 0.28, 4.0, 10);
    const colLeft1 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colLeft1.position.set(-3.0, 2.0, 0.2);
    forkGroup.add(colLeft1);

    const colLeft2 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colLeft2.position.set(-0.7, 2.0, 0.2);
    forkGroup.add(colLeft2);

    // Left Portal Architrave Lintel (Monumental Carved Sandstone)
    const lintelGeom = new THREE.BoxGeometry(2.5, 0.5, 0.4);
    const leftLintel = new THREE.Mesh(lintelGeom, this.egyptianSandstoneMat);
    leftLintel.position.set(-1.85, 3.8, 0.2);
    forkGroup.add(leftLintel);

    // Golden Ankh Lintel Relief on Left Portal
    const ankhBaseGeom = new THREE.BoxGeometry(2.2, 0.45, 0.12);
    const leftSign = new THREE.Mesh(ankhBaseGeom, this.egyptianGoldMat);
    leftSign.position.set(-1.85, 3.3, 0.2);
    forkGroup.add(leftSign);

    // Left Portal Warm Torch Sconces
    const portalTorchL = new THREE.PointLight(0x10b981, 2.2, 8);
    portalTorchL.position.set(-1.85, 3.2, -0.5);
    forkGroup.add(portalTorchL);

    // Left Passage Interior: Safe Path vs Lethal Spike Trap
    if (query.correctSide === 'left') {
      // Safe passage: Golden clearance glow & sacred treasure
      const safeGlow = new THREE.PointLight(0xf59e0b, 2.8, 10);
      safeGlow.position.set(-1.85, 2.0, 4.0);
      forkGroup.add(safeGlow);

      const bonusCoin = createGoldCoin();
      bonusCoin.position.set(-1.85, 0.6, 3.5);
      forkGroup.add(bonusCoin);
    } else {
      // Lethal Trap in Left Passage: Bronze lethal spiked barrier
      const dangerGlow = new THREE.PointLight(0xef4444, 4.0, 9);
      dangerGlow.position.set(-1.85, 2.0, 2.5);
      forkGroup.add(dangerGlow);

      // Ancient tomb spiked crash barricade
      const barricadeGeom = new THREE.BoxGeometry(2.2, 2.8, 0.5);
      const barricade = new THREE.Mesh(barricadeGeom, this.hazardMat);
      barricade.position.set(-1.85, 1.4, 3.0);
      forkGroup.add(barricade);

      // Lethal spikes protruding
      const spikeGeom = new THREE.ConeGeometry(0.12, 0.6, 6);
      spikeGeom.rotateX(Math.PI / 2);
      for (let s = -0.8; s <= 0.8; s += 0.4) {
        const spike = new THREE.Mesh(spikeGeom, this.egyptianBronzeMat);
        spike.position.set(-1.85 + s, 1.5, 2.7);
        forkGroup.add(spike);
      }
    }

    // ========================================================
    // 2. RIGHT EGYPTIAN TOMB PORTAL (NO / PASS Selection)
    // Completely OPEN! Runner steers right into it.
    // ========================================================
    const rightRoad = new THREE.Mesh(leftRoadGeom, this.tunnelRoadMat);
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.position.set(1.85, 0.01, branchLen * 0.5);
    rightRoad.receiveShadow = true;
    forkGroup.add(rightRoad);

    // Right Road Outer Sandstone Wall
    const rightOuterWall = new THREE.Mesh(leftWallGeom, this.stoneDividerMat);
    rightOuterWall.rotation.y = -Math.PI / 2;
    rightOuterWall.position.set(3.05, 2.1, branchLen * 0.5);
    forkGroup.add(rightOuterWall);

    // Right Egyptian Temple Colonnade Pillars
    const colRight1 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colRight1.position.set(0.7, 2.0, 0.2);
    forkGroup.add(colRight1);

    const colRight2 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colRight2.position.set(3.0, 2.0, 0.2);
    forkGroup.add(colRight2);

    // Right Portal Architrave Lintel
    const rightLintel = new THREE.Mesh(lintelGeom, this.egyptianSandstoneMat);
    rightLintel.position.set(1.85, 3.8, 0.2);
    forkGroup.add(rightLintel);

    // Golden Eye of Horus Lintel Relief on Right Portal
    const rightSign = new THREE.Mesh(ankhBaseGeom, this.egyptianGoldMat);
    rightSign.position.set(1.85, 3.3, 0.2);
    forkGroup.add(rightSign);

    const portalTorchR = new THREE.PointLight(0xf43f5e, 2.2, 8);
    portalTorchR.position.set(1.85, 3.2, -0.5);
    forkGroup.add(portalTorchR);

    // Right Passage Interior: Safe Path vs Lethal Spike Trap
    if (query.correctSide === 'right') {
      const safeGlow = new THREE.PointLight(0xf59e0b, 2.8, 10);
      safeGlow.position.set(1.85, 2.0, 4.0);
      forkGroup.add(safeGlow);

      const bonusCoin = createGoldCoin();
      bonusCoin.position.set(1.85, 0.6, 3.5);
      forkGroup.add(bonusCoin);
    } else {
      const dangerGlow = new THREE.PointLight(0xef4444, 4.0, 9);
      dangerGlow.position.set(1.85, 2.0, 2.5);
      forkGroup.add(dangerGlow);

      const barricadeGeom = new THREE.BoxGeometry(2.2, 2.8, 0.5);
      const barricade = new THREE.Mesh(barricadeGeom, this.hazardMat);
      barricade.position.set(1.85, 1.4, 3.0);
      forkGroup.add(barricade);

      const spikeGeom = new THREE.ConeGeometry(0.12, 0.6, 6);
      spikeGeom.rotateX(Math.PI / 2);
      for (let s = -0.8; s <= 0.8; s += 0.4) {
        const spike = new THREE.Mesh(spikeGeom, this.egyptianBronzeMat);
        spike.position.set(1.85 + s, 1.5, 2.7);
        forkGroup.add(spike);
      }
    }

    // ========================================================
    // 3. CENTER DIVIDER: MONUMENTAL EGYPTIAN SANDSTONE OBELISK
    // Divides Left and Right roads with golden pyramidion apex!
    // ========================================================
    const obeliskBaseGeom = new THREE.BoxGeometry(1.2, 3.4, branchLen);
    const obeliskBase = new THREE.Mesh(obeliskBaseGeom, this.stoneDividerMat);
    obeliskBase.position.set(0, 1.7, branchLen * 0.5);
    forkGroup.add(obeliskBase);

    // Tall Tapering Front Obelisk Pylon Facing Runner
    const pylonGeom = new THREE.BoxGeometry(1.2, 4.2, 3.2);
    const pylon = new THREE.Mesh(pylonGeom, this.egyptianSandstoneMat);
    pylon.position.set(0, 2.1, -1.6);
    forkGroup.add(pylon);

    // Golden Pyramidion (Apex cap of the Obelisk)
    const capGeom = new THREE.ConeGeometry(0.85, 1.2, 4);
    capGeom.rotateY(Math.PI / 4);
    const cap = new THREE.Mesh(capGeom, this.egyptianGoldMat);
    cap.position.set(0, 4.8, -1.6);
    forkGroup.add(cap);

    // Flanked by sacred golden flame beacon on the Obelisk
    const obeliskLight = new THREE.PointLight(0xffaa33, 2.5, 9);
    obeliskLight.position.set(0, 4.2, -2.5);
    forkGroup.add(obeliskLight);

    parent.add(forkGroup);
  }

  /**
   * Authentic Egyptian Flaming Wall Torches
   * Bronze bracket, fire bowl, flickering flame mesh, and warm amber torchlight.
   */
  private addCandlestickSconces(parent: THREE.Group, z: number) {
    // 1. Bronze Wall Bracket & Torch Shaft
    const bracketGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8);
    bracketGeom.rotateZ(0.25); // Angled outward from the wall

    const bowlGeom = new THREE.CylinderGeometry(0.12, 0.05, 0.16, 8);
    const flameGeom = new THREE.ConeGeometry(0.10, 0.35, 8);

    // Left Wall Torch
    const leftHolder = new THREE.Group();
    leftHolder.position.set(-this.trackWidth * 0.5 - 0.05, 1.2, z);

    const leftShaft = new THREE.Mesh(bracketGeom, this.egyptianBronzeMat);
    leftShaft.position.set(0.1, -0.1, 0);
    leftHolder.add(leftShaft);

    const leftBowl = new THREE.Mesh(bowlGeom, this.egyptianBronzeMat);
    leftBowl.position.set(0.2, 0.12, 0);
    leftHolder.add(leftBowl);

    const leftFlame = new THREE.Mesh(flameGeom, this.egyptianTorchFlameMat);
    leftFlame.position.set(0.2, 0.35, 0);
    leftHolder.add(leftFlame);

    parent.add(leftHolder);

    // Right Wall Torch
    const rightHolder = new THREE.Group();
    rightHolder.position.set(this.trackWidth * 0.5 + 0.05, 1.2, z);

    const rightShaft = new THREE.Mesh(bracketGeom, this.egyptianBronzeMat);
    rightShaft.rotation.z = -0.25 * 2;
    rightShaft.position.set(-0.1, -0.1, 0);
    rightHolder.add(rightShaft);

    const rightBowl = new THREE.Mesh(bowlGeom, this.egyptianBronzeMat);
    rightBowl.position.set(-0.2, 0.12, 0);
    rightHolder.add(rightBowl);

    const rightFlame = new THREE.Mesh(flameGeom, this.egyptianTorchFlameMat);
    rightFlame.position.set(-0.2, 0.35, 0);
    rightHolder.add(rightFlame);

    parent.add(rightHolder);

    // Warm Egyptian Torchlight Point Light (illuminating the hieroglyphic walls)
    const torchLight = new THREE.PointLight(0xffa238, 1.2, 7.5);
    torchLight.position.set((z % 16 === 0 ? -1 : 1) * (this.trackWidth * 0.5 - 0.4), 1.5, z);
    parent.add(torchLight);
  }

  public update(playerPos: THREE.Vector3, _time: number) {
    for (const c of this.coins) {
      if (!c.collected) {
        c.mesh.rotation.z += 0.045;
      }
    }

    // Recycle passed segments
    if (this.segments.length > 5) {
      const firstSeg = this.segments[0];
      const distToPlayer = playerPos.z - firstSeg.endPos.z;

      if (distToPlayer > 18) {
        this.scene.remove(firstSeg.group);
        this.coins = this.coins.filter((c) => !firstSeg.coins.includes(c));
        this.obstacles = this.obstacles.filter((o) => !firstSeg.obstacles.includes(o));
        if (firstSeg.fork) {
          this.forks = this.forks.filter((f) => f.id !== firstSeg.fork!.id);
        }
        this.segments.shift();
        this.appendNextSegment();
      }
    }
  }
}
