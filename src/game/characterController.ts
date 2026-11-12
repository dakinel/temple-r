import * as THREE from 'three';
import { AdventurerModel } from './models';
import { TrackManager } from './trackManager';
import { sound } from './audio';

const _absorbTarget = new THREE.Vector3();
const _localCoinPos = new THREE.Vector3();
const _forwardDir = new THREE.Vector3();
const _sideDir = new THREE.Vector3();
const _renderPos = new THREE.Vector3();
const _wallImpactPos = new THREE.Vector3();

export type PlayerState = 'run' | 'jump' | 'slide' | 'fall' | 'dead';

export interface PowerupState {
  magnetTimer: number; // seconds remaining
  shieldActive: boolean;
  boostTimer: number;
}

export class CharacterController {
  public model: AdventurerModel;
  public trackManager: TrackManager;

  // Position & Orientation
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public headingAngle: number = 0; // Current travel direction in radians
  public currentLane: number = 0; // -1, 0, 1
  public targetLaneX: number = 0;
  public currentLaneX: number = 0;

  // Movement Specs
  public baseSpeed: number = 9.5;
  public currentSpeed: number = 9.5;
  public state: PlayerState = 'run';
  public distanceRun: number = 0;
  public coinsCollected: number = 0;
  public score: number = 0;

  // Jump & Slide Physics
  public verticalVelocity: number = 0;
  public jumpDuration: number = 0;
  public slideTimer: number = 0;
  public landingImpact: number = 0;
  private wallScrapeCooldown: number = 0;
  private readonly gravity: number = 28.0;
  private readonly jumpForce: number = 9.8;
  private readonly slideDuration: number = 0.75;

  // Powerups
  public powerups: PowerupState = {
    magnetTimer: 0,
    shieldActive: false,
    boostTimer: 0,
  };

  // Turn state & input buffer
  private queuedTurn: 'left' | 'right' | null = null;
  private lastTurnSegmentId: number = -1;

  // Callbacks
  public onGameOver?: (stats: {
    distance: number;
    coins: number;
    score: number;
    reason?: string;
  }) => void;
  public onCoinPickup?: (count: number) => void;
  public onCoinAbsorb?: (worldPos: THREE.Vector3) => void;
  public onPowerupPickup?: (type: string) => void;
  public onLanding?: (worldPos: THREE.Vector3) => void;
  public onWallImpact?: (worldPos: THREE.Vector3, heavy: boolean) => void;

  constructor(
    model: AdventurerModel,
    trackManager: TrackManager
  ) {
    this.model = model;
    this.trackManager = trackManager;
    this.reset();
  }

  public reset() {
    this.position.set(0, 0, 0);
    this.headingAngle = 0;
    this.currentLane = 0;
    this.targetLaneX = 0;
    this.currentLaneX = 0;
    this.currentSpeed = this.baseSpeed;
    this.state = 'run';
    this.verticalVelocity = 0;
    this.slideTimer = 0;
    this.landingImpact = 0;
    this.wallScrapeCooldown = 0;
    this.distanceRun = 0;
    this.coinsCollected = 0;
    this.score = 0;
    this.queuedTurn = null;
    this.lastTurnSegmentId = -1;

    this.powerups = {
      magnetTimer: 0,
      shieldActive: false,
      boostTimer: 0,
    };

    this.model.group.position.set(0, 0, 0);
    this.model.group.rotation.set(0, 0, 0);
    this.model.group.scale.set(1, 1, 1);
  }

  private emitWallScrape(sideSign: -1 | 1) {
    if (this.wallScrapeCooldown > 0) return;
    this.wallScrapeCooldown = 0.35;
    const wallX = sideSign * (this.trackManager.trackWidth * 0.5 + 0.05);
    _wallImpactPos.set(wallX, Math.max(0.7, this.position.y + 0.9), this.position.z);
    sound.playStoneExplosion(false);
    this.onWallImpact?.(_wallImpactPos, false);
  }

