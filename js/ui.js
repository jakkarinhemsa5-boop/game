/**
 * UI & HUD Controller for "Needle in the Ocean"
 * (จัดการหน้าจอ HUD, ระบบ 100 ด่านพร้อม Sector Navigation, และระบบเลือกระดับความยาก)
 */

class UIManager {
  constructor() {
    // Top Bar Elements
    this.hudLevelPill = document.getElementById('hud-level-pill');
    this.hudLocation = document.getElementById('hud-location');
    this.hudEnergyText = document.getElementById('hud-energy-text');
    this.hudEnergyBar = document.getElementById('hud-energy-bar');
    this.hudNeedleCounter = document.getElementById('hud-needle-counter');
    this.hudScore = document.getElementById('hud-score');

    // Reticle & Screen Flash
    this.reticle = document.getElementById('reticle');
    this.screenFlash = document.getElementById('screen-flash');

    // Ocean Currents Panel
    this.currentPanel = document.getElementById('current-warning-panel');
    this.currentArrow = document.getElementById('current-arrow');
    this.currentText = document.getElementById('current-text');

    // Action Buttons
    this.btnMenu = document.getElementById('btn-menu-toggle');
    this.btnOpenMenu = document.getElementById('btn-open-menu');
    this.btnAudio = document.getElementById('btn-audio-toggle');
    this.audioIcon = document.getElementById('audio-icon');
    this.btnHelp = document.getElementById('btn-help-toggle');
    this.btnFullscreen = document.getElementById('btn-fullscreen');

    // Modals
    this.modalStart = document.getElementById('modal-start');
    this.modalClear = document.getElementById('modal-clear');
    this.modalGameOver = document.getElementById('modal-gameover');
    this.levelNextWarning = document.getElementById('level-next-warning');

    // Difficulty Buttons
    this.diffBtns = {
      casual: document.getElementById('diff-btn-casual'),
      normal: document.getElementById('diff-btn-normal'),
      abyssal: document.getElementById('diff-btn-abyssal')
    };

    // 100 Stages & Sector Navigation Elements
    this.stageGridContainer = document.getElementById('stage-grid-container');
    this.sectorTabsContainer = document.getElementById('sector-tabs-container');
    this.sectorTitleText = document.getElementById('sector-title-text');
    this.btnSectorPrev = document.getElementById('btn-sector-prev');
    this.btnSectorNext = document.getElementById('btn-sector-next');
    this.btnJumpCurrent = document.getElementById('btn-jump-current');

    this.menuStatHighscore = document.getElementById('menu-stat-highscore');
    this.menuStatNeedles = document.getElementById('menu-stat-needles');
    this.menuUnlockedProgress = document.getElementById('menu-unlocked-progress');
    this.btnStartLabel = document.getElementById('btn-start-label');

    // Dossier Elements
    this.dossierLevelBadge = document.getElementById('dossier-level-badge');
    this.dossierLevelName = document.getElementById('dossier-level-name');
    this.dossierDepth = document.getElementById('dossier-depth');
    this.dossierNeedlesCount = document.getElementById('dossier-needles-count');
    this.dossierDecoys = document.getElementById('dossier-decoys');
    this.dossierCurrent = document.getElementById('dossier-current');

    // Stats
    this.statTime = document.getElementById('stat-time');
    this.statO2 = document.getElementById('stat-o2');
    this.statScore = document.getElementById('stat-score');
    this.statNextDepth = document.getElementById('stat-next-depth');

    this.statGameOverLevel = document.getElementById('stat-gameover-level');
    this.statGameOverNeedles = document.getElementById('stat-gameover-needles');
    this.statGameOverScore = document.getElementById('stat-gameover-score');

    // Generate 100 Stages Database
    this.stageDatabase = StageDatabase.generateAllStages();
    this.sectors = StageDatabase.SECTORS;
    this.activeSectorId = 1;

    this.setupButtonEvents();
  }

