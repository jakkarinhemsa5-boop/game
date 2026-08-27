/**
 * Euclidean Sonar System: Wave Rings, Audio Pitch & Distance Calculation
 */

class SonarSystem {
  constructor(scene) {
    this.scene = scene;
    this.sonarRings = [];
    this.ringPoolSize = 6;
    this.currentRingIdx = 0;
    this.pingTimer = 0;
    this.pingInterval = 1.6;

    // Euclidean Metrics
    this.currentDistance = 999;
    this.closenessRatio = 0; // 0.0 (Far) to 1.0 (Locked/Near)
    this.isNearNeedle = false;
    this.maxEffectiveDistance = 65; // Range of sonar in units
  }

  init() {
    this.createSonarRings();
  }

  createSonarRings() {
    const ringGeo = new THREE.RingGeometry(0.3, 0.7, 32);
    ringGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < this.ringPoolSize; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = -100;
      this.scene.add(ring);

      this.sonarRings.push({
        mesh: ring,
        material: ringMat,
        scale: 0.1,
        maxScale: 28,
        opacity: 0,
        active: false,
        speed: 16.0
      });
    }
  }

  triggerPing(pos) {
    const ring = this.sonarRings[this.currentRingIdx];
    this.currentRingIdx = (this.currentRingIdx + 1) % this.ringPoolSize;

    ring.mesh.position.set(pos.x, pos.y + 0.15, pos.z);
    ring.scale = 0.2;
    ring.mesh.scale.set(0.2, 0.2, 0.2);
    ring.opacity = 0.85;
    ring.material.opacity = 0.85;
    ring.active = true;

    // Trigger Audio Beep scaled to closeness
    window.soundEngine.playSonarPing(this.closenessRatio);
  }

  update(delta, dronePos, closestNeedleObj, decoys, getTerrainHeight) {
    if (closestNeedleObj && closestNeedleObj.needle) {
      const needlePos = closestNeedleObj.needle.pos;
      // 1. Calculate Euclidean Distance: d = sqrt(dx^2 + dz^2)
      const dx = dronePos.x - needlePos.x;
      const dz = dronePos.z - needlePos.z;
      this.currentDistance = Math.hypot(dx, dz);

      // Closeness ratio: 0.0 (far) to 1.0 (right on top)
      this.closenessRatio = Math.max(0, Math.min(1, 1 - (this.currentDistance / this.maxEffectiveDistance)));

      // Locked in recovery range (< 4.2 units)
      this.isNearNeedle = this.currentDistance < 4.2;

      // Sonar ping frequency scales dynamically with closeness (0.35s to 1.6s)
      this.pingInterval = THREE.MathUtils.lerp(1.6, 0.35, Math.pow(this.closenessRatio, 1.4));
    } else {
      this.currentDistance = 999;
      this.closenessRatio = 0;
      this.isNearNeedle = false;
      this.pingInterval = 1.8;
    }

    // Ping interval timer
    this.pingTimer += delta;
    if (this.pingTimer >= this.pingInterval) {
      this.pingTimer = 0;
      const terrainY = (typeof getTerrainHeight === 'function') ? getTerrainHeight(dronePos.x, dronePos.z) : 0;
      this.triggerPing(new THREE.Vector3(dronePos.x, terrainY, dronePos.z));
    }

    // Update 3D visual wave rings
    this.sonarRings.forEach(r => {
      if (r.active) {
        r.scale += r.speed * delta;
        r.opacity = Math.max(0, 0.85 * (1 - (r.scale / r.maxScale)));

        r.mesh.scale.set(r.scale, r.scale, r.scale);
        r.material.opacity = r.opacity;

        if (r.scale >= r.maxScale || r.opacity <= 0.01) {
          r.active = false;
          r.material.opacity = 0;
          r.mesh.position.y = -100;
        }
      }
    });
  }

  // Inspection check for recovery
  inspectTarget(dronePos, needlesList, decoys) {
    // 1. Check for uncollected needles in range (< 4.2 units)
    for (const n of needlesList) {
      if (n.collected) continue;
      const d = Math.hypot(dronePos.x - n.pos.x, dronePos.z - n.pos.z);
      if (d < 4.2) {
        return { success: true, targetNeedle: n, isDecoy: false };
      }
    }

    // 2. Check for false decoy scan
    for (const d of decoys) {
      const distDecoy = Math.hypot(dronePos.x - d.pos.x, dronePos.z - d.pos.z);
      if (distDecoy < 3.8) {
        return { success: false, targetNeedle: null, isDecoy: true, decoyType: d.type };
      }
    }

    return { success: false, targetNeedle: null, isDecoy: false };
  }
}
