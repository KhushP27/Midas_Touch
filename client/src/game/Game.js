import * as THREE from 'three';
import { Vehicle } from '../systems/Vehicle.js';
import { InputManager } from '../systems/InputManager.js';
import { PhysicsManager } from '../systems/PhysicsManager.js';
import { PickupManager } from '../systems/PickupManager.js';
import { ShootingManager } from '../systems/ShootingManager.js';
import { ScoringManager } from '../systems/ScoringManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { SnowParticles } from '../systems/SnowParticles.js';
import { TrackBuilder } from './TrackBuilder.js';
import { CoachingManager } from '../systems/CoachingManager.js';

export class Game {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.canvas = document.getElementById('game-canvas');

    // Three.js core
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Game systems
    this.vehicle = null;
    this.inputManager = null;
    this.physicsManager = null;
    this.pickupManager = null;
    this.shootingManager = null;
    this.scoringManager = null;
    this.audioManager = null;
    this.snowParticles = null;
    this.trackBuilder = null;
    this.coachingManager = null;

    // Game state
    this.isRacing = false;
    this.startTime = 0;
    this.gameTime = 0;

    // Car customization
    this.selectedColor = 'red';
    this.selectedWheel = 'standard';
    this.selectedCoach = 'motivational';

    // Collision audio cooldown
    this.lastCollisionSound = 0;
    this.collisionSoundCooldown = 5000; // 5 seconds in milliseconds

