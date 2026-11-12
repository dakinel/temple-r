import * as THREE from 'three';
import { createCandlestickTexture } from './textures';
import {
  createFallenTreeObstacle,
  createSlideGateObstacle,
  createGoldCoin,
} from './models';
import { MARKET_QUERIES, MarketQuery } from './queries';

export type ObstacleType = 'none' | 'crash_dip' | 'margin_call';

export interface CoinInstance {
  mesh: THREE.Mesh;
  worldPos: THREE.Vector3;
  lane: number;
  collected: boolean;
}

export interface ObstacleInstance {
  group: THREE.Group;
  type: 'tree' | 'gate';
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
 * Procedural high-resolution End-of-Tunnel Query Board Canvas Texture.
 * Renders the Wall Street query as a massive, high-tech terminal wall visible
 * at the vanishing point / end of the incoming tunnel.
 */
function createEndOfTunnelBillboardTexture(query: MarketQuery): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Carbon Background
  ctx.fillStyle = '#060a0f';
  ctx.fillRect(0, 0, 1024, 576);

  // Digital Grid lines
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 576);
    ctx.stroke();
  }
  for (let y = 0; y < 576; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // 2. High-Tech Bezel / Glowing Border
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 1000, 552);

  ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 988, 540);

  // Corner Accents
  ctx.fillStyle = '#34d399';
  const cornerSize = 20;
  ctx.fillRect(12, 12, cornerSize, 6);
  ctx.fillRect(12, 12, 6, cornerSize);
  ctx.fillRect(1012 - cornerSize, 12, cornerSize, 6);
  ctx.fillRect(1006, 12, 6, cornerSize);
  ctx.fillRect(12, 558, cornerSize, 6);
  ctx.fillRect(12, 564 - cornerSize, 6, cornerSize);
  ctx.fillRect(1012 - cornerSize, 558, cornerSize, 6);
  ctx.fillRect(1006, 564 - cornerSize, 6, cornerSize);

  // 3. Top Status Ribbon
  ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
  ctx.fillRect(24, 24, 976, 44);

  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = '#6ee7b7';
  ctx.textAlign = 'left';
  ctx.fillText('LIVE WALL STREET TERMINAL // FORK JUNCTION AHEAD', 38, 52);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  ctx.fillText('REAL-TIME MARKET FEED ● CONNECTED', 980, 52);

  // 4. Stock Ticker & Category Bar
  const isUp = !query.change.startsWith('-');
  const trendColor = isUp ? '#34d399' : '#f87171';

  // Ticker badge
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(40, 84, 180, 48);
  ctx.strokeStyle = trendColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 84, 180, 48);

  ctx.font = '900 30px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(query.ticker, 130, 120);

  // Price & Change
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(query.price, 240, 120);

  ctx.fillStyle = trendColor;
  ctx.fillText(query.change, 380, 120);

  // Category Tag
  ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
  ctx.fillRect(520, 88, 160, 40);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(520, 88, 160, 40);

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#7dd3fc';
  ctx.textAlign = 'center';
  ctx.fillText(query.category, 600, 114);

  // Profit Stake
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`POTENTIAL P&L: +$${query.profit.toLocaleString()}`, 980, 118);

  // 5. Headline Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(40, 150, 944, 56);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 150, 944, 56);

  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  ctx.fillText(`HEADLINE: ${query.headline}`, 56, 186);

  // 6. Question Banner
  ctx.fillStyle = 'rgba(12, 74, 110, 0.55)';
  ctx.fillRect(40, 220, 944, 76);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 220, 944, 76);

  ctx.font = 'bold 25px system-ui, sans-serif';
  ctx.fillStyle = '#f0fdf4';
  ctx.fillText(`DECISION: "${query.question}"`, 56, 268);

  // 7. Left Tunnel vs Right Tunnel Road Signs
  // --- LEFT TUNNEL SELECTION BOX ---
  ctx.fillStyle = 'rgba(5, 46, 22, 0.95)';
  ctx.fillRect(40, 316, 450, 160);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(40, 316, 450, 160);

  ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.textAlign = 'center';
  ctx.fillText('◄ TAKE LEFT TUNNEL', 265, 356);

  ctx.font = '900 28px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(query.leftLabel, 265, 404);

  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText('STEER / SCROLL LEFT TO SELECT', 265, 446);

  // --- RIGHT TUNNEL SELECTION BOX ---
  ctx.fillStyle = 'rgba(76, 5, 25, 0.95)';
  ctx.fillRect(534, 316, 450, 160);
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(534, 316, 450, 160);

  ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillStyle = '#fb7185';
  ctx.textAlign = 'center';
  ctx.fillText('TAKE RIGHT TUNNEL ►', 759, 356);

  ctx.font = '900 28px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(query.rightLabel, 759, 404);

  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#fda4af';
  ctx.fillText('STEER / SCROLL RIGHT TO SELECT', 759, 446);

  // 8. Bottom Lethal Warning Ticker
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(40, 496, 944, 44);

  ctx.font = '900 17px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ HIGH-STAKES FORK: CHOOSING THE WRONG TUNNEL = INSTANT LIQUIDATION (DEATH)', 512, 524);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
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
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });

    this.neonRoseMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });

    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.stoneDividerMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTexture,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.tunnelRoadMat = new THREE.MeshStandardMaterial({
      color: 0x222622,
      roughness: 0.8,
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

    // Runway: first 3 segments straight, 4th segment has the first tunnel fork!
    for (let i = 0; i < 4; i++) {
      const isFork = (i === 3);
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
    // A tunnel fork occurs regularly every ~3-4 segments
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
    // (Doors have been completely removed! Path splits cleanly into Left & Right roads)
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
        decisionLineZ: worldForkZ + 4.0, // Point where tunnel selection is evaluated
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
      if (rnd < 0.4) {
        obsType = rnd < 0.25 ? 'crash_dip' : 'margin_call';
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
    } else if (obsType === 'margin_call') {
      const gate = createSlideGateObstacle();
      const obsZ = length * 0.5;
      gate.position.set(0, 0, obsZ);
      group.add(gate);

      const worldObsPos = startPos.clone().add(dir.clone().multiplyScalar(obsZ));
      const obsInst: ObstacleInstance = {
        group: gate,
        type: 'gate',
        worldPos: worldObsPos,
        lane: 0,
        boundingSphere: new THREE.Sphere(worldObsPos, 1.5),
        cleared: false,
      };
      obstacles.push(obsInst);
      this.obstacles.push(obsInst);
    }

    // Gold Bullion Coins ($) along Corridor Floor
    if (spawnCoins && obsType !== 'margin_call' && !spawnFork) {
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
   * 3D TUNNEL FORK & END-OF-TUNNEL QUERY BOARD:
   * 1. Query Table Board: positioned directly at the end of the incoming tunnel.
   * 2. Left Road / Tunnel: branches outward to the left (YES/BUY option).
   * 3. Right Road / Tunnel: branches outward to the right (NO/PASS option).
   * 4. Center Divider: hazard-striped stone barrier in the center between the two roads.
   * NO DOORS: completely open tunnel openings!
   */
  private addTunnelFork(parent: THREE.Group, forkZ: number, query: MarketQuery) {
    const forkGroup = new THREE.Group();
    forkGroup.position.set(0, 0, forkZ);

    // ========================================================
    // 1. END-OF-TUNNEL QUERY DISPLAY BOARD
    // Looks like the back wall / end of the tunnel ahead!
    // ========================================================
    const boardTex = createEndOfTunnelBillboardTexture(query);
    const boardMat = new THREE.MeshBasicMaterial({
      map: boardTex,
      toneMapped: false,
    });

    const boardW = 5.2;
    const boardH = 3.0;
    const boardGeom = new THREE.PlaneGeometry(boardW, boardH);
    const boardMesh = new THREE.Mesh(boardGeom, boardMat);
    // Positioned facing the runner, spanning the tunnel end
    boardMesh.position.set(0, 2.5, 0);
    forkGroup.add(boardMesh);

    // Frame & Industrial Truss for Board
    const frameGeom = new THREE.BoxGeometry(boardW + 0.25, boardH + 0.25, 0.15);
    const frameMesh = new THREE.Mesh(frameGeom, this.frameMat);
    frameMesh.position.set(0, 2.5, -0.08);
    forkGroup.add(frameMesh);

    // Overhead Illumination Floodlights on the Board
    const boardLight = new THREE.PointLight(0x6ee7b7, 3.5, 9);
    boardLight.position.set(0, 4.0, 1.2);
    forkGroup.add(boardLight);

    // Left & Right Beacon Lights atop Board
    const beaconL = new THREE.PointLight(0x10b981, 2.0, 6);
    beaconL.position.set(-boardW * 0.45, 4.2, 0.2);
    forkGroup.add(beaconL);

    const beaconR = new THREE.PointLight(0xf43f5e, 2.0, 6);
    beaconR.position.set(boardW * 0.45, 4.2, 0.2);
    forkGroup.add(beaconR);

    // ========================================================
    // 2. LEFT ROAD / TUNNEL (YES / BUY Selection)
    // Branches out to the left: x = -1.2 to -2.8
    // ========================================================
    const branchLen = 22.0;

    // Left road stone floor
    const leftRoadGeom = new THREE.PlaneGeometry(2.4, branchLen);
    const leftRoad = new THREE.Mesh(leftRoadGeom, this.tunnelRoadMat);
    leftRoad.rotation.x = -Math.PI / 2;
    // Angled slightly outward to left
    leftRoad.rotation.z = 0.08;
    leftRoad.position.set(-1.85, 0.01, branchLen * 0.5);
    leftRoad.receiveShadow = true;
    forkGroup.add(leftRoad);

    // Left Road Outer Stone Wall
    const leftWallGeom = new THREE.PlaneGeometry(branchLen, 4.2);
    const leftOuterWall = new THREE.Mesh(leftWallGeom, this.stoneDividerMat);
    leftOuterWall.rotation.y = Math.PI / 2 - 0.08;
    leftOuterWall.position.set(-3.1, 2.0, branchLen * 0.5);
    forkGroup.add(leftOuterWall);

    // Left Road Neon Emerald Guide Kerbs (Pavement Light Strips)
    const kerbGeom = new THREE.BoxGeometry(0.12, 0.16, branchLen);
    const leftKerb = new THREE.Mesh(kerbGeom, this.neonGreenMat);
    leftKerb.position.set(-3.0, 0.08, branchLen * 0.5);
    forkGroup.add(leftKerb);

    const leftInnerKerb = new THREE.Mesh(kerbGeom, this.neonGreenMat);
    leftInnerKerb.position.set(-0.7, 0.08, branchLen * 0.5);
    forkGroup.add(leftInnerKerb);

    // Left Road Overhead Neon Sign: [ ◄ LEFT TUNNEL: YES ]
    const leftSignGeom = new THREE.BoxGeometry(2.2, 0.5, 0.1);
    const leftSign = new THREE.Mesh(leftSignGeom, this.neonGreenMat);
    leftSign.position.set(-1.85, 3.2, 3.5);
    forkGroup.add(leftSign);

    // ========================================================
    // 3. RIGHT ROAD / TUNNEL (NO / PASS Selection)
    // Branches out to the right: x = +1.2 to +2.8
    // ========================================================
    const rightRoad = new THREE.Mesh(leftRoadGeom, this.tunnelRoadMat);
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.rotation.z = -0.08;
    rightRoad.position.set(1.85, 0.01, branchLen * 0.5);
    rightRoad.receiveShadow = true;
    forkGroup.add(rightRoad);

    // Right Road Outer Stone Wall
    const rightOuterWall = new THREE.Mesh(leftWallGeom, this.stoneDividerMat);
    rightOuterWall.rotation.y = -Math.PI / 2 + 0.08;
    rightOuterWall.position.set(3.1, 2.0, branchLen * 0.5);
    forkGroup.add(rightOuterWall);

    // Right Road Neon Rose Guide Kerbs (Pavement Light Strips)
    const rightKerb = new THREE.Mesh(kerbGeom, this.neonRoseMat);
    rightKerb.position.set(3.0, 0.08, branchLen * 0.5);
    forkGroup.add(rightKerb);

    const rightInnerKerb = new THREE.Mesh(kerbGeom, this.neonRoseMat);
    rightInnerKerb.position.set(0.7, 0.08, branchLen * 0.5);
    forkGroup.add(rightInnerKerb);

    // Right Road Overhead Neon Sign: [ RIGHT TUNNEL: NO ► ]
    const rightSignGeom = new THREE.BoxGeometry(2.2, 0.5, 0.1);
    const rightSign = new THREE.Mesh(rightSignGeom, this.neonRoseMat);
    rightSign.position.set(1.85, 3.2, 3.5);
    forkGroup.add(rightSign);

    // ========================================================
    // 4. CENTER DIVIDER WEDGE (Hazard-Striped Crash Barrier)
    // Separates the Left and Right road. Hesitation / staying in center = crash!
    // ========================================================
    const dividerGeom = new THREE.BoxGeometry(1.2, 3.2, branchLen);
    const dividerMesh = new THREE.Mesh(dividerGeom, this.stoneDividerMat);
    dividerMesh.position.set(0, 1.6, branchLen * 0.5);
    forkGroup.add(dividerMesh);

    // Nose Hazard Plate (Facing Oncoming Runner)
    const noseGeom = new THREE.BoxGeometry(1.22, 3.22, 0.3);
    const noseMesh = new THREE.Mesh(noseGeom, this.hazardMat);
    noseMesh.position.set(0, 1.6, 0.15);
    forkGroup.add(noseMesh);

    // Flashing Alert Beacon on Nose
    const noseBeacon = new THREE.PointLight(0xeab308, 2.5, 5);
    noseBeacon.position.set(0, 3.4, 0.3);
    forkGroup.add(noseBeacon);

    parent.add(forkGroup);
  }

  private addCandlestickSconces(parent: THREE.Group, z: number) {
    const candleGeom = new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8);
    const postMat = (z % 16 === 0) ? this.neonGreenMat : this.neonRoseMat;

    const leftCandle = new THREE.Mesh(candleGeom, postMat);
    leftCandle.position.set(-this.trackWidth * 0.5 - 0.1, 0.7, z);
    parent.add(leftCandle);

    const rightCandle = new THREE.Mesh(candleGeom, postMat === this.neonGreenMat ? this.neonRoseMat : this.neonGreenMat);
    rightCandle.position.set(this.trackWidth * 0.5 + 0.1, 0.7, z);
    parent.add(rightCandle);
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
