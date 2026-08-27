/**
 * Objects System: Needles (Tiny Realistic Horizontal Needles) & Decoys
 * (เข็มเย็บผ้าขนาดเล็กจิ๋วสมจริง วางแนวนอนบนผืนทราย ไร้ตัวช่วยบอกพิกัด)
 */

class OceanObjects {
  constructor(scene) {
    this.scene = scene;
    this.needles = [];
    this.decoys = [];
    this.lastGlintSoundTime = 0;
  }

  init() {
    // Initialization
  }

  // Clear and Spawn Multiple Tiny Horizontal Needles
  spawnNeedles(count, bounds, level, getTerrainHeight) {
    this.cleanupNeedles();

    const margin = bounds * 0.78;
    const targetCount = Math.max(1, count);

    for (let i = 0; i < targetCount; i++) {
      let x, z, distFromOthers;
      let attempts = 0;
      do {
        x = (Math.random() - 0.5) * margin * 2;
        z = (Math.random() - 0.5) * margin * 2;
        distFromOthers = true;
        for (const existing of this.needles) {
          if (Math.hypot(x - existing.pos.x, z - existing.pos.z) < 14) {
            distFromOthers = false;
            break;
          }
        }
        attempts++;
      } while (!distFromOthers && attempts < 50);

      const y = (typeof getTerrainHeight === 'function') ? getTerrainHeight(x, z) : 0;
      const needleObj = this.createTinyHorizontalNeedle(i, x, y, z, level);
      this.needles.push(needleObj);
      this.scene.add(needleObj.mesh);
    }
  }

