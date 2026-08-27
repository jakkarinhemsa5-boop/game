/**
 * Tactical Seabed Minimap & Radar System
 * (แสดงเฉพาะพิกัดโดรน ทิศทาง และพื้นที่ที่สำรวจแล้ว - ไม่แสดงตำแหน่งเข็ม)
 */

class SeabedMinimap {
  constructor() {
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.coordsEl = document.getElementById('minimap-coords');
    this.scaleEl = document.getElementById('minimap-scale');
    this.exploredTextEl = document.getElementById('minimap-explored-text');

    this.mapBound = 40;
    this.level = 1;
    this.exploredCanvas = document.createElement('canvas');
    this.exploredCtx = this.exploredCanvas.getContext('2d');
    this.radarAngle = 0;
    this.width = 180;
    this.height = 115;
    this.exploredPixels = 0;
  }

  init() {
    if (!this.canvas) return;
    this.width = this.canvas.width = 180;
    this.height = this.canvas.height = 115;
    this.exploredCanvas.width = this.width;
    this.exploredCanvas.height = this.height;
    this.resetLevel(40, 1);
  }

  resetLevel(mapBound, level) {
    this.mapBound = mapBound;
    this.level = level;
    this.exploredPixels = 0;

    if (this.exploredCtx) {
      this.exploredCtx.clearRect(0, 0, this.width, this.height);
      this.exploredCtx.fillStyle = 'rgba(2, 10, 20, 0.78)';
      this.exploredCtx.fillRect(0, 0, this.width, this.height);
    }

    if (this.scaleEl) {
      this.scaleEl.innerText = `SCALE: ${(mapBound * 2)}M`;
    }
    if (this.exploredTextEl) {
      this.exploredTextEl.innerText = 'สำรวจแล้ว: 0%';
    }
  }

  // World coordinates (X, Z) to Minimap Canvas (PX, PY)
  worldToMinimap(x, z) {
    const padX = 8;
    const padY = 6;
    const drawW = this.width - padX * 2;
    const drawH = this.height - padY * 2;
    const nx = (x + this.mapBound) / (this.mapBound * 2);
    const nz = (z + this.mapBound) / (this.mapBound * 2);
    return {
      x: padX + Math.max(0, Math.min(1, nx)) * drawW,
      y: padY + Math.max(0, Math.min(1, nz)) * drawH
    };
  }

  markExplored(x, z, lightRadius) {
    if (!this.exploredCtx) return;
    const pt = this.worldToMinimap(x, z);
    const r = (lightRadius / (this.mapBound * 2)) * (this.height - 12);

    this.exploredCtx.save();
    this.exploredCtx.globalCompositeOperation = 'destination-out';
    const grad = this.exploredCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, Math.max(8, r * 1.2));
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.exploredCtx.fillStyle = grad;
    this.exploredCtx.beginPath();
    this.exploredCtx.arc(pt.x, pt.y, Math.max(8, r * 1.2), 0, Math.PI * 2);
    this.exploredCtx.fill();
    this.exploredCtx.restore();

    this.exploredPixels = Math.min(100, this.exploredPixels + 0.08);
    if (this.exploredTextEl) {
      this.exploredTextEl.innerText = `สำรวจแล้ว: ${Math.round(this.exploredPixels)}%`;
    }
  }

  update(delta, dronePos, droneRotY, lightRadius, sonarDist, closenessRatio) {
    if (!this.ctx) return;

    this.markExplored(dronePos.x, dronePos.z, lightRadius);

    if (this.coordsEl) {
      this.coordsEl.innerText = `พิกัด: X:${Math.round(dronePos.x)} | Z:${Math.round(dronePos.z)}`;
    }

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const padX = 8;
    const padY = 6;
    const drawW = w - padX * 2;
    const drawH = h - padY * 2;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 12, 24, 0.94)';
    ctx.fillRect(0, 0, w, h);

    // Grid & Rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;

    const gridCols = 4;
    const gridRows = 3;
    for (let i = 0; i <= gridCols; i++) {
      ctx.beginPath();
      ctx.moveTo(padX + (i * drawW) / gridCols, padY);
      ctx.lineTo(padX + (i * drawW) / gridCols, h - padY);
      ctx.stroke();
    }
    for (let j = 0; j <= gridRows; j++) {
      ctx.beginPath();
      ctx.moveTo(padX, padY + (j * drawH) / gridRows);
      ctx.lineTo(w - padX, padY + (j * drawH) / gridRows);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, drawH * 0.28, 0, Math.PI * 2);
    ctx.arc(cx, cy, drawH * 0.48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(padX, padY, drawW, drawH);

    // Fog of War
    ctx.drawImage(this.exploredCanvas, 0, 0);

    // Sonar Sweep Line
    this.radarAngle += delta * 2.2;
    const dronePt = this.worldToMinimap(dronePos.x, dronePos.z);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dronePt.x, dronePt.y);
    const sweepLen = drawH * 0.6;
    const endX = dronePt.x + Math.cos(this.radarAngle) * sweepLen;
    const endY = dronePt.y + Math.sin(this.radarAngle) * sweepLen;
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 6. Draw Player Drone Icon (Rotated to match Heading in Canvas 2D)
    ctx.save();
    ctx.translate(dronePt.x, dronePt.y);
    // In Canvas: angle 0 points down (+Z).
    ctx.rotate(droneRotY);

    // Forward Light Cone (Points Down at angle 0)
    const coneAngle = Math.PI / 4.5;
    const coneLen = 14;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-Math.sin(coneAngle) * coneLen, Math.cos(coneAngle) * coneLen);
    ctx.lineTo(Math.sin(coneAngle) * coneLen, Math.cos(coneAngle) * coneLen);
    ctx.closePath();
    ctx.fill();

    // Drone Arrow pointing Forward in heading
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(4, -4);
    ctx.lineTo(0, -2);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();

    // Center Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.seabedMinimap = new SeabedMinimap();