  // --- Input Handlers ---
  public moveLeft() {
    if (this.state === 'fall' || this.state === 'dead') return;
    if (this.currentLane > -1) {
      this.currentLane--;
      this.targetLaneX = this.currentLane * this.trackManager.laneOffset;
      sound.playTurn();
    } else {
      this.targetLaneX = -this.trackManager.laneOffset;
      this.emitWallScrape(-1);
    }
  }

  public moveRight() {
    if (this.state === 'fall' || this.state === 'dead') return;
    if (this.currentLane < 1) {
      this.currentLane++;
      this.targetLaneX = this.currentLane * this.trackManager.laneOffset;
      sound.playTurn();
    } else {
      this.targetLaneX = this.trackManager.laneOffset;
      this.emitWallScrape(1);
    }
  }

  // Smooth lateral steering with mouse wheel scroll left/right or trackpad
  public steer(deltaX: number) {
    if (this.state === 'fall' || this.state === 'dead') return;
    const maxOffset = this.trackManager.laneOffset;
    const rawTarget = this.targetLaneX + deltaX;
    if (Math.abs(rawTarget) > maxOffset + 0.08) {
      this.emitWallScrape(rawTarget < 0 ? -1 : 1);
    }
    this.targetLaneX = Math.max(-maxOffset, Math.min(maxOffset, rawTarget));
    if (this.targetLaneX < -maxOffset * 0.5) {
      this.currentLane = -1;
    } else if (this.targetLaneX > maxOffset * 0.5) {
      this.currentLane = 1;
    } else {
      this.currentLane = 0;
    }
  }

  public turnLeft() {
    this.moveLeft();
  }

  public turnRight() {
    this.moveRight();
  }

  public jump() {
    if (this.state === 'fall' || this.state === 'dead') return;
    if (this.state === 'run' || this.state === 'slide') {
      this.state = 'jump';
      this.verticalVelocity = this.jumpForce;
      this.slideTimer = 0;
      sound.playJump();
    }
  }

  public slide() {
    if (this.state === 'fall' || this.state === 'dead') return;
    if (this.state === 'run' || this.state === 'jump') {
      this.state = 'slide';
      this.slideTimer = this.slideDuration;
      // Fast drop if jumping
      if (this.verticalVelocity > 0) this.verticalVelocity = -4;
      sound.playSlide();
    }
  }

  // --- Main Update Loop ---
  public update(dt: number, time: number) {
    if (this.state === 'dead') return;

    // Handle Fall State
    if (this.state === 'fall') {
      this.position.y -= this.gravity * 0.7 * dt;
      this.model.group.position.copy(this.position);
      this.model.updateAnimation(time, this.currentSpeed, 'fall');

      if (this.position.y < -14) {
        this.state = 'dead';
        this.onGameOver?.({
          distance: Math.floor(this.distanceRun),
          coins: this.coinsCollected,
          score: Math.floor(this.score),
        });
      }
      return;
    }

    // Speed progression: speed increases by 0.1 m/s every 8 seconds, capped at 22 m/s
    const boostMult = this.powerups.boostTimer > 0 ? 1.4 : 1.0;
    this.currentSpeed = Math.min(22, (this.baseSpeed + (this.distanceRun / 100) * 0.8) * boostMult);

    if (this.powerups.boostTimer > 0) {
      this.powerups.boostTimer = Math.max(0, this.powerups.boostTimer - dt);
    }
    if (this.powerups.magnetTimer > 0) {
      this.powerups.magnetTimer = Math.max(0, this.powerups.magnetTimer - dt);
    }
    if (this.wallScrapeCooldown > 0) {
      this.wallScrapeCooldown = Math.max(0, this.wallScrapeCooldown - dt);
    }
    if (this.landingImpact > 0) {
      this.landingImpact = Math.max(0, this.landingImpact - dt / 0.28);
    }

    // 1. Forward Movement along current heading
    const moveDist = this.currentSpeed * dt;
    this.distanceRun += moveDist;

    _forwardDir.set(Math.sin(this.headingAngle), 0, Math.cos(this.headingAngle));
    this.position.addScaledVector(_forwardDir, moveDist);

    // 2. Lateral Lane Transition (smooth spring damping)
    this.currentLaneX += (this.targetLaneX - this.currentLaneX) * Math.min(1, dt * 14);

    // Compute side vector (perpendicular to forward)
    _sideDir.set(Math.cos(this.headingAngle), 0, -Math.sin(this.headingAngle));
    _renderPos.copy(this.position).addScaledVector(_sideDir, this.currentLaneX);

    // 3. Jump Physics & Touchdown Impact
    if (this.state === 'jump') {
      this.position.y += this.verticalVelocity * dt;
      this.verticalVelocity -= this.gravity * dt;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        this.state = 'run';
        this.landingImpact = 1.0;
        _renderPos.y = 0;
        sound.playLand();
        this.onLanding?.(_renderPos);
      }
    }

