import * as THREE from 'three';
import { AdventurerModel, SpiderModel } from './models';
import { TrackManager, ObstacleInstance, CoinInstance } from './trackManager';
import { sound } from './audio';

export type PlayerState = 'run' | 'jump' | 'slide' | 'fall' | 'dead';

export interface PowerupState {
  magnetTimer: number; // seconds remaining
  shieldActive: boolean;
  boostTimer: number;
}

export class CharacterController {
  public model: AdventurerModel;
  public spider: SpiderModel;
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
  public onGameOver?: (stats: { distance: number; coins: number; score: number }) => void;
  public onCoinPickup?: (count: number) => void;
  public onPowerupPickup?: (type: string) => void;

  constructor(
    model: AdventurerModel,
    spider: SpiderModel,
    trackManager: TrackManager
  ) {
    this.model = model;
    this.spider = spider;
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

    // Spider placement behind player
    this.spider.group.position.set(0, 0, -4.5);
    this.spider.group.rotation.set(0, 0, 0);
  }

  // --- Input Handlers ---
  public moveLeft() {
    if (this.state === 'fall' || this.state === 'dead') return;
    if (this.currentLane > -1) {
      this.currentLane--;
      this.targetLaneX = this.currentLane * this.trackManager.laneOffset;
      sound.playTurn();
    }
  }

  public moveRight() {
    if (this.state === 'fall' || this.state === 'dead') return;
    if (this.currentLane < 1) {
      this.currentLane++;
      this.targetLaneX = this.currentLane * this.trackManager.laneOffset;
      sound.playTurn();
    }
  }

  public turnLeft() {
    if (this.state === 'fall' || this.state === 'dead') return;
    this.queuedTurn = 'left';
    this.checkTurnExecution();
  }

  public turnRight() {
    if (this.state === 'fall' || this.state === 'dead') return;
    this.queuedTurn = 'right';
    this.checkTurnExecution();
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

  // Turn execution check: checks if player is near a junction trigger
  private checkTurnExecution(): boolean {
    if (!this.queuedTurn) return false;

    // Search nearby track segment with turn opportunity
    for (const seg of this.trackManager.segments) {
      if (seg.hasTurnOpportunity && seg.id !== this.lastTurnSegmentId) {
        const distToTrigger = this.position.distanceTo(seg.turnTriggerPos);

        // Turn acceptance window: within 4.5m of the turn center
        if (distToTrigger < 4.8) {
          const desired = this.queuedTurn;
          const allowed = seg.turnDirection;

          if (allowed === 'both' || allowed === desired) {
            // Execute 90-degree turn!
            const turnAngle = desired === 'left' ? Math.PI / 2 : -Math.PI / 2;
            this.headingAngle += turnAngle;

            // Snap forward position cleanly onto the turn trigger center
            this.position.x = seg.turnTriggerPos.x;
            this.position.z = seg.turnTriggerPos.z;

            // Reset lane offset
            this.currentLane = 0;
            this.targetLaneX = 0;
            this.currentLaneX = 0;

            this.lastTurnSegmentId = seg.id;
            this.queuedTurn = null;
            sound.playTurn();
            return true;
          }
        }
      }
    }

    return false;
  }

  // --- Main Update Loop ---
  public update(dt: number, time: number) {
    if (this.state === 'dead') return;

    // Handle Fall State
    if (this.state === 'fall') {
      this.position.y -= this.gravity * 0.7 * dt;
      this.model.group.position.copy(this.position);
      this.model.updateAnimation(time, this.currentSpeed, 'fall');

      // Spider lunges down/forward
      this.spider.group.position.lerp(this.position, dt * 2.5);
      this.spider.updateAnimation(time, this.currentSpeed, true);

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

    // 1. Forward Movement along current heading
    const moveDist = this.currentSpeed * dt;
    this.distanceRun += moveDist;
    this.score += moveDist * (1 + (this.coinsCollected * 0.05));

    const forwardDir = new THREE.Vector3(
      Math.sin(this.headingAngle),
      0,
      Math.cos(this.headingAngle)
    );
    this.position.addScaledVector(forwardDir, moveDist);

    // 2. Lateral Lane Transition (smooth spring damping)
    this.currentLaneX += (this.targetLaneX - this.currentLaneX) * Math.min(1, dt * 14);

    // Compute side vector (perpendicular to forward)
    const sideDir = new THREE.Vector3(
      Math.cos(this.headingAngle),
      0,
      -Math.sin(this.headingAngle)
    );
    const renderPos = this.position.clone().addScaledVector(sideDir, this.currentLaneX);

    // 3. Jump Physics
    if (this.state === 'jump') {
      this.position.y += this.verticalVelocity * dt;
      this.verticalVelocity -= this.gravity * dt;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        this.state = 'run';
      }
    }

    // 4. Slide Duration
    if (this.state === 'slide') {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.state = 'run';
      }
    }

    // 5. Update Model Position & Rotation
    renderPos.y = this.position.y;
    this.model.group.position.copy(renderPos);
    this.model.group.rotation.y = this.headingAngle;
    this.model.updateAnimation(time, this.currentSpeed, this.state);

    // 6. Update Chasing Demon Spider Position & Animation
    // Spider stays ~4.2 meters behind runner along forward vector
    const spiderTarget = this.position.clone().addScaledVector(forwardDir, -4.2);
    this.spider.group.position.lerp(spiderTarget, dt * 10);
    this.spider.group.rotation.y = this.headingAngle;
    this.spider.updateAnimation(time, this.currentSpeed, false);

    // 7. Check Turn Opportunity Window
    if (this.queuedTurn) {
      this.checkTurnExecution();
    }

    // 8. Track Boundaries & Abyss Check
    this.checkTrackBounds();

    // 9. Coin Pickups & Magnet Effect
    this.handleCoins(renderPos, dt);

    // 10. Obstacle Collisions
    this.handleObstacles(renderPos);
  }

