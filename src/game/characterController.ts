import * as THREE from 'three';
import { AdventurerModel } from './models';
import { CornerInstance, TrackManager } from './trackManager';
import { sound } from './audio';

const _absorbTarget = new THREE.Vector3();
const _localCoinPos = new THREE.Vector3();
const _forwardDir = new THREE.Vector3();
const _sideDir = new THREE.Vector3();
const _renderPos = new THREE.Vector3();
const _wallImpactPos = new THREE.Vector3();
const _wallImpactNormal = new THREE.Vector3();
const _relVec = new THREE.Vector3();
const _newForward = new THREE.Vector3();
const _newRightDir = new THREE.Vector3();

export type PlayerState = 'run' | 'jump' | 'slide' | 'fall' | 'dead';
export type CrashType = 'candlestick' | 'corner_wall';

export interface PowerupState {
  magnetTimer: number;
  shieldActive: boolean;
  boostTimer: number;
}

export interface CornerStatus {
  turnDir: 'left' | 'right';
  distToPivot: number;
  inTurnWindow: boolean;
}

export class CharacterController {
  public model: AdventurerModel;
  public trackManager: TrackManager;

  // Position & Orientation
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public headingAngle: number = 0; // Logical travel direction in radians
  public visualHeadingAngle: number = 0; // Smoothed visual & camera heading in radians
  public currentLane: number = 0; // -1 (Screen Left), 0, 1 (Screen Right)
  public targetLaneX: number = 0;
  public currentLaneX: number = 0;

  // Movement Specs
  public baseSpeed: number = 9.5;
  public speedMultiplier: number = 1.0;
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
  public laneVelocity: number = 0;
  private headingVelocity: number = 0;
  public smoothSteerBank: number = 0;
  public cornerTurnCamTimer: number = 0;
  public steerInputCount: number = 0;
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

  // Callbacks
  public onGameOver?: (stats: {
    distance: number;
    coins: number;
    score: number;
    reason?: string;
    crashType?: CrashType;
    impactPos?: THREE.Vector3;
    impactNormal?: THREE.Vector3;
  }) => void;
  public onCoinPickup?: (count: number) => void;
  public onCoinAbsorb?: (worldPos: THREE.Vector3) => void;
  public onPowerupPickup?: (type: string) => void;
  public onLanding?: (worldPos: THREE.Vector3) => void;
  public onWallImpact?: (worldPos: THREE.Vector3, heavy: boolean) => void;
  public onCornerWallCrash?: (impactPos: THREE.Vector3, impactNormal: THREE.Vector3) => void;
  public onCornerCleared?: (turnDir: 'left' | 'right') => void;

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
    this.visualHeadingAngle = 0;
    this.currentLane = 0;
    this.targetLaneX = 0;
    this.currentLaneX = 0;
    this.speedMultiplier = 1.0;
    this.currentSpeed = this.baseSpeed;
    this.state = 'run';
    this.verticalVelocity = 0;
    this.slideTimer = 0;
    this.landingImpact = 0;
    this.laneVelocity = 0;
    this.headingVelocity = 0;
    this.smoothSteerBank = 0;
    this.cornerTurnCamTimer = 0;
    this.steerInputCount = 0;
    this.wallScrapeCooldown = 0;
    this.distanceRun = 0;
    this.coinsCollected = 0;
    this.score = 0;

    this.powerups = {
      magnetTimer: 0,
      shieldActive: false,
      boostTimer: 0,
    };

