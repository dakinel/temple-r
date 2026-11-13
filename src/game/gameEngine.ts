import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAdventurer, createGoldenIdol, AdventurerModel } from './models';
import { TrackManager, ForkInstance } from './trackManager';
import { CharacterController, CrashType } from './characterController';
import { FpsCorridor } from './fpsCorridor';
import { sound } from './audio';
import { AdventurerProfile, loadAvatarPair } from './adventurers';
import { MarketQuery } from './queries';
import { createDollarBillTrailTexture } from './textures';

export interface GameEngineCallbacks {
  onScoreUpdate: (stats: { distance: number; coins: number; score: number }) => void;
  onGameOver: (stats: { distance: number; coins: number; score: number; reason?: string; crashType?: CrashType }) => void;
  onPowerupMessage: (msg: string) => void;
  onForkApproaching?: (fork: ForkInstance) => void;
  onCornerCleared?: (turnDir: 'left' | 'right') => void;
  onForkDecision?: (result: {
    survived: boolean;
    profit: number;
    feedback: string;
    query: MarketQuery;
    chosenSide: 'left' | 'right';
  }) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private isSoftwareGl: boolean;

  // Game Systems
  public trackManager: TrackManager;
  public corridor: FpsCorridor;
  public adventurer: AdventurerModel;
  public player: CharacterController;
  public idolPedestal: THREE.Group | null = null;

  // Camera tracking
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private cameraCurrentPos: THREE.Vector3 = new THREE.Vector3();
  private cameraCurrentLookAt: THREE.Vector3 = new THREE.Vector3();

  // Animation frame & pacing
  private frameId: number = 0;
  private isRunning: boolean = false;
  public isPaused: boolean = false;
  private callbacks: GameEngineCallbacks;

  // Pooled InstancedMesh 3D dollar-bill money trail & sparkle wake (2 draw calls total)
  private moneyTrailBills: Array<{
    active: boolean;
    age: number;
    maxAge: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    velocity: THREE.Vector3;
    spinSpeed: THREE.Vector3;
    flutterPhase: number;
    baseScale: number;
  }> = [];
  private moneyTrailSparks: Array<{
    active: boolean;
    age: number;
    maxAge: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    velocity: THREE.Vector3;
    baseScale: number;
  }> = [];
  private moneyBillInstancedMesh: THREE.InstancedMesh | null = null;
  private moneySparkInstancedMesh: THREE.InstancedMesh | null = null;
  private moneyBillMat: THREE.MeshStandardMaterial | null = null;
  private moneySparkMat: THREE.MeshBasicMaterial | null = null;
  private moneyTrailGeom: THREE.PlaneGeometry | null = null;
  private moneyTrailSparkGeom: THREE.OctahedronGeometry | null = null;
  private moneyTrailTex: THREE.CanvasTexture | null = null;
  private readonly _trailDummy = new THREE.Object3D();
  private lastTrailTime: number = 0;
  private trailSideIndex: number = 0;
  private trailFillLight: THREE.PointLight | null = null;

