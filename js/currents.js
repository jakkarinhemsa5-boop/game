/**
 * Ocean Currents System: Vector Force & Visual Flow Particles
 */

class OceanCurrents {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.currentVector = new THREE.Vector2(0, 0);
    this.targetVector = new THREE.Vector2(0, 0);
    this.strength = 0; // knots / units per second
    this.changeTimer = 0;
    this.changeInterval = 5.0; // seconds between direction changes

    // Visual flow particles
    this.flowGroup = null;
    this.particleCount = 180;
    this.flowPositions = null;
  }

  init() {
    this.createFlowParticles();
  }

  createFlowParticles() {
    this.flowGroup = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const alphas = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 6 + 1; // Hover above terrain
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      alphas[i] = Math.random() * 0.5 + 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.flowPositions = positions;

    const material = new THREE.PointsMaterial({
      color: 0x64dfdf,
      size: 0.5,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.flowPoints = new THREE.Points(geometry, material);
    this.flowGroup.add(this.flowPoints);
    this.scene.add(this.flowGroup);
    this.flowGroup.visible = false;
  }

  setLevel(level) {
    // Current is enabled from level 3 onwards
    if (level >= 3) {
      this.enabled = true;
      this.flowGroup.visible = true;
      this.strength = 3.5 + (level - 3) * 1.8;
      this.pickNewTargetDirection();
    } else {
      this.enabled = false;
      this.flowGroup.visible = false;
      this.currentVector.set(0, 0);
      this.targetVector.set(0, 0);
    }
  }

  pickNewTargetDirection() {
    const angle = Math.random() * Math.PI * 2;
    const speed = this.strength * (0.8 + Math.random() * 0.4);
    this.targetVector.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.changeTimer = this.changeInterval + (Math.random() - 0.5) * 2;

    if (this.enabled) {
      window.soundEngine.playCurrentSurge();
    }
  }

  update(delta, dronePos) {
    if (!this.enabled) return;

    // Smoothly interpolate current vector towards target
    this.currentVector.lerp(this.targetVector, delta * 1.2);

    // Direction change countdown
    this.changeTimer -= delta;
    if (this.changeTimer <= 0) {
      this.pickNewTargetDirection();
    }

    // Follow drone position with flow particles & animate along current vector
    if (this.flowGroup && this.flowPoints) {
      const posAttr = this.flowPoints.geometry.attributes.position;
      const count = posAttr.count;
      const vx = this.currentVector.x * delta * 2.5;
      const vz = this.currentVector.y * delta * 2.5;

      for (let i = 0; i < count; i++) {
        let px = posAttr.getX(i) + vx;
        let py = posAttr.getY(i);
        let pz = posAttr.getZ(i) + vz;

        // Wrap around drone if drifted too far
        const dx = px - dronePos.x;
        const dz = pz - dronePos.z;

        if (dx > 45) px -= 90;
        if (dx < -45) px += 90;
        if (dz > 45) pz -= 90;
        if (dz < -45) pz += 90;

        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;
    }
  }

  // Get current force vector for physics
  getForce() {
    if (!this.enabled) return new THREE.Vector2(0, 0);
    return this.currentVector.clone();
  }

  // Get human-readable description & compass angle for UI
  getUIInfo() {
    if (!this.enabled) return null;
    const speed = this.currentVector.length();
    const angleRad = Math.atan2(this.currentVector.y, this.currentVector.x);
    const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;

    // Cardinal directions
    const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const idx = Math.round(angleDeg / 45) % 8;
    const cardinal = dirs[idx];

    return {
      speedKts: (speed * 0.4).toFixed(1),
      angleDeg: angleDeg,
      cardinal: cardinal
    };
  }
}
