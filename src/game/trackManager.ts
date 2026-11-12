import * as THREE from 'three';
import { createStoneTrackTexture } from './textures';
import {
  createFallenTreeObstacle,
  createSlideGateObstacle,
  createGoldCoin,
} from './models';

export type ObstacleType = 'none' | 'tree' | 'gate' | 'gap';
export type TrackType = 'straight' | 'turn_left' | 'turn_right' | 't_junction';

export interface CoinInstance {
  mesh: THREE.Mesh;
  worldPos: THREE.Vector3;
  lane: number; // -1, 0, 1
  collected: boolean;
}

export interface ObstacleInstance {
  group: THREE.Group;
  type: ObstacleType;
  worldPos: THREE.Vector3;
  lane: number; // 0 for full-width, or specific lane
  boundingSphere: THREE.Sphere;
  cleared: boolean;
}

export interface TrackSegment {
  id: number;
  type: TrackType;
  group: THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  headingAngle: number; // 0, PI/2, PI, -PI/2
  length: number;
  hasTurnOpportunity: boolean;
  turnTriggerPos: THREE.Vector3;
  turnDirection: 'left' | 'right' | 'both' | 'none';
  coins: CoinInstance[];
  obstacles: ObstacleInstance[];
}

export class TrackManager {
  public scene: THREE.Scene;
  public segments: TrackSegment[] = [];
  public coins: CoinInstance[] = [];
  public obstacles: ObstacleInstance[] = [];
  private segmentCounter: number = 0;
  private stoneTexture: THREE.CanvasTexture;
  private trackMat: THREE.MeshStandardMaterial;
  private sideBorderMat: THREE.MeshStandardMaterial;
  private columnMat: THREE.MeshStandardMaterial;
  private torchLightPool: THREE.PointLight[] = [];

  // Track Dimensions
  public readonly trackWidth: number = 3.6;
  public readonly laneOffset: number = 1.15; // lane -1, 0, 1
  public readonly straightLength: number = 24.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.stoneTexture = createStoneTrackTexture();

    this.trackMat = new THREE.MeshStandardMaterial({
      map: this.stoneTexture,
      roughness: 0.85,
      metalness: 0.1,
    });

    this.sideBorderMat = new THREE.MeshStandardMaterial({
      color: 0x3d372f,
      roughness: 0.9,
      metalness: 0.15,
    });

