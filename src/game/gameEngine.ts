import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAdventurer, createChasingSpider, createGoldenIdol, AdventurerModel, SpiderModel } from './models';
import { TrackManager } from './trackManager';
import { CharacterController } from './characterController';
import { sound } from './audio';
import { AdventurerProfile, getDiceBearAvatarUrl, loadAvatarPair, loadAvatarToCanvas } from './adventurers';

export interface GameEngineCallbacks {
  onScoreUpdate: (stats: { distance: number; coins: number; score: number }) => void;
  onGameOver: (stats: { distance: number; coins: number; score: number }) => void;
  onPowerupMessage: (msg: string) => void;
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
  public adventurer: AdventurerModel;
  public spider: SpiderModel;
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

  // Cartoon dust particle puffs
  private cartoonPuffs: Array<{
    mesh: THREE.Mesh;
    active: boolean;
    age: number;
    maxAge: number;
  }> = [];
  private lastPuffTime: number = 0;
  private handPuffIndex: number = 0;

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
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Atmospheric Horizon Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x131a15);
    this.scene.fog = new THREE.FogExp2(0x131a15, 0.016);

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 4, -6);
    this.camera.lookAt(0, 1.2, 3);

    // 5. Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Balanced Lighting Rig
    this.setupLighting();

    // 7. Track & Actors
    this.trackManager = new TrackManager(this.scene);
    this.adventurer = createAdventurer();
    this.spider = createChasingSpider();

    this.scene.add(this.adventurer.group);
    this.scene.add(this.spider.group);

    // Initial Pedestal with Golden Idol at start point
    this.setupStartPedestal();

    // Controller
    this.player = new CharacterController(this.adventurer, this.spider, this.trackManager);
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
    this.player.onPowerupPickup = (msg) => {
      this.callbacks.onPowerupMessage(msg);
    };

    // 8. Dust particles
    this.setupDustParticles();

    // 9. Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private setupLighting() {
    // Key Sun Light
    const sunLight = new THREE.DirectionalLight(0xfff0d0, 2.2);
    sunLight.position.set(20, 35, 15);
    sunLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 100;
      sunLight.shadow.camera.left = -16;
      sunLight.shadow.camera.right = 16;
      sunLight.shadow.camera.top = 16;
      sunLight.shadow.camera.bottom = -16;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    // Cool Sky & Lush Ground Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x7bc482, 0x1f2e22, 1.1);
    this.scene.add(hemiLight);

    // Warm Ambient
    const ambientLight = new THREE.AmbientLight(0x222920, 0.8);
    this.scene.add(ambientLight);
  }

  private setupStartPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, -3.5);

    // Stone altar
    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x474036, roughness: 0.9 })
    );
    altar.position.y = 0.6;
    altar.castShadow = true;
    pedestalGroup.add(altar);

    // Golden Idol
    const idol = createGoldenIdol();
    idol.position.y = 1.2;
    pedestalGroup.add(idol);

    this.idolPedestal = pedestalGroup;
    this.scene.add(pedestalGroup);
  }

  private setupDustParticles() {
    const puffGeom = new THREE.SphereGeometry(0.13, 8, 8);

    for (let i = 0; i < 12; i++) {
      const puffMat = new THREE.MeshToonMaterial({
        color: 0xeadac4,
        transparent: true,
        opacity: 0.65,
      });
      const mesh = new THREE.Mesh(puffGeom, puffMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.cartoonPuffs.push({
        mesh,
        active: false,
        age: 0,
        maxAge: 0.42,
      });
    }
  }

  private updateCartoonPuffs(dt: number, time: number) {
    if (this.player.state === 'run' && time - this.lastPuffTime > 0.15) {
      this.lastPuffTime = time;
      const inactive = this.cartoonPuffs.find((p) => !p.active);
      if (inactive) {
        inactive.active = true;
        inactive.age = 0;
        inactive.mesh.visible = true;

        const playerPos = this.player.model.group.position;
        const heading = this.player.headingAngle;
        // Alternate dust puff between left and right big cyborg hands
        this.handPuffIndex = ((this.handPuffIndex || 0) + 1) % 2;
        const handSide = (this.handPuffIndex === 0 ? -1 : 1) * 0.42;

        inactive.mesh.position.set(
          playerPos.x - Math.sin(heading) * 0.15 + Math.cos(heading) * handSide,
          0.06,
          playerPos.z - Math.cos(heading) * 0.15 - Math.sin(heading) * handSide
        );
        inactive.mesh.scale.set(0.38, 0.38, 0.38);
      }
    }

    for (const puff of this.cartoonPuffs) {
      if (!puff.active) continue;
      puff.age += dt;
      if (puff.age >= puff.maxAge) {
        puff.active = false;
        puff.mesh.visible = false;
      } else {
        const progress = puff.age / puff.maxAge;
        const s = 0.35 + progress * 0.95;
        puff.mesh.scale.set(s, s * 0.72, s);
        puff.mesh.position.y += dt * 0.35;
        (puff.mesh.material as THREE.MeshToonMaterial).opacity = (1 - progress) * 0.65;
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
    this.loop();
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

  public restart() {
    this.trackManager.reset();
    this.player.reset();
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

    // Smooth exponential damping
    this.cameraCurrentPos.lerp(targetPos, Math.min(1, dt * 8.5));
    this.cameraCurrentLookAt.lerp(lookAtTarget, Math.min(1, dt * 9.5));

    this.camera.position.copy(this.cameraCurrentPos);
    this.camera.lookAt(this.cameraCurrentLookAt);
  }

  private loop = () => {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      const dt = Math.min(this.clock.getDelta(), 0.1);
      const time = this.clock.getElapsedTime();

      // Update character & spider
      this.player.update(dt, time);

      // Update procedural track
      this.trackManager.update(this.player.position, time);

      // Update camera
      this.updateCamera(dt);

      // Update cartoon dust puffs behind runner
      this.updateCartoonPuffs(dt, time);

      // Update score callback regularly
      this.callbacks.onScoreUpdate({
        distance: Math.floor(this.player.distanceRun),
        coins: this.player.coinsCollected,
        score: Math.floor(this.player.score),
      });
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
    this.cartoonPuffs.forEach((p) => {
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.renderer.dispose();
  }
}