  // Pooled 3D Coin Absorption Effects (Zero-GC)
  private absorptionRings: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
  }> = [];
  private absorptionSparks: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
    startPos: THREE.Vector3;
    orbitOffset: THREE.Vector3;
  }> = [];
  private absorbRingGeom: THREE.TorusGeometry | null = null;
  private absorbSparkGeom: THREE.OctahedronGeometry | null = null;
  private readonly _absorbTargetPos = new THREE.Vector3();
  private magnetBeams: Array<{
    line: THREE.Line;
    positions: Float32Array;
    material: THREE.LineBasicMaterial;
  }> = [];
  private magnetFieldOuter: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial } | null = null;
  private magnetFieldInner: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial } | null = null;
  private magnetFieldAlpha: number = 0;
  private magnetTime: number = 0;

  // Pooled 3D Jump Landing Shockwave & Floor Dust Effects
  private landingRings: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
  }> = [];
  private landingPuffs: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    active: boolean;
    age: number;
    maxAge: number;
    velocity: THREE.Vector3;
    baseScale: number;
  }> = [];
  private landingRingGeom: THREE.RingGeometry | null = null;
  private landingPuffGeom: THREE.DodecahedronGeometry | null = null;

  // Pooled 3D Fractured Wall Chunks, Dust Clouds & Breach Crater (Uses Actual Wall Textures)
  private stoneChunks: Array<{
    mesh: THREE.Mesh;
    active: boolean;
    age: number;
    maxAge: number;
    persistOnFloor: boolean;
    velocity: THREE.Vector3;
    spin: THREE.Vector3;
    baseScale: number;
    radius: number;
  }> = [];
  private stoneDustPuffs: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
    velocity: THREE.Vector3;
    startScale: number;
    startOpacity: number;
    rotZ: number;
    rotVel: number;
  }> = [];
  private wallChips: Array<{
    active: boolean;
    age: number;
    maxAge: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    velocity: THREE.Vector3;
    spin: THREE.Vector3;
    baseScale: number;
  }> = [];
  private emberSparks: Array<{
    active: boolean;
    age: number;
    maxAge: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    baseScale: number;
  }> = [];
  private wallChipInstancedMesh: THREE.InstancedMesh | null = null;
  private emberSparkInstancedMesh: THREE.InstancedMesh | null = null;
  private wallChipGeom: THREE.DodecahedronGeometry | null = null;
  private wallChipMat: THREE.MeshStandardMaterial | null = null;
  private emberSparkGeom: THREE.OctahedronGeometry | null = null;
  private emberSparkMat: THREE.MeshBasicMaterial | null = null;
  private wallBreachMesh: THREE.Mesh | null = null;
  private wallBreachMat: THREE.MeshBasicMaterial | null = null;
  private wallBreachTex: THREE.CanvasTexture | null = null;
  private wallDustTex: THREE.CanvasTexture | null = null;
  private stoneBlastRing: {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
  } | null = null;
  private stoneGeoms: THREE.BufferGeometry[] = [];
  private stoneMats: THREE.Material[] = [];
  private stoneDustGeom: THREE.PlaneGeometry | null = null;
  private stoneBlastRingGeom: THREE.RingGeometry | null = null;
  private explosionFlashLight: THREE.PointLight | null = null;
  private readonly _debrisDummy = new THREE.Object3D();

  // Pooled 3D Cinematic Red Stock Market Candlestick Crash Batch (On Loss)
  private crashCandles: Array<{
    group: THREE.Group;
    active: boolean;
    delay: number;
    age: number;
    bodyHalfH: number;
    landed: boolean;
    velocity: THREE.Vector3;
    rotVel: THREE.Vector3;
    targetTiltX: number;
    targetTiltZ: number;
  }> = [];
  private crashShockRings: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
  }> = [];
  private crashCandleGeoms: THREE.BufferGeometry[] = [];
  private crashCandleMats: THREE.Material[] = [];
  private crashCrimsonLight: THREE.PointLight | null = null;
  private crashCinematicTimer: number = 0;

  // Distinct Corner Wall Crash Timing & Camera Punch State (Shares Wall-Textured Fracture System)
  private cornerShockRings: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
  }> = [];
  private cornerGeoms: THREE.BufferGeometry[] = [];
  private cornerMats: THREE.Material[] = [];
  private cornerFlashLight: THREE.PointLight | null = null;
  private cornerCrashTimer: number = 0;
  private cornerCrashRollDir: number = 1;
  private hitStopTimer: number = 0;
  private lastApproachedForkId: number = -1;
  private forkRecenterTimer: number = 0;
  private forkRecenterSteerSeq: number = 0;

  // Camera Shake & Landing Impact Thud
  private cameraShakeIntensity: number = 0;
  private cameraDropOffset: number = 0;
  private runnerFillLight: THREE.PointLight | null = null;
  private readonly _impactTmp = new THREE.Vector3();
  private readonly _relTmp = new THREE.Vector3();
  private readonly _fwdTmp = new THREE.Vector3();
  private readonly _rightTmp = new THREE.Vector3();
  private readonly _zAxis = new THREE.Vector3(0, 0, 1);

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Detect software WebGL from GPU renderer info
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Warm Temple Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x110c08);
    this.scene.fog = new THREE.FogExp2(0x110c08, 0.017);

    // 4. Camera (perspective matching FPS corridor)
    this.camera = new THREE.PerspectiveCamera(
      64,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );
    this.cameraCurrentPos.set(0, 3.2, -5.5);
    this.cameraCurrentLookAt.set(0, 1.2, 3);
    this.camera.position.copy(this.cameraCurrentPos);
    this.camera.lookAt(this.cameraCurrentLookAt);

    // 5. Studio Environment Map (Subtle metallic reflections for iron cyber arms)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.015).texture;
    this.scene.environmentIntensity = 0.55;
    pmremGenerator.dispose();

    // 6. Balanced Low-Light Atmospheric Lighting Rig
    this.setupLighting();

    // 7. Corridor Architecture Kit & Looping Track Manager
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.corridor = new FpsCorridor(this.scene, maxAniso);
    this.trackManager = new TrackManager(this.scene, this.corridor, maxAniso);
    this.adventurer = createAdventurer();

    this.scene.add(this.adventurer.group);

    // Initial Pedestal with Golden Idol at start point
    this.setupStartPedestal();

    // Controller
    this.player = new CharacterController(this.adventurer, this.trackManager);
    this.player.onGameOver = (stats) => {
      sound.stopJungleDrums();
      if (stats.crashType === 'corner_wall') {
        sound.playCornerWallCrash();
        const impactPos = stats.impactPos ?? this.player.model.group.position;
        const impactNormal = stats.impactNormal ?? new THREE.Vector3(0, 0, -1);
        this.spawnCornerWallShatter(impactPos, impactNormal);
      } else {
        sound.playCandlestickCrash();
        this.spawnRedCandlestickCrash(this.player.model.group.position);
      }
      this.callbacks.onGameOver({
        distance: stats.distance,
        coins: stats.coins,
        score: stats.score,
        reason: stats.reason,
        crashType: stats.crashType,
      });
    };
    this.player.onCoinPickup = () => {
      this.callbacks.onScoreUpdate({
        distance: Math.floor(this.player.distanceRun),
        coins: this.player.coinsCollected,
        score: Math.floor(this.player.score),
      });
    };
    this.player.onCoinAbsorb = (worldPos) => {
      this.spawnCoinAbsorption(worldPos);
    };
    this.player.onPowerupPickup = (msg) => {
      this.callbacks.onPowerupMessage(msg);
    };
    this.player.onLanding = (worldPos) => {
      this.spawnLandingImpact(worldPos);
    };
    this.player.onWallImpact = (worldPos, heavy) => {
      this.spawnStoneExplosion(worldPos, heavy);
    };
    this.player.onCornerCleared = (turnDir) => {
      this.callbacks.onCornerCleared?.(turnDir);
    };

    // 8. Money Trail, Coin Absorption, Landing Shockwave, Stone Explosion, Candlestick Crash & Corner Shatter
    this.setupMoneyTrail();
    this.setupCoinAbsorptionPool();
    this.setupLandingEffectsPool();
    this.setupStoneExplosionPool();
    this.setupRedCandlestickCrashPool();
    this.setupCornerWallCrashPool();

    // 9. Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Start background render loop
    this.loop();
  }

  private setupLighting() {
    // Low-Key Overhead Directional Key Light
    const sunLight = new THREE.DirectionalLight(0xcbd5e1, 0.55);
    sunLight.position.set(8, 24, 14);
    sunLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 80;
      sunLight.shadow.camera.left = -14;
      sunLight.shadow.camera.right = 14;
      sunLight.shadow.camera.top = 14;
      sunLight.shadow.camera.bottom = -14;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    // Balanced Slate Sky / Warm Tomb Ground Bounce Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x64748b, 0x3d2c1c, 0.72);
    this.scene.add(hemiLight);

    // Subtle Corridor Ambient Fill
    const ambientLight = new THREE.AmbientLight(0x2c241b, 0.52);
    this.scene.add(ambientLight);

    // Cool Rim Light on Runner & Iron Cyber Arms from behind
    const rimLight = new THREE.DirectionalLight(0x94a3b8, 0.48);
    rimLight.position.set(-4, 6, -10);
    this.scene.add(rimLight);

    // Forward Runner Wall-Wash Point Light (illuminates left/right Egyptian temple reliefs ahead)
    this.runnerFillLight = new THREE.PointLight(0xffedd5, 1.75, 24, 1.3);
    this.runnerFillLight.position.set(0, 2.35, 3.0);
    this.scene.add(this.runnerFillLight);

    // Trailing Emerald-Gold Fill Light (illuminates the fluttering money trail & rear corridor walls)
    this.trailFillLight = new THREE.PointLight(0xa7f3d0, 1.45, 12, 1.35);
    this.trailFillLight.position.set(0, 1.85, -1.8);
    this.scene.add(this.trailFillLight);
  }

  private setupStartPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, -3.5);

    // Wall Street Charging Bull Trophy on Trading Altar
    const bullIdol = createGoldenIdol();
    bullIdol.position.y = 0.2;
    pedestalGroup.add(bullIdol);

    this.idolPedestal = pedestalGroup;
    this.scene.add(pedestalGroup);
  }

  private setupMoneyTrail() {
    const MAX_BILLS = 32;
    const MAX_SPARKS = 24;

    // Sleek, compact S-curved $100 banknote geometry (single shared InstancedMesh)
    const geom = new THREE.PlaneGeometry(0.38, 0.19, 5, 1);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      pos.setZ(i, Math.sin(px * 9.5) * 0.022);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    this.moneyTrailGeom = geom;

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.moneyTrailTex = createDollarBillTrailTexture(maxAniso);

    this.moneyBillMat = new THREE.MeshStandardMaterial({
      map: this.moneyTrailTex,
      emissiveMap: this.moneyTrailTex,
      emissive: 0x166534,
      emissiveIntensity: 0.28,
      roughness: 0.72,
      metalness: 0.08,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });

    this.moneyBillInstancedMesh = new THREE.InstancedMesh(geom, this.moneyBillMat, MAX_BILLS);
    this.moneyBillInstancedMesh.frustumCulled = false;
    this.moneyBillInstancedMesh.count = 0;
    this.scene.add(this.moneyBillInstancedMesh);

    this._trailDummy.scale.set(0, 0, 0);
    this._trailDummy.updateMatrix();
    for (let i = 0; i < MAX_BILLS; i++) {
      this.moneyBillInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
      this.moneyTrailBills.push({
        active: false,
        age: 0,
        maxAge: 0.6,
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        velocity: new THREE.Vector3(),
        spinSpeed: new THREE.Vector3(),
        flutterPhase: Math.random() * Math.PI * 2,
        baseScale: 0.85,
      });
    }
    this.moneyBillInstancedMesh.instanceMatrix.needsUpdate = true;

    // Refined gold-leaf & emerald shimmer wake (single shared InstancedMesh)
    this.moneyTrailSparkGeom = new THREE.OctahedronGeometry(0.036, 0);
    this.moneySparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.moneySparkInstancedMesh = new THREE.InstancedMesh(
      this.moneyTrailSparkGeom,
      this.moneySparkMat,
      MAX_SPARKS
    );
    this.moneySparkInstancedMesh.frustumCulled = false;
    this.moneySparkInstancedMesh.count = 0;
    this.scene.add(this.moneySparkInstancedMesh);

    const goldColor = new THREE.Color(0xfde047);
    const emeraldColor = new THREE.Color(0x6ee7b7);
    for (let i = 0; i < MAX_SPARKS; i++) {
      this.moneySparkInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
      this.moneySparkInstancedMesh.setColorAt(i, i % 3 === 0 ? goldColor : emeraldColor);
      this.moneyTrailSparks.push({
        active: false,
        age: 0,
        maxAge: 0.44,
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        velocity: new THREE.Vector3(),
        baseScale: 1,
      });
    }
    this.moneySparkInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.moneySparkInstancedMesh.instanceColor) {
      this.moneySparkInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  private spawnTrailBill(
    playerPos: THREE.Vector3,
    heading: number,
    forwardSpeed: number,
    sideSign: number
  ) {
    const bill = this.moneyTrailBills.find((b) => !b.active);
    if (!bill) return;

    bill.active = true;
    bill.age = 0;
    bill.maxAge = 0.50 + Math.random() * 0.18;

    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    const rightX = -Math.cos(heading);
    const rightZ = Math.sin(heading);

    // Spawn cleanly at ankle/boot height off to the left/right edges so sightlines stay wide open
    const lateral = sideSign * (0.20 + Math.random() * 0.24);
    const spawnY = Math.max(0.06, playerPos.y * 0.35 + 0.06 + Math.random() * 0.11);
    bill.position.set(
      playerPos.x - fwdX * 0.52 + rightX * lateral,
      spawnY,
      playerPos.z - fwdZ * 0.52 + rightZ * lateral
    );
    bill.rotation.set(
      (Math.random() - 0.5) * 0.45,
      heading + (Math.random() - 0.5) * 1.4,
      (Math.random() - 0.5) * 0.45
    );
    bill.baseScale = 0.72 + Math.random() * 0.26;

    // Aerodynamic V-shaped slipstream peeling away behind the boots along the floor
    const forwardCarry = forwardSpeed * 0.08 - (0.65 + Math.random() * 0.75);
    const latSpeed = sideSign * (0.85 + Math.random() * 0.65);
    bill.velocity.set(
      rightX * latSpeed + fwdX * forwardCarry,
      0.22 + Math.random() * 0.32,
      rightZ * latSpeed + fwdZ * forwardCarry
    );
    bill.spinSpeed.set(
      (Math.random() - 0.5) * 7.5,
      (Math.random() - 0.5) * 6.5,
      (Math.random() - 0.5) * 8.0
    );
    bill.flutterPhase = Math.random() * Math.PI * 2;
  }

  private spawnTrailSpark(
    playerPos: THREE.Vector3,
    heading: number,
    forwardSpeed: number,
    sideSign: number
  ) {
    const spark = this.moneyTrailSparks.find((s) => !s.active);
    if (!spark) return;

    spark.active = true;
    spark.age = 0;
    spark.maxAge = 0.36 + Math.random() * 0.16;

    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    const rightX = -Math.cos(heading);
    const rightZ = Math.sin(heading);

    const lateral = sideSign * (0.18 + Math.random() * 0.28);
    spark.position.set(
      playerPos.x - fwdX * 0.48 + rightX * lateral,
      Math.max(0.06, playerPos.y * 0.35 + 0.05 + Math.random() * 0.14),
      playerPos.z - fwdZ * 0.48 + rightZ * lateral
    );
    spark.rotation.set(0, 0, 0);
    spark.baseScale = 0.65 + Math.random() * 0.55;

    const forwardCarry = forwardSpeed * 0.06 - (0.5 + Math.random() * 0.6);
    const latSpeed = sideSign * (0.75 + Math.random() * 0.65);
    spark.velocity.set(
      rightX * latSpeed + fwdX * forwardCarry,
      0.16 + Math.random() * 0.28,
      rightZ * latSpeed + fwdZ * forwardCarry
    );
  }

  private updateMoneyTrail(dt: number, time: number) {
    const state = this.player.state;
    if ((state === 'run' || state === 'jump' || state === 'slide') && time - this.lastTrailTime > 0.048) {
      this.lastTrailTime = time;
      const playerPos = this.player.model.group.position;
      const heading = this.player.visualHeadingAngle;
      this.trailSideIndex = (this.trailSideIndex + 1) % 2;
      const sideSign = this.trailSideIndex === 0 ? -1 : 1;

      this.spawnTrailBill(playerPos, heading, this.player.currentSpeed, sideSign);
      this.spawnTrailSpark(playerPos, heading, this.player.currentSpeed, sideSign);
    }

    const visHeading = this.player.visualHeadingAngle;
    const rightX = -Math.cos(visHeading);
    const rightZ = Math.sin(visHeading);
    const maxAllowedY = this.player.model.group.position.y + 0.46;

    if (this.moneyBillInstancedMesh) {
      let anyActive = false;
      const dragXZ = Math.max(0, 1 - dt * 3.0);

      for (let i = 0; i < this.moneyTrailBills.length; i++) {
        const bill = this.moneyTrailBills[i];
        if (!bill.active) {
          this._trailDummy.scale.set(0, 0, 0);
          this._trailDummy.updateMatrix();
          this.moneyBillInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
          continue;
        }

        bill.age += dt;
        if (bill.age >= bill.maxAge) {
          bill.active = false;
          this._trailDummy.scale.set(0, 0, 0);
          this._trailDummy.updateMatrix();
          this.moneyBillInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
          continue;
        }

        anyActive = true;
        const progress = bill.age / bill.maxAge;
        bill.velocity.y -= dt * 2.15;
        bill.velocity.x *= dragXZ;
        bill.velocity.z *= dragXZ;
        bill.position.addScaledVector(bill.velocity, dt);

        const flutter = Math.sin(time * 14 + bill.flutterPhase) * dt * 0.45;
        bill.position.x += rightX * flutter;
        bill.position.z += rightZ * flutter;

        if (bill.position.y > maxAllowedY) {
          bill.position.y = maxAllowedY;
          if (bill.velocity.y > 0) bill.velocity.y = 0;
        }
        if (bill.position.y < 0.05) {
          bill.position.y = 0.05;
          bill.velocity.y = Math.abs(bill.velocity.y) * 0.16;
        }

        bill.rotation.x += bill.spinSpeed.x * dt + Math.sin(time * 15 + bill.flutterPhase) * dt * 2.0;
        bill.rotation.y += bill.spinSpeed.y * dt;
        bill.rotation.z += bill.spinSpeed.z * dt;

        const pop = progress < 0.12 ? 0.45 + (progress / 0.12) * 0.55 : 1.0;
        const shrink = progress > 0.55 ? Math.max(0.01, 1 - (progress - 0.55) / 0.45) : 1.0;

        this._trailDummy.position.copy(bill.position);
        this._trailDummy.rotation.copy(bill.rotation);
        this._trailDummy.scale.setScalar(bill.baseScale * pop * shrink);
        this._trailDummy.updateMatrix();
        this.moneyBillInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
      }

      this.moneyBillInstancedMesh.count = anyActive ? this.moneyTrailBills.length : 0;
      if (anyActive) {
        this.moneyBillInstancedMesh.instanceMatrix.needsUpdate = true;
      }
    }

    if (this.moneySparkInstancedMesh) {
      let anySparkActive = false;
      const dragSpark = Math.max(0, 1 - dt * 3.0);

      for (let i = 0; i < this.moneyTrailSparks.length; i++) {
        const spark = this.moneyTrailSparks[i];
        if (!spark.active) {
          this._trailDummy.scale.set(0, 0, 0);
          this._trailDummy.updateMatrix();
          this.moneySparkInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
          continue;
        }

        spark.age += dt;
        if (spark.age >= spark.maxAge) {
          spark.active = false;
          this._trailDummy.scale.set(0, 0, 0);
          this._trailDummy.updateMatrix();
          this.moneySparkInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
          continue;
        }

        anySparkActive = true;
        const progress = spark.age / spark.maxAge;
        spark.velocity.multiplyScalar(dragSpark);
        spark.position.addScaledVector(spark.velocity, dt);
        spark.rotation.y += dt * 10;
        spark.rotation.x += dt * 8;

        this._trailDummy.position.copy(spark.position);
        this._trailDummy.rotation.copy(spark.rotation);
        this._trailDummy.scale.setScalar(spark.baseScale * Math.max(0.02, 1 - progress * 0.92));
        this._trailDummy.updateMatrix();
        this.moneySparkInstancedMesh.setMatrixAt(i, this._trailDummy.matrix);
      }

      this.moneySparkInstancedMesh.count = anySparkActive ? this.moneyTrailSparks.length : 0;
      if (anySparkActive) {
        this.moneySparkInstancedMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  private setupCoinAbsorptionPool() {
    this.absorbRingGeom = new THREE.TorusGeometry(0.62, 0.042, 8, 28);
    for (let i = 0; i < 6; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x38bdf8 : 0xffd700,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.absorbRingGeom, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.absorptionRings.push({
        mesh,
        material,
        active: false,
        age: 0,
        maxAge: 0.3,
      });
    }

    this.absorbSparkGeom = new THREE.OctahedronGeometry(0.085, 0);
    for (let i = 0; i < 42; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x38bdf8 : 0xfef08a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.absorbSparkGeom, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.absorptionSparks.push({
        mesh,
        material,
        active: false,
        age: 0,
        maxAge: 0.28,
        startPos: new THREE.Vector3(),
        orbitOffset: new THREE.Vector3(),
      });
    }

    // Pooled Magnetic Flux Arcs connecting pulling coins -> runner chest
    const segments = 10;
    for (let i = 0; i < 10; i++) {
      const positions = new Float32Array(segments * 3);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x38bdf8 : 0xfbbf24,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geom, material);
      line.visible = false;
      line.frustumCulled = false;
      this.scene.add(line);
      this.magnetBeams.push({ line, positions, material });
    }

    // Counter-tilted Magnetic Pole Rings orbiting runner's chest when pulling coins
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerMesh = new THREE.Mesh(this.absorbRingGeom, outerMat);
    outerMesh.visible = false;
    this.scene.add(outerMesh);
    this.magnetFieldOuter = { mesh: outerMesh, material: outerMat };

    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerMesh = new THREE.Mesh(this.absorbRingGeom, innerMat);
    innerMesh.visible = false;
    this.scene.add(innerMesh);
    this.magnetFieldInner = { mesh: innerMesh, material: innerMat };
  }

  private spawnCoinAbsorption(coinWorldPos: THREE.Vector3) {
    const ring = this.absorptionRings.find((r) => !r.active);
    if (ring) {
      ring.active = true;
      ring.age = 0;
      ring.mesh.visible = true;
      ring.mesh.position.set(
        this.player.model.group.position.x,
        this.player.model.group.position.y + 1.05,
        this.player.model.group.position.z
      );
      ring.mesh.rotation.set(Math.PI * 0.38, Math.random() * Math.PI, 0);
      ring.mesh.scale.setScalar(1.75);
      ring.material.opacity = 0.92;
    }

    let spawned = 0;
    for (const spark of this.absorptionSparks) {
      if (spark.active) continue;
      const angle = (spawned / 8) * Math.PI * 2 + Math.random() * 0.5;
      const spread = 0.32 + Math.random() * 0.32;
      spark.active = true;
      spark.age = 0;
      spark.maxAge = 0.22 + Math.random() * 0.09;
      spark.startPos.copy(coinWorldPos);
      spark.orbitOffset.set(
        Math.cos(angle) * spread,
        0.12 + Math.random() * 0.42,
        Math.sin(angle) * spread
      );
      spark.mesh.position.copy(coinWorldPos);
      spark.mesh.scale.setScalar(1.0);
      spark.mesh.visible = true;
      spark.material.opacity = 1.0;

      spawned++;
      if (spawned >= 8) break;
    }
  }

  private updateCoinAbsorption(dt: number) {
    this.magnetTime += dt;
    const playerPos = this.player.model.group.position;
    this._absorbTargetPos.set(playerPos.x, playerPos.y + 1.05, playerPos.z);

    // 1. Update Magnetic Flux Arcs between early-pulling coins and runner
    let beamIdx = 0;
    let maxPull = 0;
    const magnetPowerup = this.player.powerups.magnetTimer > 0;

    for (const coin of this.trackManager.coins) {
      if (coin.collected || coin.magnetPull <= 0) continue;
      if (coin.magnetPull > maxPull) maxPull = coin.magnetPull;

      if (beamIdx < this.magnetBeams.length) {
        const beam = this.magnetBeams[beamIdx];
        const posArr = beam.positions;
        const segments = posArr.length / 3;
        const bowSign = beamIdx % 2 === 0 ? 1 : -1;
        const bowAmt = (0.18 + (1 - coin.magnetPull) * 0.38) * bowSign;
        const dx = this._absorbTargetPos.x - coin.worldPos.x;
        const dy = this._absorbTargetPos.y - coin.worldPos.y;
        const dz = this._absorbTargetPos.z - coin.worldPos.z;
        const len = Math.hypot(dx, dz) || 1;
        const perpX = -dz / len;
        const perpZ = dx / len;

        for (let s = 0; s < segments; s++) {
          const u = s / (segments - 1);
          const arch = Math.sin(u * Math.PI);
          const wave = Math.sin(u * 10 - this.magnetTime * 22 + beamIdx) * 0.06 * arch;
          const base = s * 3;
          posArr[base] = coin.worldPos.x + dx * u + perpX * (arch * bowAmt + wave);
          posArr[base + 1] = coin.worldPos.y + dy * u + arch * 0.24;
          posArr[base + 2] = coin.worldPos.z + dz * u + perpZ * (arch * bowAmt + wave);
        }

        const posAttr = beam.line.geometry.getAttribute('position') as THREE.BufferAttribute;
        posAttr.needsUpdate = true;
        beam.line.visible = true;
        beam.material.opacity = Math.min(0.95, 0.34 + coin.magnetPull * 0.62);
        beamIdx++;
      }

      // Emit occasional magnetic stream spark from pulling coin -> chest
      if (Math.random() < (magnetPowerup ? 0.38 : 0.24) * coin.magnetPull) {
        const spark = this.absorptionSparks.find((s) => !s.active);
        if (spark) {
          spark.active = true;
          spark.age = 0;
          spark.maxAge = 0.2 + Math.random() * 0.08;
          spark.startPos.copy(coin.worldPos);
          spark.orbitOffset.set(
            (Math.random() - 0.5) * 0.32,
            0.16 + Math.random() * 0.24,
            (Math.random() - 0.5) * 0.32
          );
          spark.mesh.position.copy(coin.worldPos);
          spark.mesh.scale.setScalar(0.72);
          spark.mesh.visible = true;
          spark.material.opacity = 0.9;
        }
      }
    }

    for (let i = beamIdx; i < this.magnetBeams.length; i++) {
      this.magnetBeams[i].line.visible = false;
    }

    // 2. Runner Magnetic Field Halo (lights up smoothly during early pull or magnet powerup)
    const targetHaloAlpha = magnetPowerup ? 0.72 : maxPull > 0 ? Math.min(0.65, 0.25 + maxPull * 0.45) : 0;
    this.magnetFieldAlpha += (targetHaloAlpha - this.magnetFieldAlpha) * (1 - Math.exp(-12 * dt));

    if (this.magnetFieldOuter && this.magnetFieldInner) {
      const showHalo = this.magnetFieldAlpha > 0.02;
      this.magnetFieldOuter.mesh.visible = showHalo;
      this.magnetFieldInner.mesh.visible = showHalo;
      if (showHalo) {
        const scalePulse = (magnetPowerup ? 1.32 : 1.08) + Math.sin(this.magnetTime * 11) * 0.06;
        this.magnetFieldOuter.mesh.position.copy(this._absorbTargetPos);
        this.magnetFieldOuter.mesh.rotation.set(
          Math.PI * 0.36,
          this.magnetTime * 4.5,
          this.magnetTime * 2.1
        );
        this.magnetFieldOuter.mesh.scale.setScalar(scalePulse);
        this.magnetFieldOuter.material.opacity = this.magnetFieldAlpha;

        this.magnetFieldInner.mesh.position.copy(this._absorbTargetPos);
        this.magnetFieldInner.mesh.rotation.set(
          -Math.PI * 0.32,
          -this.magnetTime * 5.2,
          this.magnetTime * 1.7
        );
        this.magnetFieldInner.mesh.scale.setScalar(scalePulse * 0.78);
        this.magnetFieldInner.material.opacity = this.magnetFieldAlpha * 0.85;
      }
    }

    // 3. Chest Snap Rings & Sparks
    for (const ring of this.absorptionRings) {
      if (!ring.active) continue;
      ring.age += dt;
      if (ring.age >= ring.maxAge) {
        ring.active = false;
        ring.mesh.visible = false;
      } else {
        const t = ring.age / ring.maxAge;
        ring.mesh.position.copy(this._absorbTargetPos);
        ring.mesh.rotation.z += dt * 8.5;
        const s = Math.max(0.1, 1.75 * (1 - t * 0.94));
        ring.mesh.scale.setScalar(s);
        ring.material.opacity = (1 - t) * 0.9;
      }
    }

    for (const spark of this.absorptionSparks) {
      if (!spark.active) continue;
      spark.age += dt;
      if (spark.age >= spark.maxAge) {
        spark.active = false;
        spark.mesh.visible = false;
      } else {
        const t = spark.age / spark.maxAge;
        const pullEase = t * t;
        const arcFade = Math.sin(t * Math.PI);
        spark.mesh.position.lerpVectors(spark.startPos, this._absorbTargetPos, pullEase);
        spark.mesh.position.addScaledVector(spark.orbitOffset, arcFade);
        spark.mesh.rotation.y += dt * 16;
        spark.mesh.rotation.x += dt * 12;
        const s = Math.max(0.05, (1 - t * 0.85) * 1.15);
        spark.mesh.scale.setScalar(s);
        spark.material.opacity = 1 - t * 0.9;
      }
    }
  }

  private setupLandingEffectsPool() {
    this.landingRingGeom = new THREE.RingGeometry(0.32, 0.56, 28);
    this.landingRingGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < 4; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.landingRingGeom, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.landingRings.push({
        mesh,
        material,
        active: false,
        age: 0,
        maxAge: 0.34,
      });
    }

    this.landingPuffGeom = new THREE.DodecahedronGeometry(0.11, 0);
    for (let i = 0; i < 24; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0xfbbf24 : 0x86efac,
        roughness: 0.85,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.landingPuffGeom, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.landingPuffs.push({
        mesh,
        material,
        active: false,
        age: 0,
        maxAge: 0.38,
        velocity: new THREE.Vector3(),
        baseScale: 1,
      });
    }
  }

  private spawnLandingImpact(worldPos: THREE.Vector3) {
    // Camera vertical thud impulse
    this.cameraDropOffset = Math.max(this.cameraDropOffset, 0.24);
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.06);

    const ring = this.landingRings.find((r) => !r.active);
    if (ring) {
      ring.active = true;
      ring.age = 0;
      ring.mesh.visible = true;
      ring.mesh.position.set(worldPos.x, 0.05, worldPos.z);
      ring.mesh.scale.setScalar(0.5);
      ring.material.opacity = 0.88;
    }

    // Burst 10 radial ground dust & emerald-gold spark puffs
    let spawned = 0;
    for (const puff of this.landingPuffs) {
      if (puff.active) continue;
      const angle = (spawned / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const radialSpeed = 2.4 + Math.random() * 2.1;
      puff.active = true;
      puff.age = 0;
      puff.maxAge = 0.28 + Math.random() * 0.14;
      puff.baseScale = 0.75 + Math.random() * 0.65;
      puff.mesh.position.set(
        worldPos.x + Math.cos(angle) * 0.24,
        0.08,
        worldPos.z + Math.sin(angle) * 0.24
      );
      puff.mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      puff.mesh.scale.setScalar(puff.baseScale);
      puff.mesh.visible = true;
      puff.material.opacity = 0.85;
      puff.velocity.set(
        Math.cos(angle) * radialSpeed,
        1.1 + Math.random() * 1.4,
        Math.sin(angle) * radialSpeed
      );
      spawned++;
      if (spawned >= 10) break;
    }

    // Kick up 4 low-profile fluttering dollar bills radially across the money floor
    let kickedBills = 0;
    for (const bill of this.moneyTrailBills) {
      if (bill.active) continue;
      const angle = Math.random() * Math.PI * 2;
      bill.active = true;
      bill.age = 0;
      bill.maxAge = 0.5 + Math.random() * 0.16;
      bill.baseScale = 0.78;
      bill.position.set(
        worldPos.x + Math.cos(angle) * 0.28,
        0.08,
        worldPos.z + Math.sin(angle) * 0.28
      );
      bill.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * 3, (Math.random() - 0.5) * 0.5);
      bill.velocity.set(
        Math.cos(angle) * (1.8 + Math.random() * 1.3),
        0.55 + Math.random() * 0.45,
        Math.sin(angle) * (1.8 + Math.random() * 1.3)
      );
      bill.spinSpeed.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      bill.flutterPhase = Math.random() * Math.PI * 2;
      kickedBills++;
      if (kickedBills >= 4) break;
    }
  }

  private updateLandingEffects(dt: number) {
    for (const ring of this.landingRings) {
      if (!ring.active) continue;
      ring.age += dt;
      if (ring.age >= ring.maxAge) {
        ring.active = false;
        ring.mesh.visible = false;
      } else {
        const t = ring.age / ring.maxAge;
        const easeOut = 1 - Math.pow(1 - t, 3);
        ring.mesh.scale.setScalar(0.5 + easeOut * 2.5);
        ring.material.opacity = (1 - t) * 0.85;
      }
    }

    for (const puff of this.landingPuffs) {
      if (!puff.active) continue;
      puff.age += dt;
      if (puff.age >= puff.maxAge) {
        puff.active = false;
        puff.mesh.visible = false;
      } else {
        const t = puff.age / puff.maxAge;
        puff.velocity.y -= 5.8 * dt;
        puff.velocity.x *= 1 - dt * 3.5;
        puff.velocity.z *= 1 - dt * 3.5;
        puff.mesh.position.addScaledVector(puff.velocity, dt);
        if (puff.mesh.position.y < 0.05) {
          puff.mesh.position.y = 0.05;
          puff.velocity.y *= -0.25;
        }
        puff.mesh.rotation.x += dt * 4;
        puff.mesh.rotation.y += dt * 5;
        puff.mesh.scale.setScalar(puff.baseScale * (1 + t * 0.9));
        puff.material.opacity = (1 - t) * 0.82;
      }
    }
  }

  private createFracturedSlabGeometry(w: number, h: number, d: number, seed: number): THREE.BoxGeometry {
    const geom = new THREE.BoxGeometry(w, h, d, 2, 2, 1);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // Deterministically chip edges and slightly shear corners so every block looks hand-fractured
      const hashA = Math.sin(x * 17.3 + y * 31.7 + z * 11.1 + seed * 7.9);
      const hashB = Math.cos(x * 23.1 - y * 13.7 + z * 19.3 + seed * 5.3);
      const isEdge = Math.abs(x) > w * 0.25 || Math.abs(y) > h * 0.25;
      const amp = isEdge ? 0.16 : 0.06;
      pos.setXYZ(
        i,
        x * (1 + hashA * amp),
        y * (1 + hashB * amp),
        z + (hashA - hashB) * d * 0.14
      );
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }

  private createWallDustCloudTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);

    // Multi-lobe radial dust cloud with zero harsh polygon edges
    const lobes = [
      { x: 64, y: 64, r: 54, a: 0.72 },
      { x: 46, y: 54, r: 36, a: 0.48 },
      { x: 82, y: 58, r: 34, a: 0.45 },
      { x: 60, y: 80, r: 38, a: 0.42 },
    ];
    for (const lobe of lobes) {
      const grad = ctx.createRadialGradient(lobe.x, lobe.y, 2, lobe.x, lobe.y, lobe.r);
      grad.addColorStop(0, `rgba(255, 244, 224, ${lobe.a})`);
      grad.addColorStop(0.45, `rgba(218, 186, 138, ${lobe.a * 0.55})`);
      grad.addColorStop(1, 'rgba(160, 124, 78, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createWallBreachCraterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);

    const cx = 128;
    const cy = 128;

    // Outer dusty impact bruise on sandstone
    const dustHalo = ctx.createRadialGradient(cx, cy, 24, cx, cy, 122);
    dustHalo.addColorStop(0, 'rgba(26, 16, 8, 0.92)');
    dustHalo.addColorStop(0.36, 'rgba(54, 36, 16, 0.78)');
    dustHalo.addColorStop(0.66, 'rgba(176, 136, 82, 0.34)');
    dustHalo.addColorStop(1, 'rgba(176, 136, 82, 0)');
    ctx.fillStyle = dustHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, 122, 0, Math.PI * 2);
    ctx.fill();

    // Jagged inner broken sandstone rim highlight
    ctx.strokeStyle = 'rgba(222, 184, 120, 0.65)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 46 + Math.sin(i * 3.7) * 11 + Math.cos(i * 5.3) * 7;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Deep dark caved-in cavity
    ctx.fillStyle = 'rgba(18, 11, 5, 0.96)';
    ctx.fill();

    // Radiating wall fracture cracks
    ctx.strokeStyle = 'rgba(20, 12, 6, 0.92)';
    ctx.lineCap = 'round';
    for (let c = 0; c < 11; c++) {
      const baseAngle = (c / 11) * Math.PI * 2 + (c % 2) * 0.18;
      let px = cx + Math.cos(baseAngle) * 38;
      let py = cy + Math.sin(baseAngle) * 38;
      ctx.lineWidth = 3.8 - (c % 3) * 0.7;
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let step = 1; step <= 4; step++) {
        const stepAngle = baseAngle + Math.sin(c * 9 + step * 4) * 0.32;
        const len = 14 + ((c + step) % 3) * 7;
        px += Math.cos(stepAngle) * len;
        py += Math.sin(stepAngle) * len;
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Subtle lighter sandstone crack lip
      ctx.strokeStyle = 'rgba(210, 174, 112, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(20, 12, 6, 0.92)';
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private setupStoneExplosionPool() {
    // Fractured slab/masonry geometries preserving BoxGeometry UVs so wall reliefs wrap onto the broken chunks
    const blockGeom = this.createFracturedSlabGeometry(0.46, 0.30, 0.22, 1.2);
    const slabGeom = this.createFracturedSlabGeometry(0.56, 0.24, 0.14, 2.7);
    const pillarGeom = this.createFracturedSlabGeometry(0.32, 0.42, 0.20, 4.1);
    const tileShardGeom = this.createFracturedSlabGeometry(0.36, 0.28, 0.11, 6.4);
    this.stoneGeoms = [blockGeom, slabGeom, pillarGeom, tileShardGeom];

    // Actual Egyptian carved wall materials sampled directly from FpsCorridor walls + fractured core edges
    const { carvedFaces, innerCore } = this.corridor.createWallDebrisMaterialSet();
    const multiMaterials = carvedFaces.map((faceMat) => [
      innerCore,
      innerCore,
      innerCore,
      innerCore,
      faceMat,
      faceMat,
    ]);

    for (let i = 0; i < 44; i++) {
      const geom = this.stoneGeoms[i % this.stoneGeoms.length];
      const matArr = multiMaterials[i % multiMaterials.length];
      const mesh = new THREE.Mesh(geom, matArr);
      mesh.castShadow = !this.isSoftwareGl;
      mesh.receiveShadow = true;
      mesh.visible = false;
      this.scene.add(mesh);
      this.stoneChunks.push({
        mesh,
        active: false,
        age: 0,
        maxAge: 2.2,
        persistOnFloor: false,
        velocity: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        baseScale: 1,
        radius: 0.15,
      });
    }

    // High-speed instanced sandstone & gilded mortar rubble chips (1 draw call)
    const MAX_CHIPS = 84;
    this.wallChipGeom = new THREE.DodecahedronGeometry(0.085, 0);
    const chipPos = this.wallChipGeom.attributes.position;
    for (let i = 0; i < chipPos.count; i++) {
      chipPos.setY(i, chipPos.getY(i) * 0.62);
      chipPos.setX(i, chipPos.getX(i) * (1 + Math.sin(i * 4.3) * 0.28));
    }
    chipPos.needsUpdate = true;
    this.wallChipGeom.computeVertexNormals();

    this.wallChipMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.08,
    });
    this.wallChipInstancedMesh = new THREE.InstancedMesh(this.wallChipGeom, this.wallChipMat, MAX_CHIPS);
    this.wallChipInstancedMesh.frustumCulled = false;
    this.wallChipInstancedMesh.castShadow = !this.isSoftwareGl;
    this.wallChipInstancedMesh.count = 0;
    this.scene.add(this.wallChipInstancedMesh);

    const chipColors = [
      new THREE.Color(0xa87f47), // weathered sandstone
      new THREE.Color(0x735228), // dark ashlar mortar
      new THREE.Color(0xd4a438), // chipped gilded relief
      new THREE.Color(0xc9a56e), // pale crushed sandstone
      new THREE.Color(0x1f4e5f), // chipped lapis/teal frieze fleck
    ];
    this._debrisDummy.scale.set(0, 0, 0);
    this._debrisDummy.updateMatrix();
    for (let i = 0; i < MAX_CHIPS; i++) {
      this.wallChipInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
      this.wallChipInstancedMesh.setColorAt(i, chipColors[i % chipColors.length]);
      this.wallChips.push({
        active: false,
        age: 0,
        maxAge: 1.5,
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        velocity: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        baseScale: 1,
      });
    }
    this.wallChipInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.wallChipInstancedMesh.instanceColor) {
      this.wallChipInstancedMesh.instanceColor.needsUpdate = true;
    }

    // Instanced hot brazier & stone-strike embers (1 draw call)
    const MAX_EMBERS = 48;
    this.emberSparkGeom = new THREE.OctahedronGeometry(0.048, 0);
    this.emberSparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.emberSparkInstancedMesh = new THREE.InstancedMesh(this.emberSparkGeom, this.emberSparkMat, MAX_EMBERS);
    this.emberSparkInstancedMesh.frustumCulled = false;
    this.emberSparkInstancedMesh.count = 0;
    this.scene.add(this.emberSparkInstancedMesh);

    const emberColors = [
      new THREE.Color(0xfde047),
      new THREE.Color(0xfb923c),
      new THREE.Color(0xf59e0b),
    ];
    for (let i = 0; i < MAX_EMBERS; i++) {
      this.emberSparkInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
      this.emberSparkInstancedMesh.setColorAt(i, emberColors[i % emberColors.length]);
      this.emberSparks.push({
        active: false,
        age: 0,
        maxAge: 0.75,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        baseScale: 1,
      });
    }
    this.emberSparkInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.emberSparkInstancedMesh.instanceColor) {
      this.emberSparkInstancedMesh.instanceColor.needsUpdate = true;
    }

    // Soft billboarded sandstone mortar dust cloud puffs
    this.wallDustTex = this.createWallDustCloudTexture();
    this.stoneDustGeom = new THREE.PlaneGeometry(1.1, 1.1);
    const dustTints = [0xd4b282, 0xb58f5e, 0x8a6b43];
    for (let i = 0; i < 28; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: this.wallDustTex,
        color: dustTints[i % dustTints.length],
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.stoneDustGeom, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.stoneDustPuffs.push({
        mesh,
        material,
        active: false,
        age: 0,
        maxAge: 1.35,
        velocity: new THREE.Vector3(),
        startScale: 1.0,
        startOpacity: 0.65,
        rotZ: Math.random() * Math.PI * 2,
        rotVel: (Math.random() - 0.5) * 1.4,
      });
    }

    // Wall Breach Crater Decal pinned at the impact site on the wall
    this.wallBreachTex = this.createWallBreachCraterTexture();
    const breachGeom = new THREE.PlaneGeometry(3.2, 3.2);
    this.stoneGeoms.push(breachGeom);
    this.wallBreachMat = new THREE.MeshBasicMaterial({
      map: this.wallBreachTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.wallBreachMesh = new THREE.Mesh(breachGeom, this.wallBreachMat);
    this.wallBreachMesh.visible = false;
    this.scene.add(this.wallBreachMesh);

    this.stoneBlastRingGeom = new THREE.RingGeometry(0.25, 0.62, 28);
    const blastMat = new THREE.MeshBasicMaterial({
      color: 0xe6b873,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const blastMesh = new THREE.Mesh(this.stoneBlastRingGeom, blastMat);
    blastMesh.visible = false;
    this.scene.add(blastMesh);
    this.stoneBlastRing = {
      mesh: blastMesh,
      material: blastMat,
      active: false,
      age: 0,
      maxAge: 0.42,
    };

    this.explosionFlashLight = new THREE.PointLight(0xf59e0b, 0, 16, 1.3);
    this.scene.add(this.explosionFlashLight);
  }

  private setupRedCandlestickCrashPool() {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.45,
      roughness: 0.25,
      metalness: 0.22,
    });
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0xfca5a5,
      emissive: 0xef4444,
      emissiveIntensity: 1.15,
      roughness: 0.3,
      metalness: 0.45,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.36,
      metalness: 0.85,
    });
    this.crashCandleMats.push(bodyMat, wickMat, capMat);

    const baseBodyGeom = new THREE.BoxGeometry(1, 1, 1);
    const baseCapGeom = new THREE.BoxGeometry(1.12, 0.08, 1.12);
    const baseWickGeom = new THREE.CylinderGeometry(0.032, 0.032, 1, 8);
    const ringGeom = new THREE.RingGeometry(0.22, 0.46, 24);
    ringGeom.rotateX(-Math.PI / 2);
    this.crashCandleGeoms.push(baseBodyGeom, baseCapGeom, baseWickGeom, ringGeom);

    for (let i = 0; i < 20; i++) {
      const candleGroup = new THREE.Group();
      const width = 0.32 + (i % 4) * 0.07;
      const bodyH = 1.05 + ((i * 37) % 10) * 0.19;
      const wickH = bodyH + 0.85 + (i % 3) * 0.35;

      const body = new THREE.Mesh(baseBodyGeom, bodyMat);
      body.scale.set(width, bodyH, width);
      body.castShadow = !this.isSoftwareGl;
      candleGroup.add(body);

      const topCap = new THREE.Mesh(baseCapGeom, capMat);
      topCap.scale.set(width, 1, width);
      topCap.position.y = bodyH * 0.5 + 0.04;
      candleGroup.add(topCap);

      const botCap = new THREE.Mesh(baseCapGeom, capMat);
      botCap.scale.set(width, 1, width);
      botCap.position.y = -bodyH * 0.5 - 0.04;
      candleGroup.add(botCap);

      const wick = new THREE.Mesh(baseWickGeom, wickMat);
      wick.scale.set(1, wickH, 1);
      wick.position.y = (i % 2 === 0 ? 0.12 : -0.1);
      candleGroup.add(wick);

      candleGroup.visible = false;
      this.scene.add(candleGroup);

      this.crashCandles.push({
        group: candleGroup,
        active: false,
        delay: 0,
        age: 0,
        bodyHalfH: wickH * 0.5,
        landed: false,
        velocity: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        targetTiltX: 0,
        targetTiltZ: 0,
      });
    }

    for (let i = 0; i < 10; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3b3b,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.crashCandleMats.push(ringMat);
      const mesh = new THREE.Mesh(ringGeom, ringMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.crashShockRings.push({
        mesh,
        material: ringMat,
        active: false,
        age: 0,
        maxAge: 0.45,
      });
    }

    this.crashCrimsonLight = new THREE.PointLight(0xff1e2d, 0, 22, 1.25);
    this.scene.add(this.crashCrimsonLight);
  }

  public spawnRedCandlestickCrash(centerPos: THREE.Vector3) {
    this.crashCinematicTimer = 2.4;
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.55);

    const heading = this.player.headingAngle;
    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    const rightX = -Math.cos(heading);
    const rightZ = Math.sin(heading);

    if (this.crashCrimsonLight) {
      this.crashCrimsonLight.position.set(
        centerPos.x + fwdX * 1.5,
        centerPos.y + 3.8,
        centerPos.z + fwdZ * 1.5
      );
      this.crashCrimsonLight.intensity = 7.5;
    }

    this.crashCandles.forEach((c, idx) => {
      c.active = true;
      c.landed = false;
      c.age = 0;
      c.delay = (idx % 6) * 0.085 + Math.floor(idx / 6) * 0.06;
      c.group.visible = false;

      // Distribute across corridor width & ahead of camera along active heading
      const laneSpread = ((idx % 5) - 2) * 0.92 + (Math.random() - 0.5) * 0.35;
      const depthSpread = -1.6 + Math.floor(idx / 5) * 2.1 + (Math.random() - 0.5) * 0.8;

      c.group.position.set(
        centerPos.x + rightX * laneSpread + fwdX * depthSpread,
        9.5 + (idx % 4) * 1.45,
        centerPos.z + rightZ * laneSpread + fwdZ * depthSpread
      );
      c.targetTiltX = (Math.random() - 0.5) * 0.28;
      c.targetTiltZ = (Math.random() - 0.5) * 0.28;
      c.group.rotation.set(
        c.targetTiltX + (Math.random() - 0.5) * 0.5,
        Math.random() * Math.PI,
        c.targetTiltZ + (Math.random() - 0.5) * 0.5
      );

      c.velocity.set(
        (Math.random() - 0.5) * 0.65,
        -(4.0 + Math.random() * 4.5),
        (Math.random() - 0.5) * 0.65
      );
      c.rotVel.set(
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 3.8,
        (Math.random() - 0.5) * 2.5
      );
    });
  }

  private setupCornerWallCrashPool() {
    const shockRingGeom = new THREE.RingGeometry(0.35, 0.78, 32);
    this.cornerGeoms.push(shockRingGeom);
    for (let i = 0; i < 2; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xf6d38b : 0xd97706,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.cornerMats.push(mat);
      const mesh = new THREE.Mesh(shockRingGeom, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.cornerShockRings.push({
        mesh,
        material: mat,
        active: false,
        age: 0,
        maxAge: 0.48 + i * 0.14,
      });
    }

    // Warm torch-lit dust & stone-strike flash light
    this.cornerFlashLight = new THREE.PointLight(0xfbbf24, 0, 22, 1.3);
    this.scene.add(this.cornerFlashLight);
  }

  private emitWallDebrisBurst(
    impactPos: THREE.Vector3,
    normal: THREE.Vector3,
    options: {
      slabCount: number;
      chipCount: number;
      emberCount: number;
      dustCount: number;
      spreadW: number;
      spreadH: number;
      forceScale: number;
      persistOnFloor: boolean;
      showCrater: boolean;
    }
  ) {
    const tangent = new THREE.Vector3(-normal.z, 0, normal.x);

    // 1. Pinned wall-breach crater decal at point of impact
    if (options.showCrater && this.wallBreachMesh) {
      this.wallBreachMesh.visible = true;
      this.wallBreachMesh.position.copy(impactPos).addScaledVector(normal, 0.14);
      this.wallBreachMesh.position.y = Math.max(1.35, impactPos.y);
      this.wallBreachMesh.quaternion.setFromUnitVectors(this._zAxis, normal);
      this.wallBreachMesh.rotateZ(Math.random() * Math.PI * 2);
    }

    // 2. Heavy carved Egyptian bas-relief wall masonry blocks & fractured frieze slabs
    let slabSpawned = 0;
    for (const chunk of this.stoneChunks) {
      if (chunk.active) continue;
      chunk.active = true;
      chunk.age = 0;
      chunk.maxAge = options.persistOnFloor ? 6.0 : 0.72 + Math.random() * 0.35;
      chunk.persistOnFloor = options.persistOnFloor;
      chunk.baseScale = options.persistOnFloor
        ? 0.72 + Math.random() * 0.95
        : 0.35 + Math.random() * 0.38;
      chunk.radius = 0.14 * chunk.baseScale;
      chunk.mesh.visible = true;

      const lateralOff = (Math.random() - 0.5) * options.spreadW;
      const vertOff = (Math.random() - 0.4) * options.spreadH;
      chunk.mesh.position
        .copy(impactPos)
        .addScaledVector(tangent, lateralOff)
        .addScaledVector(normal, 0.08 + Math.random() * 0.32);
      chunk.mesh.position.y = Math.max(0.28, impactPos.y + vertOff);

      // Start mostly aligned with the wall face so the carved relief cracks apart visually, then tumbles
      chunk.mesh.quaternion.setFromUnitVectors(this._zAxis, normal);
      chunk.mesh.rotateX((Math.random() - 0.5) * 0.45);
      chunk.mesh.rotateY((Math.random() - 0.5) * 0.45);
      chunk.mesh.rotateZ((Math.random() - 0.5) * 0.6);

      chunk.mesh.scale.set(
        chunk.baseScale * (0.8 + Math.random() * 0.5),
        chunk.baseScale * (0.8 + Math.random() * 0.5),
        chunk.baseScale * (0.75 + Math.random() * 0.55)
      );

      const radialSpeed = (2.8 + Math.random() * 6.8) * options.forceScale;
      const sideSpeed = (lateralOff * 1.6 + (Math.random() - 0.5) * 5.2) * options.forceScale;
      chunk.velocity
        .copy(normal)
        .multiplyScalar(radialSpeed)
        .addScaledVector(tangent, sideSpeed);
      chunk.velocity.y = (1.8 + Math.random() * 5.8) * options.forceScale;

      chunk.spin.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      );

      slabSpawned++;
      if (slabSpawned >= options.slabCount) break;
    }

    // 3. Fine sandstone, ashlar mortar & gilded paint rubble chips (InstancedMesh)
    let chipsSpawned = 0;
    for (const chip of this.wallChips) {
      if (chip.active) continue;
      chip.active = true;
      chip.age = 0;
      chip.maxAge = options.persistOnFloor ? 3.5 : 0.75 + Math.random() * 0.4;
      chip.baseScale = 0.65 + Math.random() * 1.15;

      const lat = (Math.random() - 0.5) * options.spreadW * 0.9;
      const vert = (Math.random() - 0.4) * options.spreadH;
      chip.position
        .copy(impactPos)
        .addScaledVector(tangent, lat)
        .addScaledVector(normal, 0.08 + Math.random() * 0.25);
      chip.position.y = Math.max(0.22, impactPos.y + vert);
      chip.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);

      const fwdBlast = (3.4 + Math.random() * 8.6) * options.forceScale;
      const sideBlast = ((Math.random() - 0.5) * 7.2) * options.forceScale;
      chip.velocity
        .copy(normal)
        .multiplyScalar(fwdBlast)
        .addScaledVector(tangent, sideBlast);
      chip.velocity.y = (1.5 + Math.random() * 7.4) * options.forceScale;

      chip.spin.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );

      chipsSpawned++;
      if (chipsSpawned >= options.chipCount) break;
    }

    // 4. Torch brazier embers & gold-leaf strike sparks
    let embersSpawned = 0;
    for (const ember of this.emberSparks) {
      if (ember.active) continue;
      ember.active = true;
      ember.age = 0;
      ember.maxAge = 0.45 + Math.random() * 0.45;
      ember.baseScale = 0.7 + Math.random() * 0.85;
      ember.position
        .copy(impactPos)
        .addScaledVector(tangent, (Math.random() - 0.5) * options.spreadW * 0.7)
        .addScaledVector(normal, 0.18);
      ember.position.y = Math.max(0.4, impactPos.y + (Math.random() - 0.35) * options.spreadH);

      const sparkOut = (3.2 + Math.random() * 7.5) * options.forceScale;
      ember.velocity
        .copy(normal)
        .multiplyScalar(sparkOut)
        .addScaledVector(tangent, (Math.random() - 0.5) * 6.5 * options.forceScale);
      ember.velocity.y = 1.6 + Math.random() * 5.2;

      embersSpawned++;
      if (embersSpawned >= options.emberCount) break;
    }

    // 5. Volumetric soft-edged sandstone dust cloud billows
    let dustSpawned = 0;
    for (const puff of this.stoneDustPuffs) {
      if (puff.active) continue;
      puff.active = true;
      puff.age = 0;
      puff.maxAge = options.persistOnFloor ? 1.25 + Math.random() * 0.65 : 0.52 + Math.random() * 0.25;
      puff.startScale = options.persistOnFloor
        ? 1.15 + Math.random() * 1.15
        : 0.65 + Math.random() * 0.55;
      puff.startOpacity = options.persistOnFloor ? 0.52 + Math.random() * 0.22 : 0.38;
      puff.mesh.visible = true;
      puff.mesh.position
        .copy(impactPos)
        .addScaledVector(tangent, (Math.random() - 0.5) * options.spreadW * 0.85)
        .addScaledVector(normal, 0.25 + Math.random() * 0.55);
      puff.mesh.position.y = Math.max(0.35, impactPos.y + (Math.random() - 0.45) * options.spreadH);
      puff.mesh.scale.setScalar(puff.startScale);
      puff.material.opacity = puff.startOpacity;

      const dustOut = (1.6 + Math.random() * 3.8) * options.forceScale;
      puff.velocity
        .copy(normal)
        .multiplyScalar(dustOut)
        .addScaledVector(tangent, (Math.random() - 0.5) * 3.8 * options.forceScale);
      puff.velocity.y = 0.65 + Math.random() * 2.1;

      dustSpawned++;
      if (dustSpawned >= options.dustCount) break;
    }
  }

  public spawnCornerWallShatter(impactPos: THREE.Vector3, impactNormal: THREE.Vector3) {
    this.hitStopTimer = 0.045;
    this.cornerCrashTimer = 2.4;
    this.cornerCrashRollDir = Math.random() < 0.5 ? -1 : 1;
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.92);
    this.cameraDropOffset = Math.max(this.cameraDropOffset, 0.38);

    const normal = impactNormal.clone().normalize();

    if (this.cornerFlashLight) {
      this.cornerFlashLight.position.copy(impactPos).addScaledVector(normal, 1.3);
      this.cornerFlashLight.position.y += 0.9;
      this.cornerFlashLight.intensity = 9.5;
    }

    // Subtle warm dust-compression shock rings aligned cleanly to the breached wall plane
    this.cornerShockRings.forEach((ring, idx) => {
      ring.active = true;
      ring.age = -idx * 0.06;
      ring.mesh.visible = true;
      ring.mesh.position.copy(impactPos).addScaledVector(normal, 0.18 + idx * 0.1);
      ring.mesh.quaternion.setFromUnitVectors(this._zAxis, normal);
      ring.mesh.scale.setScalar(0.5);
      ring.material.opacity = 0.72;
    });

    this.emitWallDebrisBurst(impactPos, normal, {
      slabCount: 38,
      chipCount: 72,
      emberCount: 40,
      dustCount: 24,
      spreadW: 3.4,
      spreadH: 2.3,
      forceScale: 1.05,
      persistOnFloor: true,
      showCrater: true,
    });
  }

  private updateCornerWallShatter(dt: number) {
    if (this.cornerCrashTimer > 0) {
      this.cornerCrashTimer = Math.max(0, this.cornerCrashTimer - dt);
    }

    if (this.cornerFlashLight && this.cornerFlashLight.intensity > 0) {
      this.cornerFlashLight.intensity = Math.max(0, this.cornerFlashLight.intensity - dt * 16);
    }

    for (const ring of this.cornerShockRings) {
      if (!ring.active) continue;
      ring.age += dt;
      if (ring.age < 0) continue;
      if (ring.age >= ring.maxAge) {
        ring.active = false;
        ring.mesh.visible = false;
      } else {
        const t = ring.age / ring.maxAge;
        const ease = 1 - Math.pow(1 - t, 3);
        ring.mesh.scale.setScalar(0.5 + ease * 4.6);
        ring.material.opacity = (1 - t) * 0.65;
      }
    }
  }

  private spawnCrashShockRing(x: number, z: number) {
    const ring = this.crashShockRings.find((r) => !r.active);
    if (!ring) return;
    ring.active = true;
    ring.age = 0;
    ring.mesh.visible = true;
    ring.mesh.position.set(x, 0.06, z);
    ring.mesh.scale.setScalar(0.5);
    ring.material.opacity = 0.92;
  }

  private updateRedCandlestickCrash(dt: number) {
    if (this.crashCinematicTimer > 0) {
      this.crashCinematicTimer = Math.max(0, this.crashCinematicTimer - dt);
    }

    if (this.crashCrimsonLight && this.crashCrimsonLight.intensity > 0) {
      const targetIntensity = this.crashCinematicTimer > 0 ? 5.2 : 2.2;
      this.crashCrimsonLight.intensity += (targetIntensity - this.crashCrimsonLight.intensity) * Math.min(1, dt * 3.5);
    }

    for (const c of this.crashCandles) {
      if (!c.active) continue;
      c.age += dt;
      if (c.age < c.delay) continue;

      if (!c.group.visible) {
        c.group.visible = true;
      }

      if (!c.landed) {
        c.velocity.y -= 34.0 * dt;
        c.group.position.addScaledVector(c.velocity, dt);
        c.group.rotation.x += c.rotVel.x * dt;
        c.group.rotation.y += c.rotVel.y * dt;
        c.group.rotation.z += c.rotVel.z * dt;

        const floorStopY = c.bodyHalfH - 0.14;
        if (c.group.position.y <= floorStopY) {
          c.group.position.y = floorStopY;
          if (Math.abs(c.velocity.y) > 7.5) {
            // Heavy candlestick slam bounce + crimson shockwave + camera thud
            c.velocity.y = -c.velocity.y * 0.22;
            c.velocity.x *= 0.4;
            c.velocity.z *= 0.4;
            c.rotVel.multiplyScalar(0.25);
            this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.34);
            this.cameraDropOffset = Math.max(this.cameraDropOffset, 0.14);
            this.spawnCrashShockRing(c.group.position.x, c.group.position.z);
          } else {
            c.landed = true;
            c.velocity.set(0, 0, 0);
            c.rotVel.set(0, 0, 0);
          }
        }
      } else {
        // Settle slightly crooked like shattered market monoliths
        c.group.rotation.x += (c.targetTiltX - c.group.rotation.x) * Math.min(1, dt * 8);
        c.group.rotation.z += (c.targetTiltZ - c.group.rotation.z) * Math.min(1, dt * 8);
      }
    }

    for (const ring of this.crashShockRings) {
      if (!ring.active) continue;
      ring.age += dt;
      if (ring.age >= ring.maxAge) {
        ring.active = false;
        ring.mesh.visible = false;
      } else {
        const t = ring.age / ring.maxAge;
        const ease = 1 - Math.pow(1 - t, 3);
        ring.mesh.scale.setScalar(0.5 + ease * 3.4);
        ring.material.opacity = (1 - t) * 0.88;
      }
    }
  }

  public spawnStoneExplosion(impactPos: THREE.Vector3, heavy = true) {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, heavy ? 0.65 : 0.16);
    if (heavy) {
      this.hitStopTimer = 0.035;
      this.cameraDropOffset = Math.max(this.cameraDropOffset, 0.22);
    }

    const heading = this.player.visualHeadingAngle;
    const backNormal = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));
    if (!heavy) {
      // Side wall scrape deflects inward from left/right corridor wall
      const rightX = -Math.cos(heading);
      const rightZ = Math.sin(heading);
      const relSide =
        (impactPos.x - this.player.position.x) * rightX +
        (impactPos.z - this.player.position.z) * rightZ;
      backNormal.set(-rightX * Math.sign(relSide || 1), 0, -rightZ * Math.sign(relSide || 1)).normalize();
    }

    if (this.explosionFlashLight) {
      this.explosionFlashLight.position.copy(impactPos).addScaledVector(backNormal, 0.9);
      this.explosionFlashLight.position.y += 0.4;
      this.explosionFlashLight.intensity = heavy ? 7.8 : 2.6;
    }

    if (heavy && this.stoneBlastRing) {
      this.stoneBlastRing.active = true;
      this.stoneBlastRing.age = 0;
      this.stoneBlastRing.mesh.visible = true;
      this.stoneBlastRing.mesh.position.copy(impactPos).addScaledVector(backNormal, 0.22);
      this.stoneBlastRing.mesh.position.y = Math.max(0.95, impactPos.y);
      this.stoneBlastRing.mesh.quaternion.setFromUnitVectors(this._zAxis, backNormal);
      this.stoneBlastRing.mesh.scale.setScalar(0.5);
      this.stoneBlastRing.material.opacity = 0.68;
    }

    this.emitWallDebrisBurst(impactPos, backNormal, {
      slabCount: heavy ? 28 : 8,
      chipCount: heavy ? 54 : 18,
      emberCount: heavy ? 28 : 8,
      dustCount: heavy ? 18 : 6,
      spreadW: heavy ? 2.2 : 0.7,
      spreadH: heavy ? 1.8 : 0.9,
      forceScale: heavy ? 0.95 : 0.55,
      persistOnFloor: heavy,
      showCrater: heavy,
    });
  }

  private updateStoneExplosion(dt: number) {
    if (this.explosionFlashLight && this.explosionFlashLight.intensity > 0) {
      this.explosionFlashLight.intensity = Math.max(0, this.explosionFlashLight.intensity - dt * 24);
    }

    if (this.stoneBlastRing && this.stoneBlastRing.active) {
      const ring = this.stoneBlastRing;
      ring.age += dt;
      if (ring.age >= ring.maxAge) {
        ring.active = false;
        ring.mesh.visible = false;
      } else {
        const t = ring.age / ring.maxAge;
        const easeOut = 1 - Math.pow(1 - t, 3);
        ring.mesh.scale.setScalar(0.5 + easeOut * 4.2);
        ring.material.opacity = (1 - t) * 0.68;
      }
    }

    // 1. Heavy carved sandstone wall blocks & slabs
    for (const chunk of this.stoneChunks) {
      if (!chunk.active) continue;
      chunk.age += dt;
      if (!chunk.persistOnFloor && chunk.age >= chunk.maxAge) {
        chunk.active = false;
        chunk.mesh.visible = false;
        continue;
      }

      const settled = chunk.persistOnFloor && chunk.mesh.position.y <= chunk.radius + 0.015 && chunk.velocity.lengthSq() < 0.08;
      if (!settled) {
        chunk.velocity.y -= 25.5 * dt;
        chunk.mesh.position.addScaledVector(chunk.velocity, dt);

        if (chunk.mesh.position.y < chunk.radius && chunk.velocity.y < 0) {
          chunk.mesh.position.y = chunk.radius;
          chunk.velocity.y = Math.abs(chunk.velocity.y) > 1.8 ? -chunk.velocity.y * 0.34 : 0;
          chunk.velocity.x *= 0.62;
          chunk.velocity.z *= 0.62;
          chunk.spin.multiplyScalar(0.45);
        }

        chunk.mesh.rotation.x += chunk.spin.x * dt;
        chunk.mesh.rotation.y += chunk.spin.y * dt;
        chunk.mesh.rotation.z += chunk.spin.z * dt;
      }

      if (!chunk.persistOnFloor) {
        const life = chunk.age / chunk.maxAge;
        if (life > 0.68) {
          const shrink = Math.max(0.01, 1 - (life - 0.68) / 0.32);
          chunk.mesh.scale.setScalar(chunk.baseScale * shrink);
        }
      }
    }

    // 2. Instanced fine rubble chips
    if (this.wallChipInstancedMesh) {
      let anyChipActive = false;
      for (let i = 0; i < this.wallChips.length; i++) {
        const chip = this.wallChips[i];
        if (!chip.active) {
          this._debrisDummy.scale.set(0, 0, 0);
          this._debrisDummy.updateMatrix();
          this.wallChipInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
          continue;
        }
        chip.age += dt;
        if (chip.age >= chip.maxAge) {
          chip.active = false;
          this._debrisDummy.scale.set(0, 0, 0);
          this._debrisDummy.updateMatrix();
          this.wallChipInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
          continue;
        }

        anyChipActive = true;
        chip.velocity.y -= 24.5 * dt;
        chip.position.addScaledVector(chip.velocity, dt);
        if (chip.position.y < 0.05 && chip.velocity.y < 0) {
          chip.position.y = 0.05;
          chip.velocity.y = Math.abs(chip.velocity.y) > 1.4 ? -chip.velocity.y * 0.32 : 0;
          chip.velocity.x *= 0.65;
          chip.velocity.z *= 0.65;
          chip.spin.multiplyScalar(0.5);
        }
        chip.rotation.x += chip.spin.x * dt;
        chip.rotation.y += chip.spin.y * dt;
        chip.rotation.z += chip.spin.z * dt;

        const life = chip.age / chip.maxAge;
        const shrink = life > 0.78 ? Math.max(0.01, 1 - (life - 0.78) / 0.22) : 1.0;
        this._debrisDummy.position.copy(chip.position);
        this._debrisDummy.rotation.copy(chip.rotation);
        this._debrisDummy.scale.setScalar(chip.baseScale * shrink);
        this._debrisDummy.updateMatrix();
        this.wallChipInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
      }
      this.wallChipInstancedMesh.count = anyChipActive ? this.wallChips.length : 0;
      if (anyChipActive) {
        this.wallChipInstancedMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // 3. Instanced torch ember sparks
    if (this.emberSparkInstancedMesh) {
      let anyEmberActive = false;
      const drag = Math.max(0, 1 - dt * 2.4);
      for (let i = 0; i < this.emberSparks.length; i++) {
        const ember = this.emberSparks[i];
        if (!ember.active) {
          this._debrisDummy.scale.set(0, 0, 0);
          this._debrisDummy.updateMatrix();
          this.emberSparkInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
          continue;
        }
        ember.age += dt;
        if (ember.age >= ember.maxAge) {
          ember.active = false;
          this._debrisDummy.scale.set(0, 0, 0);
          this._debrisDummy.updateMatrix();
          this.emberSparkInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
          continue;
        }
        anyEmberActive = true;
        ember.velocity.y -= 11.0 * dt;
        ember.velocity.multiplyScalar(drag);
        ember.position.addScaledVector(ember.velocity, dt);
        if (ember.position.y < 0.04) {
          ember.position.y = 0.04;
          ember.velocity.y = Math.abs(ember.velocity.y) * 0.45;
        }
        const t = ember.age / ember.maxAge;
        this._debrisDummy.position.copy(ember.position);
        this._debrisDummy.rotation.set(t * 9, t * 12, 0);
        this._debrisDummy.scale.setScalar(ember.baseScale * Math.max(0.02, 1 - t));
        this._debrisDummy.updateMatrix();
        this.emberSparkInstancedMesh.setMatrixAt(i, this._debrisDummy.matrix);
      }
      this.emberSparkInstancedMesh.count = anyEmberActive ? this.emberSparks.length : 0;
      if (anyEmberActive) {
        this.emberSparkInstancedMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // 4. Volumetric billboarded sandstone mortar dust cloud puffs
    for (const puff of this.stoneDustPuffs) {
      if (!puff.active) continue;
      puff.age += dt;
      if (puff.age >= puff.maxAge) {
        puff.active = false;
        puff.mesh.visible = false;
      } else {
        const t = puff.age / puff.maxAge;
        puff.velocity.multiplyScalar(Math.max(0, 1 - dt * 2.8));
        puff.velocity.y += dt * 0.85;
        puff.mesh.position.addScaledVector(puff.velocity, dt);
        if (puff.mesh.position.y < 0.35) {
          puff.mesh.position.y = 0.35;
        }
        puff.rotZ += puff.rotVel * dt;
        puff.mesh.quaternion.copy(this.camera.quaternion);
        puff.mesh.rotateZ(puff.rotZ);
        const expand = 1 + Math.pow(t, 0.72) * 2.4;
        puff.mesh.scale.setScalar(puff.startScale * expand);
        puff.material.opacity = Math.pow(1 - t, 1.35) * puff.startOpacity;
      }
    }
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // Start / Resume Game
  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    sound.startJungleDrums();
  }

  public pause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      sound.stopJungleDrums();
    } else {
      sound.startJungleDrums();
      this.clock.getDelta(); // flush delta
    }
  }

  public setMarketQueries(queries: MarketQuery[]) {
    this.trackManager.setQueries(queries, !this.isRunning);
  }

  public getNextForkQuery(): { query: MarketQuery; queryIndex: number } | null {
    return this.trackManager.getNextForkQuery();
  }

  public restart() {
    this.trackManager.reset();
    this.player.reset();
    this.lastApproachedForkId = -1;
    this.forkRecenterTimer = 0;
    this.forkRecenterSteerSeq = 0;
    for (const bill of this.moneyTrailBills) {
      bill.active = false;
    }
    for (const spark of this.moneyTrailSparks) {
      spark.active = false;
    }
    if (this.moneyBillInstancedMesh) {
      this.moneyBillInstancedMesh.count = 0;
    }
    if (this.moneySparkInstancedMesh) {
      this.moneySparkInstancedMesh.count = 0;
    }
    for (const ring of this.absorptionRings) {
      ring.active = false;
      ring.mesh.visible = false;
    }
    for (const spark of this.absorptionSparks) {
      spark.active = false;
      spark.mesh.visible = false;
    }
    for (const ring of this.landingRings) {
      ring.active = false;
      ring.mesh.visible = false;
    }
    for (const puff of this.landingPuffs) {
      puff.active = false;
      puff.mesh.visible = false;
    }
    for (const chunk of this.stoneChunks) {
      chunk.active = false;
      chunk.persistOnFloor = false;
      chunk.mesh.visible = false;
    }
    for (const chip of this.wallChips) {
      chip.active = false;
    }
    for (const ember of this.emberSparks) {
      ember.active = false;
    }
    if (this.wallChipInstancedMesh) {
      this.wallChipInstancedMesh.count = 0;
    }
    if (this.emberSparkInstancedMesh) {
      this.emberSparkInstancedMesh.count = 0;
    }
    if (this.wallBreachMesh) {
      this.wallBreachMesh.visible = false;
    }
    for (const puff of this.stoneDustPuffs) {
      puff.active = false;
      puff.mesh.visible = false;
    }
    for (const candle of this.crashCandles) {
      candle.active = false;
      candle.landed = false;
      candle.group.visible = false;
    }
    for (const ring of this.crashShockRings) {
      ring.active = false;
      ring.mesh.visible = false;
    }
    if (this.crashCrimsonLight) {
      this.crashCrimsonLight.intensity = 0;
    }
    for (const ring of this.cornerShockRings) {
      ring.active = false;
      ring.mesh.visible = false;
    }
    if (this.cornerFlashLight) {
      this.cornerFlashLight.intensity = 0;
    }
    this.cornerCrashTimer = 0;
    this.crashCinematicTimer = 0;
    this.hitStopTimer = 0;
    if (this.stoneBlastRing) {
      this.stoneBlastRing.active = false;
      this.stoneBlastRing.mesh.visible = false;
    }
    if (this.explosionFlashLight) {
      this.explosionFlashLight.intensity = 0;
    }
    this.cameraShakeIntensity = 0;
    this.cameraDropOffset = 0;
    this.cameraCurrentPos.set(0, 3.2, -5.5);
    this.cameraCurrentLookAt.set(0, 1.2, 3);
    this.camera.position.copy(this.cameraCurrentPos);
    this.camera.lookAt(this.cameraCurrentLookAt);
    if (this.idolPedestal) {
      this.idolPedestal.position.set(0, 0, -3.5);
    }
    this.isPaused = false;
    this.isRunning = true;
    sound.startJungleDrums();
  }

  // Update Adventurer Appearance & DiceBear Face Texture
  public setAdventurer(profile: AdventurerProfile) {
    this.adventurer.updateAppearance(
      profile.shirtColor,
      profile.vestColor,
      profile.pantsColor
    );

    loadAvatarPair(profile.seed, (frontCanvas, backCanvas) => {
      this.adventurer.updateAppearance(
        profile.shirtColor,
        profile.vestColor,
        profile.pantsColor,
        frontCanvas,
        backCanvas
      );
    });
  }

  // Steer runner into Left Road or Right Road tunnel (or execute Corner Turn!)
  public selectTunnel(side: 'left' | 'right') {
    if (side === 'left') {
      this.player.moveLeft();
    } else {
      this.player.moveRight();
    }
  }

  public cameraMode: 'rear' | 'front' | 'side' = 'rear';

  public toggleCameraView(): string {
    if (this.cameraMode === 'rear') {
      this.cameraMode = 'front';
    } else if (this.cameraMode === 'front') {
      this.cameraMode = 'side';
    } else {
      this.cameraMode = 'rear';
    }
    return this.cameraMode;
  }

  // Camera smooth follow calculation around 90-degree Egyptian corners
  private updateCamera(dt: number) {
    const playerPos = this.player.model.group.position;
    const heading = this.player.visualHeadingAngle;
    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    const rightX = -Math.cos(heading);
    const rightZ = Math.sin(heading);

    let offsetVector: THREE.Vector3;
    let lookAtTarget: THREE.Vector3;

    const headingRatio = Math.min(
      1,
      Math.abs(this.player.headingAngle - this.player.visualHeadingAngle) / 0.65
    );
    const timerRatio = Math.min(1, this.player.cornerTurnCamTimer / 0.55);
    const rawTurn = Math.max(headingRatio, timerRatio);
    const turnEnvelope = rawTurn * rawTurn * (3 - 2 * rawTurn);

    if (this.cameraMode === 'front') {
      offsetVector = new THREE.Vector3(fwdX * 4.8, 2.1, fwdZ * 4.8);
      lookAtTarget = playerPos.clone().add(new THREE.Vector3(0, 1.18, 0));
    } else if (this.cameraMode === 'side') {
      offsetVector = new THREE.Vector3(
        -fwdX * 4.6 - rightX * 2.6,
        2.6,
        -fwdZ * 4.6 - rightZ * 2.6
      );
      lookAtTarget = playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
    } else if (this.cornerCrashTimer > 0) {
      // Dramatic whiplash wall-recoil framing looking straight at the shattered Egyptian wall
      offsetVector = new THREE.Vector3(-fwdX * 6.4, 2.15, -fwdZ * 6.4);
      lookAtTarget = playerPos.clone().add(new THREE.Vector3(fwdX * 2.2, 1.45, fwdZ * 2.2));
    } else if (this.crashCinematicTimer > 0) {
      // Dramatic low-angle wide crash framing as red candlesticks rain down
      offsetVector = new THREE.Vector3(-fwdX * 6.9, 2.35, -fwdZ * 6.9);
      lookAtTarget = playerPos.clone().add(new THREE.Vector3(fwdX * 1.4, 1.75, fwdZ * 1.4));
    } else {
      // Rear chase view: pulls tight inside the 3.15m corridor hub on 90-deg turns so walls never backface-cull to black
      const chaseDist = THREE.MathUtils.lerp(5.8, 2.45, turnEnvelope);
      const chaseHeight = THREE.MathUtils.lerp(3.2, 2.4, turnEnvelope);
      const lookAhead = THREE.MathUtils.lerp(1.2, 3.8, turnEnvelope);
      offsetVector = new THREE.Vector3(-fwdX * chaseDist, chaseHeight, -fwdZ * chaseDist);
      const laneLead = this.player.laneVelocity * 0.05;
      lookAtTarget = playerPos.clone().add(
        new THREE.Vector3(
          fwdX * lookAhead + rightX * laneLead,
          1.18,
          fwdZ * lookAhead + rightZ * laneLead
        )
      );
    }

    const targetPos = playerPos.clone().add(offsetVector);

    targetPos.y -= this.cameraDropOffset;

    if (this.cameraDropOffset > 0) {
      this.cameraDropOffset = Math.max(0, this.cameraDropOffset - dt * 1.45);
    }
    if (this.cameraShakeIntensity > 0) {
      targetPos.x += (Math.random() - 0.5) * this.cameraShakeIntensity * 1.4;
      targetPos.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      lookAtTarget.x += (Math.random() - 0.5) * this.cameraShakeIntensity * 0.6;
      lookAtTarget.y += (Math.random() - 0.5) * this.cameraShakeIntensity * 0.5;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 1.35);
    }

    const posRate = THREE.MathUtils.lerp(10.5, 17.5, turnEnvelope);
    const lookRate = THREE.MathUtils.lerp(12.5, 18.0, turnEnvelope);
    const posAlpha = 1 - Math.exp(-posRate * dt);
    const lookAlpha = 1 - Math.exp(-lookRate * dt);
    this.cameraCurrentPos.lerp(targetPos, posAlpha);
    this.cameraCurrentLookAt.lerp(lookAtTarget, lookAlpha);

    this.camera.position.copy(this.cameraCurrentPos);
    this.camera.lookAt(this.cameraCurrentLookAt);

    if (this.cornerCrashTimer > 0) {
      const roll = this.cornerCrashRollDir * (this.cornerCrashTimer / 2.2) * 0.11;
      this.camera.rotateZ(roll);
    } else if (this.cameraMode === 'rear') {
      this.camera.rotateZ(-this.player.smoothSteerBank * 0.095);
    }

    const desiredFov = Math.max(
      60,
      Math.min(71, 64 + (this.player.speedMultiplier - 1) * 5.0)
    );
    if (Math.abs(desiredFov - this.camera.fov) > 0.04) {
      this.camera.fov += (desiredFov - this.camera.fov) * (1 - Math.exp(-8 * dt));
      this.camera.updateProjectionMatrix();
    }
  }

  private loop = () => {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      this.updateCamera(dt * 0.35);
    } else if (this.isRunning && !this.isPaused) {
      this.player.update(dt, time);
      this.trackManager.update(this.player.position, time);

      // Tick deterministic post-fork recenter timer (cancels automatically if player steers)
      if (this.forkRecenterTimer > 0) {
        if (this.player.steerInputCount !== this.forkRecenterSteerSeq) {
          this.forkRecenterTimer = 0;
        } else {
          this.forkRecenterTimer -= dt;
          if (this.forkRecenterTimer <= 0) {
            this.forkRecenterTimer = 0;
            if (this.player.state === 'run' && this.player.cornerTurnCamTimer <= 0) {
              this.player.currentLane = 0;
              this.player.targetLaneX = 0;
            }
          }
        }
      }

      // Evaluate Tunnel Fork Decisions along active corridor forward vector
      const pFwdX = Math.sin(this.player.headingAngle);
      const pFwdZ = Math.cos(this.player.headingAngle);

      for (const fork of this.trackManager.forks) {
        const playerFwdDot = pFwdX * fork.forwardDir.x + pFwdZ * fork.forwardDir.z;
        if (playerFwdDot < 0.7) continue;

        const lateralToFork = Math.abs(
          this._relTmp.copy(this.player.position).sub(fork.worldDecisionPos).dot(fork.rightDir)
        );
        if (lateralToFork > 4.5) continue;

        const distToFork = this._relTmp.copy(fork.worldForkPos).sub(this.player.position).dot(fork.forwardDir);
        if (!fork.cleared && distToFork > -1.5 && distToFork < 40) {
          if (this.lastApproachedForkId !== fork.id) {
            this.lastApproachedForkId = fork.id;
            this.callbacks.onForkApproaching?.(fork);
          }
        }

        const passedDecision = this._relTmp.copy(this.player.position).sub(fork.worldDecisionPos).dot(fork.forwardDir);
        if (!fork.cleared && passedDecision >= 0 && passedDecision <= 14.0) {
          fork.cleared = true;
          const laneX = this.player.currentLaneX;
          const targetX = this.player.targetLaneX;

          let chosenSide: 'left' | 'right' | 'center' = 'center';
          if (laneX < -0.35 || (Math.abs(laneX) <= 0.35 && targetX < -0.45)) {
            chosenSide = 'left';
          } else if (laneX > 0.35 || (Math.abs(laneX) <= 0.35 && targetX > 0.45)) {
            chosenSide = 'right';
          }

          if (chosenSide === 'center') {
            this.player.score = Math.max(0, this.player.score - fork.query.profit);
            this.callbacks.onScoreUpdate({
              distance: Math.floor(this.player.distanceRun),
              coins: this.player.coinsCollected,
              score: Math.floor(this.player.score),
            });
            this.callbacks.onForkDecision?.({
              survived: false,
              profit: -fork.query.profit,
              feedback: 'CRASHED INTO CENTER DIVIDER! Hesitation killed the portfolio.',
              query: fork.query,
              chosenSide: 'left',
            });
            this._impactTmp.copy(fork.worldDecisionPos);
            this._impactTmp.y = 1.35;
            this.player.die(
              'CRASHED INTO FORK DIVIDER! Hesitation killed the fund. You hit the stone barrier dead-center.',
              this._impactTmp
            );
            break;
          }

          const isCorrect = (chosenSide === fork.query.correctSide);
          if (isCorrect) {
            sound.playCoin();
            this.player.score += fork.query.profit;
            this.callbacks.onScoreUpdate({
              distance: Math.floor(this.player.distanceRun),
              coins: this.player.coinsCollected,
              score: Math.floor(this.player.score),
            });
            this.callbacks.onForkDecision?.({
              survived: true,
              profit: fork.query.profit,
              feedback: fork.query.successReason,
              query: fork.query,
              chosenSide,
            });

            // Smoothly recenter after exiting the fork divider unless the player steers manually
            this.forkRecenterTimer = 0.65;
            this.forkRecenterSteerSeq = this.player.steerInputCount;
          } else {
            this.player.score = Math.max(0, this.player.score - fork.query.profit);
            this.callbacks.onScoreUpdate({
              distance: Math.floor(this.player.distanceRun),
              coins: this.player.coinsCollected,
              score: Math.floor(this.player.score),
            });
            this.callbacks.onForkDecision?.({
              survived: false,
              profit: -fork.query.profit,
              feedback: fork.query.deathReason,
              query: fork.query,
              chosenSide,
            });
            const sideSign = chosenSide === 'left' ? -1 : 1;
            this._impactTmp
              .copy(fork.worldDecisionPos)
              .addScaledVector(fork.rightDir, sideSign * this.trackManager.laneOffset)
              .addScaledVector(fork.forwardDir, 1.2);
            this._impactTmp.y = 1.35;
            this.player.die(fork.query.deathReason, this._impactTmp);
            break;
          }
        }
      }

      this.updateCamera(dt);
      this.updateMoneyTrail(dt, time);
      this.updateCoinAbsorption(dt);
      this.updateLandingEffects(dt);
      this.updateStoneExplosion(dt);
      this.updateRedCandlestickCrash(dt);
      this.updateCornerWallShatter(dt);

      this.callbacks.onScoreUpdate({
        distance: Math.floor(this.player.distanceRun),
        coins: this.player.coinsCollected,
        score: Math.floor(this.player.score),
      });
    } else {
      this.updateCamera(dt);
      this.updateLandingEffects(dt);
      this.updateStoneExplosion(dt);
      this.updateRedCandlestickCrash(dt);
      this.updateCornerWallShatter(dt);
    }

    // Keep corridor wall-wash lights moving along active & newly turned runner heading
    const visHeading = this.player.visualHeadingAngle;
    const fillHeading = THREE.MathUtils.lerp(visHeading, this.player.headingAngle, 0.72);
    const playerRenderPos = this.player.model.group.position;
    if (this.runnerFillLight) {
      this._fwdTmp.set(Math.sin(fillHeading), 0, Math.cos(fillHeading));
      this.runnerFillLight.position
        .copy(playerRenderPos)
        .addScaledVector(this._fwdTmp, 4.5);
      this.runnerFillLight.position.y = 2.35;
    }
    if (this.trailFillLight) {
      this._fwdTmp.set(Math.sin(visHeading), 0, Math.cos(visHeading));
      this.trailFillLight.position
        .copy(playerRenderPos)
        .addScaledVector(this._fwdTmp, -1.8);
      this.trailFillLight.position.y = 1.85;
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.loop);
    } else {
      this.frameId = requestAnimationFrame(this.loop);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    sound.stopJungleDrums();
    this.moneyTrailGeom?.dispose();
    this.moneyTrailSparkGeom?.dispose();
    this.moneyTrailTex?.dispose();
    this.moneyBillMat?.dispose();
    this.moneySparkMat?.dispose();
    this.moneyBillInstancedMesh?.dispose();
    this.moneySparkInstancedMesh?.dispose();
    this.absorbRingGeom?.dispose();
    this.absorptionRings.forEach((r) => r.material.dispose());
    this.absorbSparkGeom?.dispose();
    this.absorptionSparks.forEach((s) => s.material.dispose());
    this.magnetBeams.forEach((b) => {
      b.line.geometry.dispose();
      b.material.dispose();
    });
    this.magnetFieldOuter?.material.dispose();
    this.magnetFieldInner?.material.dispose();
    this.landingRingGeom?.dispose();
    this.landingRings.forEach((r) => r.material.dispose());
    this.landingPuffGeom?.dispose();
    this.landingPuffs.forEach((p) => p.material.dispose());
    this.stoneGeoms.forEach((g) => g.dispose());
    this.stoneMats.forEach((m) => m.dispose());
    this.wallChipGeom?.dispose();
    this.wallChipMat?.dispose();
    this.wallChipInstancedMesh?.dispose();
    this.emberSparkGeom?.dispose();
    this.emberSparkMat?.dispose();
    this.emberSparkInstancedMesh?.dispose();
    this.wallBreachTex?.dispose();
    this.wallBreachMat?.dispose();
    this.wallDustTex?.dispose();
    this.stoneDustGeom?.dispose();
    this.stoneDustPuffs.forEach((p) => p.material.dispose());
    this.stoneBlastRingGeom?.dispose();
    this.stoneBlastRing?.material.dispose();
    this.crashCandleGeoms.forEach((g) => g.dispose());
    this.crashCandleMats.forEach((m) => m.dispose());
    this.cornerGeoms.forEach((g) => g.dispose());
    this.cornerMats.forEach((m) => m.dispose());
    if (this.corridor) {
      this.corridor.dispose();
    }
    this.renderer.dispose();
  }
}