  setupButtonEvents() {
    const toggleMenu = () => {
      this.modalStart.classList.toggle('active');
    };

    if (this.btnMenu) this.btnMenu.addEventListener('click', toggleMenu);
    if (this.btnOpenMenu) this.btnOpenMenu.addEventListener('click', toggleMenu);
    if (this.btnHelp) this.btnHelp.addEventListener('click', toggleMenu);

    if (this.btnFullscreen) {
      this.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  setupDifficultyEvents(onSelectDifficulty) {
    Object.keys(this.diffBtns).forEach(diffKey => {
      const btn = this.diffBtns[diffKey];
      if (!btn) return;
      btn.addEventListener('click', () => {
        Object.values(this.diffBtns).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (typeof onSelectDifficulty === 'function') {
          onSelectDifficulty(diffKey);
        }
      });
    });
  }

  setDifficultyActive(diffKey) {
    Object.keys(this.diffBtns).forEach(k => {
      if (this.diffBtns[k]) {
        this.diffBtns[k].classList.toggle('active', k === diffKey);
      }
    });
  }

  // Scaling needle count across 100 levels
  getNeedleCount(level, difficulty) {
    const progress = Math.min(1.0, (level - 1) / 99);

    if (difficulty === 'casual') {
      // 1 to 5 needles
      return Math.min(5, Math.floor(1 + progress * 4));
    } else if (difficulty === 'abyssal') {
      // 3 to 14 needles
      return Math.min(14, Math.floor(3 + progress * 11));
    } else {
      // Normal: 2 to 8 needles
      return Math.min(8, Math.floor(2 + progress * 6));
    }
  }

  updateNeedleCounter(found, total) {
    if (this.hudNeedleCounter) {
      this.hudNeedleCounter.innerText = `🪡 เข็ม: ${found} / ${total} เล่ม`;
      if (found >= total && total > 0) {
        this.hudNeedleCounter.style.background = 'rgba(0, 255, 170, 0.35)';
      } else {
        this.hudNeedleCounter.style.background = 'rgba(0, 255, 170, 0.15)';
      }
    }
  }

  // Render Sector Tabs and 100-Stage Grid
  renderSectorAndGrid(unlockedLevel, selectedLevel, difficulty, onSelectCallback) {
    this.activeSectorId = Math.min(10, Math.max(1, Math.floor((selectedLevel - 1) / 10) + 1));
    this.renderSectorTabs(unlockedLevel, selectedLevel, difficulty, onSelectCallback);
    this.renderStageGridForSector(this.activeSectorId, unlockedLevel, selectedLevel, difficulty, onSelectCallback);
  }

  renderSectorTabs(unlockedLevel, selectedLevel, difficulty, onSelectCallback) {
    if (!this.sectorTabsContainer) return;
    this.sectorTabsContainer.innerHTML = '';

    const currentSector = this.sectors.find(s => s.id === this.activeSectorId) || this.sectors[0];
    if (this.sectorTitleText) {
      this.sectorTitleText.innerText = currentSector.name;
    }

    if (this.menuUnlockedProgress) {
      this.menuUnlockedProgress.innerText = `ปลดล็อกแล้ว: ${Math.min(100, unlockedLevel)} / 100 ด่าน`;
    }

    this.sectors.forEach(sec => {
      const isSectorUnlocked = unlockedLevel >= sec.minLvl;
      const isSectorActive = sec.id === this.activeSectorId;

      const tab = document.createElement('button');
      let tabClass = 'sector-tab-btn';
      if (isSectorActive) tabClass += ' active';
      if (!isSectorUnlocked) tabClass += ' locked';

      tab.className = tabClass;
      tab.innerHTML = `
        <span class="sector-tab-num">Z${sec.id}</span>
        <span class="sector-tab-range">${sec.minLvl}-${sec.maxLvl}</span>
      `;

      if (isSectorUnlocked) {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          this.activeSectorId = sec.id;
          this.renderSectorTabs(unlockedLevel, selectedLevel, difficulty, onSelectCallback);
          this.renderStageGridForSector(this.activeSectorId, unlockedLevel, selectedLevel, difficulty, onSelectCallback);
        });
      }

      this.sectorTabsContainer.appendChild(tab);
    });

    // Sector Prev / Next Buttons
    if (this.btnSectorPrev) {
      this.btnSectorPrev.onclick = () => {
        if (this.activeSectorId > 1) {
          this.activeSectorId--;
          this.renderSectorTabs(unlockedLevel, selectedLevel, difficulty, onSelectCallback);
          this.renderStageGridForSector(this.activeSectorId, unlockedLevel, selectedLevel, difficulty, onSelectCallback);
        }
      };
    }

    if (this.btnSectorNext) {
      this.btnSectorNext.onclick = () => {
        const maxSectorUnlocked = Math.min(10, Math.floor((unlockedLevel - 1) / 10) + 1);
        if (this.activeSectorId < maxSectorUnlocked) {
          this.activeSectorId++;
          this.renderSectorTabs(unlockedLevel, selectedLevel, difficulty, onSelectCallback);
          this.renderStageGridForSector(this.activeSectorId, unlockedLevel, selectedLevel, difficulty, onSelectCallback);
        }
      };
    }

    if (this.btnJumpCurrent) {
      this.btnJumpCurrent.onclick = () => {
        if (typeof onSelectCallback === 'function') {
          onSelectCallback(Math.min(100, unlockedLevel));
        }
      };
    }
  }

