import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  interface Room {
    id: string;
    players: Record<string, any>;
    bullets: any[];
    obstacles: any[];
    bushes: any[];
    items: any[];
    bulletIdCounter: number;
  }

  const rooms = new Map<string, Room>();

  function createRoom(roomId: string): Room {
    const obstacles = [];
    const bushes = [];
    const items = [];
    
    // Map size 3000x3000
    for(let i=0; i<60; i++) {
      obstacles.push({ 
        x: Math.random() * 2800 + 100, 
        y: Math.random() * 2800 + 100, 
        w: Math.random() * 200 + 80, 
        d: Math.random() * 200 + 80 
      });
    }
    for(let i=0; i<60; i++) {
      bushes.push({ 
        x: Math.random() * 2800 + 100, 
        y: Math.random() * 2800 + 100, 
        r: Math.random() * 50 + 40 
      });
    }
    for(let i=0; i<30; i++) {
      items.push({ 
        id: Math.random(), 
        x: Math.random() * 2800 + 100, 
        y: Math.random() * 2800 + 100, 
        type: ['Shotgun', 'MachineGun', 'Sniper'][Math.floor(Math.random() * 3)] 
      });
    }

    return {
      id: roomId,
      players: {},
      bullets: [],
      obstacles,
      bushes,
      items,
      bulletIdCounter: 0
    };
  }

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    let currentRoomId: string | null = null;

    socket.on('joinRoom', (roomId: string) => {
      if (currentRoomId) {
        socket.leave(currentRoomId);
        if (rooms.has(currentRoomId)) {
          delete rooms.get(currentRoomId)!.players[socket.id];
        }
      }

      currentRoomId = roomId;
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, createRoom(roomId));
      }

      const room = rooms.get(roomId)!;
      
      room.players[socket.id] = {
        id: socket.id,
        x: Math.random() * 2800 + 100,
        y: Math.random() * 2800 + 100,
        hp: 100,
        weapon: 'Pistol',
        angle: 0,
        isMoving: false,
        lastShot: 0,
        hidden: false,
        kills: 0,
        deaths: 0
      };

      socket.emit('init', { 
        socketId: socket.id, 
        obstacles: room.obstacles, 
        bushes: room.bushes 
      });
    });

    socket.on('input', (data) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      
      const p = room.players[socket.id];
      if (!p || p.hp <= 0) return;

      p.keys = data.keys;
      p.angle = data.angle;
      p.isShooting = data.isShooting;
    });

    socket.on('respawn', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const p = room.players[socket.id];
      if (p && p.hp <= 0) {
        p.hp = 100;
        p.x = Math.random() * 2800 + 100;
        p.y = Math.random() * 2800 + 100;
        p.weapon = 'Pistol';
      }
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId)!;
        delete room.players[socket.id];
        // Optional: clean up empty rooms
        if (Object.keys(room.players).length === 0) {
          rooms.delete(currentRoomId);
        }
      }
    });
  });

  // Game Loop
  setInterval(() => {
    const now = Date.now();

    for (const [roomId, room] of rooms.entries()) {
      // Update players
      for (const id in room.players) {
        const p = room.players[id];
        if (p.hp <= 0 || !p.keys) continue;

        const speed = 5; // Slightly faster base speed
        let dx = 0;
        let dy = 0;
        if (p.keys.w) dy -= speed;
        if (p.keys.s) dy += speed;
        if (p.keys.a) dx -= speed;
        if (p.keys.d) dx += speed;

        if (dx !== 0 && dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / length) * speed;
          dy = (dy / length) * speed;
        }

        let newX = p.x + dx;
        let newY = p.y + dy;

        let collision = false;
        for (const obs of room.obstacles) {
          if (newX > obs.x && newX < obs.x + obs.w && newY > obs.y && newY < obs.y + obs.d) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          p.x = newX;
          p.y = newY;
        }

        p.x = Math.max(0, Math.min(3000, p.x));
        p.y = Math.max(0, Math.min(3000, p.y));

        p.isMoving = dx !== 0 || dy !== 0;

        p.hidden = false;
        for (const bush of room.bushes) {
          if (Math.hypot(p.x - bush.x, p.y - bush.y) < bush.r) {
            p.hidden = true;
            break;
          }
        }

        for (let i = room.items.length - 1; i >= 0; i--) {
          const item = room.items[i];
          if (Math.hypot(p.x - item.x, p.y - item.y) < 40) {
            p.weapon = item.type;
            room.items.splice(i, 1);
            setTimeout(() => {
              if (rooms.has(roomId)) {
                rooms.get(roomId)!.items.push({
                  id: Math.random(),
                  x: Math.random() * 2800 + 100,
                  y: Math.random() * 2800 + 100,
                  type: ['Shotgun', 'MachineGun', 'Sniper'][Math.floor(Math.random() * 3)]
                });
              }
            }, 15000);
          }
        }

        if (p.isShooting) {
          let fireRate = 400;
          let bulletSpeed = 18;
          let damage = 15;
          let spread = 0.05;
          let pellets = 1;

          if (p.weapon === 'MachineGun') { fireRate = 100; damage = 8; spread = 0.15; bulletSpeed = 20; }
          if (p.weapon === 'Shotgun') { fireRate = 800; damage = 12; spread = 0.3; pellets = 5; bulletSpeed = 15; }
          if (p.weapon === 'Sniper') { fireRate = 1500; damage = 80; bulletSpeed = 40; spread = 0.01; }

          if (now - p.lastShot > fireRate) {
            p.lastShot = now;
            p.hidden = false;
            
            for (let i = 0; i < pellets; i++) {
              const finalAngle = p.angle + (Math.random() - 0.5) * spread;
              room.bullets.push({
                id: room.bulletIdCounter++,
                owner: p.id,
                weaponType: p.weapon,
                x: p.x,
                y: p.y,
                vx: Math.cos(finalAngle) * bulletSpeed,
                vy: Math.sin(finalAngle) * bulletSpeed,
                damage,
                life: 100
              });
            }
          }
        }
      }

      // Update bullets
      for (let i = room.bullets.length - 1; i >= 0; i--) {
        const b = room.bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        if (b.life <= 0) {
          room.bullets.splice(i, 1);
          continue;
        }

        let hitObs = false;
        for (const obs of room.obstacles) {
          if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.d) {
            hitObs = true;
            break;
          }
        }
        if (hitObs) {
          room.bullets.splice(i, 1);
          continue;
        }

        let hitPlayer = false;
        for (const id in room.players) {
          const p = room.players[id];
          if (p.hp > 0 && id !== b.owner) {
            if (b.x > p.x - 20 && b.x < p.x + 20 && b.y > p.y - 20 && b.y < p.y + 20) {
              p.hp -= b.damage;
              
              // Emit hit event for juice (particles, shake)
              io.to(roomId).emit('hit', { x: p.x, y: p.y, damage: b.damage, target: p.id });

              if (p.hp <= 0) {
                p.hp = 0;
                p.deaths++;
                if (room.players[b.owner]) room.players[b.owner].kills++;
              }
              hitPlayer = true;
              break;
            }
          }
        }

        if (hitPlayer) {
          room.bullets.splice(i, 1);
        }
      }

      io.to(roomId).emit('state', { 
        players: room.players, 
        bullets: room.bullets, 
        items: room.items 
      });
    }
  }, 1000 / 60);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
