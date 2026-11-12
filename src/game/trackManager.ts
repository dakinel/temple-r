import * as THREE from 'three';
import { createCandlestickTexture, createPremiumDollarFloorTextures } from './textures';
import {
  createFallenTreeObstacle,
  createGoldCoin,
} from './models';
import { MARKET_QUERIES, MarketQuery } from './queries';

export type ObstacleType = 'none' | 'crash_dip';

export interface CoinInstance {
  mesh: THREE.Mesh;
  segmentGroup: THREE.Group;
  worldPos: THREE.Vector3;
  lane: number;
  collected: boolean;
  absorbing: boolean;
  absorbProgress: number;
  absorbStartPos: THREE.Vector3;
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
  public queries: MarketQuery[] = MARKET_QUERIES;

  // Materials
  private candlestickTexture: THREE.CanvasTexture;
  private hazardTexture: THREE.CanvasTexture;
  private neonGreenMat: THREE.MeshStandardMaterial;
  private neonRoseMat: THREE.MeshStandardMaterial;
  private bullCandleBodyMat: THREE.MeshStandardMaterial;
  private bearCandleBodyMat: THREE.MeshStandardMaterial;
  private bullWickMat: THREE.MeshStandardMaterial;
  private bearWickMat: THREE.MeshStandardMaterial;
  private candleMountIronMat: THREE.MeshStandardMaterial;
  private stoneDividerMat: THREE.MeshStandardMaterial;
  private hazardMat: THREE.MeshStandardMaterial;
  private tunnelRoadMat: THREE.MeshStandardMaterial;
  private frameMat: THREE.MeshStandardMaterial;
  // Egyptian Tomb Materials
  private egyptianSandstoneMat: THREE.MeshStandardMaterial;
  private egyptianGoldMat: THREE.MeshStandardMaterial;
  private egyptianBronzeMat: THREE.MeshStandardMaterial;

  // Shared Geometries for Stock Market Candlesticks
  private candleBracketGeom: THREE.BoxGeometry;
  private candlePlateGeom: THREE.BoxGeometry;
  private candleBodyGeom: THREE.BoxGeometry;
  private candleCapGeom: THREE.BoxGeometry;
  private candleWickGeom: THREE.CylinderGeometry;

  // Dimensions
  public readonly trackWidth: number = 4.2;
  public readonly laneOffset: number = 1.85; // Allows clean steering into Left (-1.85) or Right (+1.85) road
  public readonly segmentLength: number = 28.0;

