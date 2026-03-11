import React, { useEffect, useRef, useState } from 'react';
import { Skill, Player, Enemy, Bullet, MAPS, Room, createRoom } from './gameLogic';

const SKILL_NAMES: Record<Skill, string> = {
  bold: '加粗 (Bold)',
  underline: '下划线 (Underline)',
  italic: '斜体 (Italic)',
  strikethrough: '删除线 (Strikethrough)',
  highlight: '高亮 (Highlight)'
};

const SKILL_DESCS: Record<Skill, string> = {
  bold: '子弹变大，伤害翻倍，附带击退效果',
  underline: '双排平行发射，火力覆盖更广',
  italic: '子弹获得穿透效果，并能在屏幕边缘反弹',
  strikethrough: '周期性发射贯穿全屏的删除线激光',
  highlight: '子弹消失时留下高亮区域，持续伤害并减速敌人'
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const gameStateRef = useRef<Room | null>(null);
  const [uiState, setUiState] = useState<any>(null);
  const myId = 'player1';
  
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('工作簿1');

  const keys = useRef({ w: false, a: false, s: false, d: false });
  const mouse = useRef({ x: 0, y: 0, isDown: false });
  const animationFrameId = useRef<number | null>(null);
  const gameLoopId = useRef<number | null>(null);
  
  const particles = useRef<any[]>([]);
  const shake = useRef<number>(0);

  const [showGridMenu, setShowGridMenu] = useState(false);
  const [gridMenuPos, setGridMenuPos] = useState({x: 0, y: 0});

  const isSelectingGridRef = useRef(false);
  const selectionStartRef = useRef<{x: number, y: number} | null>(null);
  const selectionEndRef = useRef<{x: number, y: number} | null>(null);

  const joinRoom = () => {
    if (roomInput.trim()) {
      const room = createRoom(roomInput.trim());
      room.players[myId] = {
        id: myId,
        x: MAPS[0].playerSpawn.x,
        y: MAPS[0].playerSpawn.y,
        hp: 100,
        maxHp: 100,
        angle: 0,
        isShooting: false,
        keys: { w: false, a: false, s: false, d: false },
        skills: [],
        lastShot: 0,
        lastLaser: 0,
        kills: 0,
        deaths: 0,
        readyForNextStage: false,
        invincibleUntil: 0
      };
      gameStateRef.current = room;
      setCurrentRoom(roomInput.trim());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') keys.current.w = true;
      if (e.key === 'a' || e.key === 'A') keys.current.a = true;
      if (e.key === 's' || e.key === 'S') keys.current.s = true;
      if (e.key === 'd' || e.key === 'D') keys.current.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') keys.current.w = false;
      if (e.key === 'a' || e.key === 'A') keys.current.a = false;
      if (e.key === 's' || e.key === 'S') keys.current.s = false;
      if (e.key === 'd' || e.key === 'D') keys.current.d = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
      
      if (isSelectingGridRef.current && selectionStartRef.current) {
        selectionEndRef.current = { x: mouse.current.x, y: mouse.current.y };
      }
    };

    const handleMouseDown = (e: MouseEvent) => { 
      if (e.button !== 0) return;
      mouse.current.isDown = true; 
      
      if (showGridMenu) {
        // If clicking outside the menu, close it
        const menuEl = document.getElementById('grid-menu');
        if (menuEl && !menuEl.contains(e.target as Node)) {
          setShowGridMenu(false);
          if (gameStateRef.current) gameStateRef.current.bulletTime = 0;
        }
        return;
      }

      const gs = gameStateRef.current;
      if (gs && gs.bulletTime > 0 && !showGridMenu) {
        isSelectingGridRef.current = true;
        selectionStartRef.current = { x: mouse.current.x, y: mouse.current.y };
        selectionEndRef.current = { x: mouse.current.x, y: mouse.current.y };
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => { 
      if (e.button !== 0) return;
      mouse.current.isDown = false; 
      
      if (isSelectingGridRef.current) {
        isSelectingGridRef.current = false;
        if (selectionStartRef.current && selectionEndRef.current) {
          const dx = Math.abs(selectionEndRef.current.x - selectionStartRef.current.x);
          const dy = Math.abs(selectionEndRef.current.y - selectionStartRef.current.y);
          if (dx > 10 && dy > 10) {
            setShowGridMenu(true);
            setGridMenuPos({ x: mouse.current.x, y: mouse.current.y });
          } else {
            selectionStartRef.current = null;
            selectionEndRef.current = null;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showGridMenu]);

  // Game Loop
  useEffect(() => {
    if (!currentRoom) return;

    let tick = 0;
    let lastUiUpdate = 0;
    let lastIsSelecting = false;

    const gameLoop = () => {
      const room = gameStateRef.current;
      if (!room) return;

      tick++;
      const now = Date.now();
      const currentMap = MAPS[Math.min(room.stage - 1, MAPS.length - 1)];

      // Update UI
      const forceUpdate = room.isSelectingSkill !== lastIsSelecting;
      if (forceUpdate || now - lastUiUpdate > 250) {
        setUiState({
          stage: room.stage,
          stageTimer: room.stageTimer,
          isSelectingSkill: room.isSelectingSkill,
          players: JSON.parse(JSON.stringify(room.players))
        });
        lastUiUpdate = now;
        lastIsSelecting = room.isSelectingSkill;
      }

      if (room.isSelectingSkill) return;

      room.stageTimer++;
      if (room.bulletTime > 0) room.bulletTime--;

      const timeSpeed = room.bulletTime > 0 ? 0.1 : 1.0;
      const stageDuration = 1800; 

      if (room.stageTimer >= stageDuration && room.stage < 5) {
        room.isSelectingSkill = true;
        return;
      }

      const spawnChance = 0.1 + (room.stage * 0.05) + (room.stageTimer / stageDuration) * 0.2;
      
      if (room.enemies.length < 300 && Math.random() < spawnChance * timeSpeed) {
        const spawner = currentMap.spawners[Math.floor(Math.random() * currentMap.spawners.length)];
        const spawnCount = Math.floor(Math.random() * 3) + 1 + Math.floor(room.stage / 2);
        
        for(let i=0; i<spawnCount; i++) {
          const sx = spawner.x + (Math.random() - 0.5) * 100;
          const sy = spawner.y + (Math.random() - 0.5) * 100;

          let type: 'Minion' | 'Elite' | 'MiniBoss' | 'EliteBoss' = 'Minion';
          let hp = 15 * room.stage;
          let speed = 1.0 + Math.random() * 0.5; 
          let text = ['测试文本', 'Lorem ipsum', '11111', '如题', '占位符'][Math.floor(Math.random() * 5)];
          let width = 60;
          let height = 20;

          const r = Math.random();
          if (room.stage >= 2 && r < 0.1) {
            type = 'Elite';
            hp = 80 * room.stage;
            speed = 2.0; 
            text = ['烫烫烫', '锟斤拷', 'NullReference'][Math.floor(Math.random() * 3)];
            width = 80;
          } else if (room.stage >= 3 && r < 0.02) {
            type = 'MiniBoss';
            hp = 400 * room.stage;
            speed = 1.2;
            text = '[批注: Logo再大一点]';
            width = 150;
            height = 40;
          } else if (room.stage >= 5 && room.stageTimer === 100 && room.enemies.filter(e => e.type === 'EliteBoss').length === 0) {
            type = 'EliteBoss';
            hp = 5000;
            speed = 0.8;
            text = '【项目方案_最终版_V18_打死不改版】';
            width = 300;
            height = 60;
          }

          room.enemies.push({
            id: room.enemyIdCounter++,
            x: sx, y: sy, hp, maxHp: hp, type, vx: 0, vy: 0, knockbackX: 0, knockbackY: 0,
            text, width, height, speed
          });
        }
      }

      const checkObstacleCollision = (x: number, y: number, w: number, h: number) => {
        for (const obs of currentMap.obstacles) {
          if (x + w/2 > obs.x && x - w/2 < obs.x + obs.w && 
              y + h/2 > obs.y && y - h/2 < obs.y + obs.h) {
            return true;
          }
        }
        return false;
      };

      const p = room.players[myId];
      if (p && p.hp > 0) {
        const speed = 6;
        let dx = 0;
        let dy = 0;
        if (keys.current.w) dy -= speed;
        if (keys.current.s) dy += speed;
        if (keys.current.a) dx -= speed;
        if (keys.current.d) dx += speed;

        if (dx !== 0 && dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / length) * speed;
          dy = (dy / length) * speed;
        }

        if (!checkObstacleCollision(p.x + dx, p.y, 40, 20)) p.x += dx;
        if (!checkObstacleCollision(p.x, p.y + dy, 40, 20)) p.y += dy;
        
        p.x = Math.max(0, Math.min(currentMap.width, p.x));
        p.y = Math.max(0, Math.min(currentMap.height, p.y));

        for (let i = room.items.length - 1; i >= 0; i--) {
          const item = room.items[i];
          if (Math.hypot(p.x - item.x, p.y - item.y) < 50) {
            room.bulletTime = 300; 
            room.items.splice(i, 1);
            shake.current = 10;
          }
        }

        const canvas = canvasRef.current;
        if (canvas) {
          const screenX = canvas.width / 2;
          const screenY = canvas.height / 2;
          p.angle = Math.atan2(mouse.current.y - screenY, mouse.current.x - screenX);
        }

        const isShooting = mouse.current.isDown && !isSelectingGridRef.current && !showGridMenu && room.bulletTime <= 0;

        if (isShooting) {
          let fireRate = 150; 
          let bulletSpeed = 20;
          let damage = 20;
          let size = 12;
          let pierce = 1;

          const isBold = p.skills.includes('bold');
          const isUnderline = p.skills.includes('underline');
          const isItalic = p.skills.includes('italic');
          const isStrikethrough = p.skills.includes('strikethrough');
          const isHighlight = p.skills.includes('highlight');

          if (isBold) {
            size *= 1.5;
            damage *= 2;
          }
          if (isItalic) {
            pierce = 4;
          }

          if (now - p.lastShot > fireRate) {
            p.lastShot = now;
            
            const spawnBullet = (offsetAngle: number, offsetDist: number) => {
              const finalAngle = p.angle + offsetAngle;
              const bx = p.x + Math.cos(p.angle + Math.PI/2) * offsetDist;
              const by = p.y + Math.sin(p.angle + Math.PI/2) * offsetDist;
              
              room.bullets.push({
                id: room.bulletIdCounter++,
                owner: p.id,
                x: bx, y: by,
                vx: Math.cos(finalAngle) * bulletSpeed,
                vy: Math.sin(finalAngle) * bulletSpeed,
                damage, life: 100, size, pierce,
                bounces: isItalic ? 2 : 0,
                isBold, isItalic, isUnderline, isHighlight
              });
            };

            if (isUnderline) {
              spawnBullet(-0.1, -20);
              spawnBullet(0, 0);
              spawnBullet(0.1, 20);
            } else {
              spawnBullet(0, 0);
            }
          }

          if (isStrikethrough && now - p.lastLaser > 4000) {
            p.lastLaser = now;
            room.lasers.push({
              id: Math.random(),
              x: p.x, y: p.y, angle: p.angle, life: 30
            });
            room.enemies.forEach(e => {
              const dist = Math.abs(Math.cos(p.angle)*(p.y - e.y) - Math.sin(p.angle)*(p.x - e.x));
              const dot = (e.x - p.x) * Math.cos(p.angle) + (e.y - p.y) * Math.sin(p.angle);
              if (dist < e.width/2 + 30 && dot > 0) {
                e.hp -= damage * 10;
                shake.current = 20;
                for(let i=0; i<10; i++) {
                  particles.current.push({
                    x: e.x + (Math.random()-0.5)*30, y: e.y + (Math.random()-0.5)*30,
                    vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6 - 2,
                    life: 30 + Math.random()*20, text: `-${Math.floor(damage * 10)}`, color: '#ff0000'
                  });
                }
              }
            });
          }
        }
      }

      for (let i = room.enemies.length - 1; i >= 0; i--) {
        const e = room.enemies[i];
        
        let nearestP = null;
        let minDist = Infinity;
        if (p && p.hp > 0) {
          const d = Math.hypot(p.x - e.x, p.y - e.y);
          if (d < minDist) {
            minDist = d;
            nearestP = p;
          }
        }

        if (nearestP) {
          const angle = Math.atan2(nearestP.y - e.y, nearestP.x - e.x);
          e.vx = Math.cos(angle) * e.speed;
          e.vy = Math.sin(angle) * e.speed;
        } else {
          e.vx = 0;
          e.vy = 0;
        }

        let moveX = (e.vx * timeSpeed) + e.knockbackX;
        let moveY = (e.vy * timeSpeed) + e.knockbackY;
        
        e.knockbackX *= 0.8;
        e.knockbackY *= 0.8;

        if (!checkObstacleCollision(e.x + moveX, e.y, e.width, e.height)) e.x += moveX;
        if (!checkObstacleCollision(e.x, e.y + moveY, e.width, e.height)) e.y += moveY;

        if (nearestP && minDist < (e.width/2 + 20)) {
          if (now > nearestP.invincibleUntil) {
            const wasAlive = nearestP.hp > 0;
            nearestP.hp -= (e.type === 'EliteBoss' ? 10 : e.type === 'MiniBoss' ? 5 : 2) * timeSpeed;
            if (wasAlive && nearestP.hp <= 0) nearestP.deaths++;
          }
        }

        if (e.hp <= 0) {
          if (p) p.kills++;
          
          if ((e.type === 'Elite' && Math.random() < 0.15) || e.type === 'MiniBoss' || e.type === 'EliteBoss') {
            room.items.push({ id: room.itemIdCounter++, x: e.x, y: e.y, type: 'GridTool' });
          }
          room.enemies.splice(i, 1);
        }
      }

      for (let i = 0; i < room.enemies.length; i++) {
        const e1 = room.enemies[i];
        for (let j = i + 1; j < room.enemies.length; j++) {
          const e2 = room.enemies[j];
          const dx = e1.x - e2.x;
          const dy = e1.y - e2.y;
          const distSq = dx * dx + dy * dy;
          
          const r1 = (e1.width + e1.height) / 4;
          const r2 = (e2.width + e2.height) / 4;
          const minDist = r1 + r2;
          
          if (distSq < minDist * minDist && distSq > 0.1) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            const forceX = (dx / dist) * overlap * 0.5;
            const forceY = (dy / dist) * overlap * 0.5;
            
            e1.x += forceX;
            e1.y += forceY;
            e2.x -= forceX;
            e2.y -= forceY;
          }
        }
      }

      for (let i = room.bullets.length - 1; i >= 0; i--) {
        const b = room.bullets[i];
        b.x += b.vx * timeSpeed;
        b.y += b.vy * timeSpeed;
        b.life -= timeSpeed;

        if (checkObstacleCollision(b.x, b.y, b.size, b.size) || 
            b.x < 0 || b.x > currentMap.width || b.y < 0 || b.y > currentMap.height) {
          if (b.bounces > 0) {
            b.vx *= -1;
            b.vy *= -1;
            b.bounces--;
            b.x += b.vx * 2;
            b.y += b.vy * 2;
          } else {
            b.life = 0;
          }
        }

        if (b.life <= 0) {
          if (b.isHighlight) {
            room.puddles.push({
              id: Math.random(), x: b.x, y: b.y, radius: 80, life: 180, damage: b.damage * 0.3, owner: b.owner
            });
          }
          room.bullets.splice(i, 1);
          continue;
        }

        let hitEnemy = false;
        for (const e of room.enemies) {
          if (Math.abs(b.x - e.x) < e.width/2 + b.size && Math.abs(b.y - e.y) < e.height/2 + b.size) {
            e.hp -= b.damage;
            
            particles.current.push({
              x: e.x + (Math.random()-0.5)*30, y: e.y + (Math.random()-0.5)*30,
              vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6 - 2,
              life: 30 + Math.random()*20, text: `-${Math.floor(b.damage)}`, color: '#666666'
            });
            
            if (b.isBold) {
              e.knockbackX = b.vx * 0.8;
              e.knockbackY = b.vy * 0.8;
            }

            b.pierce--;
            hitEnemy = true;
            break;
          }
        }

        if (hitEnemy && b.pierce <= 0) {
          if (b.isHighlight) {
            room.puddles.push({
              id: Math.random(), x: b.x, y: b.y, radius: 80, life: 180, damage: b.damage * 0.3, owner: b.owner
            });
          }
          room.bullets.splice(i, 1);
        }
      }

      for (let i = room.puddles.length - 1; i >= 0; i--) {
        const p = room.puddles[i];
        p.life -= timeSpeed;
        if (p.life <= 0) {
          room.puddles.splice(i, 1);
          continue;
        }
        if (room.stageTimer % 10 === 0) {
          room.enemies.forEach(e => {
            if (Math.hypot(e.x - p.x, e.y - p.y) < p.radius + e.width/2) {
              e.hp -= p.damage;
              e.vx *= 0.4;
              e.vy *= 0.4;
            }
          });
        }
      }

      for (let i = room.lasers.length - 1; i >= 0; i--) {
        room.lasers[i].life -= timeSpeed;
        if (room.lasers[i].life <= 0) {
          room.lasers.splice(i, 1);
        }
      }
      
      if (particles.current.length > 200) {
        particles.current = particles.current.slice(-200);
      }
    };

    gameLoopId.current = window.setInterval(gameLoop, 1000 / 60);

    return () => {
      if (gameLoopId.current) clearInterval(gameLoopId.current);
    };
  }, [currentRoom]);

  const handleGridAction = (type: 'area' | 'row' | 'col') => {
    if (!selectionStartRef.current || !selectionEndRef.current || !gameStateRef.current) return;
    
    const room = gameStateRef.current;
    const me = room.players[myId];
    if (!me) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const SCALE = 0.6;
    const cameraX = me.x - canvas.width / (2 * SCALE);
    const cameraY = me.y - canvas.height / (2 * SCALE);
    
    const worldStartX = selectionStartRef.current.x / SCALE + cameraX;
    const worldStartY = selectionStartRef.current.y / SCALE + cameraY;
    const worldEndX = selectionEndRef.current.x / SCALE + cameraX;
    const worldEndY = selectionEndRef.current.y / SCALE + cameraY;
    
    const x = Math.min(worldStartX, worldEndX);
    const y = Math.min(worldStartY, worldEndY);
    const w = Math.abs(worldEndX - worldStartX);
    const h = Math.abs(worldEndY - worldStartY);
    
    room.bulletTime = 0;
    let hitCount = 0;
    room.enemies.forEach(e => {
      let hit = false;
      if (type === 'area') {
        if (e.x > x && e.x < x + w && e.y > y && e.y < y + h) hit = true;
      } else if (type === 'row') {
        if (e.y > y && e.y < y + h) hit = true;
      } else if (type === 'col') {
        if (e.x > x && e.x < x + w) hit = true;
      }

      if (hit) {
        e.hp -= 99999;
        hitCount++;
      }
    });
    
    if (hitCount > 0) {
      shake.current = 30;
    }
    
    setShowGridMenu(false);
    isSelectingGridRef.current = false;
    selectionStartRef.current = null;
    selectionEndRef.current = null;
  };

  const handleSelectSkill = (skill: Skill) => {
    const room = gameStateRef.current;
    if (!room) return;
    
    const p = room.players[myId];
    if (p && !p.skills.includes(skill)) {
      p.skills.push(skill);
    }
    p.readyForNextStage = true;

    room.isSelectingSkill = false;
    room.stage++;
    room.stageTimer = 0;
    room.enemies = []; 
    room.bullets = [];
    room.puddles = [];
    room.items = [];
    const nextMap = MAPS[Math.min(room.stage - 1, MAPS.length - 1)];
    p.readyForNextStage = false;
    p.x = nextMap.playerSpawn.x;
    p.y = nextMap.playerSpawn.y;
  };

  const handleRespawn = () => {
    const room = gameStateRef.current;
    if (!room) return;
    const p = room.players[myId];
    if (p && p.hp <= 0) {
      const currentMap = MAPS[Math.min(room.stage - 1, MAPS.length - 1)];
      p.hp = p.maxHp;
      p.x = currentMap.playerSpawn.x;
      p.y = currentMap.playerSpawn.y;
      p.invincibleUntil = Date.now() + 3000;
    }
  };

  // Canvas Render Loop
  useEffect(() => {
    if (!currentRoom) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const gameState = gameStateRef.current;
      
      if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      if (!gameState) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }

      const me = gameState.players[myId];
      const SCALE = 0.6;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let cameraX = me ? me.x - canvas.width / (2 * SCALE) : 0;
      let cameraY = me ? me.y - canvas.height / (2 * SCALE) : 0;

      if (shake.current > 0) {
        cameraX += (Math.random() - 0.5) * shake.current;
        cameraY += (Math.random() - 0.5) * shake.current;
        shake.current *= 0.9;
        if (shake.current < 0.5) shake.current = 0;
      }

      ctx.save();
      ctx.scale(SCALE, SCALE);
      ctx.translate(-cameraX, -cameraY);

      const CELL_W = 80;
      const CELL_H = 24;
      
      const startCol = Math.floor(cameraX / CELL_W);
      const startRow = Math.floor(cameraY / CELL_H);
      const endCol = startCol + (canvas.width / SCALE) / CELL_W + 2;
      const endRow = startRow + (canvas.height / SCALE) / CELL_H + 2;

      const isVisible = (x: number, y: number, w: number, h: number) => {
        return x + w > cameraX && x < cameraX + canvas.width / SCALE &&
               y + h > cameraY && y < cameraY + canvas.height / SCALE;
      };

      const currentMap = MAPS[Math.min(gameState.stage - 1, MAPS.length - 1)];

      ctx.strokeStyle = '#e1dfdd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = startCol; c <= endCol; c++) {
        ctx.moveTo(c * CELL_W, cameraY); 
        ctx.lineTo(c * CELL_W, cameraY + canvas.height / SCALE);
      }
      for (let r = startRow; r <= endRow; r++) {
        ctx.moveTo(cameraX, r * CELL_H); 
        ctx.lineTo(cameraX + canvas.width / SCALE, r * CELL_H);
      }
      ctx.stroke();

      if (currentMap) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, currentMap.width, currentMap.height);
      }

      currentMap?.obstacles?.forEach((obs: any) => {
        if (!isVisible(obs.x, obs.y, obs.w, obs.h)) return;
        ctx.fillStyle = '#f3f2f1';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#c8c6c4';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        
        ctx.strokeStyle = '#e1dfdd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -obs.h; i < obs.w; i += 20) {
          ctx.moveTo(obs.x + i, obs.y);
          ctx.lineTo(obs.x + i + obs.h, obs.y + obs.h);
        }
        ctx.stroke();
      });

      currentMap?.bushes?.forEach((bush: any) => {
        if (!isVisible(bush.x, bush.y, bush.w, bush.h)) return;
        ctx.fillStyle = '#1e3b2b'; 
        ctx.fillRect(bush.x, bush.y, bush.w, bush.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Calibri';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('***', bush.x + bush.w/2, bush.y + bush.h/2);
      });

      gameState.puddles?.forEach((p: any) => {
        if (!isVisible(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)) return;
        ctx.fillStyle = `rgba(255, 255, 0, ${Math.min(0.3, p.life / 60)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      gameState.items?.forEach((item: any) => {
        if (!isVisible(item.x - 15, item.y - 15, 30, 30)) return;
        ctx.fillStyle = 'rgba(0, 120, 215, 0.2)';
        ctx.fillRect(item.x - 15, item.y - 15, 30, 30);
        ctx.strokeStyle = '#0078d7';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(item.x - 15, item.y - 15, 30, 30);
        ctx.setLineDash([]);
      });

      gameState.enemies?.forEach((e: any) => {
        if (!isVisible(e.x - e.width/2, e.y - e.height/2, e.width, e.height)) return;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (e.type === 'Minion') {
          ctx.fillStyle = '#666666';
          ctx.font = '14px Calibri';
          ctx.fillText(e.text, e.x, e.y);
        } else if (e.type === 'Elite') {
          ctx.fillStyle = '#e81123';
          ctx.font = '16px Calibri';
          ctx.fillText(e.text, e.x, e.y);
          ctx.beginPath();
          ctx.strokeStyle = '#e81123';
          ctx.lineWidth = 1;
          for(let i = -e.width/2; i < e.width/2; i+=4) {
            ctx.lineTo(e.x + i, e.y + 10 + (i%8 === 0 ? 2 : -2));
          }
          ctx.stroke();
        } else if (e.type === 'MiniBoss') {
          ctx.fillStyle = '#fff2ab';
          ctx.fillRect(e.x - e.width/2, e.y - e.height/2, e.width, e.height);
          ctx.strokeStyle = '#c8c6c4';
          ctx.strokeRect(e.x - e.width/2, e.y - e.height/2, e.width, e.height);
          ctx.fillStyle = '#000000';
          ctx.font = '14px Calibri';
          ctx.fillText(e.text, e.x, e.y);
        } else if (e.type === 'EliteBoss') {
          ctx.fillStyle = '#e81123';
          ctx.font = 'bold 24px Calibri';
          ctx.fillText(e.text, e.x, e.y);
        }

        if (e.type === 'MiniBoss' || e.type === 'EliteBoss') {
          ctx.fillStyle = '#e1dfdd';
          ctx.fillRect(e.x - e.width/2, e.y - e.height/2 - 10, e.width, 4);
          ctx.fillStyle = '#e81123';
          ctx.fillRect(e.x - e.width/2, e.y - e.height/2 - 10, e.width * (e.hp / e.maxHp), 4);
        }
      });

      Object.values(gameState.players).forEach((p: any) => {
        if (p.hp > 0) {
          if (!isVisible(p.x - 40, p.y - 12, 80, 24)) return;

          const isMe = p.id === myId;
          const now = Date.now();
          const isInvincible = p.invincibleUntil && now < p.invincibleUntil;
          
          if (isInvincible) {
            ctx.globalAlpha = Math.floor(now / 150) % 2 === 0 ? 0.5 : 1.0;
          }
          
          ctx.fillStyle = 'rgba(33, 115, 70, 0.1)';
          ctx.fillRect(p.x - 40, p.y - 12, 80, 24);
          ctx.strokeStyle = isMe ? '#217346' : '#800080';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x - 40, p.y - 12, 80, 24);
          
          ctx.fillStyle = isMe ? '#217346' : '#800080';
          ctx.fillRect(p.x + 37, p.y + 9, 6, 6);

          ctx.fillStyle = '#000000';
          ctx.font = '12px Calibri';
          ctx.textAlign = 'left';
          ctx.fillText(isMe ? '我' : '同事', p.x - 35, p.y + 4);

          ctx.fillStyle = '#e1dfdd';
          ctx.fillRect(p.x - 40, p.y + 15, 80, 4);
          ctx.fillStyle = '#217346';
          ctx.fillRect(p.x - 40, p.y + 15, 80 * (p.hp / p.maxHp), 4);

          ctx.globalAlpha = 1.0;
        } else if (p.id === myId) {
          ctx.fillStyle = '#e81123';
          ctx.font = 'bold 12px Calibri';
          ctx.fillText('#DIV/0!', p.x - 20, p.y + 4);
        }
      });

      gameState.bullets?.forEach((b: any) => {
        if (!isVisible(b.x - 20, b.y - 20, 40, 40)) return;
        
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        
        ctx.fillStyle = '#000000';
        let fontStr = '';
        if (b.isItalic) fontStr += 'italic ';
        if (b.isBold) fontStr += 'bold ';
        fontStr += `${b.size}px Calibri`;
        ctx.font = fontStr;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('文字', 0, 0);
        
        if (b.isUnderline) {
          ctx.beginPath();
          ctx.moveTo(-10, b.size/2);
          ctx.lineTo(10, b.size/2);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = b.isBold ? 2 : 1;
          ctx.stroke();
        }
        
        ctx.restore();
      });

      gameState.lasers?.forEach((l: any) => {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.strokeStyle = `rgba(232, 17, 35, ${l.life / 30})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(3000, 0);
        ctx.stroke();
        ctx.restore();
      });

      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.font = 'bold 14px Calibri';
        ctx.globalAlpha = Math.max(0, p.life / 30);
        ctx.fillText(p.text, p.x, p.y);
      });
      ctx.globalAlpha = 1.0;
      particles.current = particles.current.filter(p => p.life > 0);

      ctx.restore();

      ctx.fillStyle = '#f3f2f1';
      ctx.fillRect(0, 0, canvas.width, 24);
      ctx.strokeStyle = '#c8c6c4';
      ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(canvas.width, 24); ctx.stroke();
      
      ctx.fillStyle = '#666666';
      ctx.font = '12px Calibri, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.beginPath();
      for (let c = startCol; c <= endCol; c++) {
        const screenX = (c * CELL_W - cameraX) * SCALE;
        const screenW = CELL_W * SCALE;
        let colName = '';
        let tempC = c;
        while (tempC >= 0) {
          colName = String.fromCharCode(65 + (tempC % 26)) + colName;
          tempC = Math.floor(tempC / 26) - 1;
        }
        ctx.fillText(colName, screenX + screenW / 2, 12);
        ctx.moveTo(screenX, 0); 
        ctx.lineTo(screenX, 24);
      }
      ctx.stroke();

      ctx.fillStyle = '#f3f2f1';
      ctx.fillRect(0, 0, 40, canvas.height);
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, canvas.height); ctx.stroke();
      
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.beginPath();
      for (let r = startRow; r <= endRow; r++) {
        const screenY = (r * CELL_H - cameraY) * SCALE;
        const screenH = CELL_H * SCALE;
        ctx.fillText((r + 1).toString(), 20, screenY + screenH / 2);
        ctx.moveTo(0, screenY); 
        ctx.lineTo(40, screenY);
      }
      ctx.stroke();

      ctx.fillStyle = '#e1dfdd';
      ctx.fillRect(0, 0, 40, 24);
      ctx.beginPath();
      ctx.moveTo(40, 0); ctx.lineTo(40, 24); ctx.lineTo(0, 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(35, 19); ctx.lineTo(35, 24); ctx.lineTo(40, 24);
      ctx.fillStyle = '#c8c6c4';
      ctx.fill();

      if (selectionStartRef.current && selectionEndRef.current) {
        const x = Math.min(selectionStartRef.current.x, selectionEndRef.current.x);
        const y = Math.min(selectionStartRef.current.y, selectionEndRef.current.y);
        const w = Math.abs(selectionEndRef.current.x - selectionStartRef.current.x);
        const h = Math.abs(selectionEndRef.current.y - selectionStartRef.current.y);
        
        ctx.fillStyle = 'rgba(0, 120, 215, 0.2)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#0078d7';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      }

      if (gameState.bulletTime > 0) {
        ctx.fillStyle = 'rgba(0, 120, 215, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0078d7';
        ctx.font = 'bold 24px Calibri';
        ctx.textAlign = 'center';
        ctx.fillText('框选网格以删除！', canvas.width/2, 50);
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [currentRoom, showGridMenu]);

  if (!currentRoom) {
    return (
      <div className="flex w-full h-screen bg-white font-sans text-[14px] select-none">
        <div className="w-32 bg-[#217346] text-white flex flex-col py-4">
          <div className="px-4 py-2 hover:bg-[#1e6b40] cursor-pointer font-semibold">主页</div>
          <div className="px-4 py-2 bg-[#1e6b40] cursor-pointer font-semibold border-l-4 border-white">新建</div>
        </div>
        <div className="flex-1 p-10 bg-[#f3f2f1]">
          <h1 className="text-2xl font-light mb-6 text-gray-800">新建</h1>
          <div className="mt-12 max-w-md">
            <h2 className="text-lg font-light mb-4 text-gray-800">开始本地游戏 (文档保卫战)</h2>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                className="border border-gray-400 px-3 py-2 outline-none focus:border-[#217346]"
                placeholder="输入文档名称..."
              />
              <button 
                onClick={joinRoom}
                className="bg-[#217346] text-white px-4 py-2 hover:bg-[#1e6b40] transition-colors w-fit"
              >
                开始游戏
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const me = uiState?.players[myId];

  return (
    <div className="flex flex-col w-full h-screen bg-white font-sans text-[13px] select-none overflow-hidden">
      <div className="bg-[#217346] text-white px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{currentRoom} - Excel保卫战</span>
        </div>
        <div className="flex gap-4 text-lg leading-none cursor-default">
          <span className="hover:bg-[#1e6b40] px-2">_</span>
          <span className="hover:bg-[#1e6b40] px-2">□</span>
          <span className="hover:bg-[#e81123] px-2">×</span>
        </div>
      </div>
      
      <div className="bg-[#f3f2f1] border-b border-[#e1dfdd] flex flex-col">
        <div className="flex gap-1 px-2 pt-1 text-gray-600">
          <span className="px-3 py-1 bg-white border border-[#e1dfdd] border-b-white -mb-[1px] z-10 text-[#217346] font-semibold">开始</span>
        </div>
        <div className="bg-white px-4 py-2 flex gap-6 items-center border-t border-[#e1dfdd]">
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
              <span className={`font-bold font-serif border px-2 py-0.5 ${me?.skills.includes('bold') ? 'bg-gray-200 border-gray-400' : 'border-transparent text-gray-400'}`}>B</span>
              <span className={`italic font-serif border px-2 py-0.5 ${me?.skills.includes('italic') ? 'bg-gray-200 border-gray-400' : 'border-transparent text-gray-400'}`}>I</span>
              <span className={`underline font-serif border px-2 py-0.5 ${me?.skills.includes('underline') ? 'bg-gray-200 border-gray-400' : 'border-transparent text-gray-400'}`}>U</span>
              <span className={`line-through font-serif border px-2 py-0.5 ${me?.skills.includes('strikethrough') ? 'bg-gray-200 border-gray-400' : 'border-transparent text-gray-400'}`}>ab</span>
              <span className={`font-serif border px-2 py-0.5 bg-yellow-100 ${me?.skills.includes('highlight') ? 'border-yellow-400' : 'border-transparent text-gray-400'}`}>A</span>
            </div>
            <span className="text-[10px] text-gray-500">已激活技能</span>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-700 font-semibold">第 {uiState?.stage || 1} 关</span>
            <span className="text-[10px] text-gray-500">生存进度: {Math.floor((uiState?.stageTimer || 0) / 60)}s / 30s</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-1 border-b border-[#e1dfdd] bg-white">
        <div className="w-20 text-center border border-[#e1dfdd] bg-white shadow-inner py-0.5 text-gray-700">
          {me ? `HP:${Math.floor(me.hp)}` : 'A1'}
        </div>
        <div className="text-gray-400 font-serif italic font-bold text-base px-1">fx</div>
        <div className="flex-1 border border-[#e1dfdd] px-2 py-0.5 bg-white shadow-inner font-mono text-gray-700">
          {me ? `=玩家(击杀:${me.kills}, 死亡:${me.deaths})` : '=正在加载...'}
        </div>
      </div>

      <div className="flex-1 relative w-full h-full bg-[#f3f2f1]" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onClick={handleRespawn}
          className="absolute inset-0 block"
          style={{ cursor: 'crosshair' }}
        />
        
        {showGridMenu && (
          <div 
            id="grid-menu"
            className="absolute bg-white border border-gray-300 shadow-lg py-1 flex flex-col text-sm z-10"
            style={{ left: gridMenuPos.x, top: gridMenuPos.y }}
          >
            <button className="px-4 py-1 hover:bg-gray-100 text-left" onClick={() => handleGridAction('area')}>删除选区 (Delete Area)</button>
            <button className="px-4 py-1 hover:bg-gray-100 text-left" onClick={() => handleGridAction('row')}>删除行 (Delete Row)</button>
            <button className="px-4 py-1 hover:bg-gray-100 text-left" onClick={() => handleGridAction('col')}>删除列 (Delete Column)</button>
            <div className="h-px bg-gray-200 my-1"></div>
            <button className="px-4 py-1 hover:bg-gray-100 text-left text-gray-500" onClick={() => {
              setShowGridMenu(false);
              if (gameStateRef.current) gameStateRef.current.bulletTime = 0;
            }}>取消</button>
          </div>
        )}

        {uiState?.isSelectingSkill && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded shadow-xl max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">格式化完成！选择一项新能力</h2>
              <p className="text-gray-600 mb-6">准备进入第 {uiState.stage + 1} 关</p>
              
              <div className="grid grid-cols-1 gap-4">
                {(Object.keys(SKILL_NAMES) as Skill[]).filter(s => !me?.skills.includes(s)).map(skill => (
                  <button 
                    key={skill}
                    onClick={() => handleSelectSkill(skill)}
                    className="flex flex-col items-start p-4 border border-gray-300 hover:border-[#217346] hover:bg-green-50 transition-colors text-left"
                  >
                    <span className="font-bold text-lg text-[#217346]">{SKILL_NAMES[skill]}</span>
                    <span className="text-gray-600 mt-1">{SKILL_DESCS[skill]}</span>
                  </button>
                ))}
                {Object.keys(SKILL_NAMES).filter(s => !me?.skills.includes(s as Skill)).length === 0 && (
                  <button 
                    onClick={() => handleSelectSkill('bold')}
                    className="p-4 border border-[#217346] bg-green-50 font-bold text-[#217346]"
                  >
                    能力已满，继续下一关！
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#f3f2f1] border-t border-[#e1dfdd] flex items-center px-2 py-1 text-sm text-gray-600">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(sheetNum => (
            <div 
              key={sheetNum}
              className={`px-4 py-1 cursor-default ${uiState?.stage === sheetNum ? 'bg-white border-b-2 border-[#217346] font-semibold text-[#217346]' : 'hover:bg-gray-200'}`}
            >
              Sheet{sheetNum}
            </div>
          ))}
        </div>
        <div className="ml-auto flex gap-4 px-4">
          <span>就绪</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
