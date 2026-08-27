/**
 * 100 Deep Sea Expedition Stages Database & Procedural Scaling
 * (ระบบฐานข้อมูล 100 ด่านความลึก แบ่งเป็น 10 เขตแดนมหาสมุทร)
 */

class StageDatabase {
  static SECTORS = [
    { id: 1, name: 'ZONE I: แนวปะการังทมิฬ (Sunlit & Twilight Coral)', minLvl: 1, maxLvl: 10, baseDepth: 120, depthStep: 80, current: 'สงบนิ่ง' },
    { id: 2, name: 'ZONE II: ไหล่ทวีปความมืด (Midnight Bathyal Shelf)', minLvl: 11, maxLvl: 20, baseDepth: 1000, depthStep: 150, current: 'กระแสน้ำเบา 1.5 KTS' },
    { id: 3, name: 'ZONE III: แอ่งสมุทรเรืองแสง (Abyssal Plain of Bioluminescence)', minLvl: 21, maxLvl: 30, baseDepth: 2500, depthStep: 200, current: 'กระแสน้ำวน 2.4 KTS' },
    { id: 4, name: 'ZONE IV: ปล่องภูเขาไฟใต้สมุทร (Hydrothermal Smoker Vents)', minLvl: 31, maxLvl: 40, baseDepth: 4500, depthStep: 250, current: 'แปรปรวน 3.2 KTS' },
    { id: 5, name: 'ZONE V: ร่องลึกมาเรียนา (Mariana Hadal Trench)', minLvl: 41, maxLvl: 50, baseDepth: 7000, depthStep: 300, current: 'รุนแรง 3.8 KTS' },
    { id: 6, name: 'ZONE VI: แดนน้ำแข็งก้นบาดาล (Glacial Subduction Shelf)', minLvl: 51, maxLvl: 60, baseDepth: 10000, depthStep: 350, current: 'รุนแรง 4.4 KTS' },
    { id: 7, name: 'ZONE VII: สุสานไททันโบราณ (Sunken Titan Graveyard)', minLvl: 61, maxLvl: 70, baseDepth: 13500, depthStep: 400, current: 'น้ำวนลึก 5.0 KTS' },
    { id: 8, name: 'ZONE VIII: ถ้ำผลึกเรืองแสงใต้พิภพ (Bioluminescent Crystal Hollows)', minLvl: 71, maxLvl: 80, baseDepth: 17500, depthStep: 450, current: 'แม่เหล็กแปรปรวน 5.5 KTS' },
    { id: 9, name: 'ZONE IX: รอยแยกแมกมาใต้เปลือกโลก (Magma Oceanic Mantle)', minLvl: 81, maxLvl: 90, baseDepth: 22000, depthStep: 500, current: 'วิกฤตความร้อน 6.0 KTS' },
    { id: 10, name: 'ZONE X: ก้นบึ้งอนันตกาลแกนโลก (The Abyssal Singularity)', minLvl: 91, maxLvl: 100, baseDepth: 27500, depthStep: 600, current: 'พายุมหาอเวจี 6.8 KTS' }
  ];

  static STAGE_PREFIXES = [
    'แนวผา', 'ร่องเหว', 'แอ่งลึก', 'โตรกธาร', 'ซากเรือ',
    'แดนผลึก', 'วังน้ำวน', 'ถ้ำเรืองแสง', 'ปล่องความร้อน', 'ประตูมิติ'
  ];

  static generateAllStages() {
    const stages = [];
    for (let lvl = 1; lvl <= 100; lvl++) {
      const sectorIdx = Math.min(9, Math.floor((lvl - 1) / 10));
      const sector = this.SECTORS[sectorIdx];
      const offsetInSector = (lvl - 1) % 10;

      const depth = sector.baseDepth + offsetInSector * sector.depthStep;
      const mapSize = Math.min(140, 42 + Math.floor((lvl - 1) * 1.0));
      const decoys = Math.floor((lvl - 1) * 0.55);

      const prefix = this.STAGE_PREFIXES[offsetInSector % this.STAGE_PREFIXES.length];
      const stageName = `${prefix}ระดับ ${lvl} • ${sector.name.split(':')[1].trim()}`;

      stages.push({
        level: lvl,
        sectorId: sector.id,
        sectorName: sector.name,
        name: stageName,
        depth: depth,
        map: mapSize,
        decoys: decoys,
        current: sector.current
      });
    }
    return stages;
  }
}

window.StageDatabase = StageDatabase;
