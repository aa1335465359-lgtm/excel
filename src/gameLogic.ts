export type AttackForm = 'wordart' | 'sparkline' | 'comment' | 'array';

export type SpecificUpgrade = 
  | 'wordart_size' | 'wordart_weight' | 'wordart_spread' | 'wordart_title' | 'wordart_ult'
  | 'sparkline_width' | 'sparkline_focus' | 'sparkline_bounce' | 'sparkline_rapid' | 'sparkline_ult'
  | 'comment_size' | 'comment_chain' | 'comment_residue' | 'comment_fast' | 'comment_ult'
  | 'array_count' | 'array_split' | 'array_track' | 'array_fast' | 'array_ult'
  | 'wordart_wide' | 'wordart_fast_push' | 'wordart_shield' | 'wordart_stun' | 'wordart_quad'
  | 'array_plus_2' | 'array_rapid' | 'array_bounce' | 'array_pierce' | 'array_big'
  | 'sparkline_freeze' | 'sparkline_cannon' | 'sparkline_reflect' | 'sparkline_overclock'
  | 'comment_triple' | 'comment_knockback' | 'comment_split' | 'comment_black' | 'comment_super';

export type GeneralUpgrade = 'bold' | 'underline' | 'highlight' | 'rand' | 'vlookup' | 'sum' | 'italic' | 'strikethrough' | 'ctrl_c' | 'ctrl_z' | 'format_painter';

export type Upgrade = SpecificUpgrade | GeneralUpgrade;

export const ATTACK_FORM_NAMES: Record<AttackForm, string> = {
  wordart: '艺术字 (WordArt)',
  sparkline: '迷你图 (Sparkline)',
  comment: '批注/报错框 (Comment)',
  array: '数组/自动填充 (Array)'
};

export const ATTACK_FORM_DESCS: Record<AttackForm, string> = {
  wordart: '发射巨大的文字推图机，缓慢推进并强制推走敌人，推到墙边直接秒杀',
  sparkline: '发射高频穿透地形的无限距离激光，无击退但可减速',
  comment: '投掷会爆炸的批注框，造成范围击退并留下持续伤害区域',
  array: '发射常规文字子弹，属性均衡，适合穿透和分裂'
};

export const UPGRADE_NAMES: Record<Upgrade, string> = {
  wordart_size: '字号 (Size)',
  wordart_weight: '字重 (Weight)',
  wordart_spread: '段落扩散 (Spread)',
  wordart_title: '标题编排 (Title)',
  wordart_ult: 'WordArt (终极)',
  sparkline_width: '线宽 (Width)',
  sparkline_focus: '聚焦 (Focus)',
  sparkline_bounce: '折线 (Bounce)',
  sparkline_rapid: '连续扫射 (Rapid)',
  sparkline_ult: 'SPARKLINE (终极)',
  comment_size: '大气泡 (Large Bubble)',
  comment_chain: '连环批注 (Chain)',
  comment_residue: '高亮残留 (Residue)',
  comment_fast: '快速批注 (Fast)',
  comment_ult: '#VALUE! (终极)',
  array_count: '扩列 (Expand)',
  array_split: '自动填充 (AutoFill)',
  array_track: '智能填充 (SmartFill)',
  array_fast: '高速填充 (FastFill)',
  array_ult: 'RANDARRAY (终极)',
  wordart_wide: '啊啊啊啊啊',
  wordart_fast_push: '推动加速',
  wordart_shield: '文字护盾',
  wordart_stun: '震慑排版',
  wordart_quad: '四面大字',
  array_plus_2: '弹道 +2',
  array_rapid: '高速填充',
  array_bounce: '墙体反弹',
  array_pierce: '无限穿透',
  array_big: '大号单元格',
  sparkline_freeze: '冻结射线',
  sparkline_cannon: '激光炮',
  sparkline_reflect: '反射',
  sparkline_overclock: '超频',
  comment_triple: '三连投',
  comment_knockback: '强力击飞',
  comment_split: '分裂炸弹',
  comment_black: '炸黑了',
  comment_super: '超级炸弹',
  bold: '加粗 (Bold)',
  italic: '斜体 (Italic)',
  underline: '下划线 (Underline)',
  strikethrough: '删除线 (Strikethrough)',
  highlight: '高亮 (Highlight)',
  rand: '=RAND() 随机数',
  vlookup: '=VLOOKUP() 查找',
  sum: '=SUM() 求和',
  ctrl_c: 'Ctrl+C 复制',
  ctrl_z: 'Ctrl+Z 撤销',
  format_painter: '格式刷 (Format Painter)'
};

