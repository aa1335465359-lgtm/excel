export type Skill = 'bold' | 'underline' | 'italic' | 'strikethrough' | 'highlight';

export interface Player {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  angle: number;
  isShooting: boolean;
  keys: { w: boolean; a: boolean; s: boolean; d: boolean };
  skills: Skill[];
  lastShot: number;
  lastLaser: number;
  kills: number;
  deaths: number;
  readyForNextStage: boolean;
  invincibleUntil: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type: 'Minion' | 'Elite' | 'MiniBoss' | 'EliteBoss';
  vx: number;
  vy: number;
  knockbackX: number;
  knockbackY: number;
  text: string;
  width: number;
  height: number;
  speed: number;
}

export interface Bullet {
  id: number;
  owner: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  size: number;
  pierce: number;
  bounces: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isHighlight: boolean;
}

export interface MapDef {
  width: number;
  height: number;
  obstacles: { x: number, y: number, w: number, h: number }[];
  bushes: { x: number, y: number, w: number, h: number }[];
  spawners: { x: number, y: number }[];
  playerSpawn: { x: number, y: number };
}

export const MAPS: MapDef[] = [
  {
    width: 3000, height: 3000,
    obstacles: [
      { x: 1000, y: 1000, w: 200, h: 200 },
      { x: 1800, y: 1000, w: 200, h: 200 },
      { x: 1000, y: 1800, w: 200, h: 200 },
      { x: 1800, y: 1800, w: 200, h: 200 },
    ],
    bushes: [
      { x: 1400, y: 1400, w: 200, h: 200 }
    ],
    spawners: [
      { x: 200, y: 200 }, { x: 2800, y: 200 },
      { x: 200, y: 2800 }, { x: 2800, y: 2800 },
      { x: 1500, y: 200 }, { x: 1500, y: 2800 }
    ],
    playerSpawn: { x: 1500, y: 1500 }
  },
  {
    width: 3000, height: 3000,
    obstacles: [
      { x: 0, y: 800, w: 1200, h: 200 },
      { x: 1800, y: 800, w: 1200, h: 200 },
      { x: 0, y: 2000, w: 1200, h: 200 },
      { x: 1800, y: 2000, w: 1200, h: 200 },
    ],
    bushes: [
      { x: 1300, y: 800, w: 400, h: 200 },
      { x: 1300, y: 2000, w: 400, h: 200 }
    ],
    spawners: [
      { x: 1500, y: 200 }, { x: 1500, y: 2800 },
      { x: 200, y: 1400 }, { x: 2800, y: 1400 }
    ],
    playerSpawn: { x: 1500, y: 1500 }
  },
  {
    width: 3000, height: 3000,
    obstacles: [
      { x: 800, y: 0, w: 200, h: 1200 },
      { x: 800, y: 1800, w: 200, h: 1200 },
      { x: 2000, y: 0, w: 200, h: 1200 },
      { x: 2000, y: 1800, w: 200, h: 1200 },
    ],
    bushes: [],
    spawners: [
      { x: 400, y: 1500 }, { x: 1500, y: 1500 }, { x: 2600, y: 1500 },
      { x: 1500, y: 200 }, { x: 1500, y: 2800 }
    ],
    playerSpawn: { x: 1500, y: 1500 }
  },
  {
    width: 3000, height: 3000,
    obstacles: [
      { x: 600, y: 600, w: 400, h: 400 }, { x: 2000, y: 600, w: 400, h: 400 },
      { x: 600, y: 2000, w: 400, h: 400 }, { x: 2000, y: 2000, w: 400, h: 400 },
      { x: 1300, y: 1300, w: 400, h: 400 }
    ],
    bushes: [
      { x: 1000, y: 1000, w: 300, h: 300 }, { x: 1700, y: 1700, w: 300, h: 300 }
    ],
    spawners: [
      { x: 1500, y: 200 }, { x: 1500, y: 2800 },
      { x: 200, y: 1500 }, { x: 2800, y: 1500 },
      { x: 200, y: 200 }, { x: 2800, y: 2800 }
    ],
    playerSpawn: { x: 1500, y: 1100 }
  },
  {
    width: 3000, height: 3000,
    obstacles: [
      { x: 0, y: 0, w: 3000, h: 100 },
      { x: 0, y: 2900, w: 3000, h: 100 },
      { x: 0, y: 0, w: 100, h: 3000 },
      { x: 2900, y: 0, w: 100, h: 3000 },
    ],
    bushes: [],
    spawners: [
      { x: 300, y: 300 }, { x: 1500, y: 300 }, { x: 2700, y: 300 },
      { x: 300, y: 1500 }, { x: 2700, y: 1500 },
      { x: 300, y: 2700 }, { x: 1500, y: 2700 }, { x: 2700, y: 2700 }
    ],
    playerSpawn: { x: 1500, y: 1500 }
  }
];

export interface Room {
  id: string;
  players: Record<string, Player>;
  enemies: Enemy[];
  bullets: Bullet[];
  puddles: any[];
  lasers: any[];
  items: any[];
  stage: number;
  stageTimer: number;
  isSelectingSkill: boolean;
  bulletTime: number;
  enemyIdCounter: number;
  bulletIdCounter: number;
  itemIdCounter: number;
}

export function createRoom(roomId: string): Room {
  return {
    id: roomId,
    players: {},
    enemies: [],
    bullets: [],
    puddles: [],
    lasers: [],
    items: [],
    stage: 1,
    stageTimer: 0,
    isSelectingSkill: false,
    bulletTime: 0,
    enemyIdCounter: 0,
    bulletIdCounter: 0,
    itemIdCounter: 0
  };
}
