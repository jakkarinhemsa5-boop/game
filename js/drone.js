/**
 * Drone System: 3D Submersible Model, Spotlight, Physics & Controls
 */

class SubmarineDrone {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.propellers = [];
    this.spotlight = null;
    this.spotlightTarget = null;
    this.fillLight = null;
    this.clawArm = null;

    // Movement & Physics
    this.position = new THREE.Vector3(0, 7, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.pitch = 0;
    this.roll = 0;

    // Speeds & Stats
    this.baseSpeed = 16.0;
    this.turboMultiplier = 1.6;
    this.drag = 0.88; // Hydrodynamic friction
    this.lightRadius = 26;

    // Particle Emitter for thruster bubbles
    this.bubbleParticles = null;
    this.bubblePool = [];

    // Keyboard & Virtual Control Inputs
    this.keys = { w: false, a: false, s: false, d: false, shift: false };
    this.virtualBoost = false;
    this.joystickVector = new THREE.Vector2(0, 0); // 360-degree analog drag vector

    this.mouseMode = false;
    this.mouseScreenPos = new THREE.Vector2(0, 0);
    this.isMouseMoving = false;

    // Map limits
    this.mapBound = 40;
  }

  init() {
    this.buildDroneModel();
    this.setupLighting();
    this.setupBubbleSystem();
    this.setupInputListeners();
  }