export const UPGRADE_DESCS: Record<Upgrade, string> = {
  wordart_size: '大标题宽度 +50%，伤害 +25%',
  wordart_weight: '大标题推进速度加快，推力更强',
  wordart_spread: '大标题命中敌人时，有概率向两侧发射小号文字',
  wordart_title: '每第3发变成超宽大标题，伤害2.5倍，无限穿透',
  wordart_ult: '每5秒全屏发射巨型大标题清场，伤害150，对精英1.5倍伤害',
  sparkline_width: '激光加粗，伤害 +20%',
  sparkline_focus: '激光附带强力减速效果',
  sparkline_bounce: '激光命中第一个敌人时会折射出一条新的激光',
  sparkline_rapid: '激光发射频率大幅提升',
  sparkline_ult: '每次发射3道激光，主激光极宽',
  comment_size: '爆炸半径 +30%，伤害 +20%',
  comment_chain: '敌人被爆炸击杀时，有50%概率触发二次爆炸',
  comment_residue: '爆炸后留下的持续伤害区域范围变大，伤害提升',
  comment_fast: '投掷频率加快，飞行速度提升',
  comment_ult: '每第4次爆炸变成大崩溃爆炸，范围极大',
  array_count: '子弹数 +2，扇形角度 +6°',
  array_split: '每发子弹在命中或飞行结束时分裂成3个小碎片',
  array_track: '获得轻度追踪，追踪半径160',
  array_fast: '冷却 -18%，飞行速度 +15%',
  array_ult: '每3秒向四周发射一圈子弹(16发)',
  wordart_wide: '【啊啊啊啊啊】推出去的文字横向变宽',
  wordart_fast_push: '【推动加速】推着敌人往前走的速度更快',
  wordart_shield: '【文字护盾】大字可抵挡敌方子弹，射速-20%，移速额外-10%',
  wordart_stun: '【震慑排版】未击杀目标时50%概率眩晕1秒',
  wordart_quad: '【四面大字】每20秒向四个方向各发射一个大字',
  array_plus_2: '【弹道 +2】子弹数量 +2',
  array_rapid: '【高速填充】射速 x1.5',
  array_bounce: '【墙体反弹】子弹碰到墙壁可反弹1次',
  array_pierce: '【无限穿透】子弹获得无限穿透',
  array_big: '【大号单元格】子弹体积 x2',
  sparkline_freeze: '【冻结射线】命中时5%概率冰冻敌人',
  sparkline_cannon: '【激光炮】每30秒发射极粗激光秒杀非BOSS，随后1.5秒无法发射普通激光',
  sparkline_reflect: '【反射】激光击中墙壁后反射1次',
  sparkline_overclock: '【超频】激光射速 x2',
  comment_triple: '【三连投】一次扔出3颗炸弹，攻速降低20%',
  comment_knockback: '【强力击飞】炸弹击飞距离增加100%',
  comment_split: '【分裂炸弹】碰到敌人后分裂成3颗炸弹',
  comment_black: '【炸黑了】爆炸后把地面炸黑(视觉效果)',
  comment_super: '【超级炸弹】每30秒扔出巨大炸弹，秒杀普通/精英怪，并附加减速和灼烧',
  bold: '直接伤害 +30%，击退 +6px',
  italic: '飞行速度 +15%，射速 +10%',
  underline: '攻击留下1.4秒拖尾/残痕，伤害7/s',
  strikethrough: '穿透 +1，直接秒杀生命值低于20%的非Boss敌人 (斩杀)',
  highlight: '命中后生成50px高亮区，持续2.5秒，区域内敌人受到伤害增加50% (易伤)',
  rand: '15%概率暴击，暴击倍率2.4x',
  vlookup: '对精英/Boss伤害+15%，投射物获得轻度追踪，激光对目标有轻微吸附',
  sum: '当前波次内：每击杀10个敌人，本波伤害+3%(上限+24%)，下波清零',
  ctrl_c: '每次攻击有20%概率额外发射一团乱码(多重射击)',
  ctrl_z: '受到致命伤时免死，恢复30%血量并无敌2秒 (每局限1次)',
  format_painter: '击中敌人时，有20%概率在敌人脚下生成一个格式刷区域，减速并造成持续伤害'
};

export interface Player {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  angle: number;
  isShooting: boolean;
  keys: { w: boolean; a: boolean; s: boolean; d: boolean };
  attackForm: AttackForm | null;
  specificUpgrades: SpecificUpgrade[];
  generalUpgrades: GeneralUpgrade[];
  lastShot: number;
  lastLaser: number;
  lastWordart?: number;
  lastWordartUlt?: number;
  lastWordartQuad?: number;
  lastArrayUlt?: number;
  lastCommentUlt?: number;
  lastCommentSuper?: number;
  sparklineVacuumUntil?: number;
  lastSparklineCannon?: number;
  kills: number;
  sumKills: number;
  deaths: number;
  readyForNextStage: boolean;
  invincibleUntil: number;
  sumStacks?: number;
  knockbackMult?: number;
  sizeMult?: number;
  eliteDamageMult?: number;
  wordartCounter: number;
  commentCounter: number;
  ctrlZUsed?: boolean;
}

