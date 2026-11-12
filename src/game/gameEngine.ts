import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAdventurer, createGoldenIdol, AdventurerModel } from './models';
import { TrackManager, ForkInstance } from './trackManager';
import { CharacterController } from './characterController';
import { FpsCorridor } from './fpsCorridor';
import { sound } from './audio';
import { AdventurerProfile, getDiceBearAvatarUrl, loadAvatarPair, loadAvatarToCanvas } from './adventurers';
import { MarketQuery } from './queries';
import { createDollarBillTrailTexture } from './textures';

export interface GameEngineCallbacks {
  onScoreUpdate: (stats: { distance: number; coins: number; score: number }) => void;
  onGameOver: (stats: { distance: number; coins: number; score: number; reason?: string }) => void;
  onPowerupMessage: (msg: string) => void;
  onForkApproaching?: (fork: ForkInstance) => void;
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

  // Fluttering 3D dollar-bill money trail behind the runner
  private moneyTrailBills: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    active: boolean;
    age: number;
    maxAge: number;
    velocity: THREE.Vector3;
    spinSpeed: THREE.Vector3;
    flutterPhase: number;
  }> = [];
  private moneyTrailGeom: THREE.PlaneGeometry | null = null;
  private moneyTrailTex: THREE.CanvasTexture | null = null;
  private lastTrailTime: number = 0;
  private trailSideIndex: number = 0;

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

  // Pooled 3D Stone Wall Explosion (Shattering sandstone blocks, shards, dust & flash)
  private stoneChunks: Array<{
    mesh: THREE.Mesh;
    active: boolean;
    age: number;
    maxAge: number;
    velocity: THREE.Vector3;
    spin: THREE.Vector3;
    baseScale: number;
    radius: number;
  }> = [];
  private stoneDustPuffs: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    active: boolean;
    age: number;
    maxAge: number;
    velocity: THREE.Vector3;
    startScale: number;
  }> = [];
  private stoneBlastRing: {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
    maxAge: number;
  } | null = null;
  private stoneGeoms: THREE.BufferGeometry[] = [];
  private stoneMats: THREE.MeshStandardMaterial[] = [];
  private stoneDustGeom: THREE.IcosahedronGeometry | null = null;
  private stoneBlastRingGeom: THREE.RingGeometry | null = null;
  private explosionFlashLight: THREE.PointLight | null = null;

  // Camera Shake & Landing Impact Thud
  private cameraShakeIntensity: number = 0;
  private cameraDropOffset: number = 0;
  private readonly _impactTmp = new THREE.Vector3();

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
    this.renderer.toneMappingExposure = 0.68;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Dark Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06070a);
    this.scene.fog = new THREE.FogExp2(0x06070a, 0.036);

    // 4. Camera (perspective matching FPS corridor)
    this.camera = new THREE.PerspectiveCamera(
      64,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );
    this.camera.position.set(0, 3.2, -5.5);
    this.camera.lookAt(0, 1.2, 3);

    // 5. Studio Environment Map (Subtle metallic reflections for iron cyber arms)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.015).texture;
    this.scene.environmentIntensity = 0.38;
    pmremGenerator.dispose();

    // 6. Balanced Low-Light Atmospheric Lighting Rig
    this.setupLighting();

    // 7. Keith Clark CSS FPS 3D Corridor & Track Manager (with max anisotropic texture filtering)
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.corridor = new FpsCorridor(this.scene, maxAniso);

    // 8. Track & Actors
    this.trackManager = new TrackManager(this.scene, maxAniso);
    this.adventurer = createAdventurer();

    this.scene.add(this.adventurer.group);

    // Initial Pedestal with Golden Idol at start point
    this.setupStartPedestal();

    // Controller
    this.player = new CharacterController(this.adventurer, this.trackManager);
    this.player.onGameOver = (stats) => {
      sound.stopJungleDrums();
      this.callbacks.onGameOver(stats);
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

    // 8. Money Trail, Coin Absorption, Landing Shockwave & Stone Explosion Pools
    this.setupMoneyTrail();
    this.setupCoinAbsorptionPool();
    this.setupLandingEffectsPool();
    this.setupStoneExplosionPool();

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
    const sunLight = new THREE.DirectionalLight(0x94a3b8, 0.36);
    sunLight.position.set(12, 28, 14);
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

    // Dark Slate Sky / Near-Black Ground Bounce Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x050507, 0.22);
    this.scene.add(hemiLight);

    // Minimal Dark Ambient Tomb Fill
    const ambientLight = new THREE.AmbientLight(0x0b0f17, 0.14);
    this.scene.add(ambientLight);

    // Subtle Cool Rim Light on Runner & Iron Cyber Arms from behind
    const rimLight = new THREE.DirectionalLight(0x64748b, 0.38);
    rimLight.position.set(-4, 6, -10);
    this.scene.add(rimLight);
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
    // Gently curved paper bill geometry so trailing dollars flutter realistically
    const geom = new THREE.PlaneGeometry(0.44, 0.22, 5, 2);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      pos.setZ(i, Math.sin(px * 9.5) * 0.028 + Math.cos(py * 10) * 0.01);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    this.moneyTrailGeom = geom;

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.moneyTrailTex = createDollarBillTrailTexture(maxAniso);

    for (let i = 0; i < 28; i++) {
      const material = new THREE.MeshStandardMaterial({
        map: this.moneyTrailTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        roughness: 0.95,
        metalness: 0.0,
        envMapIntensity: 0.08,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.moneyTrailGeom, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.moneyTrailBills.push({
        mesh,
        material,
        active: false,
        age: 0,
        maxAge: 0.85,
        velocity: new THREE.Vector3(),
        spinSpeed: new THREE.Vector3(),
        flutterPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private updateMoneyTrail(dt: number, time: number) {
    const state = this.player.state;
    if ((state === 'run' || state === 'jump' || state === 'slide') && time - this.lastTrailTime > 0.065) {
      this.lastTrailTime = time;
      const bill = this.moneyTrailBills.find((b) => !b.active);
      if (bill) {
        bill.active = true;
        bill.age = 0;
        bill.maxAge = 0.72 + Math.random() * 0.28;
        bill.mesh.visible = true;

        const playerPos = this.player.model.group.position;
        const heading = this.player.headingAngle;
        this.trailSideIndex = (this.trailSideIndex + 1) % 2;
        const sideSign = this.trailSideIndex === 0 ? -1 : 1;
        const lateral = sideSign * (0.18 + Math.random() * 0.34);

        bill.mesh.position.set(
          playerPos.x - Math.sin(heading) * 0.35 + Math.cos(heading) * lateral,
          playerPos.y + 0.22 + Math.random() * 0.45,
          playerPos.z - Math.cos(heading) * 0.35 - Math.sin(heading) * lateral
        );
        bill.mesh.rotation.set(
          (Math.random() - 0.5) * 0.8,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.8
        );
        const s = 0.85 + Math.random() * 0.35;
        bill.mesh.scale.setScalar(s);

        bill.velocity.set(
          sideSign * (0.45 + Math.random() * 0.65),
          0.75 + Math.random() * 0.75,
          -Math.cos(heading) * (1.2 + Math.random() * 1.1)
        );
        bill.spinSpeed.set(
          (Math.random() - 0.5) * 7.5,
          (Math.random() - 0.5) * 6.5,
          (Math.random() - 0.5) * 8.5
        );
        bill.flutterPhase = Math.random() * Math.PI * 2;
        bill.material.opacity = 0.96;
      }
    }

    for (const bill of this.moneyTrailBills) {
      if (!bill.active) continue;
      bill.age += dt;
      if (bill.age >= bill.maxAge) {
        bill.active = false;
        bill.mesh.visible = false;
      } else {
        const progress = bill.age / bill.maxAge;
        // Air drag + gentle upward-and-downward paper flutter
        bill.velocity.y -= dt * 1.45;
        bill.velocity.x *= 1 - dt * 1.8;
        bill.mesh.position.addScaledVector(bill.velocity, dt);
        bill.mesh.position.x += Math.sin(time * 12 + bill.flutterPhase) * dt * 0.42;

        bill.mesh.rotation.x += bill.spinSpeed.x * dt + Math.sin(time * 14 + bill.flutterPhase) * dt * 2.2;
        bill.mesh.rotation.y += bill.spinSpeed.y * dt;
        bill.mesh.rotation.z += bill.spinSpeed.z * dt;

        const fade = progress > 0.55 ? 1 - (progress - 0.55) / 0.45 : 1.0;
        bill.material.opacity = Math.max(0, fade * 0.96);
      }
    }
  }

  private setupCoinAbsorptionPool() {
    this.absorbRingGeom = new THREE.TorusGeometry(0.62, 0.042, 8, 28);
    for (let i = 0; i < 6; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd700,
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
        maxAge: 0.34,
      });
    }

    this.absorbSparkGeom = new THREE.OctahedronGeometry(0.085, 0);
    for (let i = 0; i < 36; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xfef08a : 0xf59e0b,
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
        maxAge: 0.32,
        startPos: new THREE.Vector3(),
        orbitOffset: new THREE.Vector3(),
      });
    }
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
      ring.mesh.scale.setScalar(1.65);
      ring.material.opacity = 0.92;
    }

    let spawned = 0;
    for (const spark of this.absorptionSparks) {
      if (spark.active) continue;
      const angle = (spawned / 8) * Math.PI * 2 + Math.random() * 0.5;
      const spread = 0.35 + Math.random() * 0.35;
      spark.active = true;
      spark.age = 0;
      spark.maxAge = 0.26 + Math.random() * 0.1;
      spark.startPos.copy(coinWorldPos);
      spark.orbitOffset.set(
        Math.cos(angle) * spread,
        0.15 + Math.random() * 0.5,
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
    const playerPos = this.player.model.group.position;
    this._absorbTargetPos.set(playerPos.x, playerPos.y + 1.05, playerPos.z);

    for (const ring of this.absorptionRings) {
      if (!ring.active) continue;
      ring.age += dt;
      if (ring.age >= ring.maxAge) {
        ring.active = false;
        ring.mesh.visible = false;
      } else {
        const t = ring.age / ring.maxAge;
        // Contract inward onto runner's chest while glowing
        ring.mesh.position.copy(this._absorbTargetPos);
        ring.mesh.rotation.z += dt * 7;
        const s = Math.max(0.12, 1.65 * (1 - t * 0.92));
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
        spark.mesh.rotation.y += dt * 15;
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

    // Kick up 3 extra fluttering dollar bills radially from the money floor!
    let kickedBills = 0;
    for (const bill of this.moneyTrailBills) {
      if (bill.active) continue;
      const angle = Math.random() * Math.PI * 2;
      bill.active = true;
      bill.age = 0;
      bill.maxAge = 0.65 + Math.random() * 0.2;
      bill.mesh.visible = true;
      bill.mesh.position.set(
        worldPos.x + Math.cos(angle) * 0.25,
        0.12,
        worldPos.z + Math.sin(angle) * 0.25
      );
      bill.mesh.scale.setScalar(0.95);
      bill.velocity.set(
        Math.cos(angle) * (1.8 + Math.random() * 1.4),
        2.0 + Math.random() * 1.4,
        Math.sin(angle) * (1.8 + Math.random() * 1.4)
      );
      bill.spinSpeed.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      bill.flutterPhase = Math.random() * Math.PI * 2;
      bill.material.opacity = 0.96;
      kickedBills++;
      if (kickedBills >= 3) break;
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

  private setupStoneExplosionPool() {
    // 3 jagged stone chunk geometries (sandstone blocks, fractured rocks, sharp splinters)
    const rockGeom = new THREE.DodecahedronGeometry(0.18, 0);
    const brickGeom = new THREE.BoxGeometry(0.28, 0.16, 0.22);
    const shardGeom = new THREE.TetrahedronGeometry(0.17, 0);
    this.stoneGeoms = [rockGeom, brickGeom, shardGeom];

    // Varied sandstone, dark mortar, carved granite, and ember stone materials
    this.stoneMats = [
      new THREE.MeshStandardMaterial({ color: 0x9c7642, roughness: 0.9, metalness: 0.06 }),
      new THREE.MeshStandardMaterial({ color: 0x73542b, roughness: 0.92, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0x4b3821, roughness: 0.95, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({
        color: 0xc29855,
        emissive: 0x4a2208,
        emissiveIntensity: 0.35,
        roughness: 0.82,
        metalness: 0.12,
      }),
    ];

    for (let i = 0; i < 42; i++) {
      const geom = this.stoneGeoms[i % this.stoneGeoms.length];
      const mat = this.stoneMats[i % this.stoneMats.length];
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = !this.isSoftwareGl;
      mesh.visible = false;
      this.scene.add(mesh);
      this.stoneChunks.push({
        mesh,
        active: false,
        age: 0,
        maxAge: 1.6,
        velocity: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        baseScale: 1,
        radius: 0.16,
      });
    }

    this.stoneDustGeom = new THREE.IcosahedronGeometry(0.34, 1);
    for (let i = 0; i < 18; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xb59568 : 0x7a6242,
        roughness: 1.0,
        metalness: 0.0,
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
        maxAge: 0.85,
        velocity: new THREE.Vector3(),
        startScale: 0.8,
      });
    }

    this.stoneBlastRingGeom = new THREE.RingGeometry(0.25, 0.55, 24);
    const blastMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
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

    this.explosionFlashLight = new THREE.PointLight(0xfb923c, 0, 14);
    this.scene.add(this.explosionFlashLight);
  }

  public spawnStoneExplosion(impactPos: THREE.Vector3, heavy = true) {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, heavy ? 0.58 : 0.18);

    // Momentary amber stone-impact flash
    if (this.explosionFlashLight) {
      this.explosionFlashLight.position.set(impactPos.x, impactPos.y + 0.3, impactPos.z - 0.6);
      this.explosionFlashLight.intensity = heavy ? 7.5 : 2.5;
    }

    // Expanding stone shockwave ring facing camera
    if (heavy && this.stoneBlastRing) {
      this.stoneBlastRing.active = true;
      this.stoneBlastRing.age = 0;
      this.stoneBlastRing.mesh.visible = true;
      this.stoneBlastRing.mesh.position.set(impactPos.x, Math.max(0.8, impactPos.y), impactPos.z);
      this.stoneBlastRing.mesh.rotation.set(0, 0, Math.random() * Math.PI);
      this.stoneBlastRing.mesh.scale.setScalar(0.5);
      this.stoneBlastRing.material.opacity = 0.92;
    }

    // Spawn shattering sandstone rock chunks
    const targetChunks = heavy ? 36 : 12;
    let chunkCount = 0;
    for (const chunk of this.stoneChunks) {
      if (chunk.active) continue;
      chunk.active = true;
      chunk.age = 0;
      chunk.maxAge = heavy ? 1.45 + Math.random() * 0.65 : 0.65 + Math.random() * 0.3;
      chunk.baseScale = heavy ? 0.65 + Math.random() * 1.15 : 0.35 + Math.random() * 0.45;
      chunk.radius = 0.16 * chunk.baseScale;

      chunk.mesh.visible = true;
      chunk.mesh.position.set(
        impactPos.x + (Math.random() - 0.5) * (heavy ? 1.1 : 0.35),
        Math.max(0.25, impactPos.y + (Math.random() - 0.4) * (heavy ? 1.4 : 0.6)),
        impactPos.z + (Math.random() - 0.5) * 0.6
      );
      chunk.mesh.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      chunk.mesh.scale.set(
        chunk.baseScale * (0.75 + Math.random() * 0.6),
        chunk.baseScale * (0.7 + Math.random() * 0.6),
        chunk.baseScale * (0.75 + Math.random() * 0.6)
      );

      const angle = Math.random() * Math.PI * 2;
      const radial = heavy ? 2.5 + Math.random() * 6.5 : 1.5 + Math.random() * 3.0;
      const inwardBias = impactPos.x !== 0 && !heavy ? -Math.sign(impactPos.x) * 2.2 : 0;
      chunk.velocity.set(
        Math.cos(angle) * radial + inwardBias,
        (heavy ? 3.2 + Math.random() * 6.8 : 1.5 + Math.random() * 3.8),
        Math.sin(angle) * radial - (heavy ? 2.5 : 0.8)
      );
      chunk.spin.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      );

      chunkCount++;
      if (chunkCount >= targetChunks) break;
    }

    // Spawn billowing sandstone dust clouds
    const targetDust = heavy ? 14 : 5;
    let dustCount = 0;
    for (const puff of this.stoneDustPuffs) {
      if (puff.active) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = heavy ? 1.6 + Math.random() * 3.2 : 0.8 + Math.random() * 1.6;
      puff.active = true;
      puff.age = 0;
      puff.maxAge = heavy ? 0.72 + Math.random() * 0.35 : 0.42 + Math.random() * 0.2;
      puff.startScale = heavy ? 0.7 + Math.random() * 0.65 : 0.35 + Math.random() * 0.3;
      puff.mesh.visible = true;
      puff.mesh.position.set(
        impactPos.x + (Math.random() - 0.5) * 0.8,
        Math.max(0.25, impactPos.y + (Math.random() - 0.5) * 0.9),
        impactPos.z + (Math.random() - 0.5) * 0.5
      );
      puff.mesh.scale.setScalar(puff.startScale);
      puff.material.opacity = heavy ? 0.78 : 0.55;
      puff.velocity.set(
        Math.cos(angle) * speed,
        0.8 + Math.random() * 2.2,
        Math.sin(angle) * speed - 0.8
      );
      dustCount++;
      if (dustCount >= targetDust) break;
    }
  }

  private updateStoneExplosion(dt: number) {
    if (this.explosionFlashLight && this.explosionFlashLight.intensity > 0) {
      this.explosionFlashLight.intensity = Math.max(0, this.explosionFlashLight.intensity - dt * 28);
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
        ring.mesh.scale.setScalar(0.5 + easeOut * 4.4);
        ring.material.opacity = (1 - t) * 0.88;
      }
    }

    for (const chunk of this.stoneChunks) {
      if (!chunk.active) continue;
      chunk.age += dt;
      if (chunk.age >= chunk.maxAge) {
        chunk.active = false;
        chunk.mesh.visible = false;
      } else {
        // Gravity + air drag + floor bounce
        chunk.velocity.y -= 24.0 * dt;
        chunk.mesh.position.addScaledVector(chunk.velocity, dt);

        if (chunk.mesh.position.y < chunk.radius && chunk.velocity.y < 0) {
          chunk.mesh.position.y = chunk.radius;
          chunk.velocity.y = -chunk.velocity.y * 0.42;
          chunk.velocity.x *= 0.72;
          chunk.velocity.z *= 0.72;
          chunk.spin.multiplyScalar(0.75);
        }

        chunk.mesh.rotation.x += chunk.spin.x * dt;
        chunk.mesh.rotation.y += chunk.spin.y * dt;
        chunk.mesh.rotation.z += chunk.spin.z * dt;

        const life = chunk.age / chunk.maxAge;
        if (life > 0.72) {
          const shrink = Math.max(0.01, 1 - (life - 0.72) / 0.28);
          chunk.mesh.scale.setScalar(chunk.baseScale * shrink);
        }
      }
    }

    for (const puff of this.stoneDustPuffs) {
      if (!puff.active) continue;
      puff.age += dt;
      if (puff.age >= puff.maxAge) {
        puff.active = false;
        puff.mesh.visible = false;
      } else {
        const t = puff.age / puff.maxAge;
        puff.velocity.multiplyScalar(Math.max(0, 1 - dt * 2.6));
        puff.velocity.y += dt * 1.1;
        puff.mesh.position.addScaledVector(puff.velocity, dt);
        puff.mesh.rotation.y += dt * 1.4;
        puff.mesh.scale.setScalar(puff.startScale * (1 + t * 2.8));
        puff.material.opacity = (1 - t) * 0.72;
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

  public restart() {
    this.trackManager.reset();
    this.player.reset();
    for (const bill of this.moneyTrailBills) {
      bill.active = false;
      bill.mesh.visible = false;
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
      chunk.mesh.visible = false;
    }
    for (const puff of this.stoneDustPuffs) {
      puff.active = false;
      puff.mesh.visible = false;
    }
    if (this.stoneBlastRing) {
      this.stoneBlastRing.active = false;
      this.stoneBlastRing.mesh.visible = false;
    }
    if (this.explosionFlashLight) {
      this.explosionFlashLight.intensity = 0;
    }
    this.cameraShakeIntensity = 0;
    this.cameraDropOffset = 0;
    if (this.idolPedestal) {
      this.idolPedestal.position.set(0, 0, -3.5);
    }
    this.isPaused = false;
    this.isRunning = true;
    sound.startJungleDrums();
  }

  // Update Adventurer Appearance & DiceBear Face Texture
  public setAdventurer(profile: AdventurerProfile) {
    // Immediately apply clothes colors
    this.adventurer.updateAppearance(
      profile.shirtColor,
      profile.vestColor,
      profile.pantsColor
    );

    // Fetch and apply DiceBear adventure avatar front & back faces onto 3D character
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

  // Steer runner into Left Road or Right Road tunnel
  public selectTunnel(side: 'left' | 'right') {
    if (side === 'left') {
      this.player.targetLaneX = -this.trackManager.laneOffset;
      this.player.currentLane = -1;
    } else {
      this.player.targetLaneX = this.trackManager.laneOffset;
      this.player.currentLane = 1;
    }
    sound.playTurn();
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

  // Camera smooth follow calculation
  private updateCamera(dt: number) {
    const playerPos = this.player.model.group.position;
    const heading = this.player.headingAngle;

    let offsetVector: THREE.Vector3;
    let lookAtTarget: THREE.Vector3;

    if (this.cameraMode === 'front') {
      // Front selfie camera: directly displays the adventurer's DiceBear face while running!
      offsetVector = new THREE.Vector3(
        Math.sin(heading) * 4.8,
        2.1,
        Math.cos(heading) * 4.8
      );
      lookAtTarget = playerPos.clone().add(new THREE.Vector3(0, 1.18, 0));
    } else if (this.cameraMode === 'side') {
      // Action quarter angle: captures the path ahead and the runner's face profile
      offsetVector = new THREE.Vector3(
        -Math.sin(heading) * 4.6 + Math.cos(heading) * 2.6,
        2.6,
        -Math.cos(heading) * 4.6 - Math.sin(heading) * 2.6
      );
      lookAtTarget = playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
    } else {
      // Classic rear chase view: ~5.8m behind, ~3.2m above
      offsetVector = new THREE.Vector3(
        -Math.sin(heading) * 5.8,
        3.2,
        -Math.cos(heading) * 5.8
      );
      lookAtTarget = playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
    }

    const targetPos = playerPos.clone().add(offsetVector);

    // Subtle organic camera sway + landing drop thud & stone collision shake
    const time = this.clock.getElapsedTime();
    targetPos.x += Math.sin(time * 0.45) * 0.12;
    targetPos.y += Math.cos(time * 0.6) * 0.08 - this.cameraDropOffset;

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

    // Smooth exponential damping
    this.cameraCurrentPos.lerp(targetPos, Math.min(1, dt * 8.5));
    this.cameraCurrentLookAt.lerp(lookAtTarget, Math.min(1, dt * 9.5));

    this.camera.position.copy(this.cameraCurrentPos);
    this.camera.lookAt(this.cameraCurrentLookAt);
  }

  private loop = () => {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    if (this.isRunning && !this.isPaused) {
      // Update runner
      this.player.update(dt, time);

      // Update procedural track
      this.trackManager.update(this.player.position, time);

      // Evaluate Tunnel Fork Decisions (End-of-Tunnel Query)
      for (const fork of this.trackManager.forks) {
        const distToFork = fork.forkZ - this.player.position.z;
        if (distToFork > -5 && distToFork < 40) {
          this.callbacks.onForkApproaching?.(fork);
        }

        if (!fork.cleared && this.player.position.z >= fork.decisionLineZ) {
          fork.cleared = true;
          const laneX = this.player.currentLaneX;

          let chosenSide: 'left' | 'right' | 'center' = 'center';
          if (laneX < -0.45) {
            chosenSide = 'left';
          } else if (laneX > 0.45) {
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
            this._impactTmp.set(0, 1.35, fork.decisionLineZ);
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

            // Smoothly re-center for the next straight corridor section
            setTimeout(() => {
              if (this.player.state === 'run') {
                this.player.currentLane = 0;
                this.player.targetLaneX = 0;
              }
            }, 1400);
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
            this._impactTmp.set(
              chosenSide === 'left' ? -this.trackManager.laneOffset : this.trackManager.laneOffset,
              1.35,
              fork.decisionLineZ + 1.2
            );
            this.player.die(fork.query.deathReason, this._impactTmp);
            break;
          }
        }
      }

      // Update camera
      this.updateCamera(dt);

      // Update fluttering dollar-bill money trail, coin absorption, landing shockwave & stone explosion
      this.updateMoneyTrail(dt, time);
      this.updateCoinAbsorption(dt);
      this.updateLandingEffects(dt);
      this.updateStoneExplosion(dt);

      // Update score callback regularly
      this.callbacks.onScoreUpdate({
        distance: Math.floor(this.player.distanceRun),
        coins: this.player.coinsCollected,
        score: Math.floor(this.player.score),
      });
    } else {
      this.updateCamera(dt);
      this.updateLandingEffects(dt);
      this.updateStoneExplosion(dt);
    }

    // Animate Keith Clark CSS FPS 3D corridor (endless modular wrapping around runner)
    if (this.corridor) {
      this.corridor.update(this.player.position.z, time);
    }

    this.renderer.render(this.scene, this.camera);

    // Software-WebGL guard pacing
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
    this.moneyTrailTex?.dispose();
    this.moneyTrailBills.forEach((b) => b.material.dispose());
    this.absorbRingGeom?.dispose();
    this.absorptionRings.forEach((r) => r.material.dispose());
    this.absorbSparkGeom?.dispose();
    this.absorptionSparks.forEach((s) => s.material.dispose());
    this.landingRingGeom?.dispose();
    this.landingRings.forEach((r) => r.material.dispose());
    this.landingPuffGeom?.dispose();
    this.landingPuffs.forEach((p) => p.material.dispose());
    this.stoneGeoms.forEach((g) => g.dispose());
    this.stoneMats.forEach((m) => m.dispose());
    this.stoneDustGeom?.dispose();
    this.stoneDustPuffs.forEach((p) => p.material.dispose());
    this.stoneBlastRingGeom?.dispose();
    this.stoneBlastRing?.material.dispose();
    if (this.corridor) {
      this.corridor.dispose(this.scene);
    }
    this.renderer.dispose();
  }
}