    this.model.group.position.set(0, 0, 0);
    this.model.group.rotation.set(0, 0, 0);
    this.model.group.scale.set(1, 1, 1);
  }

  private getActiveCorner(): { corner: CornerInstance; zInCorner: number } | null {
    let best: { corner: CornerInstance; zInCorner: number } | null = null;
    for (const corner of this.trackManager.corners) {
      if (corner.cleared) continue;
      _relVec.copy(this.position).sub(corner.startPos);
      const lateral = Math.abs(_relVec.dot(corner.rightDir));
      const zInCorner = _relVec.dot(corner.forwardDir);
      if (lateral < 4.5 && zInCorner > -24 && zInCorner <= 21) {
        if (!best || Math.abs(zInCorner - 14.6) < Math.abs(best.zInCorner - 14.6)) {
          best = { corner, zInCorner };
        }
      }
    }
    return best;
  }

  public getUpcomingCornerStatus(): CornerStatus | null {
    const active = this.getActiveCorner();
    if (!active) return null;
    const { corner, zInCorner } = active;
    if (zInCorner < -18) return null;
    return {
      turnDir: corner.turnDir,
      distToPivot: Math.max(0, 16.0 - zInCorner),
      inTurnWindow: zInCorner >= corner.turnWindowMinZ && zInCorner <= corner.turnWindowMaxZ,
    };
  }

  private tryExecuteCornerTurn(inputDir: 'left' | 'right'): boolean {
    const active = this.getActiveCorner();
    if (!active) return false;
    const { corner, zInCorner } = active;

    // Outside the precise timing window: normal lane steering only
    if (zInCorner < corner.turnWindowMinZ || zInCorner > corner.turnWindowMaxZ) {
      return false;
    }

    if (inputDir === corner.turnDir) {
      // Precision 90-degree corner turn executed inside the golden zone!
      corner.cleared = true;

      _sideDir.set(-Math.cos(this.headingAngle), 0, Math.sin(this.headingAngle));
      _renderPos.copy(this.position).addScaledVector(_sideDir, this.currentLaneX);

      this.headingAngle = corner.newHeading;
      _newForward.set(Math.sin(this.headingAngle), 0, Math.cos(this.headingAngle));
      _newRightDir.set(-Math.cos(this.headingAngle), 0, Math.sin(this.headingAngle));

      _relVec.copy(_renderPos).sub(corner.pivotPos);
      const newAlong = THREE.MathUtils.clamp(_relVec.dot(_newForward), 0.1, 2.2);
      const newLateral = THREE.MathUtils.clamp(_relVec.dot(_newRightDir), -1.85, 1.85);

      this.position.copy(corner.pivotPos).addScaledVector(_newForward, newAlong);
      this.currentLaneX = newLateral;
      this.targetLaneX = 0;
      this.currentLane = 0;
      this.cornerTurnCamTimer = 0.65;
      this.score += 3;

      sound.playTurn();
      this.onCornerCleared?.(corner.turnDir);
      return true;
    }

    // Wrong turn direction inside the corner zone -> crash into closed inner Egyptian wall!
    if (zInCorner >= 12.2) {
      corner.cleared = true;
      const closedSideSign = corner.turnDir === 'left' ? 1 : -1;
      _wallImpactPos
        .copy(corner.startPos)
        .addScaledVector(corner.forwardDir, zInCorner)
        .addScaledVector(corner.rightDir, closedSideSign * 2.85);
      _wallImpactPos.y = Math.max(1.2, this.position.y + 1.15);

      _wallImpactNormal.copy(corner.rightDir).multiplyScalar(-closedSideSign);

      this.dieCornerWall(
        `WRONG CORNER TURN! Turned ${inputDir.toUpperCase()} instead of ${corner.turnDir.toUpperCase()} and slammed into the sandstone temple wall.`,
        _wallImpactPos,
        _wallImpactNormal
      );
      return true;
    }

    return false;
  }

  private emitWallScrape(sideSign: -1 | 1) {
    if (this.wallScrapeCooldown > 0) return;
    this.wallScrapeCooldown = 0.35;
    _sideDir.set(-Math.cos(this.headingAngle), 0, Math.sin(this.headingAngle));
    const wallDist = sideSign * (this.trackManager.trackWidth * 0.5 + 0.05);
    _wallImpactPos.copy(this.position).addScaledVector(_sideDir, wallDist);
    _wallImpactPos.y = Math.max(0.7, this.position.y + 0.9);
    sound.playStoneExplosion(false);
    this.onWallImpact?.(_wallImpactPos, false);
  }

  // --- Input Handlers ---
  public moveLeft() {
    if (this.state === 'fall' || this.state === 'dead') return;
    this.steerInputCount++;
    if (this.tryExecuteCornerTurn('left')) return;

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
    this.steerInputCount++;
    if (this.tryExecuteCornerTurn('right')) return;

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
    if (Math.abs(deltaX) > 0.02) {
      this.steerInputCount++;
    }
    if (Math.abs(deltaX) > 0.25) {
      if (this.tryExecuteCornerTurn(deltaX < 0 ? 'left' : 'right')) return;
    }
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

  // Vertical scroll speed adjustment (0.45x slow-cruise up to 2.25x sprint)
  public adjustSpeed(deltaMultiplier: number) {
    if (this.state === 'fall' || this.state === 'dead') return;
    this.speedMultiplier = Math.max(
      0.45,
      Math.min(2.25, Math.round((this.speedMultiplier + deltaMultiplier) * 100) / 100)
    );
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
      if (this.verticalVelocity > 0) this.verticalVelocity = -4;
      sound.playSlide();
    }
  }

  // --- Main Update Loop ---
  public update(dt: number, time: number) {
    if (this.state === 'dead') return;

    // Smooth critically-damped spring interpolation around 90-deg turns
    const headingStiff = 155;
    const headingDamp = 25;
    const headingForce = (this.headingAngle - this.visualHeadingAngle) * headingStiff - this.headingVelocity * headingDamp;
    this.headingVelocity += headingForce * dt;
    this.visualHeadingAngle += this.headingVelocity * dt;

    // Handle Fall State
    if (this.state === 'fall') {
      this.position.y -= this.gravity * 0.7 * dt;
      this.model.group.position.copy(this.position);
      this.model.updateAnimation(time, this.currentSpeed, 'fall', 0, 0, dt, 0);

      if (this.position.y < -14) {
        this.state = 'dead';
        this.onGameOver?.({
          distance: Math.floor(this.distanceRun),
          coins: this.coinsCollected,
          score: Math.floor(this.score),
          crashType: 'candlestick',
        });
      }
      return;
    }

    const boostMult = this.powerups.boostTimer > 0 ? 1.4 : 1.0;
    const naturalSpeed = Math.min(22, this.baseSpeed + (this.distanceRun / 100) * 0.8);
    const targetSpeed = Math.max(4.2, Math.min(36, naturalSpeed * this.speedMultiplier * boostMult));
    this.currentSpeed += (targetSpeed - this.currentSpeed) * (1 - Math.exp(-9 * dt));

    if (this.powerups.boostTimer > 0) {
      this.powerups.boostTimer = Math.max(0, this.powerups.boostTimer - dt);
    }
    if (this.powerups.magnetTimer > 0) {
      this.powerups.magnetTimer = Math.max(0, this.powerups.magnetTimer - dt);
    }
    if (this.wallScrapeCooldown > 0) {
      this.wallScrapeCooldown = Math.max(0, this.wallScrapeCooldown - dt);
    }
    if (this.cornerTurnCamTimer > 0) {
      this.cornerTurnCamTimer = Math.max(0, this.cornerTurnCamTimer - dt);
    }
    if (this.landingImpact > 0) {
      this.landingImpact = Math.max(0, this.landingImpact - dt / 0.28);
    }

    // 1. Forward Movement along current heading
    const moveDist = this.currentSpeed * dt;
    this.distanceRun += moveDist;

    _forwardDir.set(Math.sin(this.headingAngle), 0, Math.cos(this.headingAngle));
    this.position.addScaledVector(_forwardDir, moveDist);

    // 2. Lateral Lane Transition (critically-damped spring for silky zero-jerk weaving)
    const laneStiff = 215;
    const laneDamp = 29.3;
    const laneForce = (this.targetLaneX - this.currentLaneX) * laneStiff - this.laneVelocity * laneDamp;
    this.laneVelocity += laneForce * dt;
    this.currentLaneX += this.laneVelocity * dt;

    // Smooth bank angle driven by lateral lane weave & 90-degree turning rate
    const rawBank = Math.max(
      -0.42,
      Math.min(0.42, -this.laneVelocity * 0.044 + (this.headingAngle - this.visualHeadingAngle) * 0.34)
    );
    this.smoothSteerBank += (rawBank - this.smoothSteerBank) * (1 - Math.exp(-12 * dt));

    // Compute Screen-Right vector (perpendicular to forward: (-cos θ, 0, sin θ))
    // currentLaneX < 0 moves toward +X_local (Screen Left); currentLaneX > 0 moves toward -X_local (Screen Right)
    _sideDir.set(-Math.cos(this.headingAngle), 0, Math.sin(this.headingAngle));
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

    // 4. Slide Duration
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

    // 5. Update Model Position & Smoothed Rotation
    _renderPos.y = this.position.y;
    this.model.group.position.copy(_renderPos);
    this.model.group.rotation.y = this.visualHeadingAngle;
    this.model.updateAnimation(
      time,
      this.currentSpeed,
      this.state,
      this.landingImpact,
      this.verticalVelocity,
      dt,
      this.smoothSteerBank
    );

    // 6. Track Boundaries
    this.checkTrackBounds();

    // 7. Check Missed 90-Degree Corner Wall Crash!
    const activeCorner = this.getActiveCorner();
    if (activeCorner && activeCorner.zInCorner >= activeCorner.corner.wallCrashZ) {
      const { corner } = activeCorner;
      corner.cleared = true;
      _wallImpactPos
        .copy(corner.startPos)
        .addScaledVector(corner.forwardDir, 18.7)
        .addScaledVector(corner.rightDir, this.currentLaneX * 0.45);
      _wallImpactPos.y = Math.max(1.25, this.position.y + 1.25);

      _wallImpactNormal.copy(corner.forwardDir).negate();

      this.dieCornerWall(
        `MISSED THE ${corner.turnDir.toUpperCase()} CORNER TURN! You failed to turn inside the golden timing zone and smashed head-on into the temple wall.`,
        _wallImpactPos,
        _wallImpactNormal
      );
      return;
    }

    // 8. Dollar Coin Pickups & Magnet Effect
    this.handleCoins(_renderPos, dt);

    // 9. Obstacle Collisions
    this.handleObstacles(_renderPos);
  }

  private checkTrackBounds() {
    const halfWidth = this.trackManager.trackWidth * 0.5 - 0.2;
    if (Math.abs(this.currentLaneX) > halfWidth) {
      this.currentLaneX = Math.sign(this.currentLaneX) * halfWidth;
      this.targetLaneX = this.currentLaneX;
    }
  }

  private handleCoins(playerPos: THREE.Vector3, dt: number) {
    // Early magnetic attraction so coins visibly lift and curve into the runner well before impact
    const magnetActive = this.powerups.magnetTimer > 0;
    const pullRadius = magnetActive ? 15.0 : 6.4;
    _absorbTarget.set(playerPos.x, playerPos.y + 1.05, playerPos.z);

    for (const coin of this.trackManager.coins) {
      if (coin.absorbing) {
        coin.absorbProgress += dt / 0.2;
        if (coin.absorbProgress >= 1) {
          coin.absorbing = false;
          coin.magnetPull = 0;
          coin.mesh.visible = false;
          coin.mesh.scale.set(1, 1, 1);
        } else {
          const t = coin.absorbProgress;
          // Rapid magnetic snap-in acceleration right into the chest core
          const ease = t * t * (2.6 - 1.6 * t);
          coin.worldPos.lerpVectors(coin.absorbStartPos, _absorbTarget, ease);
          const spiralAmp = (1 - t) * 0.2;
          coin.worldPos.x += Math.cos(t * Math.PI * 3.0) * spiralAmp;
          coin.worldPos.y += Math.sin(t * Math.PI * 3.0) * spiralAmp * 0.5;

          _localCoinPos.copy(coin.worldPos);
          coin.segmentGroup.worldToLocal(_localCoinPos);
          coin.mesh.position.copy(_localCoinPos);

          const scale =
            t < 0.25
              ? 1.12 + (t / 0.25) * 0.14
              : Math.max(0.02, 1.26 * (1 - (t - 0.25) / 0.75));
          coin.mesh.scale.set(scale, scale, scale);
        }
        continue;
      }

      if (coin.collected) {
        coin.magnetPull = 0;
        continue;
      }

      const dist = coin.worldPos.distanceTo(_absorbTarget);
      if (dist < pullRadius) {
        if (dist > 1.15) {
          const prox = THREE.MathUtils.clamp(
            1 - (dist - 1.15) / Math.max(0.1, pullRadius - 1.15),
            0,
            1
          );
          coin.magnetPull = Math.max(0.16, prox);

          // Inverse-square magnetic acceleration: gentle early lift -> fast final snap
          const pullSpeed = magnetActive
            ? 15.0 + prox * prox * 36.0
            : 8.2 + prox * prox * 28.0;
          const step = Math.min(dist, pullSpeed * dt);

          _relVec.copy(_absorbTarget).sub(coin.worldPos).normalize();
          coin.worldPos.addScaledVector(_relVec, step);
          // Slight magnetic lift so floor coins arc off the ground early
          coin.worldPos.y += (1 - prox) * Math.min(0.4, (_absorbTarget.y - coin.worldPos.y)) * dt * 2.5;

          _localCoinPos.copy(coin.worldPos);
          coin.segmentGroup.worldToLocal(_localCoinPos);
          coin.mesh.position.copy(_localCoinPos);

          const magScale = 1 + prox * 0.16;
          coin.mesh.scale.set(magScale, magScale, magScale);
        } else {
          coin.collected = true;
          coin.absorbing = true;
          coin.absorbProgress = 0;
          coin.magnetPull = 1.0;
          coin.absorbStartPos.copy(coin.worldPos);

          this.coinsCollected++;
          this.score += 1;
          sound.playCoin();
          this.onCoinPickup?.(this.coinsCollected);
          this.onCoinAbsorb?.(coin.worldPos);

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
      } else {
        coin.magnetPull = 0;
      }
    }
  }

  private handleObstacles(playerPos: THREE.Vector3) {
    if (this.powerups.boostTimer > 0) return;

    for (const obs of this.trackManager.obstacles) {
      if (obs.cleared) continue;

      const dist = obs.worldPos.distanceTo(playerPos);
      if (dist < 1.6) {
        let isHit = false;

        if (obs.type === 'tree') {
          if (this.position.y < 0.65) {
            isHit = true;
          } else {
            obs.cleared = true;
          }
        }

        if (isHit) {
          if (this.powerups.shieldActive) {
            this.powerups.shieldActive = false;
            obs.cleared = true;
            obs.group.visible = false;
            _wallImpactPos.copy(obs.worldPos);
            _wallImpactPos.y = 1.05;
            sound.playStoneExplosion(false);
            this.onWallImpact?.(_wallImpactPos, false);
            this.onPowerupPickup?.('Shield Destroyed! Careful!');
          } else {
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

  public dieCornerWall(reason: string, impactPos: THREE.Vector3, impactNormal: THREE.Vector3) {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.onCornerWallCrash?.(impactPos, impactNormal);
    this.onGameOver?.({
      distance: Math.floor(this.distanceRun),
      coins: this.coinsCollected,
      score: Math.floor(this.score),
      reason,
      crashType: 'corner_wall',
      impactPos: impactPos.clone(),
      impactNormal: impactNormal.clone(),
    });
  }

  public die(reason?: string, impactPos?: THREE.Vector3) {
    if (this.state === 'dead') return;
    this.state = 'dead';
    _wallImpactPos.copy(impactPos ?? this.model.group.position);
    if (!impactPos) {
      _wallImpactPos.y += 1.1;
      _wallImpactPos.x += Math.sin(this.headingAngle) * 0.9;
      _wallImpactPos.z += Math.cos(this.headingAngle) * 0.9;
    }
    sound.playStoneExplosion(true);
    this.onWallImpact?.(_wallImpactPos, true);
    this.onGameOver?.({
      distance: Math.floor(this.distanceRun),
      coins: this.coinsCollected,
      score: Math.floor(this.score),
      reason,
      crashType: 'candlestick',
      impactPos: _wallImpactPos.clone(),
    });
  }
}