    this.columnMat = new THREE.MeshStandardMaterial({
      color: 0x5a5246,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Initialize initial straight track runway (at least 5 segments)
    this.reset();
  }

  public reset() {
    // Clear existing meshes
    for (const seg of this.segments) {
      this.scene.remove(seg.group);
    }
    this.segments = [];
    this.coins = [];
    this.obstacles = [];
    this.segmentCounter = 0;

    // Start origin
    let curPos = new THREE.Vector3(0, 0, -8);
    let curAngle = 0; // heading forward along +Z

    // Spawn 4 safe straight segments first
    for (let i = 0; i < 4; i++) {
      const seg = this.createSegment('straight', curPos, curAngle, i === 0 ? 'none' : undefined, i > 1);
      this.segments.push(seg);
      this.scene.add(seg.group);
      curPos = seg.endPos.clone();
      curAngle = seg.headingAngle;
    }

    // Spawn 4 more segments with possible turns & obstacles
    for (let i = 0; i < 4; i++) {
      this.appendNextSegment();
    }
  }

  public appendNextSegment() {
    const lastSeg = this.segments[this.segments.length - 1];
    const prevTurnCount = this.segments.slice(-3).filter(s => s.type !== 'straight').length;

    let nextType: TrackType = 'straight';

    // Avoid immediate consecutive turns to keep gameplay rhythmic and fair
    if (prevTurnCount === 0 && this.segments.length > 3) {
      const rnd = Math.random();
      if (rnd < 0.35) {
        nextType = 'turn_left';
      } else if (rnd < 0.7) {
        nextType = 'turn_right';
      } else if (rnd < 0.85) {
        nextType = 't_junction';
      }
    }

    const newSeg = this.createSegment(nextType, lastSeg.endPos, lastSeg.headingAngle);
    this.segments.push(newSeg);
    this.scene.add(newSeg.group);
  }

  private createSegment(
    type: TrackType,
    startPos: THREE.Vector3,
    headingAngle: number,
    forceObstacle?: ObstacleType,
    spawnCoins: boolean = true
  ): TrackSegment {
    const id = ++this.segmentCounter;
    const group = new THREE.Group();
    group.position.copy(startPos);
    group.rotation.y = headingAngle;

    const coins: CoinInstance[] = [];
    const obstacles: ObstacleInstance[] = [];

    // Direction vector
    const dir = new THREE.Vector3(Math.sin(headingAngle), 0, Math.cos(headingAngle));
    let length = this.straightLength;
    let endPos = startPos.clone().add(dir.clone().multiplyScalar(length));
    let nextHeading = headingAngle;
    let hasTurn = false;
    let turnDir: 'left' | 'right' | 'both' | 'none' = 'none';
    let turnPos = new THREE.Vector3();

    if (type === 'straight') {
      // 1. Straight stone road
      const roadGeom = new THREE.BoxGeometry(this.trackWidth, 1.2, length);
      const roadMesh = new THREE.Mesh(roadGeom, this.trackMat);
      roadMesh.position.set(0, -0.6, length * 0.5);
      roadMesh.receiveShadow = true;
      group.add(roadMesh);

      // Low stone curbs on borders
      const curbGeom = new THREE.BoxGeometry(0.35, 0.4, length);
      const curbL = new THREE.Mesh(curbGeom, this.sideBorderMat);
      curbL.position.set(-this.trackWidth * 0.5 - 0.15, 0.2, length * 0.5);
      group.add(curbL);

      const curbR = new THREE.Mesh(curbGeom, this.sideBorderMat);
      curbR.position.set(this.trackWidth * 0.5 + 0.15, 0.2, length * 0.5);
      group.add(curbR);

      // Temple columns & torches along the road
      for (let z = 4; z < length - 2; z += 8) {
        this.addDecorations(group, z);
      }

      // Obstacle generation
      let obsType = forceObstacle;
      if (!obsType && Math.random() < 0.65) {
        const obsRnd = Math.random();
        if (obsRnd < 0.5) obsType = 'tree'; // jump
        else obsType = 'gate'; // slide
      }

      if (obsType === 'tree') {
        const treeObstacle = createFallenTreeObstacle();
        const obsZ = length * 0.5;
        treeObstacle.position.set(0, 0, obsZ);
        group.add(treeObstacle);

        const worldObsPos = startPos.clone().add(dir.clone().multiplyScalar(obsZ));
        const obsInst: ObstacleInstance = {
          group: treeObstacle,
          type: 'tree',
          worldPos: worldObsPos,
          lane: 0,
          boundingSphere: new THREE.Sphere(worldObsPos, 1.3),
          cleared: false,
        };
        obstacles.push(obsInst);
        this.obstacles.push(obsInst);
      } else if (obsType === 'gate') {
        const gateObstacle = createSlideGateObstacle();
        const obsZ = length * 0.5;
        gateObstacle.position.set(0, 0, obsZ);
        group.add(gateObstacle);

        const worldObsPos = startPos.clone().add(dir.clone().multiplyScalar(obsZ));
        const obsInst: ObstacleInstance = {
          group: gateObstacle,
          type: 'gate',
          worldPos: worldObsPos,
          lane: 0,
          boundingSphere: new THREE.Sphere(worldObsPos, 1.4),
          cleared: false,
        };
        obstacles.push(obsInst);
        this.obstacles.push(obsInst);
      }

      // Coins generation along straight
      if (spawnCoins && obsType !== 'gate') {
        const coinLane = (Math.floor(Math.random() * 3) - 1); // -1, 0, 1
        const coinCount = 5;
        const startZ = length * 0.2;
        const spacing = 1.8;

        for (let c = 0; c < coinCount; c++) {
          const coinZ = startZ + c * spacing;
          // Don't overlap with obstacle
          if (obsType === 'tree' && Math.abs(coinZ - length * 0.5) < 2.5) continue;

          const coinMesh = createGoldCoin();
          const coinX = coinLane * this.laneOffset;
          coinMesh.position.set(coinX, 0.75, coinZ);
          group.add(coinMesh);

          // Calculate world position
          const localPos = new THREE.Vector3(coinX, 0.75, coinZ);
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
    } else {
      // 2. TURN SEGMENTS (Left, Right, or T-Junction)
      hasTurn = true;
      length = 12.0; // Junction length
      const halfW = this.trackWidth * 0.5;

      // Base junction road slab
      const juncGeom = new THREE.BoxGeometry(this.trackWidth, 1.2, length);
      const juncMesh = new THREE.Mesh(juncGeom, this.trackMat);
      juncMesh.position.set(0, -0.6, length * 0.5);
      group.add(juncMesh);

      const turnZ = length * 0.5;
      turnPos = startPos.clone().add(dir.clone().multiplyScalar(turnZ));

      if (type === 'turn_left') {
        turnDir = 'left';
        nextHeading = headingAngle + Math.PI / 2; // turn left in standard 3D coordinates

        // Branching road extending left
        const branchGeom = new THREE.BoxGeometry(this.straightLength, 1.2, this.trackWidth);
        const branchMesh = new THREE.Mesh(branchGeom, this.trackMat);
        branchMesh.position.set(-this.straightLength * 0.5, -0.6, turnZ);
        group.add(branchMesh);

        // Dead-end back wall straight ahead (so you see the temple barrier if you don't turn)
        const wallGeom = new THREE.BoxGeometry(this.trackWidth + 0.8, 3.2, 0.8);
        const wall = new THREE.Mesh(wallGeom, this.columnMat);
        wall.position.set(0, 1.6, length + 0.2);
        group.add(wall);

        // Turn marker / carved arrows
        this.addTurnMarker(group, turnZ, -1);

        // End position is along the left branch
        const leftDir = new THREE.Vector3(Math.sin(nextHeading), 0, Math.cos(nextHeading));
        endPos = turnPos.clone().add(leftDir.clone().multiplyScalar(this.straightLength * 0.5));
      } else if (type === 'turn_right') {
        turnDir = 'right';
        nextHeading = headingAngle - Math.PI / 2; // turn right

        // Branching road extending right
        const branchGeom = new THREE.BoxGeometry(this.straightLength, 1.2, this.trackWidth);
        const branchMesh = new THREE.Mesh(branchGeom, this.trackMat);
        branchMesh.position.set(this.straightLength * 0.5, -0.6, turnZ);
        group.add(branchMesh);

        // Dead-end back wall straight ahead
        const wallGeom = new THREE.BoxGeometry(this.trackWidth + 0.8, 3.2, 0.8);
        const wall = new THREE.Mesh(wallGeom, this.columnMat);
        wall.position.set(0, 1.6, length + 0.2);
        group.add(wall);

        this.addTurnMarker(group, turnZ, 1);

        const rightDir = new THREE.Vector3(Math.sin(nextHeading), 0, Math.cos(nextHeading));
        endPos = turnPos.clone().add(rightDir.clone().multiplyScalar(this.straightLength * 0.5));
      } else if (type === 't_junction') {
        turnDir = 'both';
        // Pick one direction for the main chain to extend
        const pickLeft = Math.random() < 0.5;
        nextHeading = headingAngle + (pickLeft ? Math.PI / 2 : -Math.PI / 2);

        // Both left and right arms
        const branchGeom = new THREE.BoxGeometry(this.straightLength * 2, 1.2, this.trackWidth);
        const branchMesh = new THREE.Mesh(branchGeom, this.trackMat);
        branchMesh.position.set(0, -0.6, turnZ);
        group.add(branchMesh);

        // Front wall
        const wallGeom = new THREE.BoxGeometry(this.trackWidth + 0.8, 3.2, 0.8);
        const wall = new THREE.Mesh(wallGeom, this.columnMat);
        wall.position.set(0, 1.6, length + 0.2);
        group.add(wall);

        const branchDir = new THREE.Vector3(Math.sin(nextHeading), 0, Math.cos(nextHeading));
        endPos = turnPos.clone().add(branchDir.clone().multiplyScalar(this.straightLength * 0.5));
      }
    }

    return {
      id,
      type,
      group,
      startPos,
      endPos,
      headingAngle: nextHeading,
      length,
      hasTurnOpportunity: hasTurn,
      turnTriggerPos: turnPos,
      turnDirection: turnDir,
      coins,
      obstacles,
    };
  }

  // Visual turn directional glyph
  private addTurnMarker(parent: THREE.Group, z: number, dirSign: number) {
    const glyphMat = new THREE.MeshStandardMaterial({
      color: 0xffcc33,
      emissive: 0xaa7711,
      roughness: 0.3,
    });
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 3), glyphMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = dirSign > 0 ? -Math.PI / 2 : Math.PI / 2;
    arrow.position.set(dirSign * 0.5, 0.05, z);
    parent.add(arrow);
  }

  // Decorative columns, flaming torches
  private addDecorations(parent: THREE.Group, z: number) {
    const colGeom = new THREE.CylinderGeometry(0.3, 0.36, 4.2, 12);

    // Left Column
    const colL = new THREE.Mesh(colGeom, this.columnMat);
    colL.position.set(-this.trackWidth * 0.5 - 0.75, 2.1, z);
    parent.add(colL);

    // Right Column
    const colR = new THREE.Mesh(colGeom, this.columnMat);
    colR.position.set(this.trackWidth * 0.5 + 0.75, 2.1, z);
    parent.add(colR);

    // Torch on left column
    const torchSconce = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.06, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.6 })
    );
    torchSconce.position.set(-this.trackWidth * 0.5 - 0.4, 2.6, z);
    parent.add(torchSconce);