export interface AoeWarning {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'rect' | 'row' | 'col';
  life: number;
  maxLife: number;
}

export type EnemyType = 'Minion' | 'Elite' | 'MiniBoss' | 'EliteBoss' | 'Value' | 'FormatBrush' | 'FreezeCell' | 'ProtectedView' | 'MergedCell' | 'SplitCell' | 'REF' | 'VLOOKUP' | 'MACRO' | 'MINION';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type: EnemyType;
  vx: number;
  vy: number;
  knockbackX: number;
  knockbackY: number;
  text: string;
  width: number;
  height: number;
  speed: number;
  weight: number;
  state?: 'idle' | 'warning' | 'dashing' | 'aiming' | 'firing' | 'stunned';
  stateTimer?: number;
  dashTargetX?: number;
  dashTargetY?: number;
  facingAngle?: number;
  lastAttack?: number;
  isBuffed?: boolean;
  crushCooldown?: number;
  crushCount?: number;
}

export interface EnemyBullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  size: number;
  type: 'value' | 'row' | 'col' | 'ref' | 'vlookup';
}

export interface Puddle {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: 'formatPaint' | 'freeze' | 'highlight' | 'explosion' | 'blacken' | 'burn_slow';
  life: number;
  maxLife: number;
  damage?: number;
  owner?: string;
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
  maxLife: number;
  size: number;
  pierce: number;
  type: string;
  isCrit?: boolean;
  knockback?: number;
  isTitle?: boolean;
  eliteDamageMult?: number;
  explosionRadius?: number;
  isUlt?: boolean;
  splitsLeft?: number;
  trackRadius?: number;
  leavesResidue?: boolean;
  isHighlight?: boolean;
  bouncesLeft?: number;
  isItalic?: boolean;
  isStrikethrough?: boolean;
  isBulldozer?: boolean;
  hitTargets?: Set<number>;
  angle?: number;
  width?: number;
  height?: number;
  isShield?: boolean;
  stunChance?: number;
  isSuper?: boolean;
}

export interface Laser {
  id: number;
  owner: string;
  x: number;
  y: number;
  angle: number;
  damage: number;
  width: number;
  range: number;
  life: number;
  maxLife: number;
  type: string;
  isCrit?: boolean;
  isStrikethrough?: boolean;
  eliteDamageMult?: number;
  bouncesLeft?: number;
  hasHit?: boolean;
  isHighlight?: boolean;
  leavesResidue?: boolean;
  hitTargets?: Set<number>;
  isCannon?: boolean;
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
      { x: 400, y: 1500 }, { x: 2600, y: 1500 },
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
  enemyBullets: EnemyBullet[];
  puddles: Puddle[];
  aoeWarnings: AoeWarning[];
  lasers: Laser[];
  items: any[];
  stage: number;
  stageTimer: number;
  isSelectingSkill: boolean;
  isSelectingForm: boolean;
  skillChoices: Upgrade[];
  formChoices: AttackForm[];
  bulletTime: number;
  enemyIdCounter: number;
  bulletIdCounter: number;
  enemyBulletIdCounter: number;
  puddleIdCounter: number;
  aoeIdCounter: number;
  itemIdCounter: number;
  margin: number;
  dynamicObstacles: {x: number, y: number, w: number, h: number}[];
  activeEvent: 'NONE' | 'DIV0' | 'OOM';
  eventTimer: number;
}

export function createRoom(roomId: string): Room {
  return {
    id: roomId,
    players: {},
    enemies: [],
    bullets: [],
    enemyBullets: [],
    puddles: [],
    aoeWarnings: [],
    lasers: [],
    items: [],
    stage: 1,
    stageTimer: 0,
    isSelectingSkill: false,
    isSelectingForm: true,
    skillChoices: [],
    formChoices: ['wordart', 'sparkline', 'comment', 'array'],
    bulletTime: 0,
    enemyIdCounter: 0,
    bulletIdCounter: 0,
    enemyBulletIdCounter: 0,
    puddleIdCounter: 0,
    aoeIdCounter: 0,
    itemIdCounter: 0,
    margin: 0,
    dynamicObstacles: [],
    activeEvent: 'NONE',
    eventTimer: 0
  };
}