    // Animation
    this.clock = new THREE.Clock();
  }

  async initialize() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();

    // Build track
    this.trackBuilder = new TrackBuilder(this.scene);
    this.trackBuilder.buildTrack();

    // Initialize systems
    this.inputManager = new InputManager();
    this.physicsManager = new PhysicsManager(this.scene);
    this.audioManager = new AudioManager();
    this.scoringManager = new ScoringManager(this.uiManager);

    // Create vehicle
    this.vehicle = new Vehicle(this.scene, this.selectedColor, this.selectedWheel);

    // Initialize pickup and shooting managers
    this.pickupManager = new PickupManager(
      this.scene,
      this.vehicle,
      this.trackBuilder,
      this.scoringManager,
      this.audioManager
    );

    this.shootingManager = new ShootingManager(
      this.scene,
      this.vehicle,
      this.trackBuilder,
      this.scoringManager,
      this.uiManager,
      this.audioManager
    );

    // Real-time AI coaching
    this.coachingManager = new CoachingManager(
      this.scene,
      this.vehicle,
      this.scoringManager,
      this.audioManager,
      this.uiManager,
      this.shootingManager
    );

    // Snow particles
    this.snowParticles = new SnowParticles(this.scene);

    // Start render loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 400);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 0, 0);
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Hemisphere light for winter ambiance
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0xffffff, 0.4);
    this.scene.add(hemiLight);
  }

  setCarColor(color) {
    this.selectedColor = color;
    if (this.vehicle) {
      this.vehicle.setColor(color);
    }
  }

  setWheelType(wheelType) {
    this.selectedWheel = wheelType;
    if (this.vehicle) {
      this.vehicle.setWheelType(wheelType);
    }
  }

  setCoachPersonality(coach) {
    this.selectedCoach = coach;
    if (this.audioManager) {
      this.audioManager.setCoachPersonality(coach);
    }
    if (this.coachingManager) {
      this.coachingManager.setCoachPersonality(coach);
    }
  }

  startRace() {
    this.isRacing = true;
    this.startTime = Date.now();
    this.scoringManager.reset();
    this.pickupManager.reset();
    this.shootingManager.reset();
    this.vehicle.reset();

    // Play "Ready... Go!" announcement
    this.audioManager.playAnnouncement('Ready... Go!');
  }

  resetRace() {
    this.isRacing = false;
    this.startTime = 0;
    this.gameTime = 0;
    this.lastCollisionSound = 0;
    this.scoringManager.reset();
    this.pickupManager.reset();
    this.shootingManager.reset();
    this.coachingManager.reset();
    this.vehicle.reset();
    this.trackBuilder.reset();
  }

  finishRace() {
    this.isRacing = false;

    // Play finish announcement
    this.audioManager.playAnnouncement('Finish!');

    // Show results
    const finalTime = this.gameTime;
    const finalScore = this.scoringManager.getScore();
    const collisions = this.scoringManager.getCollisions();
    const sections = this.scoringManager.getCompletedSections();

    this.uiManager.showResults(finalTime, finalScore, collisions);

    // Get AI coach tips
    this.getAICoachTips(finalTime, finalScore, collisions, sections);
  }

  async getAICoachTips(timeMs, score, collisions, sections) {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

    try {
      console.log('📊 Requesting AI coach tips with stats:', { timeMs, score, collisions, sections });

      const response = await fetch(`${apiBase}/api/gemini/coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stats: { timeMs, score, collisions, sections },
          coachPersonality: this.selectedCoach
        })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📝 Response data:', data);

      if (data.tips && data.tips.length > 0) {
        console.log('✅ Setting AI tips:', data.tips);
        this.uiManager.setAITips(data.tips);
      } else {
        console.warn('⚠️ No tips received from API');
      }
    } catch (error) {
      console.error('❌ Failed to get AI coach tips:', error);
    }
  }

  updateCamera(delta) {
    if (!this.vehicle) return;

    const carPosition = this.vehicle.getPosition();

    // Camera offset behind and above the car
    const offset = new THREE.Vector3(0, 6, 12);

    // Rotate offset based on car rotation
    const carRotation = this.vehicle.getRotation();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation.y);

    // Target camera position
    const targetPosition = new THREE.Vector3(
      carPosition.x + offset.x,
      carPosition.y + offset.y,
      carPosition.z + offset.z
    );

    // Smooth camera movement
    this.camera.position.lerp(targetPosition, delta * 3);

    // Look at car
    const lookAtTarget = new THREE.Vector3(
      carPosition.x,
      carPosition.y + 1,
      carPosition.z
    );
    this.camera.lookAt(lookAtTarget);
  }

  update(delta) {
    if (!this.isRacing) return;

    // Update game time
    this.gameTime = Date.now() - this.startTime;
    this.uiManager.updateTimer(this.gameTime);

    // Update vehicle
    const input = this.inputManager.getInput();
    this.vehicle.update(delta, input);

    // Update speedometer
    this.uiManager.updateSpeedometer(this.vehicle.getSpeedKMH());

    // Update physics
    this.physicsManager.update(delta, this.vehicle);

    // Check collisions with obstacles
    this.checkObstacleCollisions();

    // Update pickup system
    this.pickupManager.update(delta);

    // Update shooting system
    this.shootingManager.update(delta, input);

    // Update real-time coaching
    const vehiclePos = this.vehicle.getPosition();
    this.coachingManager.update(delta, vehiclePos, this.gameTime);

    // Check finish line
    this.checkFinishLine();

    // Update camera
    this.updateCamera(delta);

    // Update snow particles
    this.snowParticles.update(delta);

    // Update decorations (e.g., Santa's sleigh)
    if (this.trackBuilder?.updateDecorations) {
      this.trackBuilder.updateDecorations(delta);
    }

    // Update audio
    this.audioManager.update(this.vehicle.getSpeed());

    // Check if race is complete
    if (this.scoringManager.isRaceComplete() && this.isRacing) {
      this.finishRace();
    }
  }

  checkObstacleCollisions() {
    const vehicleBox = this.vehicle.getBoundingBox();
    const obstacles = this.trackBuilder.getObstacles();

    obstacles.forEach(obstacle => {
      const obstacleBox = new THREE.Box3().setFromObject(obstacle);
      if (vehicleBox.intersectsBox(obstacleBox)) {
        // Collision detected - slow down the car
        this.vehicle.speed *= 0.3;
        this.scoringManager.addCollision();

        // Notify coaching manager
        this.coachingManager.onCollision();

        // Play collision sound with 5-second cooldown
        const currentTime = Date.now();
        if (currentTime - this.lastCollisionSound > this.collisionSoundCooldown) {
          this.audioManager.playAnnouncement('Collision!');
          this.lastCollisionSound = currentTime;
        }

        // Push car back slightly
        const vehiclePos = this.vehicle.getPosition();
        const obstaclePos = obstacle.position;
        const pushDirection = new THREE.Vector3()
          .subVectors(vehiclePos, obstaclePos)
          .normalize();

        this.vehicle.position.x += pushDirection.x * 0.5;
        this.vehicle.position.z += pushDirection.z * 0.5;
      }
    });
  }

  checkFinishLine() {
    const vehiclePos = this.vehicle.getPosition();

    // Finish line is at position (0, 0, 8)
    // Check if vehicle is near it and has completed objectives
    if (
      Math.abs(vehiclePos.x) < 6 &&
      vehiclePos.z > 6 &&
      vehiclePos.z < 10 &&
      this.scoringManager.getCompletedSections().includes('target-shot')
    ) {
      if (!this.scoringManager.getCompletedSections().includes('finish-reached')) {
        this.scoringManager.addObjective('finish-reached');

        // Calculate time bonus (faster = more points)
        const timeSec = this.gameTime / 1000;
        let timeBonus = 0;
        if (timeSec < 60) {
          timeBonus = 30;
        } else if (timeSec < 90) {
          timeBonus = 20;
        } else if (timeSec < 120) {
          timeBonus = 10;
        }
        this.scoringManager.addScore(timeBonus + 15); // 15 for completion + time bonus
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