  // Build a Tiny Realistic Horizontal Sewing Needle Lying Flat on Sand
  createTinyHorizontalNeedle(id, x, y, z, level) {
    const needleGroup = new THREE.Group();

    // 1. Chrome + Subtle Luminous Glowing Material
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      metalness: 0.98,
      roughness: 0.08
    });

    // 2. Realistic Tiny Sewing Needle Dimensions (ขนาดเล็กจิ๋วสมจริง)
    const eyeLength = 0.22;
    const eyeWidth = 0.045;
    const eyeThickness = 0.014;

    const rimGeo = new THREE.CylinderGeometry(eyeThickness, eyeThickness, eyeLength, 10);
    const leftRim = new THREE.Mesh(rimGeo, needleMat);
    leftRim.position.set(-eyeWidth * 0.5, 0.7, 0);
    needleGroup.add(leftRim);

    const rightRim = new THREE.Mesh(rimGeo, needleMat);
    rightRim.position.set(eyeWidth * 0.5, 0.7, 0);
    needleGroup.add(rightRim);

    const topArchGeo = new THREE.TorusGeometry(eyeWidth * 0.5, eyeThickness, 6, 12, Math.PI);
    const topArch = new THREE.Mesh(topArchGeo, needleMat);
    topArch.position.set(0, 0.7 + eyeLength * 0.5, 0);
    needleGroup.add(topArch);

    const btmArchGeo = new THREE.TorusGeometry(eyeWidth * 0.5, eyeThickness, 6, 12, Math.PI);
    const btmArch = new THREE.Mesh(btmArchGeo, needleMat);
    btmArch.rotation.z = Math.PI;
    btmArch.position.set(0, 0.7 - eyeLength * 0.5, 0);
    needleGroup.add(btmArch);

    // 3. Tiny Slender Needle Shaft (ก้านเข็มเรียวเล็ก)
    const shaftLength = 0.95;
    const shaftGeo = new THREE.CylinderGeometry(0.024, 0.013, shaftLength, 12);
    const shaft = new THREE.Mesh(shaftGeo, needleMat);
    shaft.position.y = 0.7 - eyeLength * 0.5 - shaftLength * 0.5;
    shaft.castShadow = true;
    needleGroup.add(shaft);

    // 4. Sharp Needle Point (ปลายแหลมเล็ก)
    const tipLength = 0.22;
    const tipGeo = new THREE.ConeGeometry(0.013, tipLength, 12);
    tipGeo.rotateX(Math.PI);
    const tip = new THREE.Mesh(tipGeo, needleMat);
    tip.position.y = shaft.position.y - shaftLength * 0.5 - tipLength * 0.5;
    needleGroup.add(tip);

    // 5. Slender Luminous Glowing Rod Sheath
    const glowRodGeo = new THREE.CylinderGeometry(0.042, 0.028, 1.45, 12);
    const glowRodMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowRod = new THREE.Mesh(glowRodGeo, glowRodMat);
    glowRod.position.y = 0.3;
    needleGroup.add(glowRod);

    // 6. Subtle PointLight
    const glowLight = new THREE.PointLight(0x00f0ff, 1.0, 4.5);
    glowLight.position.set(0, 0.3, 0);
    needleGroup.add(glowLight);

    // 7. HORIZONTAL ORIENTATION (วางแนวนอนบนผืนทราย)
    const randomAngleY = Math.random() * Math.PI * 2;
    const slightTiltZ = (Math.random() - 0.5) * 0.08;

    needleGroup.rotation.set(Math.PI / 2, randomAngleY, slightTiltZ);
    needleGroup.position.set(x, y + 0.06, z);

    return {
      id: id,
      mesh: needleGroup,
      material: needleMat,
      glowRod: glowRod,
      glowLight: glowLight,
      pos: new THREE.Vector3(x, y, z),
      collected: false,
      isIlluminated: false
    };
  }

  getClosestNeedle(dronePos) {
    const uncollected = this.needles.filter(n => !n.collected);
    if (uncollected.length === 0) return null;

    let closest = uncollected[0];
    let minDist = Math.hypot(dronePos.x - closest.pos.x, dronePos.z - closest.pos.z);

    for (let i = 1; i < uncollected.length; i++) {
      const d = Math.hypot(dronePos.x - uncollected[i].pos.x, dronePos.z - uncollected[i].pos.z);
      if (d < minDist) {
        minDist = d;
        closest = uncollected[i];
      }
    }

    return { needle: closest, distance: minDist };
  }

  collectNeedle(needleObj) {
    if (!needleObj || needleObj.collected) return;
    needleObj.collected = true;
    this.scene.remove(needleObj.mesh);
    if (needleObj.mesh.geometry) needleObj.mesh.geometry.dispose();
  }

  getRemainingNeedlesCount() {
    return this.needles.filter(n => !n.collected).length;
  }

  getTotalNeedlesCount() {
    return this.needles.length;
  }

  spawnDecoys(count, bounds, needlesList, getTerrainHeight) {
    this.decoys.forEach(d => {
      this.scene.remove(d.mesh);
      if (d.mesh.geometry) d.mesh.geometry.dispose();
      if (d.mesh.material) d.mesh.material.dispose();
    });
    this.decoys = [];

    if (count <= 0) return;

    const types = ['nail', 'hook', 'can', 'scrap', 'screw'];

    for (let i = 0; i < count; i++) {
      let x, z, dist;
      let attempts = 0;
      do {
        x = (Math.random() - 0.5) * bounds * 1.65;
        z = (Math.random() - 0.5) * bounds * 1.65;
        dist = true;
        for (const n of this.needles) {
          if (Math.hypot(x - n.pos.x, z - n.pos.z) < 8) {
            dist = false;
            break;
          }
        }
        attempts++;
      } while (!dist && attempts < 40);

      const y = (typeof getTerrainHeight === 'function') ? getTerrainHeight(x, z) : 0;
      const type = types[Math.floor(Math.random() * types.length)];
      const mesh = this.createDecoyMesh(type);

      mesh.position.set(x, y + 0.08, z);
      mesh.rotation.set(
        Math.PI / 2 + (Math.random() - 0.5) * 0.2,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.2
      );

      this.scene.add(mesh);
      this.decoys.push({
        mesh: mesh,
        pos: new THREE.Vector3(x, y, z),
        type: type
      });
    }
  }

  createDecoyMesh(type) {
    const group = new THREE.Group();
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x7c3f1d,
      roughness: 0.85,
      metalness: 0.25
    });
    const scrapMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.65,
      metalness: 0.5
    });

    if (type === 'nail') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.9, 8), rustMat);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), rustMat);
      head.position.y = 0.45;
      group.add(shaft);
      group.add(head);
    } else if (type === 'hook') {
      const curve = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 6, 12, Math.PI * 1.2), rustMat);
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 10), rustMat);
      eye.position.set(-0.24, 0.24, 0);
      group.add(curve);
      group.add(eye);
    } else if (type === 'can') {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 8), scrapMat);
      can.scale.set(1, 0.65, 0.85);
      group.add(can);
    } else if (type === 'screw') {
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 6), scrapMat);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.7, 8), scrapMat);
      head.position.y = 0.35;
      group.add(head);
      group.add(body);
    } else {
      const scrap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.4), rustMat);
      group.add(scrap);
    }

    return group;
  }

  update(delta, dronePos, lightTarget, lightRadius) {
    const time = performance.now() * 0.005;
    const pulse = (Math.sin(time * 5) + 1.0) * 0.5;

    let anyIlluminated = false;

    this.needles.forEach(n => {
      if (n.collected) return;

      const distToDrone = Math.hypot(dronePos.x - n.pos.x, dronePos.z - n.pos.z);
      const isIlluminated = distToDrone < lightRadius;

      if (isIlluminated) {
        anyIlluminated = true;
        const intensity = Math.max(0, 1.0 - (distToDrone / lightRadius));

        n.material.emissiveIntensity = 1.0 + intensity * (1.8 + pulse * 1.2);
        n.material.emissive.setHex(pulse > 0.6 ? 0xffffff : 0x00f0ff);

        if (n.glowRod) {
          n.glowRod.material.opacity = 0.35 + intensity * 0.45;
          n.glowRod.scale.set(1.0 + pulse * 0.25, 1.0, 1.0 + pulse * 0.25);
        }

        if (n.glowLight) {
          n.glowLight.intensity = 1.2 + intensity * (2.0 + pulse * 1.2);
          n.glowLight.color.setHex(pulse > 0.5 ? 0xffffff : 0x00f0ff);
        }

        const now = performance.now();
        if (!n.isIlluminated || (now - this.lastGlintSoundTime > 2200 && distToDrone < lightRadius * 0.5)) {
          window.soundEngine.playGlintChime();
          this.lastGlintSoundTime = now;
        }

        n.isIlluminated = true;
      } else {
        n.material.emissiveIntensity = 0.4 + pulse * 0.3;
        n.material.emissive.setHex(0x00f0ff);

        if (n.glowRod) {
          n.glowRod.material.opacity = 0.25 + pulse * 0.15;
          n.glowRod.scale.set(1.0, 1.0, 1.0);
        }

        if (n.glowLight) {
          n.glowLight.intensity = 0.6 + pulse * 0.4;
          n.glowLight.color.setHex(0x00f0ff);
        }

        n.isIlluminated = false;
      }
    });

    this.isAnyNeedleIlluminated = anyIlluminated;
  }

  cleanupNeedles() {
    this.needles.forEach(n => {
      this.scene.remove(n.mesh);
      if (n.mesh.geometry) n.mesh.geometry.dispose();
      if (n.material) n.material.dispose();
    });
    this.needles = [];
  }

  cleanup() {
    this.cleanupNeedles();
    this.decoys.forEach(d => this.scene.remove(d.mesh));
    this.decoys = [];
  }
}
