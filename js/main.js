/**
 * Main Game Controller: Loop, State Machine & 100 Stages Progression
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // Subsystems
    this.ui = null;
    this.environment = null;
    this.creatures = null;
    this.drone = null;
    this.objects = null;
    this.currents = null;
    this.sonar = null;
    this.minimap = null;

    // Saved Progress & Career Stats (LocalStorage)
    this.unlockedLevel = parseInt(localStorage.getItem('needle_unlocked_level') || '1');
    this.highScore = parseInt(localStorage.getItem('needle_high_score') || '0');
    this.totalNeedles = parseInt(localStorage.getItem('needle_total_needles') || '0');
    this.difficulty = localStorage.getItem('needle_difficulty') || 'normal';
    this.selectedLevel = Math.min(100, this.unlockedLevel);

    // Active Game State
    this.state = 'MENU';
    this.level = 1;
    this.score = 0;
    this.needlesFound = 0;
    this.needlesFoundInLevel = 0;
    this.targetNeedlesInLevel = 1;
    this.energy = 100.0;
    this.elapsedTime = 0;
    this.levelStartTime = 0;
    this.lastTime = 0;

    this.cameraOffset = new THREE.Vector3(0, 32, 14);
  }

  init() {
    this.setupThreeRenderer();
    this.setupSystems();
    this.setupEventListeners();
    this.setupVirtualJoystick();
    this.openMainMenu();

    requestAnimationFrame((t) => this.loop(t));
  }

  setupThreeRenderer() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 300);
    this.camera.position.set(0, 35, 16);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.canvas.clientWidth || window.innerWidth, this.canvas.clientHeight || (window.innerHeight - 80));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  setupSystems() {
    this.ui = new UIManager();
    this.environment = new OceanEnvironment(this.scene);
    this.environment.init();

    this.creatures = new OceanCreatures(this.scene);

    this.drone = new SubmarineDrone(this.scene);
    this.drone.init();

    this.objects = new OceanObjects(this.scene);
    this.objects.init();

    this.currents = new OceanCurrents(this.scene);
    this.currents.init();

    this.sonar = new SonarSystem(this.scene);
    this.sonar.init();

    this.minimap = window.seabedMinimap;
    if (this.minimap) {
      this.minimap.init();
    }
  }

  selectStage(lvl) {
    if (lvl > this.unlockedLevel) return;
    this.selectedLevel = lvl;

    this.ui.renderSectorAndGrid(
      this.unlockedLevel,
      this.selectedLevel,
      this.difficulty,
      (chosenLvl) => {
        this.selectStage(chosenLvl);
      }
    );
  }

  openMainMenu() {
    this.state = 'MENU';
    this.ui.updateCareerProfile(this.highScore, this.totalNeedles);
    this.ui.setDifficultyActive(this.difficulty);

    this.ui.setupDifficultyEvents((diff) => {
      this.difficulty = diff;
      localStorage.setItem('needle_difficulty', this.difficulty);
      this.selectStage(this.selectedLevel);
    });

    this.selectStage(this.selectedLevel);
    this.ui.showModal('start');
  }

  setupEventListeners() {
    const handleResize = () => {
      const container = document.getElementById('viewport-container');
      const w = container ? container.clientWidth : window.innerWidth;
      const h = container ? container.clientHeight : window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);

    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        window.soundEngine.init();
        this.loadLevel(this.selectedLevel);
      });
    }

    const btnNext = document.getElementById('btn-next-level');
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextLevel();
      });
    }

    const btnBackMenu = document.getElementById('btn-back-to-menu');
    if (btnBackMenu) {
      btnBackMenu.addEventListener('click', () => {
        this.openMainMenu();
      });
    }

    const btnGameOverMenu = document.getElementById('btn-gameover-menu');
    if (btnGameOverMenu) {
      btnGameOverMenu.addEventListener('click', () => {
        this.openMainMenu();
      });
    }

    const btnRestart = document.getElementById('btn-restart-game');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.loadLevel(this.level);
      });
    }

    if (this.ui && this.ui.btnAudio) {
      this.ui.btnAudio.addEventListener('click', () => {
        const isMuted = !window.soundEngine.toggleMute();
        this.ui.setAudioButton(isMuted);
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleInspection();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.toggleBoost();
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 0 && this.state === 'PLAYING') {
        this.handleInspection();
      }
    });
  }

  toggleBoost() {
    if (!this.drone) return;
    this.drone.virtualBoost = !this.drone.virtualBoost;
    const boostBtn = document.getElementById('btn-ctrl-boost');
    if (boostBtn) {
      if (this.drone.virtualBoost) {
        boostBtn.classList.add('active');
        boostBtn.innerHTML = '<span>⚡ BOOST [ON]</span>';
      } else {
        boostBtn.classList.remove('active');
        boostBtn.innerHTML = '<span>⚡ BOOST</span>';
      }
    }
  }

  setupVirtualJoystick() {
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    if (!base || !thumb) return;

    let isDragging = false;
    let dragPointerId = null;
    const maxRadius = 38;

    const handlePointerMove = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance > maxRadius) {
        const angle = Math.atan2(dy, dx);
        dx = Math.cos(angle) * maxRadius;
        dy = Math.sin(angle) * maxRadius;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;

      if (this.drone && this.drone.joystickVector) {
        this.drone.joystickVector.set(dx / maxRadius, dy / maxRadius);
      }
    };

    const stopDragging = () => {
      if (!isDragging) return;
      isDragging = false;
      dragPointerId = null;
      base.classList.remove('dragging');
      thumb.style.transition = 'transform 0.15s ease-out';
      thumb.style.transform = 'translate(0px, 0px)';
      setTimeout(() => { thumb.style.transition = ''; }, 160);

      if (this.drone && this.drone.joystickVector) {
        this.drone.joystickVector.set(0, 0);
      }
    };

    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      dragPointerId = e.pointerId;
      base.classList.add('dragging');
      handlePointerMove(e.clientX, e.clientY);
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging || (dragPointerId !== null && e.pointerId !== dragPointerId)) return;
      e.preventDefault();
      handlePointerMove(e.clientX, e.clientY);
    });

    window.addEventListener('pointerup', (e) => {
      if (isDragging && (dragPointerId === null || e.pointerId === dragPointerId)) {
        stopDragging();
      }
    });

    window.addEventListener('pointercancel', stopDragging);

    const boostBtn = document.getElementById('btn-ctrl-boost');
    if (boostBtn) {
      boostBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleBoost();
      });
    }

    const scanBtn = document.getElementById('btn-ctrl-scan');
    if (scanBtn) {
      scanBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        scanBtn.classList.add('pressed');
        this.handleInspection();
      });
      scanBtn.addEventListener('pointerup', () => scanBtn.classList.remove('pressed'));
      scanBtn.addEventListener('pointercancel', () => scanBtn.classList.remove('pressed'));
      scanBtn.addEventListener('pointerleave', () => scanBtn.classList.remove('pressed'));
    }
  }

  loadLevel(level) {
    this.level = level;
    this.selectedLevel = level;
    this.energy = 100.0;
    this.elapsedTime = 0;
    this.needlesFoundInLevel = 0;
    this.levelStartTime = performance.now();
    this.lastTime = performance.now();

    if (this.drone) this.drone.virtualBoost = false;
    const boostBtn = document.getElementById('btn-ctrl-boost');
    if (boostBtn) {
      boostBtn.classList.remove('active');
      boostBtn.innerHTML = '<span>⚡ BOOST</span>';
    }

    this.targetNeedlesInLevel = this.ui.getNeedleCount(level, this.difficulty);

    const stage = this.ui.stageDatabase.find(s => s.level === level) || this.ui.stageDatabase[0];
    const mapBound = stage.map;
    const decoyCount = stage.decoys;

    this.environment.setLevelDepth(level);
    this.environment.buildTerrain(mapBound);

    if (this.creatures) {
      this.creatures.init(mapBound);
    }

    this.drone.resetPosition();
    this.drone.setLevel(level, mapBound);

    const terrainHeightFunc = (x, z) => this.environment.getTerrainHeight(x, z);

    this.objects.spawnNeedles(this.targetNeedlesInLevel, mapBound, level, terrainHeightFunc);
    this.objects.spawnDecoys(decoyCount, mapBound, this.objects.needles, terrainHeightFunc);

    this.currents.setLevel(level);

    if (this.minimap) {
      this.minimap.resetLevel(mapBound, level);
    }

    this.ui.hideAllModals();
    this.ui.setLevelInfo(level);
    this.ui.updateNeedleCounter(this.needlesFoundInLevel, this.targetNeedlesInLevel);
    this.ui.updateEnergy(this.energy);
    this.ui.updateScore(this.score);
    this.state = 'PLAYING';
  }

  nextLevel() {
    this.loadLevel(this.level + 1);
  }

  handleInspection() {
    if (this.state !== 'PLAYING') return;

    this.drone.pulseClaw();

    const inspectWave = document.getElementById('inspect-wave');
    if (inspectWave) {
      inspectWave.className = 'inspect-wave anim-ping';
      setTimeout(() => {
        inspectWave.className = 'inspect-wave';
      }, 600);
    }

    const result = this.sonar.inspectTarget(
      this.drone.position,
      this.objects.needles,
      this.objects.decoys
    );

    if (result.success && result.targetNeedle) {
      this.objects.collectNeedle(result.targetNeedle);
      this.needlesFoundInLevel++;
      this.needlesFound++;
      this.totalNeedles++;
      localStorage.setItem('needle_total_needles', this.totalNeedles.toString());

      this.ui.updateNeedleCounter(this.needlesFoundInLevel, this.targetNeedlesInLevel);
      window.soundEngine.playRecoverySuccess();
      this.ui.showSuccessFlash();

      if (this.needlesFoundInLevel >= this.targetNeedlesInLevel) {
        this.state = 'CLEAR';

        if (this.level >= this.unlockedLevel) {
          this.unlockedLevel = Math.min(100, this.level + 1);
          localStorage.setItem('needle_unlocked_level', this.unlockedLevel.toString());
        }

        const timeTakenSec = Math.floor((performance.now() - this.levelStartTime) / 1000);
        const mins = Math.floor(timeTakenSec / 60).toString().padStart(2, '0');
        const secs = (timeTakenSec % 60).toString().padStart(2, '0');
        const timeString = `${mins}:${secs}`;

        const diffMultiplier = this.difficulty === 'abyssal' ? 2.5 : (this.difficulty === 'normal' ? 1.5 : 1.0);
        const energyBonus = Math.round(this.energy * 10);
        const timeBonus = Math.max(100, Math.floor((120 - timeTakenSec) * 15));
        const levelScore = Math.round((this.level * 1000 * this.targetNeedlesInLevel + energyBonus + timeBonus) * diffMultiplier);
        this.score += levelScore;

        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('needle_high_score', this.highScore.toString());
        }

        this.ui.updateScore(this.score);

        setTimeout(() => {
          this.ui.showModal('clear', {
            timeString: timeString,
            bonus: energyBonus + timeBonus,
            totalScore: this.score,
            level: this.level,
            difficulty: this.difficulty
          });
        }, 650);
      }
    } else {
      window.soundEngine.playPenaltyBuzzer();
      this.ui.showPenaltyFlash();
      const penaltyAmount = this.difficulty === 'abyssal' ? 20.0 : 15.0;
      this.energy = Math.max(0, this.energy - penaltyAmount);
      this.ui.updateEnergy(this.energy);

      if (this.energy <= 0) {
        this.handleGameOver();
      }
    }
  }

  handleGameOver() {
    this.state = 'GAMEOVER';
    this.ui.showModal('gameover', {
      level: this.level,
      needlesFound: this.needlesFound,
      score: this.score
    });
  }

  loop(timestamp) {
    requestAnimationFrame((t) => this.loop(t));

    if (!this.lastTime) this.lastTime = timestamp;
    const delta = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.elapsedTime += delta;

      // 1. Update Ocean Currents
      this.currents.update(delta, this.drone.position);
      const currentForce = this.currents.getForce();
      this.ui.updateCurrent(this.currents.getUIInfo());

      // 2. Update Submarine Drone Physics & Controls
      this.drone.update(delta, currentForce, (x, z) => this.environment.getTerrainHeight(x, z));

      // 3. Update Marine Creatures
      if (this.creatures) {
        this.creatures.update(delta, this.drone.position);
      }

      // 4. Update Needles & Decoys Visual Glowing
      this.objects.update(delta, this.drone.position, this.drone.spotlightTarget.position, this.drone.lightRadius);

      // 5. Update Tactical Seabed Minimap
      if (this.minimap) {
        this.minimap.update(
          delta,
          this.drone.position,
          this.drone.rotationY,
          this.drone.lightRadius,
          0,
          0
        );
      }

      // 6. Update Environment
      this.environment.update(delta, this.drone.position);

      // 7. Smooth Camera Tracking
      const targetCamPos = this.drone.position.clone().add(this.cameraOffset);
      this.camera.position.lerp(targetCamPos, delta * 3.5);
      this.camera.lookAt(
        this.drone.position.x,
        this.drone.position.y - 1.5,
        this.drone.position.z
      );
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
  window.gameApp.init();
});