  constructor(scene: THREE.Scene, maxAnisotropy = 8) {
    this.scene = scene;
    this.candlestickTexture = createCandlestickTexture();
    this.hazardTexture = createHazardTexture();

    this.neonGreenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });

    this.neonRoseMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });

    this.bullCandleBodyMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.55,
      roughness: 0.28,
      metalness: 0.2,
    });

    this.bearCandleBodyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.55,
      roughness: 0.28,
      metalness: 0.2,
    });

    this.bullWickMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x10b981,
      emissiveIntensity: 1.35,
      roughness: 0.35,
      metalness: 0.4,
    });

    this.bearWickMat = new THREE.MeshStandardMaterial({
      color: 0xfca5a5,
      emissive: 0xef4444,
      emissiveIntensity: 1.35,
      roughness: 0.35,
      metalness: 0.4,
    });

    this.candleMountIronMat = new THREE.MeshStandardMaterial({
      color: 0x2a2f37,
      metalness: 0.88,
      roughness: 0.44,
    });

    this.candleBracketGeom = new THREE.BoxGeometry(0.28, 0.05, 0.06);
    this.candlePlateGeom = new THREE.BoxGeometry(0.05, 0.26, 0.26);
    this.candleBodyGeom = new THREE.BoxGeometry(0.18, 1.0, 0.22);
    this.candleCapGeom = new THREE.BoxGeometry(0.21, 0.035, 0.25);
    this.candleWickGeom = new THREE.CylinderGeometry(0.018, 0.018, 1.0, 8);

    this.egyptianGoldMat = new THREE.MeshStandardMaterial({
      color: 0xb89328,
      emissive: 0x4a3212,
      emissiveIntensity: 0.2,
      metalness: 0.85,
      roughness: 0.28,
    });

    this.egyptianBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x563416,
      metalness: 0.78,
      roughness: 0.38,
    });

    this.egyptianSandstoneMat = new THREE.MeshStandardMaterial({
      color: 0x7d613b,
      roughness: 0.82,
      metalness: 0.15,
    });

    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x5c4020,
      roughness: 0.65,
      metalness: 0.3,
    });

    this.stoneDividerMat = new THREE.MeshStandardMaterial({
      color: 0x6b4f28,
      roughness: 0.8,
      metalness: 0.15,
    });

    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTexture,
      roughness: 0.65,
      metalness: 0.2,
    });

    const tunnelDollar = createPremiumDollarFloorTextures(maxAnisotropy);
    tunnelDollar.map.repeat.set(1, 8);
    tunnelDollar.roughnessMap.repeat.set(1, 8);
    tunnelDollar.bumpMap.repeat.set(1, 8);

    this.tunnelRoadMat = new THREE.MeshStandardMaterial({
      map: tunnelDollar.map,
      roughnessMap: tunnelDollar.roughnessMap,
      bumpMap: tunnelDollar.bumpMap,
      bumpScale: 0.055,
      roughness: 1.0,
      metalness: 0.0,
      envMapIntensity: 0.05,
      color: 0xffffff,
    });

    this.reset();
  }

  public setQueries(queries: MarketQuery[], rebuild = false) {
    if (queries.length > 0) {
      this.queries = queries;
      if (rebuild) {
        this.reset();
      }
    }
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

    // Determine the upcoming stock market query driving this segment's candlestick data
    const activeQueries = this.queries.length > 0 ? this.queries : MARKET_QUERIES;
    const upcomingQuery = activeQueries[this.queryCounter % activeQueries.length];

    // Stock market candlesticks flanking left and right, aligned to the active stock's market data
    let candleStep = 0;
    for (let z = 3; z < length - 2; z += 5.5) {
      this.addStockMarketCandlesticks(group, z, id, upcomingQuery, candleStep);
      candleStep++;
    }

    let forkInstance: ForkInstance | undefined;

    // --- TUNNEL FORK & END-OF-TUNNEL QUERY BOARD ---
    // (Doors completely removed! Open Left & Right road tunnels with End-of-Tunnel query wall)
    if (spawnFork) {
      const qIdx = this.queryCounter % activeQueries.length;
      const query = activeQueries[qIdx];
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
      const coinCount = 2;
      const startZ = length * 0.3;
      const spacing = 2.4;

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
          segmentGroup: group,
          worldPos,
          lane: coinLane,
          collected: false,
          absorbing: false,
          absorbProgress: 0,
          absorbStartPos: new THREE.Vector3(),
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
    // Left road stacked dollar ground with varied heights
    const leftRoadGeom = new THREE.PlaneGeometry(2.4, branchLen, 12, 40);
    const roadPos = leftRoadGeom.attributes.position;
    for (let i = 0; i < roadPos.count; i++) {
      const rx = roadPos.getX(i);
      const ry = roadPos.getY(i);
      const wave =
        Math.sin(ry * 0.75 + rx * 1.3) * 0.035 +
        Math.cos(ry * 1.4 - rx * 1.9) * 0.02 +
        Math.pow(Math.min(1, Math.abs(rx) / 1.2), 2) * 0.06;
      roadPos.setZ(i, wave);
    }
    roadPos.needsUpdate = true;
    leftRoadGeom.computeVertexNormals();

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

    // Left Portal Stock Candlestick Accent Light
    const portalTorchL = new THREE.PointLight(0x10b981, 1.2, 6.5);
    portalTorchL.position.set(-1.85, 3.2, -0.5);
    forkGroup.add(portalTorchL);

    // Left Passage Interior: Safe Path vs Lethal Spike Trap
    if (query.correctSide === 'left') {
      // Safe passage: Golden clearance glow & sacred treasure
      const safeGlow = new THREE.PointLight(0xf59e0b, 1.4, 8);
      safeGlow.position.set(-1.85, 2.0, 4.0);
      forkGroup.add(safeGlow);

      const bonusCoin = createGoldCoin();
      bonusCoin.position.set(-1.85, 0.6, 3.5);
      forkGroup.add(bonusCoin);
    } else {
      // Lethal Trap in Left Passage: Bronze lethal spiked barrier
      const dangerGlow = new THREE.PointLight(0xef4444, 1.8, 7.5);
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

    const portalTorchR = new THREE.PointLight(0xf43f5e, 1.2, 6.5);
    portalTorchR.position.set(1.85, 3.2, -0.5);
    forkGroup.add(portalTorchR);

    // Right Passage Interior: Safe Path vs Lethal Spike Trap
    if (query.correctSide === 'right') {
      const safeGlow = new THREE.PointLight(0xf59e0b, 1.4, 8);
      safeGlow.position.set(1.85, 2.0, 4.0);
      forkGroup.add(safeGlow);

      const bonusCoin = createGoldCoin();
      bonusCoin.position.set(1.85, 0.6, 3.5);
      forkGroup.add(bonusCoin);
    } else {
      const dangerGlow = new THREE.PointLight(0xef4444, 1.8, 7.5);
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

    // Subtle beacon on the Obelisk
    const obeliskLight = new THREE.PointLight(0xffaa33, 1.1, 7);
    obeliskLight.position.set(0, 4.2, -2.5);
    forkGroup.add(obeliskLight);

    parent.add(forkGroup);
  }

  /**
   * 3D Stock Market Candlesticks (Left & Right Corridor Walls)
   * Replaces wall torch lights with bullish green & bearish red OHLC candlesticks
   * complete with upper/lower wicks, iron wall mounts, and subtle moody colored glow.
   */
  private buildSingleStockCandlestick(
    side: -1 | 1,
    isBull: boolean,
    bodyHeight: number,
    wickHeight: number,
    wickOffsetY: number
  ): THREE.Group {
    const holder = new THREE.Group();
    const bodyMat = isBull ? this.bullCandleBodyMat : this.bearCandleBodyMat;
    const wickMat = isBull ? this.bullWickMat : this.bearWickMat;

    // Wall backplate & iron horizontal bracket
    const plate = new THREE.Mesh(this.candlePlateGeom, this.candleMountIronMat);
    plate.position.set(0, 0, 0);
    holder.add(plate);

    const bracket = new THREE.Mesh(this.candleBracketGeom, this.candleMountIronMat);
    bracket.position.set(-side * 0.14, 0, 0);
    holder.add(bracket);

    // Candlestick chart bar assembly mounted on bracket tip
    const candleX = -side * 0.24;

    // Upper & lower OHLC wick
    const wick = new THREE.Mesh(this.candleWickGeom, wickMat);
    wick.scale.set(1, wickHeight, 1);
    wick.position.set(candleX, wickOffsetY, 0);
    holder.add(wick);

    // Main rectangular OHLC candle body
    const body = new THREE.Mesh(this.candleBodyGeom, bodyMat);
    body.scale.set(1, bodyHeight, 1);
    body.position.set(candleX, 0, 0);
    holder.add(body);

    // Open & Close dark iron price-level caps
    const topCap = new THREE.Mesh(this.candleCapGeom, this.candleMountIronMat);
    topCap.position.set(candleX, bodyHeight * 0.5 + 0.015, 0);
    holder.add(topCap);

    const bottomCap = new THREE.Mesh(this.candleCapGeom, this.candleMountIronMat);
    bottomCap.position.set(candleX, -bodyHeight * 0.5 - 0.015, 0);
    holder.add(bottomCap);

    return holder;
  }

  private addStockMarketCandlesticks(
    parent: THREE.Group,
    z: number,
    segmentId: number,
    marketQuery?: MarketQuery,
    candleIndex = 0
  ) {
    const wallX = this.trackWidth * 0.5 + 0.35;
    const seed = Math.floor(z * 1.7) + segmentId * 13;
    const candles = marketQuery?.candles;
    const candle = candles && candles.length > 0 ? candles[candleIndex % candles.length] : undefined;
    const trendBull = marketQuery ? marketQuery.chartTrend !== 'bear' : (seed % 3 !== 0);

    // Left wall candlestick matches live stock OHLC bar if available
    const leftBull = candle ? candle.bull : trendBull;
    const candleSpread =
      candle && candle.high > candle.low
        ? Math.min(0.65, Math.max(0.25, Math.abs(candle.close - candle.open) / (candle.high - candle.low)))
        : 0.45;
    const leftBodyH = 0.42 + candleSpread * 0.65;
    const leftWickH = leftBodyH + 0.44 + ((seed * 3) % 4) * 0.1;
    const leftY = 1.25 + (leftBull ? 0.14 : -0.14) + Math.sin(seed * 0.9) * 0.2;
    const leftWickOff = ((seed % 2 === 0) ? 0.08 : -0.08);

    const leftCandle = this.buildSingleStockCandlestick(-1, leftBull, leftBodyH, leftWickH, leftWickOff);
    leftCandle.position.set(-wallX, leftY, z);
    parent.add(leftCandle);

    // Right wall candlestick reflects same stock trend
    const rightCandleData =
      candles && candles.length > 0 ? candles[(candleIndex + 1) % candles.length] : undefined;
    const rightBull = rightCandleData ? rightCandleData.bull : trendBull;
    const rightBodyH = 0.44 + ((seed * 11) % 5) * 0.12;
    const rightWickH = rightBodyH + 0.42 + ((seed * 5) % 4) * 0.1;
    const rightY = 1.25 + (rightBull ? 0.14 : -0.14) + Math.cos(seed * 0.8) * 0.2;
    const rightWickOff = ((seed % 2 === 1) ? 0.08 : -0.08);

    const rightCandle = this.buildSingleStockCandlestick(1, rightBull, rightBodyH, rightWickH, rightWickOff);
    rightCandle.position.set(wallX, rightY, z);
    parent.add(rightCandle);

    // Subtle dark-mood green/red glow on alternating candlesticks
    if (Math.round(z) % 2 === 0) {
      const useLeftSide = ((seed % 2) === 0);
      const isLightBull = useLeftSide ? leftBull : rightBull;
      const candleLight = new THREE.PointLight(
        isLightBull ? 0x10b981 : 0xef4444,
        0.55,
        5.5
      );
      candleLight.position.set(
        (useLeftSide ? -1 : 1) * (this.trackWidth * 0.5 - 0.15),
        useLeftSide ? leftY : rightY,
        z
      );
      parent.add(candleLight);
    }
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
