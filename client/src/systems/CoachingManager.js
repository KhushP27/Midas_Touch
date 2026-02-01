import * as THREE from 'three';

export class CoachingManager {
  constructor(scene, vehicle, scoringManager, audioManager, uiManager, shootingManager) {
    this.scene = scene;
    this.vehicle = vehicle;
    this.scoringManager = scoringManager;
    this.audioManager = audioManager;
    this.uiManager = uiManager;
    this.shootingManager = shootingManager;

    // Coach personality (will be set by Game)
    this.coachPersonality = 'motivational';

    // Coaching state
    this.lastCoachingTime = 0;
    this.coachingCooldown = 8000; // 8 seconds between tips
    this.periodicCoachingInterval = 15000; // 15 seconds for periodic coaching
    this.lastPeriodicCoaching = 0;
    this.isCoachingEnabled = true;

    // Performance tracking
    this.recentCollisionCount = 0;
    this.lastCollisionTime = 0;
    this.speedHistory = [];
    this.maxSpeedHistoryLength = 10;
    this.currentZone = 'start';
    this.lastZone = 'start';

    // Coaching queue
    this.coachingQueue = [];
    this.isPlayingCoaching = false;
  }

  update(delta, vehiclePos, gameTime) {
    if (!this.isCoachingEnabled) return;

    const currentTime = Date.now();

    // Track speed history
    this.trackSpeedHistory();

    // Detect zone changes
    this.detectZone(vehiclePos);

    // Check for coaching opportunities
    this.checkCoachingOpportunities(currentTime, vehiclePos);
  }

  trackSpeedHistory() {
    const speed = this.vehicle.getSpeed();
    this.speedHistory.push(speed);

    if (this.speedHistory.length > this.maxSpeedHistoryLength) {
      this.speedHistory.shift();
    }
  }

  detectZone(vehiclePos) {
    this.lastZone = this.currentZone;

    // Define zones based on z position
    if (vehiclePos.z > -30) {
      this.currentZone = 'start';
    } else if (vehiclePos.z > -40 && vehiclePos.z <= -30) {
      this.currentZone = 'junction';
    } else if (vehiclePos.x < 0) {
      // Left path
      if (vehiclePos.z > -150) {
        this.currentZone = 'left-path';
      } else {
        this.currentZone = 'platform';
      }
    } else {
      // Right path
      this.currentZone = 'right-loop';
    }
  }

  checkCoachingOpportunities(currentTime, vehiclePos) {
    const avgSpeed = this.getAverageSpeed();
    const currentSpeed = this.vehicle.getSpeed();
    const avgSpeedKMH = avgSpeed * 10;
    const currentSpeedKMH = currentSpeed * 10;

    // Priority coaching events (can interrupt cooldown if critical)
    // Event: Multiple recent collisions (critical)
    if (this.recentCollisionCount >= 2) {
      if (currentTime - this.lastCoachingTime >= this.coachingCooldown * 0.5) {
        this.requestCoaching('multiple-collisions', currentTime, vehiclePos);
        this.recentCollisionCount = 0;
        return;
      }
    }

    // Don't coach too frequently for non-critical events
    if (currentTime - this.lastCoachingTime < this.coachingCooldown) {
      return;
    }

    // Event: Zone change
    if (this.currentZone !== this.lastZone) {
      this.requestCoaching('zone-change', currentTime, vehiclePos);
      return;
    }

    // Event: Low speed in open area (start zone)
    if (this.currentZone === 'start' && avgSpeedKMH < 30 && avgSpeedKMH > 5) {
      this.requestCoaching('low-speed', currentTime, vehiclePos);
      return;
    }

    // Event: High speed near obstacles (right loop)
    if (this.currentZone === 'right-loop' && currentSpeedKMH > 80) {
      this.requestCoaching('high-speed-obstacles', currentTime, vehiclePos);
      return;
    }

    // Event: Slow progress on left path
    if (this.currentZone === 'left-path' && avgSpeedKMH < 40) {
      this.requestCoaching('slow-progress', currentTime, vehiclePos);
      return;
    }

    // Event: Good speed maintenance
    if (avgSpeedKMH > 60 && avgSpeedKMH < 90 && this.scoringManager.getCollisions() === 0) {
      this.requestCoaching('good-pace', currentTime, vehiclePos);
      return;
    }

    // Periodic coaching fallback (if no events triggered)
    if (currentTime - this.lastPeriodicCoaching >= this.periodicCoachingInterval) {
      this.requestCoaching('periodic-check', currentTime, vehiclePos);
      this.lastPeriodicCoaching = currentTime;
      return;
    }
  }

