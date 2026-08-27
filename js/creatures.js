/**
 * Marine Creatures System: Deep-Sea Bioluminescent Jellyfish, Fish Schools, Manta Rays & Anglerfish
 * (ระบบสัตว์น้ำใต้ทะเลลึก: แมงกะพรุนเรืองแสง, ฝูงปลาน้ำลึก, ปลากระเบนราหู และปลาแองเกลอร์)
 */

class OceanCreatures {
  constructor(scene) {
    this.scene = scene;
    this.jellyfish = [];
    this.fishSchools = [];
    this.mantaRays = [];
    this.anglerfish = [];
    this.time = 0;
    this.mapBound = 40;
  }

  init(mapBound = 40) {
    this.mapBound = mapBound;
    this.spawnCreatures();
  }

  spawnCreatures() {
    this.cleanup();

    // 1. Spawn Bioluminescent Jellyfish (แมงกะพรุนเรืองแสง 10-15 ตัว)
    const jellyfishCount = Math.max(8, Math.floor(this.mapBound * 0.25));
    const jellyColors = [0x00f0ff, 0xa855f7, 0xff007f, 0x00ffaa, 0x38bdf8];

    for (let i = 0; i < jellyfishCount; i++) {
      const color = jellyColors[i % jellyColors.length];
      const jelly = this.createJellyfish(color);
      const x = (Math.random() - 0.5) * this.mapBound * 1.7;
      const z = (Math.random() - 0.5) * this.mapBound * 1.7;
      const y = Math.random() * 12 + 4; // Floating in water column
      jelly.mesh.position.set(x, y, z);
      jelly.baseY = y;
      jelly.phase = Math.random() * Math.PI * 2;
      jelly.speed = Math.random() * 0.8 + 0.5;

      this.scene.add(jelly.mesh);
      this.jellyfish.push(jelly);
    }

    // 2. Spawn Schools of Deep-Sea Glowing Fish (ฝูงปลาน้ำลึกเรืองแสง 25-40 ตัว)
    const fishCount = Math.max(20, Math.floor(this.mapBound * 0.5));
    for (let i = 0; i < fishCount; i++) {
      const fish = this.createBioluminescentFish();
      const x = (Math.random() - 0.5) * this.mapBound * 1.6;
      const z = (Math.random() - 0.5) * this.mapBound * 1.6;
      const y = Math.random() * 10 + 3;
      fish.mesh.position.set(x, y, z);

      fish.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 4
      ).normalize().multiplyScalar(Math.random() * 3 + 2.5);

      fish.swimPhase = Math.random() * Math.PI * 2;
      this.scene.add(fish.mesh);
      this.fishSchools.push(fish);
    }

    // 3. Spawn Majestic Deep-Sea Manta Rays (ปลากระเบนราหูยักษ์เรืองแสง 2-3 ตัว)
    const mantaCount = Math.max(2, Math.floor(this.mapBound * 0.05));
    for (let i = 0; i < mantaCount; i++) {
      const manta = this.createMantaRay();
      const x = (Math.random() - 0.5) * this.mapBound * 1.5;
      const z = (Math.random() - 0.5) * this.mapBound * 1.5;
      const y = Math.random() * 8 + 8;
      manta.mesh.position.set(x, y, z);
      manta.angle = Math.random() * Math.PI * 2;
      manta.speed = 4.5;
      manta.flapPhase = Math.random() * Math.PI * 2;

      this.scene.add(manta.mesh);
      this.mantaRays.push(manta);
    }

