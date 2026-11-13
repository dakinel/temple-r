import * as THREE from 'three';
import { createPremiumDollarFloorTextures } from './textures';
import {
  createFallenTreeObstacle,
  createGoldCoin,
} from './models';
import { MARKET_QUERIES, MarketQuery, shuffleQueries } from './queries';
import { FpsCorridor } from './fpsCorridor';

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
  magnetPull: number;
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
  worldForkPos: THREE.Vector3;
  worldDecisionPos: THREE.Vector3;
  headingAngle: number;
  forwardDir: THREE.Vector3;
  rightDir: THREE.Vector3;
  query: MarketQuery;
  queryIndex: number;
  cleared: boolean;
  group: THREE.Group;
}

export interface CornerInstance {
  id: number;
  turnDir: 'left' | 'right';
  startPos: THREE.Vector3;
  pivotPos: THREE.Vector3;
  endPos: THREE.Vector3;
  headingAngle: number;
  newHeading: number;
  forwardDir: THREE.Vector3;
  rightDir: THREE.Vector3;
  turnWindowMinZ: number;
  turnWindowMaxZ: number;
  wallCrashZ: number;
  cleared: boolean;
}

export interface TrackSegment {
  id: number;
  group: THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  headingAngle: number;
  forwardDir: THREE.Vector3;
  length: number;
  isCorner: boolean;
  coins: CoinInstance[];
  obstacles: ObstacleInstance[];
  fork?: ForkInstance;
  corner?: CornerInstance;
}

/**
 * Caution Hazard Stripe Texture for Center Fork Dividing Barrier.
 */
function createHazardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#0f172a';
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
  public corridorKit: FpsCorridor;
  public segments: TrackSegment[] = [];
  public coins: CoinInstance[] = [];
  public obstacles: ObstacleInstance[] = [];
  public forks: ForkInstance[] = [];
  public corners: CornerInstance[] = [];
  private segmentCounter: number = 0;
  private queryCounter: number = 0;
  private shuffledDeck: MarketQuery[] = [];
  private deckCursor: number = 0;
  private lastDrawnQueryId: string | null = null;
  private cornerTurnBias: 'left' | 'right' = 'left';
  private consecutiveSameTurns: number = 0;
  public queries: MarketQuery[] = MARKET_QUERIES;

  // Materials
  private hazardTexture: THREE.CanvasTexture;
  private bullCandleBodyMat: THREE.MeshStandardMaterial;
  private bearCandleBodyMat: THREE.MeshStandardMaterial;
  private bullWickMat: THREE.MeshStandardMaterial;
  private bearWickMat: THREE.MeshStandardMaterial;
  private candleMountIronMat: THREE.MeshStandardMaterial;
  private obeliskWallMaterials: THREE.MeshStandardMaterial[];
  private pylonWallMaterials: THREE.MeshStandardMaterial[];
  private hazardMat: THREE.MeshStandardMaterial;
  private tunnelRoadMat: THREE.MeshStandardMaterial;
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

  // Dimensions aligned cleanly with FpsCorridor
  public readonly trackWidth: number = 4.6;
  public readonly laneOffset: number = 1.85;
  public readonly segmentLength: number = 24.0;

  constructor(scene: THREE.Scene, corridorKit: FpsCorridor, maxAnisotropy = 8) {
    this.scene = scene;
    this.corridorKit = corridorKit;
    this.hazardTexture = createHazardTexture();

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

    this.candleBracketGeom = new THREE.BoxGeometry(0.26, 0.05, 0.06);
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

    const trimMat = this.corridorKit.getTrimMaterial();
    const obeliskSideMat = this.corridorKit.createWallMaterial(1.88, 1);
    const obeliskEndMat = this.corridorKit.createWallMaterial(1 / 3, 1, 1 / 3);
    this.obeliskWallMaterials = [
      obeliskSideMat,
      obeliskSideMat,
      trimMat,
      trimMat,
      obeliskEndMat,
      obeliskEndMat,
    ];

    const pylonSideMat = this.corridorKit.createWallMaterial(0.38, 1, 0.31);
    const pylonFrontMat = this.corridorKit.createWallMaterial(1 / 3, 1, 1 / 3);
    this.pylonWallMaterials = [
      pylonSideMat,
      pylonSideMat,
      trimMat,
      trimMat,
      pylonFrontMat,
      pylonFrontMat,
    ];

    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTexture,
      roughness: 0.65,
      metalness: 0.2,
    });

    const tunnelDollar = createPremiumDollarFloorTextures(maxAnisotropy);
    tunnelDollar.map.repeat.set(1, 7);
    tunnelDollar.roughnessMap.repeat.set(1, 7);
    tunnelDollar.bumpMap.repeat.set(1, 7);

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

  private reshuffleDeck(avoidId?: string | null) {
    const source = this.queries.length > 0 ? this.queries : MARKET_QUERIES;
    const nextDeck = shuffleQueries(source);
    if (avoidId && nextDeck.length > 1 && nextDeck[0].id === avoidId) {
      const swapIdx = 1 + Math.floor(Math.random() * (nextDeck.length - 1));
      [nextDeck[0], nextDeck[swapIdx]] = [nextDeck[swapIdx], nextDeck[0]];
    }
    this.shuffledDeck = nextDeck;
    this.deckCursor = 0;
  }

  private peekNextQuery(): MarketQuery {
    if (this.shuffledDeck.length === 0 || this.deckCursor >= this.shuffledDeck.length) {
      this.reshuffleDeck(this.lastDrawnQueryId);
    }
    return this.shuffledDeck[this.deckCursor];
  }

  private drawNextQuery(): { query: MarketQuery; index: number } {
    if (this.shuffledDeck.length === 0 || this.deckCursor >= this.shuffledDeck.length) {
      this.reshuffleDeck(this.lastDrawnQueryId);
    }
    const query = this.shuffledDeck[this.deckCursor++];
    this.lastDrawnQueryId = query.id;
    const index = this.queryCounter++;
    return { query, index };
  }

  public getNextForkQuery(): { query: MarketQuery; queryIndex: number } | null {
    const nextFork = this.forks.find((f) => !f.cleared);
    if (nextFork) {
      return { query: nextFork.query, queryIndex: nextFork.queryIndex };
    }
    return { query: this.peekNextQuery(), queryIndex: this.queryCounter };
  }

  public setQueries(queries: MarketQuery[], rebuild = false) {
    if (queries.length > 0) {
      this.queries = queries;
      this.reshuffleDeck(this.lastDrawnQueryId);
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
    this.corners = [];
    this.segmentCounter = 0;
    this.queryCounter = 0;
    this.lastDrawnQueryId = null;
    this.reshuffleDeck();
    this.cornerTurnBias = 'left';
    this.consecutiveSameTurns = 0;

    // Start runway facing +Z (heading = 0)
    let curPos = new THREE.Vector3(0, 0, -10);
    let curAngle = 0;

    // Seg 1: straight warm-up
    // Seg 2: straight + first Stock Query Tunnel Fork
    // Seg 3: first 90-degree Egyptian Corner!
    // Seg 4+: endless looping circuit
    const seg1 = this.createSegment(curPos, curAngle, 'none', false, false);
    this.segments.push(seg1);
    this.scene.add(seg1.group);
    curPos = seg1.endPos.clone();
    curAngle = seg1.headingAngle;

    const seg2 = this.createSegment(curPos, curAngle, 'none', false, true);
    this.segments.push(seg2);
    this.scene.add(seg2.group);

    for (let i = 0; i < 6; i++) {
      this.appendNextSegment();
    }
  }

  private scoreCornerSafety(startPos: THREE.Vector3, headingAngle: number, turnDir: 'left' | 'right'): number {
    const fwdIn = new THREE.Vector3(Math.sin(headingAngle), 0, Math.cos(headingAngle));
    const pivot = startPos.clone().addScaledVector(fwdIn, this.corridorKit.cornerPivotZ);
    const newHeading = turnDir === 'left' ? headingAngle + Math.PI / 2 : headingAngle - Math.PI / 2;
    const fwdOut = new THREE.Vector3(Math.sin(newHeading), 0, Math.cos(newHeading));
    const cornerEnd = pivot.clone().addScaledVector(fwdOut, this.corridorKit.width * 0.5);

    // Probe 3 distances ahead along the candidate exit direction
    const probe1 = cornerEnd.clone().addScaledVector(fwdOut, 18);
    const probe2 = cornerEnd.clone().addScaledVector(fwdOut, 40);
    const probe3 = cornerEnd.clone().addScaledVector(fwdOut, 62);

    let minDistSq = Infinity;
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      for (const probe of [cornerEnd, probe1, probe2, probe3]) {
        const dSq = this.distanceSqPointToSegment(
          probe.x,
          probe.z,
          seg.startPos.x,
          seg.startPos.z,
          seg.endPos.x,
          seg.endPos.z
        );
        if (dSq < minDistSq) {
          minDistSq = dSq;
        }
      }
    }
    return Math.sqrt(minDistSq);
  }

  private pickLoopTurnDirection(startPos: THREE.Vector3, headingAngle: number): 'left' | 'right' {
    const preferred = this.cornerTurnBias;
    const other: 'left' | 'right' = preferred === 'left' ? 'right' : 'left';

    const prefClearance = this.scoreCornerSafety(startPos, headingAngle, preferred);
    const otherClearance = this.scoreCornerSafety(startPos, headingAngle, other);

    let chosen = preferred;
    // Switch turn direction if preferred would run close to existing corridor, or after 2-3 turns to weave a circuit
    if (prefClearance < 16 && otherClearance > prefClearance) {
      chosen = other;
    } else if (this.consecutiveSameTurns >= 2 && otherClearance >= 16) {
      chosen = other;
    }

    if (chosen === this.cornerTurnBias) {
      this.consecutiveSameTurns++;
    } else {
      this.cornerTurnBias = chosen;
      this.consecutiveSameTurns = 1;
    }
    return chosen;
  }

  public appendNextSegment() {
    const lastSeg = this.segments[this.segments.length - 1];
    const nextAngle = lastSeg.corner ? lastSeg.corner.newHeading : lastSeg.headingAngle;
    const nextIndex = this.segmentCounter + 1;

    // Cadence: 1: straight run, 2: stock query fork, 3: 90° Egyptian corner!
    const cyclePos = nextIndex % 3;
    const isCorner = cyclePos === 0;
    const isFork = cyclePos === 2;

    if (isCorner) {
      const turnDir = this.pickLoopTurnDirection(lastSeg.endPos, nextAngle);
      const cornerSeg = this.createSegment(lastSeg.endPos, nextAngle, 'none', false, false, turnDir);
      this.segments.push(cornerSeg);
      this.scene.add(cornerSeg.group);
    } else {
      const newSeg = this.createSegment(lastSeg.endPos, nextAngle, undefined, true, isFork);
      this.segments.push(newSeg);
      this.scene.add(newSeg.group);
    }
  }

  private createSegment(
    startPos: THREE.Vector3,
    headingAngle: number,
    forceObstacle?: ObstacleType,
    spawnCoins: boolean = true,
    spawnFork: boolean = false,
    cornerTurnDir?: 'left' | 'right'
  ): TrackSegment {
    const id = ++this.segmentCounter;
    const group = new THREE.Group();
    group.position.copy(startPos);
    group.rotation.y = headingAngle;

    const coins: CoinInstance[] = [];
    const obstacles: ObstacleInstance[] = [];
    const isCorner = Boolean(cornerTurnDir);
    const length = isCorner ? this.corridorKit.cornerPivotZ : this.segmentLength;

    const dir = new THREE.Vector3(Math.sin(headingAngle), 0, Math.cos(headingAngle));
    // Screen-Right vector (note: when heading=0, forward=+Z, screen-right=-X)
    const rightDir = new THREE.Vector3(-Math.cos(headingAngle), 0, Math.sin(headingAngle));

    // Attach 3D Non-Linear Egyptian Temple Corridor or 90-deg Corner Hub geometry
    const archSection = cornerTurnDir
      ? this.corridorKit.buildCornerSection(id, cornerTurnDir)
      : this.corridorKit.buildStraightSection(id);
    group.add(archSection);

    // Compute endPos seamlessly
    let endPos: THREE.Vector3;
    let cornerInstance: CornerInstance | undefined;

    if (cornerTurnDir) {
      const pivotPos = startPos.clone().addScaledVector(dir, this.corridorKit.cornerPivotZ);
      const newHeading =
        cornerTurnDir === 'left'
          ? headingAngle + Math.PI / 2
          : headingAngle - Math.PI / 2;
      const outDir = new THREE.Vector3(Math.sin(newHeading), 0, Math.cos(newHeading));
      endPos = pivotPos.clone().addScaledVector(outDir, this.corridorKit.width * 0.5);

      cornerInstance = {
        id,
        turnDir: cornerTurnDir,
        startPos: startPos.clone(),
        pivotPos,
        endPos: endPos.clone(),
        headingAngle,
        newHeading,
        forwardDir: dir.clone(),
        rightDir: rightDir.clone(),
        turnWindowMinZ: 11.6,
        turnWindowMaxZ: 18.0,
        wallCrashZ: 18.1,
        cleared: false,
      };
      this.corners.push(cornerInstance);
    } else {
      endPos = startPos.clone().addScaledVector(dir, length);
    }

    // Stock market candlesticks flanking corridor walls
    const upcomingQuery = this.peekNextQuery();

    let candleStep = 0;
    const candleMaxZ = isCorner ? 10.5 : length - 2.0;
    for (let z = 3.0; z < candleMaxZ; z += 5.5) {
      this.addStockMarketCandlesticks(group, z, id, upcomingQuery, candleStep);
      candleStep++;
    }

    let forkInstance: ForkInstance | undefined;

    // --- EGYPTIAN TUNNEL FORK (YES on Screen Left = +X_local, NO on Screen Right = -X_local) ---
    if (spawnFork && !isCorner) {
      const { query, index: qIdx } = this.drawNextQuery();

      const forkZ = 5.0;
      const decisionOffsetZ = forkZ + 1.5;

      this.addTunnelFork(group, forkZ, query);

      forkInstance = {
        id,
        forkZ,
        decisionLineZ: decisionOffsetZ,
        worldForkPos: startPos.clone().addScaledVector(dir, forkZ),
        worldDecisionPos: startPos.clone().addScaledVector(dir, decisionOffsetZ),
        headingAngle,
        forwardDir: dir.clone(),
        rightDir: rightDir.clone(),
        query,
        queryIndex: qIdx,
        cleared: false,
        group,
      };
      this.forks.push(forkInstance);
    }

    // Hurdle Obstacle Placement (only on plain straight segments)
    let obsType = forceObstacle;
    if (!obsType && !spawnFork && !isCorner && this.segmentCounter > 2) {
      if (Math.random() < 0.45) {
        obsType = 'crash_dip';
      }
    }

    if (obsType === 'crash_dip' && !isCorner) {
      const hurdle = createFallenTreeObstacle();
      const obsZ = length * 0.5;
      hurdle.position.set(0, 0, obsZ);
      group.add(hurdle);

      const worldObsPos = startPos.clone().addScaledVector(dir, obsZ);
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
    if (spawnCoins && !spawnFork && !isCorner) {
      const coinLane = Math.floor(Math.random() * 3) - 1;
      const coinCount = 2;
      const startZ = length * 0.3;
      const spacing = 2.6;

      for (let c = 0; c < coinCount; c++) {
        const coinZ = startZ + c * spacing;
        if (obsType === 'crash_dip' && Math.abs(coinZ - length * 0.5) < 2.2) continue;

        const coinMesh = createGoldCoin();
        // Screen-left corresponds to +X in segment-local coords, screen-right to -X
        const coinX = -coinLane * 1.3;
        coinMesh.position.set(coinX, 0.45, coinZ);
        group.add(coinMesh);

        const localPos = new THREE.Vector3(coinX, 0.45, coinZ);
        const worldPos = localPos
          .clone()
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), headingAngle)
          .add(startPos);

        const coinInst: CoinInstance = {
          mesh: coinMesh,
          segmentGroup: group,
          worldPos,
          lane: coinLane,
          collected: false,
          absorbing: false,
          absorbProgress: 0,
          absorbStartPos: new THREE.Vector3(),
          magnetPull: 0,
        };
        coins.push(coinInst);
        this.coins.push(coinInst);
      }
    }

    return {
      id,
      group,
      startPos: startPos.clone(),
      endPos,
      headingAngle,
      forwardDir: dir,
      length,
      isCorner,
      coins,
      obstacles,
      fork: forkInstance,
      corner: cornerInstance,
    };
  }

  /**
   * 3D EGYPTIAN TEMPLE FORK:
   * Segment-local +X is Screen LEFT (YES/BUY); segment-local -X is Screen RIGHT (NO/PASS).
   */
  private addTunnelFork(parent: THREE.Group, forkZ: number, query: MarketQuery) {
    const forkGroup = new THREE.Group();
    forkGroup.position.set(0, 0, forkZ);

    const branchLen = 15.0;
    const leftX = 1.85;   // Screen Left (+X) -> YES
    const rightX = -1.85; // Screen Right (-X) -> NO

    const leftRoadGeom = new THREE.PlaneGeometry(2.35, branchLen, 10, 28);
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

    // ========================================================
    // 1. LEFT EGYPTIAN TOMB PORTAL (YES / BUY — Screen Left +X)
    // ========================================================
    const leftRoad = new THREE.Mesh(leftRoadGeom, this.tunnelRoadMat);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.position.set(leftX, 0.01, branchLen * 0.5);
    leftRoad.receiveShadow = true;
    forkGroup.add(leftRoad);

    const colGeom = new THREE.CylinderGeometry(0.22, 0.28, 4.0, 10);
    const colLeft1 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colLeft1.position.set(leftX + 1.05, 2.0, 0.2);
    forkGroup.add(colLeft1);

    const colLeft2 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colLeft2.position.set(leftX - 1.05, 2.0, 0.2);
    forkGroup.add(colLeft2);

    const lintelGeom = new THREE.BoxGeometry(2.4, 0.5, 0.4);
    const leftLintel = new THREE.Mesh(lintelGeom, this.egyptianSandstoneMat);
    leftLintel.position.set(leftX, 3.8, 0.2);
    forkGroup.add(leftLintel);

    const ankhBaseGeom = new THREE.BoxGeometry(2.1, 0.45, 0.12);
    const leftSign = new THREE.Mesh(ankhBaseGeom, this.egyptianGoldMat);
    leftSign.position.set(leftX, 3.3, 0.2);
    forkGroup.add(leftSign);

    const portalTorchL = new THREE.PointLight(0x10b981, 1.2, 6.5);
    portalTorchL.position.set(leftX, 3.2, -0.5);
    forkGroup.add(portalTorchL);

    if (query.correctSide === 'left') {
      const safeGlow = new THREE.PointLight(0xf59e0b, 1.4, 8);
      safeGlow.position.set(leftX, 2.0, 4.0);
      forkGroup.add(safeGlow);

      const bonusCoin = createGoldCoin();
      bonusCoin.position.set(leftX, 0.6, 3.5);
      forkGroup.add(bonusCoin);
    } else {
      const dangerGlow = new THREE.PointLight(0xef4444, 1.8, 7.5);
      dangerGlow.position.set(leftX, 2.0, 2.5);
      forkGroup.add(dangerGlow);

      const barricadeGeom = new THREE.BoxGeometry(2.15, 2.8, 0.5);
      const barricade = new THREE.Mesh(barricadeGeom, this.hazardMat);
      barricade.position.set(leftX, 1.4, 3.0);
      forkGroup.add(barricade);

      const spikeGeom = new THREE.ConeGeometry(0.12, 0.6, 6);
      spikeGeom.rotateX(Math.PI / 2);
      for (let s = -0.8; s <= 0.8; s += 0.4) {
        const spike = new THREE.Mesh(spikeGeom, this.egyptianBronzeMat);
        spike.position.set(leftX + s, 1.5, 2.7);
        forkGroup.add(spike);
      }
    }

    // ========================================================
    // 2. RIGHT EGYPTIAN TOMB PORTAL (NO / PASS — Screen Right -X)
    // ========================================================
    const rightRoad = new THREE.Mesh(leftRoadGeom, this.tunnelRoadMat);
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.position.set(rightX, 0.01, branchLen * 0.5);
    rightRoad.receiveShadow = true;
    forkGroup.add(rightRoad);

    const colRight1 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colRight1.position.set(rightX + 1.05, 2.0, 0.2);
    forkGroup.add(colRight1);

    const colRight2 = new THREE.Mesh(colGeom, this.egyptianSandstoneMat);
    colRight2.position.set(rightX - 1.05, 2.0, 0.2);
    forkGroup.add(colRight2);

    const rightLintel = new THREE.Mesh(lintelGeom, this.egyptianSandstoneMat);
    rightLintel.position.set(rightX, 3.8, 0.2);
    forkGroup.add(rightLintel);

    const rightSign = new THREE.Mesh(ankhBaseGeom, this.egyptianGoldMat);
    rightSign.position.set(rightX, 3.3, 0.2);
    forkGroup.add(rightSign);

    const portalTorchR = new THREE.PointLight(0xf43f5e, 1.2, 6.5);
    portalTorchR.position.set(rightX, 3.2, -0.5);
    forkGroup.add(portalTorchR);

    if (query.correctSide === 'right') {
      const safeGlow = new THREE.PointLight(0xf59e0b, 1.4, 8);
      safeGlow.position.set(rightX, 2.0, 4.0);
      forkGroup.add(safeGlow);

      const bonusCoin = createGoldCoin();
      bonusCoin.position.set(rightX, 0.6, 3.5);
      forkGroup.add(bonusCoin);
    } else {
      const dangerGlow = new THREE.PointLight(0xef4444, 1.8, 7.5);
      dangerGlow.position.set(rightX, 2.0, 2.5);
      forkGroup.add(dangerGlow);

      const barricadeGeom = new THREE.BoxGeometry(2.15, 2.8, 0.5);
      const barricade = new THREE.Mesh(barricadeGeom, this.hazardMat);
      barricade.position.set(rightX, 1.4, 3.0);
      forkGroup.add(barricade);

      const spikeGeom = new THREE.ConeGeometry(0.12, 0.6, 6);
      spikeGeom.rotateX(Math.PI / 2);
      for (let s = -0.8; s <= 0.8; s += 0.4) {
        const spike = new THREE.Mesh(spikeGeom, this.egyptianBronzeMat);
        spike.position.set(rightX + s, 1.5, 2.7);
        forkGroup.add(spike);
      }
    }

    // ========================================================
    // 3. CENTER DIVIDER: MONUMENTAL EGYPTIAN SANDSTONE OBELISK
    // ========================================================
    const obeliskBaseGeom = new THREE.BoxGeometry(1.15, 3.4, branchLen);
    const obeliskBase = new THREE.Mesh(obeliskBaseGeom, this.obeliskWallMaterials);
    obeliskBase.position.set(0, 1.7, branchLen * 0.5);
    obeliskBase.receiveShadow = true;
    forkGroup.add(obeliskBase);

    const pylonGeom = new THREE.BoxGeometry(1.15, 4.2, 3.0);
    const pylon = new THREE.Mesh(pylonGeom, this.pylonWallMaterials);
    pylon.position.set(0, 2.1, -1.3);
    pylon.receiveShadow = true;
    forkGroup.add(pylon);

    const capGeom = new THREE.ConeGeometry(0.82, 1.2, 4);
    capGeom.rotateY(Math.PI / 4);
    const cap = new THREE.Mesh(capGeom, this.egyptianGoldMat);
    cap.position.set(0, 4.8, -1.3);
    forkGroup.add(cap);

    const obeliskLight = new THREE.PointLight(0xffaa33, 1.1, 7);
    obeliskLight.position.set(0, 4.2, -2.2);
    forkGroup.add(obeliskLight);

    parent.add(forkGroup);
  }

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

    const plate = new THREE.Mesh(this.candlePlateGeom, this.candleMountIronMat);
    holder.add(plate);

    const bracket = new THREE.Mesh(this.candleBracketGeom, this.candleMountIronMat);
    bracket.position.set(-side * 0.14, 0, 0);
    holder.add(bracket);

    const candleX = -side * 0.24;

    const wick = new THREE.Mesh(this.candleWickGeom, wickMat);
    wick.scale.set(1, wickHeight, 1);
    wick.position.set(candleX, wickOffsetY, 0);
    holder.add(wick);

    const body = new THREE.Mesh(this.candleBodyGeom, bodyMat);
    body.scale.set(1, bodyHeight, 1);
    body.position.set(candleX, 0, 0);
    holder.add(body);

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
    const wallX = this.corridorKit.width * 0.5 - 0.16; // Mounted cleanly inside the 6.3m Egyptian walls
    const seed = Math.floor(z * 1.7) + segmentId * 13;
    const candles = marketQuery?.candles;
    const candle = candles && candles.length > 0 ? candles[candleIndex % candles.length] : undefined;
    const trendBull = marketQuery ? marketQuery.chartTrend !== 'bear' : (seed % 3 !== 0);

    const leftBull = candle ? candle.bull : trendBull;
    const candleSpread =
      candle && candle.high > candle.low
        ? Math.min(0.65, Math.max(0.25, Math.abs(candle.close - candle.open) / (candle.high - candle.low)))
        : 0.45;
    const leftBodyH = 0.42 + candleSpread * 0.65;
    const leftWickH = leftBodyH + 0.44 + ((seed * 3) % 4) * 0.1;
    const leftY = 1.4 + (leftBull ? 0.14 : -0.14) + Math.sin(seed * 0.9) * 0.18;
    const leftWickOff = (seed % 2 === 0 ? 0.08 : -0.08);

    const leftCandle = this.buildSingleStockCandlestick(-1, leftBull, leftBodyH, leftWickH, leftWickOff);
    leftCandle.position.set(-wallX, leftY, z);
    parent.add(leftCandle);

    const rightCandleData =
      candles && candles.length > 0 ? candles[(candleIndex + 1) % candles.length] : undefined;
    const rightBull = rightCandleData ? rightCandleData.bull : trendBull;
    const rightBodyH = 0.44 + ((seed * 11) % 5) * 0.12;
    const rightWickH = rightBodyH + 0.42 + ((seed * 5) % 4) * 0.1;
    const rightY = 1.4 + (rightBull ? 0.14 : -0.14) + Math.cos(seed * 0.8) * 0.18;
    const rightWickOff = (seed % 2 === 1 ? 0.08 : -0.08);

    const rightCandle = this.buildSingleStockCandlestick(1, rightBull, rightBodyH, rightWickH, rightWickOff);
    rightCandle.position.set(wallX, rightY, z);
    parent.add(rightCandle);

    if (Math.round(z) % 2 === 0) {
      const useLeftSide = (seed % 2) === 0;
      const isLightBull = useLeftSide ? leftBull : rightBull;
      const candleLight = new THREE.PointLight(
        isLightBull ? 0x10b981 : 0xef4444,
        0.95,
        6.5
      );
      candleLight.position.set(
        (useLeftSide ? -1 : 1) * (wallX - 0.35),
        useLeftSide ? leftY : rightY,
        z
      );
      parent.add(candleLight);
    }
  }

  private distanceSqPointToSegment(
    px: number,
    pz: number,
    ax: number,
    az: number,
    bx: number,
    bz: number
  ): number {
    const abx = bx - ax;
    const abz = bz - az;
    const lenSq = abx * abx + abz * abz;
    if (lenSq <= 1e-6) {
      const dx = px - ax;
      const dz = pz - az;
      return dx * dx + dz * dz;
    }
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / lenSq));
    const cx = ax + abx * t;
    const cz = az + abz * t;
    const dx = px - cx;
    const dz = pz - cz;
    return dx * dx + dz * dz;
  }

  private getPlayerSegmentIndex(playerPos: THREE.Vector3): number {
    let bestIdx = 0;
    let bestDistSq = Infinity;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      let dSq: number;
      if (seg.corner) {
        const d1 = this.distanceSqPointToSegment(
          playerPos.x,
          playerPos.z,
          seg.corner.startPos.x,
          seg.corner.startPos.z,
          seg.corner.pivotPos.x,
          seg.corner.pivotPos.z
        );
        const d2 = this.distanceSqPointToSegment(
          playerPos.x,
          playerPos.z,
          seg.corner.pivotPos.x,
          seg.corner.pivotPos.z,
          seg.corner.endPos.x,
          seg.corner.endPos.z
        );
        dSq = Math.min(d1, d2);
      } else {
        dSq = this.distanceSqPointToSegment(
          playerPos.x,
          playerPos.z,
          seg.startPos.x,
          seg.startPos.z,
          seg.endPos.x,
          seg.endPos.z
        );
      }

      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  public update(playerPos: THREE.Vector3, _time: number) {
    if (this.segments.length === 0) return;

    // Heading-agnostic active-segment tracking so 90-deg turns never stall corridor spawning
    let activeIdx = this.getPlayerSegmentIndex(playerPos);

    // Keep at least 2 full segments behind the player for the chase camera
    while (activeIdx >= 3 && this.segments.length > 0) {
      const removed = this.segments.shift()!;
      this.scene.remove(removed.group);
      this.coins = this.coins.filter((c) => !removed.coins.includes(c));
      this.obstacles = this.obstacles.filter((o) => !removed.obstacles.includes(o));
      if (removed.fork) {
        this.forks = this.forks.filter((f) => f.id !== removed.fork!.id);
      }
      if (removed.corner) {
        this.corners = this.corners.filter((c) => c.id !== removed.corner!.id);
      }
      activeIdx--;
    }

    // Always keep at least 7 corridor/corner segments built ahead of the player
    while (this.segments.length - 1 - activeIdx < 7) {
      this.appendNextSegment();
    }
  }
}