  setCoachPersonality(personality) {
    this.coachPersonality = personality;
  }

  async requestCoaching(eventType, currentTime, vehiclePos) {
    if (this.audioManager.isSpeaking && this.audioManager.isSpeaking()) {
      return;
    }

    this.lastCoachingTime = currentTime;

    // Gather context
    const context = {
      event: eventType,
      zone: this.currentZone,
      speed: this.vehicle.getSpeedKMH(),
      avgSpeed: this.getAverageSpeed() * 10,
      collisions: this.scoringManager.getCollisions(),
      recentCollisions: this.recentCollisionCount,
      objective: this.scoringManager.getCurrentObjective(),
      position: { x: vehiclePos.x, z: vehiclePos.z },
      ballInFlight: this.shootingManager.isBallInFlight(),
      hasShot: this.shootingManager.hasShot(),
      coachPersonality: this.coachPersonality
    };

    console.log('🎓 Requesting coaching for:', eventType, context);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/gemini/realtime-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ context })
      });

      const data = await response.json();

      if (data.tip) {
        console.log('💬 Coach says:', data.tip);
        // Show coaching text
        this.uiManager.showCoachingText(data.tip);
        // Play audio and hide text when audio finishes
        this.audioManager.playAnnouncement(data.tip, 'normal', () => {
          this.uiManager.hideCoachingText();
        });
      }
    } catch (error) {
      console.error('❌ Failed to get coaching:', error);
    }
  }

  getAverageSpeed() {
    if (this.speedHistory.length === 0) return 0;
    const sum = this.speedHistory.reduce((a, b) => a + b, 0);
    return sum / this.speedHistory.length;
  }

  // Called by Game when collision occurs
  onCollision() {
    const currentTime = Date.now();

    // Track recent collisions (within 10 seconds)
    if (currentTime - this.lastCollisionTime < 10000) {
      this.recentCollisionCount++;
    } else {
      this.recentCollisionCount = 1;
    }

    this.lastCollisionTime = currentTime;
  }

  // Called when player picks up item
  onPickup(itemType) {
    const currentTime = Date.now();

    // Give encouragement for pickups
    if (currentTime - this.lastCoachingTime > this.coachingCooldown) {
      const tips = [
        'Nice pickup! Keep moving!',
        'Great! Now complete your objective!',
        'Good grab! Stay focused!'
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      // Show coaching text
      this.uiManager.showCoachingText(randomTip);
      // Play audio and hide text when audio finishes
      this.audioManager.playAnnouncement(randomTip, 'normal', () => {
        this.uiManager.hideCoachingText();
      });
      this.lastCoachingTime = currentTime;
    }
  }

  // Called when approaching junction
  onApproachingJunction() {
    const currentTime = Date.now();

    if (currentTime - this.lastCoachingTime > this.coachingCooldown) {
      this.requestCoaching('approaching-junction', currentTime, this.vehicle.getPosition());
    }
  }

  reset() {
    this.lastCoachingTime = 0;
    this.lastPeriodicCoaching = 0;
    this.recentCollisionCount = 0;
    this.lastCollisionTime = 0;
    this.speedHistory = [];
    this.currentZone = 'start';
    this.lastZone = 'start';
    this.coachingQueue = [];
    this.isPlayingCoaching = false;
  }

  enable() {
    this.isCoachingEnabled = true;
  }

  disable() {
    this.isCoachingEnabled = false;
  }
}