  renderStageGridForSector(sectorId, unlockedLevel, selectedLevel, difficulty, onSelectCallback) {
    if (!this.stageGridContainer) return;
    this.stageGridContainer.innerHTML = '';

    const sectorStages = this.stageDatabase.filter(s => s.sectorId === sectorId);

    sectorStages.forEach((stage) => {
      const isCleared = stage.level < unlockedLevel;
      const isCurrent = stage.level === unlockedLevel;
      const isLocked = stage.level > unlockedLevel;
      const isSelected = stage.level === selectedLevel;

      const card = document.createElement('div');
      let statusClass = isLocked ? 'locked' : (isCleared ? 'cleared' : 'current');
      if (isSelected) statusClass += ' selected';

      card.className = `stage-card ${statusClass}`;

      let iconHtml = '🔒';
      let badgeHtml = '<span class="stage-badge-label locked-badge">LOCKED</span>';

      if (isCleared) {
        iconHtml = '⭐';
        badgeHtml = '<span class="stage-badge-label cleared-badge">CLEARED</span>';
      } else if (isCurrent) {
        iconHtml = '🎯';
        badgeHtml = '<span class="stage-badge-label active-badge">READY</span>';
      }

      card.innerHTML = `
        <div class="stage-num-badge">LVL ${stage.level}</div>
        <div class="stage-depth-text">-${stage.depth.toLocaleString()}M</div>
        <div class="stage-status-icon">${iconHtml}</div>
        ${badgeHtml}
      `;

      if (!isLocked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof onSelectCallback === 'function') {
            onSelectCallback(stage.level);
          }
        });
      }