  // Check if player walked off track or ran past a turn junction without turning
  private checkTrackBounds() {
    // Check if player missed a mandatory turn
    for (const seg of this.trackManager.segments) {
      if (seg.hasTurnOpportunity && seg.id !== this.lastTurnSegmentId) {
        // If player passed more than 3.5m beyond the turn trigger position without turning
        const forwardVector = new THREE.Vector3(Math.sin(seg.headingAngle), 0, Math.cos(seg.headingAngle));
        const delta = this.position.clone().sub(seg.turnTriggerPos);
        const dot = delta.dot(forwardVector);

        if (dot > 3.6 && this.headingAngle === seg.headingAngle) {
          // Missed turn! Plunge into the mist!
          this.triggerFall();
          return;
        }
      }
    }
  }

  // Coin Collection & Magnet Logic
  private handleCoins(playerPos: THREE.Vector3, dt: number) {
    const magnetRadius = this.powerups.magnetTimer > 0 ? 12.0 : 1.4;

    for (const coin of this.trackManager.coins) {
      if (coin.collected) continue;

      const dist = coin.worldPos.distanceTo(playerPos);
      if (dist < magnetRadius) {
        if (this.powerups.magnetTimer > 0 && dist > 1.4) {
          // Pull coin smoothly toward player
          coin.worldPos.lerp(playerPos, dt * 10);
          coin.mesh.position.copy(coin.worldPos);
        } else {
          // Collected!
          coin.collected = true;
          coin.mesh.visible = false;
          this.coinsCollected++;
          this.score += 150;
          sound.playCoin();
          this.onCoinPickup?.(this.coinsCollected);

          // Every 30 coins, give a chance for a magnet or shield powerup
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
          // Tree is low to ground: requires jumping! If player is below 0.65m, hit!
          if (this.position.y < 0.65) {
            isHit = true;
          } else {
            obs.cleared = true; // successfully cleared
          }
        } else if (obs.type === 'gate') {
          // Gate is high arch: requires sliding! If player is NOT sliding, hit!
          if (this.state !== 'slide') {
            isHit = true;
          } else {
            obs.cleared = true;
          }
        }

        if (isHit) {
          if (this.powerups.shieldActive) {
            // Shield absorbs the blow!
            this.powerups.shieldActive = false;
            obs.cleared = true;
            sound.playCrash();
            this.onPowerupPickup?.('Shield Destroyed! Careful!');
          } else {
            // Crash & Game Over!
            sound.playCrash();
            sound.playSpiderRoar();
            this.state = 'dead';
            this.onGameOver?.({
              distance: Math.floor(this.distanceRun),
              coins: this.coinsCollected,
              score: Math.floor(this.score),
            });
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
}