  buildDroneModel() {
    this.mesh = new THREE.Group();

    // 1. Main Submarine Hull (Built with Nose pointing along +Z axis)
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xffa200,
      roughness: 0.3,
      metalness: 0.6
    });

    const hullDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.8
    });

    const hullGeo = new THREE.CylinderGeometry(0.9, 0.7, 3.2, 16);
    hullGeo.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    this.mesh.add(hull);

    // Front Viewport Dome (+Z front)
    const noseGeo = new THREE.SphereGeometry(0.88, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    noseGeo.rotateX(Math.PI / 2);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00a8cc,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const nose = new THREE.Mesh(noseGeo, glassMat);
    nose.position.z = 1.6;
    this.mesh.add(nose);

    // Rear Conical Tail (-Z back)
    const tailGeo = new THREE.ConeGeometry(0.7, 1.0, 16);
    tailGeo.rotateX(-Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, hullDarkMat);
    tail.position.z = -2.1;
    this.mesh.add(tail);

    // 2. Dual Side Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12);
    thrusterGeo.rotateX(Math.PI / 2);

    [-1.2, 1.2].forEach((xSide) => {
      const thruster = new THREE.Mesh(thrusterGeo, hullDarkMat);
      thruster.position.set(xSide, 0.1, -0.4);

      const pylon = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(xSide) * 0.5, 0.12, 0.4), hullMat);
      pylon.position.set(xSide * 0.5, 0.1, -0.4);
      this.mesh.add(pylon);

      // 3-blade Propeller (located at -Z back of thruster)
      const propGroup = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.5, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
        );
        blade.rotation.z = (i * Math.PI * 2) / 3;
        blade.position.y = 0.25 * Math.sin((i * Math.PI * 2) / 3);
        blade.position.x = 0.25 * Math.cos((i * Math.PI * 2) / 3);
        propGroup.add(blade);
      }
      propGroup.position.set(xSide, 0.1, -1.15);
      this.mesh.add(propGroup);
      this.propellers.push(propGroup);

      this.mesh.add(thruster);
    });

    // 3. Ventral Magnetic Claw Arm
    const clawGroup = new THREE.Group();
    const clawBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8), hullDarkMat);
    clawBase.position.y = -0.75;
    clawGroup.add(clawBase);

    const magnetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.06, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.9
      })
    );
    magnetRing.rotation.x = Math.PI / 2;
    magnetRing.position.y = -0.95;
    clawGroup.add(magnetRing);

    this.clawArm = clawGroup;
    this.mesh.add(clawGroup);

    this.scene.add(this.mesh);
  }

  setupLighting() {
    this.spotlight = new THREE.SpotLight(0xc8f1ff, 4.5);
    this.spotlight.angle = Math.PI / 3.8;
    this.spotlight.penumbra = 0.65;
    this.spotlight.decay = 1.4;
    this.spotlight.distance = 45;
    this.spotlight.castShadow = true;

    this.spotlightTarget = new THREE.Object3D();
    this.scene.add(this.spotlightTarget);
    this.spotlight.target = this.spotlightTarget;

    this.mesh.add(this.spotlight);
    this.spotlight.position.set(0, -0.4, 0.6);

    this.fillLight = new THREE.PointLight(0x00f0ff, 1.8, this.lightRadius);
    this.fillLight.position.set(0, -0.8, 0);
    this.mesh.add(this.fillLight);

    const navLightL = new THREE.PointLight(0xff0055, 0.8, 6);
    navLightL.position.set(-1.2, 0.3, 0.4);
    this.mesh.add(navLightL);

    const navLightR = new THREE.PointLight(0x00ffaa, 0.8, 6);
    navLightR.position.set(1.2, 0.3, 0.4);
    this.mesh.add(navLightR);
  }

  setupBubbleSystem() {
    const count = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.bubblePool.push({
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.0
      });
      positions[i * 3 + 1] = -100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 0.55,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bubbleParticles = new THREE.Points(geometry, material);
    this.scene.add(this.bubbleParticles);
  }

  spawnBubble(pos, velocity) {
    const bubble = this.bubblePool.find(b => b.life <= 0);
    if (!bubble) return;

    bubble.x = pos.x + (Math.random() - 0.5) * 0.4;
    bubble.y = pos.y + (Math.random() - 0.5) * 0.2;
    bubble.z = pos.z + (Math.random() - 0.5) * 0.4;
    bubble.vx = -velocity.x * 0.2 + (Math.random() - 0.5) * 0.5;
    bubble.vy = Math.random() * 1.5 + 0.8;
    bubble.vz = -velocity.z * 0.2 + (Math.random() - 0.5) * 0.5;
    bubble.life = 0.8 + Math.random() * 0.5;
    bubble.maxLife = bubble.life;
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.keys.w = true;
      if (k === 's' || k === 'arrowdown') this.keys.s = true;
      if (k === 'a' || k === 'arrowleft') this.keys.a = true;
      if (k === 'd' || k === 'arrowright') this.keys.d = true;
      if (e.key === 'Shift') this.keys.shift = true;
      if (k === 'm') this.toggleMouseMode();
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.keys.w = false;
      if (k === 's' || k === 'arrowdown') this.keys.s = false;
      if (k === 'a' || k === 'arrowleft') this.keys.a = false;
      if (k === 'd' || k === 'arrowright') this.keys.d = false;
      if (e.key === 'Shift') this.keys.shift = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseScreenPos.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseScreenPos.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.isMouseMoving = true;
    });
  }

  toggleMouseMode() {
    this.mouseMode = !this.mouseMode;
  }

  pulseClaw() {
    if (!this.clawArm) return;
    this.clawArm.scale.set(1.4, 2.0, 1.4);
    setTimeout(() => {
      if (this.clawArm) this.clawArm.scale.set(1.0, 1.0, 1.0);
    }, 250);
  }

  setLevel(level, mapBound) {
    this.mapBound = mapBound;
    this.lightRadius = Math.max(15, 26 - (level - 1) * 1.5);
    if (this.fillLight) {
      this.fillLight.distance = this.lightRadius;
      this.fillLight.intensity = Math.max(1.1, 1.8 - (level - 1) * 0.08);
    }
  }

  resetPosition() {
    this.position.set(0, 7, 0);
    this.velocity.set(0, 0, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.joystickVector.set(0, 0);
    this.mesh.position.copy(this.position);
  }

  update(delta, currentForce, getTerrainHeight) {
    let inputX = 0;
    let inputZ = 0;

    // 1. Keyboard Inputs
    if (this.keys.w) inputZ -= 1;
    if (this.keys.s) inputZ += 1;
    if (this.keys.a) inputX -= 1;
    if (this.keys.d) inputX += 1;

    // 2. Analog Circular Drag Joystick Inputs (360 degrees)
    if (this.joystickVector.lengthSq() > 0.001) {
      inputX += this.joystickVector.x;
      inputZ += this.joystickVector.y;
    }

    // 3. Mouse Follow Assist
    if (this.mouseMode && (Math.abs(this.mouseScreenPos.x) > 0.15 || Math.abs(this.mouseScreenPos.y) > 0.15)) {
      inputX += this.mouseScreenPos.x * 1.2;
      inputZ -= this.mouseScreenPos.y * 1.2;
    }

    const inputLen = Math.hypot(inputX, inputZ);
    if (inputLen > 1) {
      inputX /= inputLen;
      inputZ /= inputLen;
    }

    const isBoostActive = this.keys.shift || this.virtualBoost;
    const speed = this.baseSpeed * (isBoostActive ? this.turboMultiplier : 1.0);
    const accel = 35.0;

    this.velocity.x += inputX * accel * delta;
    this.velocity.z += inputZ * accel * delta;

    if (currentForce) {
      this.velocity.x += currentForce.x * delta * 0.8;
      this.velocity.z += currentForce.y * delta * 0.8;
    }

    this.velocity.x *= Math.pow(this.drag, delta * 60);
    this.velocity.z *= Math.pow(this.drag, delta * 60);

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    const limit = this.mapBound * 0.95;
    if (Math.abs(this.position.x) > limit) {
      this.position.x = Math.sign(this.position.x) * limit;
      this.velocity.x *= -0.3;
    }
    if (Math.abs(this.position.z) > limit) {
      this.position.z = Math.sign(this.position.z) * limit;
      this.velocity.z *= -0.3;
    }

    const terrainY = (typeof getTerrainHeight === 'function') ? getTerrainHeight(this.position.x, this.position.z) : 0;
    const targetY = terrainY + 6.0;
    this.position.y += (targetY - this.position.y) * delta * 4.0;

    this.mesh.position.copy(this.position);

    // 4. Drone Rotations & Tilts (Corrected: Model Nose (+Z) aligns with (vx, vz))
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);

    if (currentSpeed > 0.3) {
      // Math.atan2(vx, vz) correctly rotates +Z front towards movement direction:
      // Left (-X): atan2(-1, 0) = -PI/2 (turns left)
      // Right (+X): atan2(1, 0) = +PI/2 (turns right)
      // Forward/North (-Z): atan2(0, -1) = PI (turns up)
      // Backward/South (+Z): atan2(0, 1) = 0 (turns down)
      this.targetRotationY = Math.atan2(this.velocity.x, this.velocity.z);

      let diff = this.targetRotationY - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * delta * 7.5;
    }

    this.mesh.rotation.y = this.rotationY;

    // Pitch & Roll based on local velocity direction
    this.mesh.rotation.x = 0;
    this.mesh.rotation.z = 0;

    const propSpeed = 15.0 + currentSpeed * 6.0;
    this.propellers.forEach(p => {
      p.rotation.z += propSpeed * delta;
    });

    if (currentSpeed > 2.0 && Math.random() < 0.35) {
      this.spawnBubble(
        new THREE.Vector3(this.position.x, this.position.y, this.position.z),
        this.velocity
      );
    }

    this.updateBubbles(delta);
    this.spotlightTarget.position.set(this.position.x, terrainY, this.position.z);
    window.soundEngine.updateEngineSound(Math.min(1.0, currentSpeed / (this.baseSpeed * 1.5)));
  }

  updateBubbles(delta) {
    if (!this.bubbleParticles) return;
    const posAttr = this.bubbleParticles.geometry.attributes.position;

    this.bubblePool.forEach((b, i) => {
      if (b.life > 0) {
        b.life -= delta;
        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.z += b.vz * delta;
        posAttr.setXYZ(i, b.x, b.y, b.z);
      } else {
        posAttr.setY(i, -100);
      }
    });

    posAttr.needsUpdate = true;
  }
}
