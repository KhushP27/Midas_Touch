import * as THREE from 'three';

export class PhysicsManager {
  constructor(scene) {
    this.scene = scene;
    this.gravity = -9.8;
  }

  update(delta, vehicle) {
    // Simple ground raycast - cast from above the vehicle downward
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(vehicle.position.x, vehicle.position.y + 10, vehicle.position.z),
      new THREE.Vector3(0, -1, 0)
    );

    // Get all scene objects except the vehicle itself and attached items
    const objectsToTest = this.scene.children.filter(obj => {
      // Don't raycast against the vehicle
      if (obj === vehicle.group) return false;

      // Don't raycast against attached items
      if (vehicle.attachedItem && obj === vehicle.attachedItem) return false;

      return true;
    });

    const intersects = raycaster.intersectObjects(objectsToTest, true);

    if (intersects.length > 0) {
      // Find the first solid ground (not a pickup or effect)
      for (let i = 0; i < intersects.length; i++) {
        const hit = intersects[i];
        // Skip particle systems and pickups
        if (hit.object.type === 'Points') continue;
        if (hit.object.parent?.userData?.type?.includes('pickup')) continue;

        // Found ground - set vehicle height
        const groundY = hit.point.y;
        vehicle.position.y = groundY + 1;
        break;
      }
    } else {
      // No ground detected - apply gravity
      vehicle.position.y += this.gravity * delta;

      // Don't fall below 0
      if (vehicle.position.y < 1) {
        vehicle.position.y = 1;
      }
    }
  }

  checkCollision(box1, box2) {
    return box1.intersectsBox(box2);
  }

  checkDistance(pos1, pos2) {
    return pos1.distanceTo(pos2);
  }
}
