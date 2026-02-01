import * as THREE from 'three';

export class TrackBuilder {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.pickupBox1 = null;  // Box near start
    this.pickupBox2 = null;  // Box on red loop
    this.dropZone1 = null;   // Drop zone on right side of red loop
    this.dropZone2 = null;   // Drop zone at start of green path
    this.gate = null;
    this.targetPlatform = null;
    this.targetCenter = null;
    this.targetBall = null;
    this.santaSleigh = null;
    this.sleighPhase = 0;
  }

  // Helper: Create smooth road from spline curve
  createRoadFromCurve({
    points,
    width = 8,
    thickness = 0.5,
    color = 0x2f3542,
    y = 0.25,  // Default flat road; set to null for rising roads
    segments = 80
  }) {
    // Create smooth curve from control points
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

    // Arrays to store vertices and indices
    const vertices = [];
    const indices = [];

    // Generate road mesh by sampling along curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // Get point and tangent on curve
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      // Create perpendicular vector for road width
      const up = new THREE.Vector3(0, 1, 0);
      const right = tangent.clone().cross(up).normalize();

      // Calculate left and right edge points
      const halfWidth = width / 2;
      const leftPoint = point.clone().add(right.clone().multiplyScalar(halfWidth));
      const rightPoint = point.clone().sub(right.clone().multiplyScalar(halfWidth));

      // Use point's y if no y override is specified (for rising roads)
      const roadY = y !== null ? y : point.y;

      // Add vertices (left and right)
      vertices.push(leftPoint.x, roadY, leftPoint.z);
      vertices.push(rightPoint.x, roadY, rightPoint.z);

      // Create triangles (two per segment)
      if (i < segments) {
        const baseIndex = i * 2;

        // First triangle
        indices.push(baseIndex, baseIndex + 2, baseIndex + 1);

        // Second triangle
        indices.push(baseIndex + 1, baseIndex + 2, baseIndex + 3);
      }
    }

    // Create buffer geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    // Compute normals automatically for proper slope lighting
    geometry.computeVertexNormals();

    // Create material and mesh (DoubleSide for slopes)
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.2,
      side: THREE.DoubleSide
    });

    const roadMesh = new THREE.Mesh(geometry, material);
    roadMesh.receiveShadow = true;
    roadMesh.castShadow = true;

    this.scene.add(roadMesh);
    return roadMesh;
  }

  buildTrack() {
    this.createGround();
    this.createStartArea();
    this.createMainStraightPath();
    this.createPathSplit(); // Fork junction
    this.createLeftPath();   // LEFT option (easier)
    this.createRightPath();  // RIGHT option (obstacles)
    this.createRaisedTargetPlatform();
    this.createFinishLine();
    this.createDecorations(); // Add winter decorations
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(600, 600);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8f4f8,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.type = 'ground';
    this.scene.add(ground);
  }

  createStartArea() {
    // BEGIN platform (blue circle at bottom)
    const startGeometry = new THREE.CylinderGeometry(8, 8, 0.5, 32);
    const startMaterial = new THREE.MeshStandardMaterial({
      color: 0x4facfe,
      metalness: 0.5,
      roughness: 0.5
    });
    const start = new THREE.Mesh(startGeometry, startMaterial);
    start.position.set(0, 0.25, 0);
    start.castShadow = true;
    start.receiveShadow = true;
    this.scene.add(start);
  }

  createMainStraightPath() {
    // Central straight black path going forward
    const pathGeometry = new THREE.BoxGeometry(8, 0.5, 30);
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f3542,
      roughness: 0.7
    });
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.position.set(0, 0.25, -20);
    path.castShadow = true;
    path.receiveShadow = true;
    this.scene.add(path);

    // Box 1: Pickup point on central path (yellow box)
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd93d,
      emissive: 0xffd93d,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.5
    });
    this.pickupBox1 = new THREE.Mesh(boxGeometry, boxMaterial);
    this.pickupBox1.position.set(0, 1, -15);
    this.pickupBox1.castShadow = true;
    this.pickupBox1.userData.type = 'pickup-box-1';
    this.scene.add(this.pickupBox1);
  }

  createPathSplit() {
    // Junction platform where paths split
    const junctionGeometry = new THREE.CylinderGeometry(10, 10, 0.5, 32);
    const junctionMaterial = new THREE.MeshStandardMaterial({
      color: 0x5f6368,
      roughness: 0.7
    });
    const junction = new THREE.Mesh(junctionGeometry, junctionMaterial);
    junction.position.set(0, 0.25, -38);
    junction.castShadow = true;
    junction.receiveShadow = true;
    this.scene.add(junction);

    // Arrow signs pointing left and right
    const signMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    });

    // Left sign
    const leftSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2, 0.1),
      signMaterial
    );
    leftSign.position.set(-5, 1, -38);
    this.scene.add(leftSign);

    // Right sign
    const rightSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2, 0.1),
      signMaterial
    );
    rightSign.position.set(5, 1, -38);
    this.scene.add(rightSign);
  }

  createLeftPath() {
    // === SMOOTH GREEN PATH THAT SPLITS INTO TWO BLACK PATHS ===

    // Initial GREEN path from junction
    const greenPoints = [
      new THREE.Vector3(0, 0.25, -38),
      new THREE.Vector3(-8, 0.25, -50),
      new THREE.Vector3(-12, 0.25, -62),
      new THREE.Vector3(-18, 0.25, -75)
    ];

    this.createRoadFromCurve({
      points: greenPoints,
      width: 12,
      color: 0x27ae60, // Green
      segments: 60
    });

    // Drop Zone 2: Blue delivery circle at start of green path
    const dropCircleGeometry2 = new THREE.CylinderGeometry(4, 4, 0.2, 32);
    const dropCircleMaterial2 = new THREE.MeshStandardMaterial({
      color: 0x4facfe,
      emissive: 0x4facfe,
      emissiveIntensity: 0.5,
      metalness: 0.4,
      roughness: 0.4
    });
    this.dropZone2 = new THREE.Mesh(dropCircleGeometry2, dropCircleMaterial2);
    this.dropZone2.position.set(-8, 0.6, -50);
    this.dropZone2.userData.type = 'drop-zone-2';
    this.scene.add(this.dropZone2);

    // SPLIT OPTION 1: STRAIGHT BLACK path to platform (with rising ramp)
    const straightPathPoints = [
      new THREE.Vector3(-18, 0.25, -75),
      new THREE.Vector3(-20, 0.25, -100),
      new THREE.Vector3(-22, 0.6, -125),
      new THREE.Vector3(-24, 1.6, -145),
      new THREE.Vector3(-25, 3.0, -165) // Platform top height
    ];

    this.createRoadFromCurve({
      points: straightPathPoints,
      width: 12,
      color: 0x2f3542, // Black
      segments: 80,
      y: null // Use point.y for rising path
    });

    // SPLIT OPTION 2: CURVED BLACK path to platform (with rising ramp)
    const curvedPathPoints = [
      new THREE.Vector3(-18, 0.25, -75),
      new THREE.Vector3(-28, 0.25, -88),
      new THREE.Vector3(-40, 0.25, -105),
      new THREE.Vector3(-50, 0.6, -122),
      new THREE.Vector3(-38, 1.8, -145),
      new THREE.Vector3(-25, 3.0, -165) // Platform top height
    ];

    this.createRoadFromCurve({
      points: curvedPathPoints,
      width: 14,
      color: 0x2f3542, // Black
      segments: 100,
      y: null // Use point.y for rising path
    });
  }

  createRightPath() {
    // === SMOOTH RED PATH (COMPLETE LOOP - PUSHED FAR RIGHT) ===

    // Red loop - smooth curve pushed far to the right
    const redLoopPoints = [
      new THREE.Vector3(0, 0.25, -38),
      new THREE.Vector3(12, 0.25, -45),
      new THREE.Vector3(22, 0.25, -52),
      new THREE.Vector3(32, 0.25, -60),
      new THREE.Vector3(42, 0.25, -70),
      new THREE.Vector3(50, 0.25, -80),
      new THREE.Vector3(54, 0.25, -90),
      new THREE.Vector3(54, 0.25, -100),
      new THREE.Vector3(50, 0.25, -110),
      new THREE.Vector3(42, 0.25, -118),
      new THREE.Vector3(32, 0.25, -122),
      new THREE.Vector3(22, 0.25, -120),
      new THREE.Vector3(14, 0.25, -114),
      new THREE.Vector3(8, 0.25, -105),
      new THREE.Vector3(6, 0.25, -95),
      new THREE.Vector3(6, 0.25, -85),
      new THREE.Vector3(8, 0.25, -75),
      new THREE.Vector3(10, 0.25, -65),
      new THREE.Vector3(12, 0.25, -55),
      new THREE.Vector3(8, 0.25, -46),
      new THREE.Vector3(0, 0.25, -38)
    ];

    this.createRoadFromCurve({
      points: redLoopPoints,
      width: 16,
      color: 0xe74c3c, // Red
      segments: 120
    });

    // Box 2: Pickup point on red loop (yellow box)
    const box2Geometry = new THREE.BoxGeometry(2, 2, 2);
    const box2Material = new THREE.MeshStandardMaterial({
      color: 0xffd93d,
      emissive: 0xffd93d,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.5
    });
    this.pickupBox2 = new THREE.Mesh(box2Geometry, box2Material);
    this.pickupBox2.position.set(45, 1, -70);
    this.pickupBox2.castShadow = true;
    this.pickupBox2.userData.type = 'pickup-box-2';
    this.scene.add(this.pickupBox2);

    // Drop Zone 1: Blue delivery circle on right side of red loop
    const dropCircleGeometry1 = new THREE.CylinderGeometry(4, 4, 0.2, 32);
    const dropCircleMaterial1 = new THREE.MeshStandardMaterial({
      color: 0x4facfe,
      emissive: 0x4facfe,
      emissiveIntensity: 0.5,
      metalness: 0.4,
      roughness: 0.4
    });
    this.dropZone1 = new THREE.Mesh(dropCircleGeometry1, dropCircleMaterial1);
    this.dropZone1.position.set(52, 0.6, -90);
    this.dropZone1.userData.type = 'drop-zone-1';
    this.scene.add(this.dropZone1);

    // OBSTACLES (black boxes) - 2 obstacles on the loop
    const obstacleGeometry = new THREE.BoxGeometry(3, 3, 3);
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.5,
      roughness: 0.5
    });

    const obs1 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obs1.position.set(50, 1.5, -80);
    obs1.castShadow = true;
    obs1.userData.type = 'obstacle';
    this.scene.add(obs1);
    this.obstacles.push(obs1);

    const obs2 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obs2.position.set(35, 1.5, -116);
    obs2.castShadow = true;
    obs2.userData.type = 'obstacle';
    this.scene.add(obs2);
    this.obstacles.push(obs2);
  }

  createRaisedTargetPlatform() {
    // === RAISED PLATFORM ON LEFT (where green paths lead) ===

    // Large raised platform on the LEFT side
    const platformGeometry = new THREE.BoxGeometry(40, 1, 25);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8b4b4,
      metalness: 0.3,
      roughness: 0.6
    });
    this.targetPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
    this.targetPlatform.position.set(-25, 2.5, -165);
    this.targetPlatform.castShadow = true;
    this.targetPlatform.receiveShadow = true;
    this.scene.add(this.targetPlatform);

    const platformTopY = this.targetPlatform.position.y + 0.5;

    // TARGET CIRCLES (concentric - Blue, Red, Green center) on LEFT platform
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(6, 7, 32),
      new THREE.MeshStandardMaterial({
        color: 0x4facfe,
        side: THREE.DoubleSide
      })
    );
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.set(-25, platformTopY, -165);
    this.scene.add(outerRing);

    const middleRing = new THREE.Mesh(
      new THREE.RingGeometry(3, 6, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        side: THREE.DoubleSide
      })
    );
    middleRing.rotation.x = -Math.PI / 2;
    middleRing.position.set(-25, platformTopY, -165);
    this.scene.add(middleRing);

    const innerCircle = new THREE.Mesh(
      new THREE.CircleGeometry(3, 32),
      new THREE.MeshStandardMaterial({
        color: 0x27ae60,
        emissive: 0x27ae60,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide
      })
    );
    innerCircle.rotation.x = -Math.PI / 2;
    innerCircle.position.set(-25, platformTopY, -165);
    this.scene.add(innerCircle);

    this.targetCenter = new THREE.Vector3(-25, platformTopY, -165);

    // BLACK BALL (shooting item) on LEFT platform
    const ballRadius = 1.2;
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x333333,
      emissiveIntensity: 0.2,
      metalness: 0.6,
      roughness: 0.3
    });
    this.targetBall = new THREE.Mesh(ballGeometry, ballMaterial);
    this.targetBall.position.set(-32, platformTopY + 0.6 + ballRadius, -165); // Ball sits on platform surface
    this.targetBall.castShadow = true;
    this.targetBall.userData.type = 'pickup-ball';
    this.scene.add(this.targetBall);
  }

  createFinishLine() {
    // GREEN finish line at start area
    const finishGeometry = new THREE.BoxGeometry(10, 0.3, 3);
    const finishMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      metalness: 0.4,
      roughness: 0.4
    });
    const finishLine = new THREE.Mesh(finishGeometry, finishMaterial);
    finishLine.position.set(0, 0.15, 8);
    finishLine.userData.type = 'finish-line';
    this.scene.add(finishLine);
  }

  reset() {
    // Reset pickup boxes
    if (this.pickupBox1) {
      this.pickupBox1.visible = true;
      this.pickupBox1.position.set(0, 1, -15);
    }
    if (this.pickupBox2) {
      this.pickupBox2.visible = true;
      this.pickupBox2.position.set(45, 1, -70);
    }

    // Reset target ball
    if (this.targetBall) {
      this.targetBall.visible = true;
      const platformTopY = this.targetPlatform ? this.targetPlatform.position.y + 0.5 : 3.0;
      this.targetBall.position.set(-32, platformTopY + 0.6 + 1.2, -165); // Ball sits on platform surface
      this.targetBall.rotation.set(0, 0, 0);
    }
  }

  createDecorations() {
    // === OLYMPIC RINGS (far in distance) ===
    const ringRadius = 3;
    const ringTube = 0.4;
    const ringColors = [0x0085c7, 0xf4c300, 0x000000, 0x009f3d, 0xdf0024]; // Blue, Yellow, Black, Green, Red
    const ringPositions = [
      { x: -6, y: 0 },
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: -3, y: -3 },
      { x: 3, y: -3 }
    ];

    ringPositions.forEach((pos, i) => {
      const ringGeometry = new THREE.TorusGeometry(ringRadius, ringTube, 16, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: ringColors[i],
        metalness: 0.3,
        roughness: 0.5
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(80 + pos.x, 12 + pos.y, -200);
      ring.rotation.x = 0; // Upright
      ring.rotation.y = Math.PI / 2; // Face camera
      this.scene.add(ring);
    });

    // === WINTER TREES ===
    const createTree = (x, z) => {
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3228 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, 1.5, z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const foliageGeometry = new THREE.ConeGeometry(2, 4, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x0d5c0d });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(x, 4.5, z);
      foliage.castShadow = true;
      this.scene.add(foliage);
    };

    // Scatter trees around the track edges
    const treePositions = [
      // Along start area
      { x: -30, z: 10 }, { x: 30, z: 10 }, { x: -35, z: -10 }, { x: 35, z: -10 },
      // Near junction
      { x: -25, z: -40 }, { x: 25, z: -40 },
      // Along left path
      { x: -60, z: -80 }, { x: -70, z: -120 }, { x: -60, z: -150 },
      // Along right path
      { x: 60, z: -60 }, { x: 70, z: -100 }, { x: 65, z: -140 },
      // Behind platform
      { x: -40, z: -180 }, { x: -10, z: -185 }, { x: 10, z: -180 },
      // Random scattered
      { x: -80, z: -50 }, { x: 80, z: -70 }, { x: -75, z: -180 }, { x: 75, z: -160 }
    ];

    treePositions.forEach(pos => createTree(pos.x, pos.z));

    // === UNIVERSITY OF TORONTO SIGN ===
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#00204e'; // UofT blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UNIVERSITY OF TORONTO', canvas.width / 2, canvas.height / 2);

    const signTexture = new THREE.CanvasTexture(canvas);
    const signGeometry = new THREE.PlaneGeometry(32, 5);
    const signMaterial = new THREE.MeshStandardMaterial({
      map: signTexture,
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(-70, 8, -100);
    sign.rotation.y = Math.PI / 4; // Angle it for visibility
    this.scene.add(sign);

    // === UTRA SIGN ===
    const utraCanvas = document.createElement('canvas');
    utraCanvas.width = 512;
    utraCanvas.height = 128;
    const utraCtx = utraCanvas.getContext('2d');
    utraCtx.fillStyle = '#00204e';
    utraCtx.fillRect(0, 0, utraCanvas.width, utraCanvas.height);
    utraCtx.fillStyle = '#ffffff';
    utraCtx.font = 'bold 64px Arial';
    utraCtx.textAlign = 'center';
    utraCtx.textBaseline = 'middle';
    utraCtx.fillText('UTRA', utraCanvas.width / 2, utraCanvas.height / 2);

    const utraTexture = new THREE.CanvasTexture(utraCanvas);
    const utraGeometry = new THREE.PlaneGeometry(16, 4);
    const utraMaterial = new THREE.MeshStandardMaterial({
      map: utraTexture,
      side: THREE.DoubleSide
    });
    const utraSign = new THREE.Mesh(utraGeometry, utraMaterial);
    utraSign.position.set(65, 7, -120);
    utraSign.rotation.y = -Math.PI / 4;
    this.scene.add(utraSign);

    // === PENGUINS ===
    const createPenguin = (x, z, scale = 1) => {
      const group = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(1 * scale, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
      );
      body.scale.set(0.9, 1.2, 0.9);
      body.castShadow = true;
      group.add(body);

      const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.7 * scale, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      belly.position.set(0, -0.1 * scale, 0.6 * scale);
      group.add(belly);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.6 * scale, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      head.position.set(0, 1.1 * scale, 0);
      head.castShadow = true;
      group.add(head);

      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.18 * scale, 0.5 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0xffa500 })
      );
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 1.0 * scale, 0.6 * scale);
      group.add(beak);

      const leftFlipper = new THREE.Mesh(
        new THREE.ConeGeometry(0.15 * scale, 0.7 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      leftFlipper.rotation.z = Math.PI / 2;
      leftFlipper.position.set(-0.8 * scale, 0.2 * scale, 0);
      group.add(leftFlipper);

      const rightFlipper = leftFlipper.clone();
      rightFlipper.position.x = 0.8 * scale;
      group.add(rightFlipper);

      group.position.set(x, 1.2 * scale, z);
      this.scene.add(group);
      return group;
    };

    const penguinPositions = [
      { x: -15, z: 8 }, { x: -18, z: 12 }, { x: 18, z: 10 },
      { x: 20, z: -20 }, { x: -35, z: -30 }, { x: 40, z: -60 },
      { x: -55, z: -140 }, { x: -20, z: -185 }
    ];
    penguinPositions.forEach(pos => createPenguin(pos.x, pos.z, 1));

    // === SANTA'S SLEIGH (animated across sky) ===
    const sleighGroup = new THREE.Group();

    const sleighBody = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 1.2, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xb00020, metalness: 0.4, roughness: 0.5 })
    );
    sleighBody.castShadow = true;
    sleighGroup.add(sleighBody);

    const sleighSeat = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.0, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x7a0018, metalness: 0.3, roughness: 0.6 })
    );
    sleighSeat.position.set(-0.8, 0.6, 0);
    sleighGroup.add(sleighSeat);

    const runnerMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, metalness: 0.2, roughness: 0.8 });
    const runnerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 8), runnerMaterial);
    runnerLeft.rotation.z = Math.PI / 2;
    runnerLeft.position.set(0, -0.8, -1.0);
    sleighGroup.add(runnerLeft);

    const runnerRight = runnerLeft.clone();
    runnerRight.position.z = 1.0;
    sleighGroup.add(runnerRight);

    const frontCurl = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 16, Math.PI), runnerMaterial);
    frontCurl.rotation.z = Math.PI / 2;
    frontCurl.position.set(3.1, -0.6, -1.0);
    sleighGroup.add(frontCurl);

    const frontCurl2 = frontCurl.clone();
    frontCurl2.position.z = 1.0;
    sleighGroup.add(frontCurl2);

    const createReindeer = (x) => {
      const deer = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.7, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
      );
      body.castShadow = true;
      deer.add(body);

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.4, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
      );
      head.position.set(0.9, 0.1, 0);
      deer.add(head);

      deer.position.set(x, 0.1, 0);
      return deer;
    };

    const deer1 = createReindeer(5.5);
    const deer2 = createReindeer(8.0);
    const deer3 = createReindeer(10.5);
    sleighGroup.add(deer1, deer2, deer3);

    const harness = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.05, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    harness.position.set(4.0, 0.0, 0);
    sleighGroup.add(harness);

    sleighGroup.position.set(-140, 45, -220);
    sleighGroup.scale.set(1.1, 1.1, 1.1);
    this.scene.add(sleighGroup);
    this.santaSleigh = sleighGroup;
  }

  updateDecorations(delta) {
    if (!this.santaSleigh) return;
    this.sleighPhase += delta * 0.15;
    const x = -140 + (this.sleighPhase * 60) % 280;
    const y = 45 + Math.sin(this.sleighPhase * 1.2) * 1.5;
    const z = -220 + Math.cos(this.sleighPhase * 0.9) * 6;
    this.santaSleigh.position.set(x, y, z);
    this.santaSleigh.rotation.y = Math.sin(this.sleighPhase * 0.8) * 0.1;
  }

  getObstacles() {
    return this.obstacles;
  }

  getPickupBox1() {
    return this.pickupBox1;
  }

  getPickupBox2() {
    return this.pickupBox2;
  }

  getDropZone1() {
    return this.dropZone1;
  }

  getDropZone2() {
    return this.dropZone2;
  }

  getTargetBall() {
    return this.targetBall;
  }

  getTargetCenter() {
    return this.targetCenter;
  }
}