    // 4. Slide Duration (and fast-drop slam landing if triggered mid-air)
    if (this.state === 'slide') {
      if (this.position.y > 0) {
        this.position.y += this.verticalVelocity * dt;
        this.verticalVelocity -= this.gravity * 1.45 * dt;
        if (this.position.y <= 0) {
          this.position.y = 0;
          this.verticalVelocity = 0;
          this.landingImpact = 1.0;
          _renderPos.y = 0;
          sound.playLand();
          this.onLanding?.(_renderPos);
        }
      }
      this.slideTimer -= dt;
      if (this.slideTimer <= 0 && this.position.y <= 0) {
        this.state = 'run';
      }
    }

    // 5. Update Model Position & Rotation
    _renderPos.y = this.position.y;
    this.model.group.position.copy(_renderPos);
    this.model.group.rotation.y = this.headingAngle;
    this.model.updateAnimation(
      time,
      this.currentSpeed,
      this.state,
      this.landingImpact,
      this.verticalVelocity
    );

    // 6. Track Boundaries
    this.checkTrackBounds();

    // 8. Dollar Coin Pickups & Magnet Effect
    this.handleCoins(_renderPos, dt);

    // 9. Obstacle Collisions
    this.handleObstacles(_renderPos);
  }

  // Safe track bounds check
  private checkTrackBounds() {
    // Keep player within ticker tape boundaries
    const halfWidth = this.trackManager.trackWidth * 0.5 - 0.2;
    if (Math.abs(this.currentLaneX) > halfWidth) {
      this.currentLaneX = Math.sign(this.currentLaneX) * halfWidth;
      this.targetLaneX = this.currentLaneX;
    }
  }

  // Coin Collection, Magnetic Pull & 3D Absorption Effect
  private handleCoins(playerPos: THREE.Vector3, dt: number) {
    const pullRadius = this.powerups.magnetTimer > 0 ? 12.0 : 2.5;
    _absorbTarget.set(playerPos.x, playerPos.y + 1.05, playerPos.z);

    for (const coin of this.trackManager.coins) {
      if (coin.absorbing) {
        coin.absorbProgress += dt / 0.28;
        if (coin.absorbProgress >= 1) {
          coin.absorbing = false;
          coin.mesh.visible = false;
          coin.mesh.scale.set(1, 1, 1);
        } else {
          const t = coin.absorbProgress;
          const ease = t * t * (3 - 2 * t);
          coin.worldPos.lerpVectors(coin.absorbStartPos, _absorbTarget, ease);
          // Tight golden spiral inward toward player's chest
          const spiralAmp = (1 - t) * 0.36;
          coin.worldPos.x += Math.cos(t * Math.PI * 3.5) * spiralAmp;
          coin.worldPos.y += Math.sin(t * Math.PI * 3.5) * spiralAmp * 0.65;

          _localCoinPos.copy(coin.worldPos);
          coin.segmentGroup.worldToLocal(_localCoinPos);
          coin.mesh.position.copy(_localCoinPos);
          coin.mesh.rotation.z += dt * 26;
          coin.mesh.rotation.y += dt * 14;

          const scale =
            t < 0.22
              ? 1.0 + (t / 0.22) * 0.28
              : Math.max(0.02, 1.28 * (1 - (t - 0.22) / 0.78));
          coin.mesh.scale.set(scale, scale, scale);
        }
        continue;
      }

      if (coin.collected) continue;

      const dist = coin.worldPos.distanceTo(playerPos);
      if (dist < pullRadius) {
        if (dist > 1.35) {
          // Pull coin smoothly toward player torso in accurate local segment space
          const pullRate = this.powerups.magnetTimer > 0 ? 11 : 7;
          coin.worldPos.lerp(_absorbTarget, Math.min(1, dt * pullRate));
          _localCoinPos.copy(coin.worldPos);
          coin.segmentGroup.worldToLocal(_localCoinPos);
          coin.mesh.position.copy(_localCoinPos);
        } else {
          // Collected — begin absorption effect into runner!
          coin.collected = true;
          coin.absorbing = true;
          coin.absorbProgress = 0;
          coin.absorbStartPos.copy(coin.worldPos);

          this.coinsCollected++;
          this.score += 1;
          sound.playCoin();
          this.onCoinPickup?.(this.coinsCollected);
          this.onCoinAbsorb?.(coin.worldPos);

          // Every 25 coins, give a chance for a magnet or shield powerup
          if (this.coinsCollected % 25 === 0) {
            if (Math.random() < 0.5) {
              this.powerups.magnetTimer = 10;
              sound.playPowerup();
              this.onPowerupPickup?.('Coin Magnet Active (10s)!');
            } else {
              this.powerups.shieldActive = true;
              sound.playPowerup();
              this.onPowerupPickup?.('Temple Shield Active!');
            }
          }
        }
      }
    }
  }

  // Obstacle Collision Detection
  private handleObstacles(playerPos: THREE.Vector3) {
    if (this.powerups.boostTimer > 0) return; // Invincible while boosting

    for (const obs of this.trackManager.obstacles) {
      if (obs.cleared) continue;

      const dist = obs.worldPos.distanceTo(playerPos);
      if (dist < 1.6) {
        let isHit = false;

        if (obs.type === 'tree') {
          // Tree hurdle is low to ground: requires jumping! If player is below 0.65m, hit!
          if (this.position.y < 0.65) {
            isHit = true;
          } else {
            obs.cleared = true; // successfully cleared
          }
        }

        if (isHit) {
          if (this.powerups.shieldActive) {
            // Shield absorbs the blow & shatters obstacle
            this.powerups.shieldActive = false;
            obs.cleared = true;
            obs.group.visible = false;
            _wallImpactPos.copy(obs.worldPos);
            _wallImpactPos.y = 1.05;
            sound.playStoneExplosion(false);
            this.onWallImpact?.(_wallImpactPos, false);
            this.onPowerupPickup?.('Shield Destroyed! Careful!');
          } else {
            // Crash with Stone Explosion & Game Over!
            obs.cleared = true;
            obs.group.visible = false;
            _wallImpactPos.copy(obs.worldPos);
            _wallImpactPos.y = 1.15;
            this.die(undefined, _wallImpactPos);
          }
        }
      }
    }
  }

  public triggerFall() {
    if (this.state === 'fall' || this.state === 'dead') return;
    this.state = 'fall';
    sound.playFall();
  }

  public die(reason?: string, impactPos?: THREE.Vector3) {
    if (this.state === 'dead') return;
    this.state = 'dead';
    _wallImpactPos.copy(impactPos ?? this.model.group.position);
    if (!impactPos) {
      _wallImpactPos.y += 1.1;
      _wallImpactPos.z += 0.9;
    }
    sound.playStoneExplosion(true);
    this.onWallImpact?.(_wallImpactPos, true);
    this.onGameOver?.({
      distance: Math.floor(this.distanceRun),
      coins: this.coinsCollected,
      score: Math.floor(this.score),
      reason,
    });
  }
}
