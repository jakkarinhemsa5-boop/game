/**
 * Environment System: Seabed Terrain, Glowing Coral Reefs, Sea Anemones, Rocks, Marine Snow & Fog
 */

class OceanEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.terrainMesh = null;
    this.props = [];
    this.marineSnow = null;
    this.boundaryMarkers = [];
    this.mapSize = 80;
    this.time = 0;
  }

  init() {
    this.setupLightingAndFog();
    this.createMarineSnow();
  }

  setupLightingAndFog() {
    this.scene.fog = new THREE.FogExp2(0x010914, 0.024);
    this.ambientLight = new THREE.AmbientLight(0x02162e, 0.28);
    this.scene.add(this.ambientLight);
  }

  getTerrainHeight(x, z) {
    const d1 = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 1.8;
    const d2 = Math.sin(x * 0.15 + z * 0.1) * 0.7;
    const d3 = Math.cos(x * 0.02 - z * 0.03) * 2.2;
    return d1 + d2 + d3;
  }

  createSandTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1c2e3d');
    grad.addColorStop(0.5, '#152533');
    grad.addColorStop(1, '#0e1b27');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 1.8;
      const bright = Math.random() * 30;
      ctx.fillStyle = `rgba(${30 + bright}, ${50 + bright}, ${70 + bright}, 0.2)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 35);
      ctx.bezierCurveTo(150, i * 35 + 20, 350, i * 35 - 20, 512, i * 35 + 10);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
  }

  buildTerrain(mapSize) {
    this.mapSize = mapSize;

    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      this.terrainMesh.material.dispose();
    }

    const segments = Math.min(160, Math.floor(mapSize * 1.2));
    const geometry = new THREE.PlaneGeometry(mapSize * 2.2, mapSize * 2.2, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getTerrainHeight(vx, vz);
      pos.setY(i, vy);
    }
    geometry.computeVertexNormals();

    const sandTex = this.createSandTexture();
    const material = new THREE.MeshStandardMaterial({
      map: sandTex,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: false
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    this.spawnEnvironmentProps();
    this.spawnBoundaryMarkers();
  }

  // Spawn Glowing Coral Reefs, Sea Anemones, Sponges, Kelp Forests and Boulders
  spawnEnvironmentProps() {
    this.props.forEach(p => {
      this.scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
    });
    this.props = [];

    const propCount = Math.floor(this.mapSize * 1.3);

    // Coral Glowing Colors Palette
    const coralColors = [
      { color: 0x00f0ff, emissive: 0x0088aa }, // Cyan
      { color: 0xff00aa, emissive: 0xaa0066 }, // Pink / Magenta
      { color: 0xa855f7, emissive: 0x6b21a8 }, // Purple
      { color: 0xffb703, emissive: 0xd97706 }, // Golden Amber
      { color: 0x00ffaa, emissive: 0x059669 }  // Emerald
    ];

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1e2d3d,
      roughness: 0.92,
      metalness: 0.15
    });

    for (let i = 0; i < propCount; i++) {
      const x = (Math.random() - 0.5) * this.mapSize * 1.85;
      const z = (Math.random() - 0.5) * this.mapSize * 1.85;
      const y = this.getTerrainHeight(x, z);
      const rand = Math.random();

      const colScheme = coralColors[Math.floor(Math.random() * coralColors.length)];
      const coralMat = new THREE.MeshStandardMaterial({
        color: colScheme.color,
        emissive: colScheme.emissive,
        emissiveIntensity: 0.65,
        roughness: 0.35,
        metalness: 0.3
      });

      if (rand < 0.30) {
        // 1. Branching Staghorn Coral Reef (ปะการังเขากวางแตกกิ่ง)
        const coralGroup = new THREE.Group();
        const mainBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.25, 2.2, 8), coralMat);
        mainBranch.position.y = 1.1;
        coralGroup.add(mainBranch);

        const branchCount = Math.floor(Math.random() * 4) + 3;
        for (let b = 0; b < branchCount; b++) {
          const subLen = Math.random() * 1.0 + 0.6;
          const sub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, subLen, 6), coralMat);
          const angle = (b / branchCount) * Math.PI * 2;
          sub.position.set(Math.cos(angle) * 0.35, 1.2 + Math.random() * 0.6, Math.sin(angle) * 0.35);
          sub.rotation.set((Math.random() - 0.5) * 0.8, angle, (Math.random() - 0.5) * 0.8);
          coralGroup.add(sub);
        }

        coralGroup.position.set(x, y, z);
        coralGroup.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(coralGroup);
        this.props.push(coralGroup);

      } else if (rand < 0.55) {
        // 2. Glowing Sea Anemone with Swaying Tentacles (ดอกไม้ทะเลเรืองแสง)
        const anemoneGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), coralMat);
        base.scale.set(1, 0.4, 1);
        anemoneGroup.add(base);

        const tentCount = 10;
        for (let t = 0; t < tentCount; t++) {
          const tLen = Math.random() * 0.8 + 0.6;
          const tent = new THREE.Mesh(new THREE.ConeGeometry(0.04, tLen, 6), coralMat);
          const a = (t / tentCount) * Math.PI * 2;
          tent.position.set(Math.cos(a) * 0.25, tLen * 0.45, Math.sin(a) * 0.25);
          tent.rotation.set((Math.random() - 0.5) * 0.4, a, (Math.random() - 0.5) * 0.4);
          anemoneGroup.add(tent);
        }

        anemoneGroup.position.set(x, y, z);
        this.scene.add(anemoneGroup);
        this.props.push(anemoneGroup);

      } else if (rand < 0.75) {
        // 3. Deep Sea Dome / Brain Coral (ปะการังสมองเรืองแสง)
        const domeGroup = new THREE.Group();
        const dome = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), coralMat);
        dome.scale.set(1.2, 0.7, 1.2);
        dome.position.y = 0.5;
        domeGroup.add(dome);

        domeGroup.position.set(x, y, z);
        this.scene.add(domeGroup);
        this.props.push(domeGroup);

      } else if (rand < 0.90) {
        // 4. Underwater Boulder (โขดหินใต้ทะเลลึก)
        const scale = Math.random() * 2.2 + 0.8;
        const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
        const pos = rockGeo.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          pos.setXYZ(
            j,
            pos.getX(j) * (1 + (Math.random() - 0.5) * 0.25),
            pos.getY(j) * (0.6 + (Math.random() - 0.5) * 0.2),
            pos.getZ(j) * (1 + (Math.random() - 0.5) * 0.25)
          );
        }
        rockGeo.computeVertexNormals();

        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, y + scale * 0.4, z);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
        this.props.push(rock);

      } else {
        // 5. Deep Sea Kelp Forest (ป่าสาหร่ายทะเลลึก)
        const kelpGroup = new THREE.Group();
        const stalks = Math.floor(Math.random() * 4) + 2;
        const kelpMat = new THREE.MeshStandardMaterial({
          color: 0x064e3b,
          emissive: 0x047857,
          emissiveIntensity: 0.35,
          roughness: 0.6
        });

        for (let s = 0; s < stalks; s++) {
          const kelpGeo = new THREE.CylinderGeometry(0.04, 0.08, 4.8, 6);
          const stalk = new THREE.Mesh(kelpGeo, kelpMat);
          stalk.position.set((Math.random() - 0.5) * 0.8, 2.4, (Math.random() - 0.5) * 0.8);
          stalk.rotation.z = (Math.random() - 0.5) * 0.25;
          kelpGroup.add(stalk);
        }
        kelpGroup.position.set(x, y, z);
        this.scene.add(kelpGroup);
        this.props.push(kelpGroup);
      }
    }
  }

  spawnBoundaryMarkers() {
    this.boundaryMarkers.forEach(m => this.scene.remove(m));
    this.boundaryMarkers = [];

    const half = this.mapSize;
    const step = 20;

    const buoyGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    const buoyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 1.2
    });

    const createMarker = (x, z) => {
      const y = this.getTerrainHeight(x, z);
      const group = new THREE.Group();
      const base = new THREE.Mesh(buoyGeo, buoyMat);
      base.position.y = 1.5;
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), beaconMat);
      beacon.position.y = 3.2;

      group.add(base);
      group.add(beacon);
      group.position.set(x, y, z);
      this.scene.add(group);
      this.boundaryMarkers.push(group);
    };

    for (let x = -half; x <= half; x += step) {
      createMarker(x, -half);
      createMarker(x, half);
    }
    for (let z = -half + step; z < half; z += step) {
      createMarker(-half, z);
      createMarker(half, z);
    }
  }

  createMarineSnow() {
    const count = 700;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      speeds[i] = Math.random() * 0.4 + 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.snowSpeeds = speeds;

    const material = new THREE.PointsMaterial({
      color: 0x90e0ef,
      size: 0.35,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.marineSnow = new THREE.Points(geometry, material);
    this.scene.add(this.marineSnow);
  }

  update(delta, dronePos) {
    this.time += delta;

    // Marine snow floating downward & drifting
    if (this.marineSnow) {
      const posAttr = this.marineSnow.geometry.attributes.position;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        let py = posAttr.getY(i) - this.snowSpeeds[i] * delta * 1.5;
        let px = posAttr.getX(i) + Math.sin(py * 0.5 + i) * delta * 0.3;
        let pz = posAttr.getZ(i) + Math.cos(py * 0.5 + i) * delta * 0.3;

        const dx = px - dronePos.x;
        const dz = pz - dronePos.z;

        if (py < 0) py = 18;
        if (dx > 60) px -= 120;
        if (dx < -60) px += 120;
        if (dz > 60) pz -= 120;
        if (dz < -60) pz += 120;

        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;
    }
  }

  setLevelDepth(level) {
    const density = 0.022 + (level - 1) * 0.005;
    this.scene.fog.density = Math.min(0.045, density);
  }
}
