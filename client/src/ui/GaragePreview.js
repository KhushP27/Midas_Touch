import * as THREE from 'three';
import { Vehicle } from '../systems/Vehicle.js';

export class GaragePreview {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);

    this.rotationY = 0;
    this.isDragging = false;
    this.lastX = 0;

    this.setupLights();
    this.setupCamera();
    this.createVehicle();
    this.resize();
    this.bindEvents();
    this.animate();
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(5, 8, 6);
    this.scene.add(key);
  }

  setupCamera() {
    this.camera.position.set(0, 2.2, 7);
    this.camera.lookAt(0, 1, 0);
  }

  createVehicle() {
    this.vehicle = new Vehicle(this.scene, 'red', 'standard');
    this.vehicle.group.position.set(0, 0, 0);
    this.vehicle.group.rotation.set(0, 0, 0);
  }

  setColor(color) {
    if (this.vehicle) {
      this.vehicle.setColor(color);
    }
  }

  setWheelType(wheelType) {
    if (this.vehicle) {
      this.vehicle.setWheelType(wheelType);
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const delta = e.clientX - this.lastX;
      this.lastX = e.clientX;
      this.rotationY += delta * 0.01;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      this.isDragging = true;
      this.lastX = e.touches[0].clientX;
    }, { passive: true });
    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const delta = e.touches[0].clientX - this.lastX;
      this.lastX = e.touches[0].clientX;
      this.rotationY += delta * 0.01;
    }, { passive: true });

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 280;
    const height = rect.height || 180;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.vehicle) {
      this.vehicle.group.rotation.y = this.rotationY;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
