import * as THREE from 'three';

export class ShootingManager {
  constructor(scene, vehicle, trackBuilder, scoringManager, uiManager, audioManager) {
    this.scene = scene;
    this.vehicle = vehicle;
    this.trackBuilder = trackBuilder;
    this.scoringManager = scoringManager;
    this.uiManager = uiManager;
    this.audioManager = audioManager;

    this.isInShootingZone = false;
    this.chargePower = 0;
    this.maxCharge = 1;
    this.chargeRate = 0.5;
    this.isCharging = false;
    this.hasShotBall = false;
    this.shotBall = null;
    this.ballVelocity = new THREE.Vector3();
  }

  update(delta, input) {
    const targetBall = this.trackBuilder.getTargetBall();
    if (!targetBall) return;

    const vehiclePos = this.vehicle.getPosition();
    const vehicleSpeed = this.vehicle.getSpeed();

    // Check if in shooting zone (raised platform on left)
    const targetPlatformPos = new THREE.Vector3(-25, 1.5, -165);
    const distanceToPlatform = vehiclePos.distanceTo(targetPlatformPos);
    this.isInShootingZone = distanceToPlatform < 30;

    // Pick up ball (only if haven't shot yet)
    if (
      !this.vehicle.getAttachedItem() &&
      !this.hasShotBall &&  // Prevent picking up after shooting
      targetBall.visible &&
      vehicleSpeed < 40  // Increased threshold for higher max speed (150)
    ) {
      const distance = vehiclePos.distanceTo(targetBall.position);
      if (distance < 8) {  // Increased for higher speeds
        this.vehicle.attachItem(targetBall);
        this.audioManager.playSound('pickup');
        this.scoringManager.addObjective('ball-picked');
        this.scoringManager.setObjective('Charge and shoot the ball at the target (hold SPACE)');
      }
    }

    // Handle charging
    if (
      this.vehicle.getAttachedItem() === targetBall &&
      this.isInShootingZone
    ) {
      this.uiManager.showChargeBar();

      if (input.space && !this.isCharging) {
        this.isCharging = true;
        this.chargePower = 0;
      }

      if (this.isCharging && input.space) {
        this.chargePower += this.chargeRate * delta;
        this.chargePower = Math.min(this.chargePower, this.maxCharge);
        this.uiManager.updateChargeBar(this.chargePower / this.maxCharge);
      }

      if (this.isCharging && !input.space) {
        this.shootBall();
      }
    } else {
      this.uiManager.hideChargeBar();
    }

    // Update shot ball physics
    if (this.shotBall) {
      // Apply gravity
      this.ballVelocity.y += -9.8 * delta;

      // Apply air resistance (damping) to horizontal velocity
      this.ballVelocity.x *= 0.99;
      this.ballVelocity.z *= 0.99;

      // Update position
      this.shotBall.position.add(
        this.ballVelocity.clone().multiplyScalar(delta)
      );

      // Rotate ball while in air for visual effect
      this.shotBall.rotation.x += delta * 5;
      this.shotBall.rotation.z += delta * 3;

      // Check if ball landed (at platform height or ground level)
      if (this.shotBall.position.y <= 2.3) {
        this.checkShotAccuracy();
      }
    }

    // Animate ball if not picked up
    if (targetBall.visible && !this.vehicle.getAttachedItem()) {
      targetBall.rotation.y += delta;
      targetBall.position.y = 3.2 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  }

  shootBall() {
    const ball = this.vehicle.detachItem();
    this.shotBall = ball;
    this.isCharging = false;
    this.hasShotBall = true;

    // Calculate shot direction and power
    const targetCenter = this.trackBuilder.getTargetCenter();
    const vehiclePos = this.vehicle.getPosition();

    const direction = new THREE.Vector3()
      .subVectors(targetCenter, vehiclePos)
      .normalize();

    // Power based on charge (0 to 1)
    const power = 8 + this.chargePower * 12; // Reduced power range

    this.ballVelocity.copy(direction.multiplyScalar(power));
    this.ballVelocity.y = 4 + this.chargePower * 6; // Arc height based on charge

    // Store initial velocity to apply friction/damping
    this.ballInitialSpeed = this.ballVelocity.length();

    this.audioManager.playSound('shoot');
    this.uiManager.hideChargeBar();
    this.uiManager.updateChargeBar(0);
    this.chargePower = 0;
  }

  checkShotAccuracy() {
    if (!this.shotBall) return;

    const targetCenter = this.trackBuilder.getTargetCenter();
    const distance = this.shotBall.position.distanceTo(targetCenter);

    let score = 0;
    let zone = '';

    if (distance < 1.5) {
      score = 20;
      zone = 'bullseye';
    } else if (distance < 3) {
      score = 10;
      zone = 'middle';
    } else if (distance < 4) {
      score = 5;
      zone = 'outer';
    }

    if (score > 0) {
      this.scoringManager.addScore(score);
      this.audioManager.playAnnouncement('Nice shot!');
    }

    // Mark as completed - only happens once
    if (!this.scoringManager.getCompletedSections().includes('target-shot')) {
      this.scoringManager.addObjective('target-shot');
      this.scoringManager.setObjective('Return to the finish line (green platform near start)');
    }

    // Keep ball visible where it landed
    this.shotBall.position.y = 3.2;
    this.shotBall.rotation.set(0, 0, 0); // Reset rotation
    this.shotBall = null;

    // Hide charge bar permanently after shooting
    this.uiManager.hideChargeBar();
  }

  reset() {
    this.isInShootingZone = false;
    this.chargePower = 0;
    this.isCharging = false;
    this.hasShotBall = false;
    this.shotBall = null;
    this.ballVelocity.set(0, 0, 0);
    this.uiManager.hideChargeBar();
  }

  isBallInFlight() {
    return this.shotBall !== null;
  }

  hasShot() {
    return this.hasShotBall;
  }
}