      this.stageGridContainer.appendChild(card);
    });

    this.updateDossier(selectedLevel, difficulty);
  }

  // Update Selected Stage Briefing Dossier
  updateDossier(level, difficulty) {
    const stage = this.stageDatabase.find(s => s.level === level) || this.stageDatabase[0];
    const needleCount = this.getNeedleCount(stage.level, difficulty || 'normal');

    if (this.dossierLevelBadge) this.dossierLevelBadge.innerText = `🎯 ด่านที่เลือก: LEVEL ${stage.level} (${stage.sectorName.split(':')[0]})`;
    if (this.dossierLevelName) this.dossierLevelName.innerText = stage.name;
    if (this.dossierDepth) this.dossierDepth.innerText = `-${stage.depth.toLocaleString()} M`;
    if (this.dossierNeedlesCount) this.dossierNeedlesCount.innerText = `${needleCount} เล่ม`;
    if (this.dossierDecoys) this.dossierDecoys.innerText = stage.decoys === 0 ? '0 ชิ้น (ไม่มี)' : `${stage.decoys} ชิ้น`;
    if (this.dossierCurrent) this.dossierCurrent.innerText = stage.current;

    if (this.btnStartLabel) {
      this.btnStartLabel.innerText = `START MISSION (LEVEL ${stage.level})`;
    }
  }

  updateCareerProfile(highScore, needles) {
    if (this.menuStatHighscore) this.menuStatHighscore.innerText = highScore.toLocaleString();
    if (this.menuStatNeedles) this.menuStatNeedles.innerText = needles.toLocaleString();
  }

  updateEnergy(percent) {
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    if (this.hudEnergyText) this.hudEnergyText.innerText = `${p}%`;
    if (this.hudEnergyBar) {
      this.hudEnergyBar.style.width = `${p}%`;
      if (p < 25) {
        this.hudEnergyBar.style.background = 'var(--danger-red)';
      } else if (p < 55) {
        this.hudEnergyBar.style.background = 'var(--energy-yellow)';
      } else {
        this.hudEnergyBar.style.background = 'linear-gradient(90deg, #ffb703, #00f0ff)';
      }
    }
  }

  updateScore(score) {
    if (this.hudScore) this.hudScore.innerText = score.toLocaleString();
  }

  updateCurrent(currentInfo) {
    if (!currentInfo) {
      if (this.currentPanel) this.currentPanel.style.display = 'none';
      return;
    }

    if (this.currentPanel) {
      this.currentPanel.style.display = 'flex';
      this.currentText.innerText = `CURRENT: ${currentInfo.speedKts} KTS ${currentInfo.cardinal}`;
      this.currentArrow.style.transform = `rotate(${currentInfo.angleDeg}deg)`;
    }
  }

  setLevelInfo(level) {
    const stage = this.stageDatabase.find(s => s.level === level);
    const locText = stage ? `${stage.name} • ความลึก -${stage.depth.toLocaleString()} ม.` : `มิติความลึกมหาอเวจีระดับ ${level}`;

    if (this.hudLevelPill) this.hudLevelPill.innerText = `Level ${level}`;
    if (this.hudLocation) this.hudLocation.innerText = locText;
  }

  showPenaltyFlash() {
    this.screenFlash.className = 'damage';
    setTimeout(() => {
      this.screenFlash.className = '';
    }, 280);
  }

  showSuccessFlash() {
    this.screenFlash.className = 'success';
    setTimeout(() => {
      this.screenFlash.className = '';
    }, 450);
  }

  showModal(name, data = {}) {
    this.modalStart.classList.remove('active');
    this.modalClear.classList.remove('active');
    this.modalGameOver.classList.remove('active');

    if (name === 'start') {
      this.modalStart.classList.add('active');
    } else if (name === 'clear') {
      this.statTime.innerText = data.timeString || '00:00';
      this.statO2.innerText = `+${data.bonus || 0} PTS`;
      this.statScore.innerText = `${data.totalScore || 0}`;

      const nextLvl = (data.level || 1) + 1;
      const nextStage = this.stageDatabase.find(s => s.level === nextLvl);
      const nextDepth = nextStage ? nextStage.depth : 36000 + (nextLvl - 100) * 1000;
      this.statNextDepth.innerText = `-${nextDepth.toLocaleString()} M`;

      const nextNeedles = this.getNeedleCount(nextLvl, data.difficulty || 'normal');
      const nextDecoys = Math.floor((nextLvl - 1) * 0.55);
      let nextDesc = `⚠️ ด่าน ${nextLvl}: เข็มที่ต้องหา ${nextNeedles} เล่ม + ขยะ ${nextDecoys} ชิ้น`;
      if (nextLvl >= 3) {
        nextDesc += ' + กระแสน้ำพัดต้าน!';
      }
      this.levelNextWarning.innerText = nextDesc;

      this.modalClear.classList.add('active');
    } else if (name === 'gameover') {
      this.statGameOverLevel.innerText = `LEVEL ${data.level || 1}`;
      this.statGameOverNeedles.innerText = `${data.needlesFound || 0}`;
      this.statGameOverScore.innerText = `${data.score || 0} PTS`;
      this.modalGameOver.classList.add('active');
    }
  }

  hideAllModals() {
    this.modalStart.classList.remove('active');
    this.modalClear.classList.remove('active');
    this.modalGameOver.classList.remove('active');
  }

  setAudioButton(isMuted) {
    if (this.audioIcon) {
      this.audioIcon.innerText = isMuted ? '🔇' : '🔊';
    }
  }
}
