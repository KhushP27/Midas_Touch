import * as THREE from 'three';

export class PickupManager {
  constructor(scene, vehicle, trackBuilder, scoringManager, audioManager) {
    this.scene = scene;
    this.vehicle = vehicle;
    this.trackBuilder = trackBuilder;
    this.scoringManager = scoringManager;
    this.audioManager = audioManager;

    this.pickupDistance = 8;  // Increased for higher speeds
    this.dropDistance = 9;  // Increased for higher speeds
    this.deliveredBoxes = new Set();  // Track which boxes have been delivered
    this.completedPaths = new Set();  // Track which paths have been completed
  }

  update(delta) {
    const box1 = this.trackBuilder.getPickupBox1();
    const box2 = this.trackBuilder.getPickupBox2();
    const dropZone1 = this.trackBuilder.getDropZone1();
    const dropZone2 = this.trackBuilder.getDropZone2();

    if (!box1 || !box2 || !dropZone1 || !dropZone2) return;

    const vehiclePos = this.vehicle.getPosition();
    const vehicleSpeed = this.vehicle.getSpeed();
    const attachedItem = this.vehicle.getAttachedItem();

    // Check if near box 1 and can pick it up
    if (
      !attachedItem &&
      box1.visible &&
      vehicleSpeed < 40
    ) {
      const distance = vehiclePos.distanceTo(box1.position);
      if (distance < this.pickupDistance) {
        this.pickupItem(box1, 'box1');
      }
    }

    // Check if near box 2 and can pick it up
    if (
      !attachedItem &&
      box2.visible &&
      vehicleSpeed < 40
    ) {
      const distance = vehiclePos.distanceTo(box2.position);
      if (distance < this.pickupDistance) {
        this.pickupItem(box2, 'box2');
      }
    }

    // Check if near drop zone 1 (red loop) with any box
    if (
      attachedItem &&
      vehicleSpeed < 40
    ) {
      const dropZone1Pos = new THREE.Vector3(
        dropZone1.position.x,
        vehiclePos.y,
        dropZone1.position.z
      );
      const distance1 = vehiclePos.distanceTo(dropZone1Pos);

      if (distance1 < this.dropDistance) {
        if (attachedItem === box1) {
          this.dropItem(box1, dropZone1, 'box1', 'green-first');
        } else if (attachedItem === box2) {
          this.dropItem(box2, dropZone1, 'box2', 'red-first');
        }
      }

      // Check if near drop zone 2 (green path) with any box
      const dropZone2Pos = new THREE.Vector3(
        dropZone2.position.x,
        vehiclePos.y,
        dropZone2.position.z
      );
      const distance2 = vehiclePos.distanceTo(dropZone2Pos);

      if (distance2 < this.dropDistance) {
        if (attachedItem === box1) {
          this.dropItem(box1, dropZone2, 'box1', 'start-to-green');
        } else if (attachedItem === box2) {
          this.dropItem(box2, dropZone2, 'box2', 'red-to-green');
        }
      }
    }

    // Animate floating pickups
    if (box1.visible && !attachedItem) {
      box1.rotation.y += delta;
      box1.position.y = 0.75 + Math.sin(Date.now() * 0.002) * 0.2;
    }
    if (box2.visible && !attachedItem) {
      box2.rotation.y += delta;
      box2.position.y = 0.75 + Math.sin(Date.now() * 0.002) * 0.2;
    }
  }

  pickupItem(item, boxId) {
    this.vehicle.attachItem(item);
    this.audioManager.playSound('pickup');
    this.scoringManager.addObjective(`${boxId}-picked`);

    // Update objective based on which box was picked up
    if (boxId === 'box1') {
      this.scoringManager.setObjective('Deliver box to drop zone (green path or red loop)');
    } else {
      this.scoringManager.setObjective('Deliver box to drop zone (red loop or green path)');
    }
  }

  dropItem(item, dropZone, boxId, pathType) {
    this.vehicle.detachItem();
    item.visible = false;

    this.deliveredBoxes.add(boxId);
    this.completedPaths.add(pathType);

    this.audioManager.playAnnouncement('Checkpoint!');

    // Scoring based on path type
    let points = 10;
    if (pathType === 'red-first') {
      points = 15; // More points for red loop (harder)
    } else if (pathType === 'green-first' || pathType === 'start-to-green') {
      points = 10; // Standard points for green path
    } else if (pathType === 'red-to-green') {
      points = 12; // Bonus for doing both paths
    }

    this.scoringManager.addScore(points);
    this.scoringManager.addObjective(`${boxId}-delivered`);

    // Update objective based on progress
    if (this.deliveredBoxes.size === 1) {
      this.scoringManager.setObjective('Deliver the second box or go to target platform');
    } else if (this.deliveredBoxes.size >= 2) {
      this.scoringManager.setObjective('Reach the target platform and shoot the target');
    }
  }

  reset() {
    this.deliveredBoxes.clear();
    this.completedPaths.clear();
  }
}
