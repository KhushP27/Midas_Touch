import * as THREE from 'three';

export class Vehicle {
  constructor(scene, color = 'red', wheelType = 'standard') {
    this.scene = scene;
    this.color = color;
    this.wheelType = wheelType;

    // Physics properties
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.speed = 0;
    this.maxSpeed = 12;
    this.acceleration = 60;
    this.braking = 50;
    this.turnSpeed = 4.0;
    this.friction = 0.96;

    // Drift mechanics
    this.driftAngle = 0;
    this.isDrifting = false;
    this.driftDirection = 0;

    // Visual effects
    this.tiltAngle = 0;
    this.targetTilt = 0;

    // Attached items
    this.attachedItem = null;

    // Create 3D model
    this.createModel();
    this.createExhaust();
  }

  createModel() {
    this.group = new THREE.Group();

    // Car body with more detail
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getColorHex(this.color),
      metalness: 0.7,
      roughness: 0.3,
      envMapIntensity: 1.0
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.set(0, 0.9, -0.2);
    roof.castShadow = true;
    this.group.add(roof);

    // Windshield (glossy)
    const windshieldGeo = new THREE.BoxGeometry(1.4, 0.6, 0.1);
    const windshieldMat = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6
    });
    const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
    windshield.position.set(0, 1.0, -0.9);
    this.group.add(windshield);

    // Create wheels based on type
    const wheelPositions = [
      { x: -1, y: -0.3, z: 1 },
      { x: 1, y: -0.3, z: 1 },
      { x: -1, y: -0.3, z: -1 },
      { x: 1, y: -0.3, z: -1 }
    ];

    this.wheels = [];
    wheelPositions.forEach(pos => {
      const { wheel, rim } = this.createWheel(pos);
      this.wheels.push(wheel);
    });

    // Headlights
    const headlightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8
    });

    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-0.7, 0.2, -1.5);
    this.group.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(0.7, 0.2, -1.5);
    this.group.add(rightHeadlight);

    // Robot arm (for pickups)
    this.createArm();

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  createWheel(pos) {
    let wheelGeometry, wheelMaterial, rimGeometry, rimMaterial;

    // Different wheel styles based on type
    if (this.wheelType === 'sport') {
      // Sport wheels: Thinner, sleeker, chrome rims
      wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 20);
      wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.5,
        roughness: 0.6
      });
      rimGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.28, 20);
      rimMaterial = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0, // Chrome silver
        metalness: 0.9,
        roughness: 0.1
      });
    } else if (this.wheelType === 'offroad') {
      // Off-road wheels: Thicker, rugged, brown/tan color
      wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
      wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x6b4423, // Brown/tan
        metalness: 0.1,
        roughness: 0.9
      });
      rimGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.42, 12);
      rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a, // Dark gray
        metalness: 0.4,
        roughness: 0.7
      });
    } else {
      // Standard wheels: Default style
      wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2f3542,
        metalness: 0.3,
        roughness: 0.8
      });
      rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.35, 16);
      rimMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4757, // Red rims
        metalness: 0.8,
        roughness: 0.2
      });
    }

    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, pos.y, pos.z);
    wheel.castShadow = true;
    this.group.add(wheel);

    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(pos.x, pos.y, pos.z);
    this.group.add(rim);

    return { wheel, rim };
  }

  createArm() {
    this.arm = new THREE.Group();

    // Arm base
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x95afc0,
      metalness: 0.6,
      roughness: 0.4
    });
    const base = new THREE.Mesh(baseGeometry, armMaterial);
    base.position.set(0, 0.7, -1.2);
    this.arm.add(base);

    // Arm segment
    const segmentGeometry = new THREE.BoxGeometry(0.15, 1.5, 0.15);
    const segment = new THREE.Mesh(segmentGeometry, armMaterial);
    segment.position.set(0, 1.2, -1.2);
    this.arm.add(segment);

    // Gripper
    const gripperGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.3);
    this.gripper = new THREE.Mesh(gripperGeometry, armMaterial);
    this.gripper.position.set(0, 1.9, -1.2);
    this.arm.add(this.gripper);

    this.group.add(this.arm);
    this.armRotation = 0;
  }

  createExhaust() {
    // Exhaust pipes
    const exhaustGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
    const exhaustMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.3
    });

    const leftExhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
    leftExhaust.rotation.x = Math.PI / 2;
    leftExhaust.position.set(-0.5, -0.2, 1.5);
    this.group.add(leftExhaust);

    const rightExhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
    rightExhaust.rotation.x = Math.PI / 2;
    rightExhaust.position.set(0.5, -0.2, 1.5);
    this.group.add(rightExhaust);
  }

  getColorHex(color) {
    // Named color presets
    const colorMap = {
      red: 0xff4757,
      blue: 0x2d7ff9,
      green: 0x22c55e,
      yellow: 0xffd93d
    };

    // Check if it's a named color
    if (colorMap[color]) {
      return colorMap[color];
    }

    // Check if it's already a hex number
    if (typeof color === 'number') {
      return color;
    }

    // Check if it's a hex string (e.g., "#ff0000" or "ff0000")
    if (typeof color === 'string') {
      const hexString = color.replace('#', '');
      const hexNumber = parseInt(hexString, 16);
      if (!isNaN(hexNumber)) {
        return hexNumber;
      }
    }

    // Default to red if invalid
    return 0xff4757;
  }

  setColor(color) {
    this.color = color;
    console.log('🎨 Setting car color to:', color);
    if (this.body) {
      const hexColor = this.getColorHex(color);
      console.log('🎨 Converted to hex:', hexColor.toString(16));
      this.body.material.color.setHex(hexColor);
      this.body.material.needsUpdate = true; // Force material update
    }
  }

  setWheelType(wheelType) {
    this.wheelType = wheelType;
    // Recreate wheels with new type
    this.updateWheels();
  }

  updateWheels() {
    // Remove old wheels and rims from the group
    const toRemove = [];
    this.group.children.forEach(child => {
      if (this.wheels.includes(child) || child.geometry instanceof THREE.CylinderGeometry) {
        toRemove.push(child);
      }
    });
    toRemove.forEach(child => this.group.remove(child));

    // Recreate wheels with current type
    const wheelPositions = [
      { x: -1, y: -0.3, z: 1 },
      { x: 1, y: -0.3, z: 1 },
      { x: -1, y: -0.3, z: -1 },
      { x: 1, y: -0.3, z: -1 }
    ];

    this.wheels = [];
    wheelPositions.forEach(pos => {
      const { wheel } = this.createWheel(pos);
      this.wheels.push(wheel);
    });
  }

  update(delta, input) {
    // Handle acceleration/braking
    if (input.forward) {
      this.speed += this.acceleration * delta;
    } else if (input.backward) {
      this.speed -= this.braking * delta;
    }

    // Apply friction
    this.speed *= this.friction;

    // Clamp speed
    this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));

    // Drift mechanics
    this.isDrifting = false;
    if (Math.abs(this.speed) > 10) {
      if (input.left) {
        this.rotation.y += this.turnSpeed * delta;
        this.driftDirection = 1;
        this.isDrifting = true;
      }
      if (input.right) {
        this.rotation.y -= this.turnSpeed * delta;
        this.driftDirection = -1;
        this.isDrifting = true;
      }
    } else if (Math.abs(this.speed) > 0.5) {
      // Slower turning at low speed
      if (input.left) {
        this.rotation.y += this.turnSpeed * delta * 0.5;
      }
      if (input.right) {
        this.rotation.y -= this.turnSpeed * delta * 0.5;
      }
    }

    // Drift angle for visual tilt
    if (this.isDrifting) {
      this.targetTilt = this.driftDirection * 0.15;
    } else {
      this.targetTilt = 0;
    }

    // Smooth tilt transition
    this.tiltAngle += (this.targetTilt - this.tiltAngle) * delta * 8;
    this.group.rotation.z = this.tiltAngle;

    // Update velocity based on rotation
    this.velocity.x = -Math.sin(this.rotation.y) * this.speed;
    this.velocity.z = -Math.cos(this.rotation.y) * this.speed;

    // Update position
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Update 3D model
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation.y;

    // Rotate wheels based on speed
    this.wheels.forEach(wheel => {
      wheel.rotation.x += this.speed * delta * 2;
    });

    // Animate arm if holding item
    if (this.attachedItem) {
      this.armRotation += delta * 2;
      this.gripper.rotation.y = Math.sin(this.armRotation) * 0.2;

      // Update attached item position with smooth lerp to prevent twitching
      const gripperWorldPos = new THREE.Vector3();
      this.gripper.getWorldPosition(gripperWorldPos);
      gripperWorldPos.y -= 0.5;

      // Smooth lerp for position
      this.attachedItem.position.lerp(gripperWorldPos, 0.15);
    }

    // Bounce effect when driving
    if (Math.abs(this.speed) > 1) {
      this.group.position.y += Math.sin(Date.now() * 0.01) * 0.02;
    }
  }

  attachItem(item) {
    this.attachedItem = item;
  }

  detachItem() {
    const item = this.attachedItem;
    this.attachedItem = null;
    return item;
  }

  getAttachedItem() {
    return this.attachedItem;
  }

  reset() {
    this.position.set(0, 1, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.speed = 0;
    this.driftAngle = 0;
    this.isDrifting = false;
    this.tiltAngle = 0;
    this.targetTilt = 0;
    this.attachedItem = null;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
  }

  getPosition() {
    return this.position.clone();
  }

  getRotation() {
    return this.rotation.clone();
  }

  getSpeed() {
    return Math.abs(this.speed);
  }

  getBoundingBox() {
    const box = new THREE.Box3();
    box.setFromObject(this.group);
    return box;
  }

  getSpeedKMH() {
    // Convert arbitrary speed units to km/h for display
    return Math.abs(this.speed * 10);
  }
}
