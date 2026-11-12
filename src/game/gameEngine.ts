import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAdventurer, createChasingSpider, createGoldenIdol, AdventurerModel, SpiderModel } from './models';
import { TrackManager, ForkInstance } from './trackManager';
import { CharacterController } from './characterController';
import { FpsCorridor } from './fpsCorridor';
import { sound } from './audio';
import { AdventurerProfile, getDiceBearAvatarUrl, loadAvatarPair, loadAvatarToCanvas } from './adventurers';
import { MarketQuery } from './queries';

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
    this.renderer.toneMappingExposure = 0.98;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Authentic Egyptian Tomb Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1108);
    this.scene.fog = new THREE.FogExp2(0x1a1108, 0.022);

    // 4. Camera (perspective matching FPS corridor)
    this.camera = new THREE.PerspectiveCamera(
      64,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );
    this.camera.position.set(0, 3.2, -5.5);
    this.camera.lookAt(0, 1.2, 3);

    // 5. Studio Environment Map (Soft warm bounce)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.015).texture;
    pmremGenerator.dispose();

    // 6. Balanced Low-Light Atmospheric Lighting Rig
    this.setupLighting();

    // 7. Keith Clark CSS FPS 3D Corridor (wall.jpg, ceil.jpg, floor.jpg, and dark green shadows)
    this.corridor = new FpsCorridor(this.scene);

    // 8. Track & Actors
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

    // Start background render loop
    this.loop();
  }

  private setupLighting() {
    // Warm Egyptian Desert Sunlight Shaft Directional Key Light
    const sunLight = new THREE.DirectionalLight(0xffd188, 0.75);
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

    // Warm Golden Sandstone Bounce Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0xff9933, 0x3a200a, 0.45);
    this.scene.add(hemiLight);

    // Warm Ambient Tomb Fill
    const ambientLight = new THREE.AmbientLight(0x2d1908, 0.35);
    this.scene.add(ambientLight);

    // Shimmering Pharaoh's Gold Rim Light on Runner from behind
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.45);
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

    // Subtle organic camera sway inspired by Keith Clark CSS FPS @keyframes move
    const time = this.clock.getElapsedTime();
    targetPos.x += Math.sin(time * 0.45) * 0.12;
    targetPos.y += Math.cos(time * 0.6) * 0.08;

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
      // Update character & spider
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
            this.callbacks.onForkDecision?.({
              survived: false,
              profit: -fork.query.profit,
              feedback: 'CRASHED INTO CENTER DIVIDER! Hesitation killed the portfolio.',
              query: fork.query,
              chosenSide: 'left',
            });
            this.player.die('CRASHED INTO FORK DIVIDER! Hesitation killed the fund. You hit the concrete crash barrier dead-center.');
            break;
          }

          const isCorrect = (chosenSide === fork.query.correctSide);
          if (isCorrect) {
            sound.playCoin();
            this.player.score += fork.query.profit;
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
            sound.playCrash();
            this.callbacks.onForkDecision?.({
              survived: false,
              profit: -fork.query.profit,
              feedback: fork.query.deathReason,
              query: fork.query,
              chosenSide,
            });
            this.player.die(fork.query.deathReason);
            break;
          }
        }
      }

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
    } else {
      this.updateCamera(dt);
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
    this.cartoonPuffs.forEach((p) => {
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    if (this.corridor) {
      this.corridor.dispose(this.scene);
    }
    this.renderer.dispose();
  }
}
