import * as THREE from 'three';

export class SnowParticles {
  constructor(scene) {
    this.scene = scene;
    this.createParticles();
  }

  createParticles() {
    const particleCount = 3000; // Increased from 1000
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      // Expanded coverage: X from -150 to 150, Z from -220 to 50
      positions[i * 3] = (Math.random() - 0.5) * 300; // X: -150 to 150
      positions[i * 3 + 1] = Math.random() * 80; // Y: 0 to 80
      positions[i * 3 + 2] = Math.random() * 270 - 220; // Z: -220 to 50

      velocities.push({
        x: (Math.random() - 0.5) * 0.5,
        y: -Math.random() * 2 - 1,
        z: (Math.random() - 0.5) * 0.5
      });
    }

    this.velocities = velocities;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4, // Slightly bigger
      transparent: true,
      opacity: 0.8
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update(delta) {
    const positions = this.particles.geometry.attributes.position.array;

    for (let i = 0; i < this.velocities.length; i++) {
      const velocity = this.velocities[i];

      positions[i * 3] += velocity.x * delta;
      positions[i * 3 + 1] += velocity.y * delta;
      positions[i * 3 + 2] += velocity.z * delta;

      // Reset particle if it goes below ground
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 80; // Match new height
        positions[i * 3] = (Math.random() - 0.5) * 300; // Match new spread
        positions[i * 3 + 2] = Math.random() * 270 - 220; // Match new spread
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}