    // Dynamic torch flame light
    const torchLight = new THREE.PointLight(0xff7722, 1.8, 8, 1.5);
    torchLight.position.set(-this.trackWidth * 0.5 - 0.4, 2.9, z);
    parent.add(torchLight);
    this.torchLightPool.push(torchLight);
  }

  public update(playerPos: THREE.Vector3, time: number) {
    // Torch flickering
    for (let i = 0; i < this.torchLightPool.length; i++) {
      const light = this.torchLightPool[i];
      light.intensity = 1.6 + Math.sin(time * 12 + i) * 0.4 + (Math.random() - 0.5) * 0.2;
    }

    // Spin active coins
    for (const c of this.coins) {
      if (!c.collected) {
        c.mesh.rotation.z += 0.04;
      }
    }

    // Recycle segments behind player (distance > 30m)
    if (this.segments.length > 5) {
      const firstSeg = this.segments[0];
      const distToPlayer = firstSeg.endPos.distanceTo(playerPos);

      // If segment's end is far behind player
      if (distToPlayer > 35) {
        // Remove meshes and data
        this.scene.remove(firstSeg.group);

        // Remove old coins and obstacles
        this.coins = this.coins.filter(c => !firstSeg.coins.includes(c));
        this.obstacles = this.obstacles.filter(o => !firstSeg.obstacles.includes(o));

        this.segments.shift();
        this.appendNextSegment();
      }
    }
  }
}