    // 4. Spawn Deep-Sea Anglerfish with Glowing Lure (ปลาแองเกลอร์ 2 ตัว)
    for (let i = 0; i < 2; i++) {
      const angler = this.createAnglerfish();
      const x = (Math.random() - 0.5) * this.mapBound * 1.4;
      const z = (Math.random() - 0.5) * this.mapBound * 1.4;
      const y = Math.random() * 5 + 3;
      angler.mesh.position.set(x, y, z);
      angler.angle = Math.random() * Math.PI * 2;
      angler.speed = 2.0;

      this.scene.add(angler.mesh);
      this.anglerfish.push(angler);
    }
  }

  // 1. Create Animated Jellyfish
  createJellyfish(glowColorHex) {
    const group = new THREE.Group();

    // Translucent Glowing Bell Dome
    const bellGeo = new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const bellMat = new THREE.MeshStandardMaterial({
      color: glowColorHex,
      emissive: glowColorHex,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.72,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.rotation.x = Math.PI;
    group.add(bell);

    // Inner Core Light
    const innerLight = new THREE.PointLight(glowColorHex, 1.2, 8);
    innerLight.position.set(0, -0.2, 0);
    group.add(innerLight);

    // Dangling Tentacles
    const tentacleCount = 6;
    const tentacles = [];
    const tentacleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: glowColorHex,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.55
    });

    for (let t = 0; t < tentacleCount; t++) {
      const angle = (t / tentacleCount) * Math.PI * 2;
      const r = 0.5;
      const tentacleGeo = new THREE.CylinderGeometry(0.015, 0.005, 1.6, 6);
      const tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
      tentacle.position.set(Math.cos(angle) * r, -1.0, Math.sin(angle) * r);
      group.add(tentacle);
      tentacles.push({ mesh: tentacle, baseAngle: angle, baseRadius: r });
    }

    group.scale.set(0.9, 0.9, 0.9);

    return {
      mesh: group,
      bell: bell,
      tentacles: tentacles,
      color: glowColorHex
    };
  }

  // 2. Create Bioluminescent Fish
  createBioluminescentFish() {
    const group = new THREE.Group();

    const fishMat = new THREE.MeshStandardMaterial({
      color: 0x0a2239,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.7
    });

    // Streamlined Body
    const bodyGeo = new THREE.ConeGeometry(0.2, 0.9, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, fishMat);
    group.add(body);

    // Flapping Tail Fin
    const tailGeo = new THREE.BoxGeometry(0.02, 0.35, 0.3);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0, -0.55);
    group.add(tail);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.12, 0.05, 0.25);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.12, 0.05, 0.25);
    group.add(eyeL);
    group.add(eyeR);

    group.scale.set(0.7, 0.7, 0.7);

    return {
      mesh: group,
      tail: tail
    };
  }

  // 3. Create Majestic Manta Ray
  createMantaRay() {
    const group = new THREE.Group();

    const mantaMat = new THREE.MeshStandardMaterial({
      color: 0x06182a,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.8
    });

    // Central Body
    const bodyGeo = new THREE.ConeGeometry(0.7, 2.8, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, mantaMat);
    body.scale.set(1, 0.25, 1);
    group.add(body);

    // Glowing Neon Dorsal Pattern Stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (let s = -2; s <= 2; s++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.8 - Math.abs(s) * 0.15, 0.04, 0.08), stripeMat);
      stripe.position.set(0, 0.1, s * 0.35);
      group.add(stripe);
    }

    // Left Wing
    const wingGeoL = new THREE.BoxGeometry(2.4, 0.06, 1.8);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0a2a4a,
      emissive: 0x00a8cc,
      emissiveIntensity: 0.3
    });
    const wingL = new THREE.Mesh(wingGeoL, wingMat);
    wingL.position.set(1.4, 0, 0);
    group.add(wingL);

    // Right Wing
    const wingR = new THREE.Mesh(wingGeoL, wingMat);
    wingR.position.set(-1.4, 0, 0);
    group.add(wingR);

    // Whip Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 2.5, 6), mantaMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0, -2.4);
    group.add(tail);

    group.scale.set(1.4, 1.4, 1.4);

    return {
      mesh: group,
      wingL: wingL,
      wingR: wingR
    };
  }

  // 4. Create Deep-Sea Anglerfish with Glowing Lure
  createAnglerfish() {
    const group = new THREE.Group();

    const anglerMat = new THREE.MeshStandardMaterial({
      color: 0x1a120b,
      roughness: 0.9,
      metalness: 0.3
    });

    // Round Bulky Body
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), anglerMat);
    body.scale.set(0.9, 1.0, 1.3);
    group.add(body);

    // Sharp Teeth Jaw
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    for (let t = -3; t <= 3; t++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.18, 4), toothMat);
      tooth.position.set(t * 0.08, -0.2, 0.65);
      tooth.rotation.x = Math.PI / 4;
      group.add(tooth);
    }

    // Glowing Esca (Lure Antenna)
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), anglerMat);
    stalk.position.set(0, 0.5, 0.5);
    stalk.rotation.x = -Math.PI / 4;
    group.add(stalk);

    const lureGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const lureMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const lure = new THREE.Mesh(lureGeo, lureMat);
    lure.position.set(0, 0.8, 0.85);
    group.add(lure);

    const lureLight = new THREE.PointLight(0x00ffaa, 1.8, 8);
    lureLight.position.set(0, 0.8, 0.85);
    group.add(lureLight);

    // Tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 6), anglerMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 0, -0.85);
    group.add(tail);

    return {
      mesh: group,
      tail: tail
    };
  }

  // Update creature movements and swimming animations
  update(delta, dronePos) {
    this.time += delta;

    // 1. Update Jellyfish (Bobbing, undulating bell and swaying tentacles)
    this.jellyfish.forEach(j => {
      const pulse = (Math.sin(this.time * 2.5 * j.speed + j.phase) + 1.0) * 0.5;

      // Bell pulsation (squash & stretch propulsion)
      j.bell.scale.set(1.0 + pulse * 0.2, 1.0 - pulse * 0.35, 1.0 + pulse * 0.2);

      // Vertical undulating drift
      j.mesh.position.y = j.baseY + Math.sin(this.time * 1.2 + j.phase) * 1.5;

      // Gentle horizontal drift
      j.mesh.position.x += Math.cos(this.time * 0.4 + j.phase) * delta * 0.5;
      j.mesh.position.z += Math.sin(this.time * 0.4 + j.phase) * delta * 0.5;

      // Sway tentacles
      j.tentacles.forEach((t, idx) => {
        t.mesh.rotation.x = Math.sin(this.time * 2.0 + idx) * 0.25;
        t.mesh.rotation.z = Math.cos(this.time * 2.0 + idx) * 0.25;
      });

      // Wrap around map boundary
      const limit = this.mapBound * 0.9;
      if (j.mesh.position.x > limit) j.mesh.position.x = -limit;
      if (j.mesh.position.x < -limit) j.mesh.position.x = limit;
      if (j.mesh.position.z > limit) j.mesh.position.z = -limit;
      if (j.mesh.position.z < -limit) j.mesh.position.z = limit;
    });

    // 2. Update Fish Schools (Smooth swimming & tail flapping)
    this.fishSchools.forEach(f => {
      f.mesh.position.addScaledVector(f.velocity, delta);

      // Flap tail fin
      f.tail.rotation.y = Math.sin(this.time * 14.0 + f.swimPhase) * 0.45;

      // Orient heading with velocity
      f.mesh.lookAt(
        f.mesh.position.x + f.velocity.x,
        f.mesh.position.y + f.velocity.y,
        f.mesh.position.z + f.velocity.z
      );

      // Turn smoothly if reaching boundary
      const limit = this.mapBound * 0.85;
      if (Math.abs(f.mesh.position.x) > limit || Math.abs(f.mesh.position.z) > limit) {
        f.velocity.x *= -0.9;
        f.velocity.z *= -0.9;
      }
    });

    // 3. Update Manta Rays (Wing flapping & graceful cruising)
    this.mantaRays.forEach(m => {
      m.angle += delta * 0.2;
      const vx = Math.cos(m.angle) * m.speed;
      const vz = Math.sin(m.angle) * m.speed;

      m.mesh.position.x += vx * delta;
      m.mesh.position.z += vz * delta;
      m.mesh.position.y += Math.sin(this.time * 0.8 + m.flapPhase) * delta * 0.6;

      m.mesh.rotation.y = -m.angle + Math.PI / 2;

      // Sine-wave wing flap
      const flap = Math.sin(this.time * 2.5 + m.flapPhase) * 0.35;
      m.wingL.rotation.z = flap;
      m.wingR.rotation.z = -flap;

      const limit = this.mapBound * 0.9;
      if (Math.abs(m.mesh.position.x) > limit || Math.abs(m.mesh.position.z) > limit) {
        m.angle += Math.PI * 0.6;
      }
    });

    // 4. Update Anglerfish (Slow predatory patrol)
    this.anglerfish.forEach(a => {
      a.angle += delta * 0.15;
      const vx = Math.cos(a.angle) * a.speed;
      const vz = Math.sin(a.angle) * a.speed;

      a.mesh.position.x += vx * delta;
      a.mesh.position.z += vz * delta;
      a.mesh.rotation.y = -a.angle + Math.PI / 2;
      a.tail.rotation.y = Math.sin(this.time * 6.0) * 0.3;

      const limit = this.mapBound * 0.85;
      if (Math.abs(a.mesh.position.x) > limit || Math.abs(a.mesh.position.z) > limit) {
        a.angle += Math.PI * 0.7;
      }
    });
  }

  cleanup() {
    this.jellyfish.forEach(j => this.scene.remove(j.mesh));
    this.fishSchools.forEach(f => this.scene.remove(f.mesh));
    this.mantaRays.forEach(m => this.scene.remove(m.mesh));
    this.anglerfish.forEach(a => this.scene.remove(a.mesh));

    this.jellyfish = [];
    this.fishSchools = [];
    this.mantaRays = [];
    this.anglerfish = [];
  }
}
