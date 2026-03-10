import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [staticData, setStaticData] = useState<any>(null);
  const [myId, setMyId] = useState<string>('');
  
  // Lobby State
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('工作簿1');

  const keys = useRef({ w: false, a: false, s: false, d: false });
  const mouse = useRef({ x: 0, y: 0, isDown: false });
  const animationFrameId = useRef<number | null>(null);
  
  // Juice / Game Feel
  const particles = useRef<any[]>([]);
  const shake = useRef<number>(0);
  const myIdRef = useRef<string>('');

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('init', (data) => {
      setMyId(data.socketId);
      setStaticData({ obstacles: data.obstacles, bushes: data.bushes });
    });

    newSocket.on('state', (state) => {
      setGameState(state);
    });

    newSocket.on('hit', (data) => {
      // Screen shake if I got hit
      if (data.target === myIdRef.current) {
        shake.current = 15;
      }
      // Spawn particles
      for(let i=0; i<3; i++) {
        particles.current.push({
          x: data.x + (Math.random()-0.5)*30,
          y: data.y + (Math.random()-0.5)*30,
          vx: (Math.random()-0.5)*6,
          vy: (Math.random()-0.5)*6 - 2,
          life: 30 + Math.random()*20,
          text: i === 0 ? `-${data.damage}` : ['#VALUE!', '#REF!', '#NAME?'][Math.floor(Math.random()*3)],
          color: '#e81123'
        });
      }
    });

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
    };

    const handleMouseDown = () => { mouse.current.isDown = true; };
    const handleMouseUp = () => { mouse.current.isDown = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      newSocket.close();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const joinRoom = () => {
    if (roomInput.trim() && socket) {
      socket.emit('joinRoom', roomInput.trim());
      setCurrentRoom(roomInput.trim());
    }
  };

  useEffect(() => {
    if (!socket || !gameState || !staticData || !currentRoom) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      const me = gameState.players[myId];
      if (me) {
        const screenX = canvas.width / 2;
        const screenY = canvas.height / 2;
        const angle = Math.atan2(mouse.current.y - screenY, mouse.current.x - screenX);

        socket.emit('input', {
          keys: keys.current,
          angle,
          isShooting: mouse.current.isDown
        });
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let cameraX = me ? me.x - canvas.width / 2 : 0;
      let cameraY = me ? me.y - canvas.height / 2 : 0;

      // Apply Screen Shake
      if (shake.current > 0) {
        cameraX += (Math.random() - 0.5) * shake.current;
        cameraY += (Math.random() - 0.5) * shake.current;
        shake.current *= 0.9; // decay
        if (shake.current < 0.5) shake.current = 0;
      }

      ctx.save();
      ctx.translate(-cameraX, -cameraY);

      const CELL_W = 80;
      const CELL_H = 24;
      
      const startCol = Math.floor(cameraX / CELL_W);
      const startRow = Math.floor(cameraY / CELL_H);
      const endCol = startCol + canvas.width / CELL_W + 2;
      const endRow = startRow + canvas.height / CELL_H + 2;

      // Culling helper
      const isVisible = (x: number, y: number, w: number, h: number) => {
        return x + w > cameraX && x < cameraX + canvas.width &&
               y + h > cameraY && y < cameraY + canvas.height;
      };

      // Draw Grid Lines
      ctx.strokeStyle = '#e1dfdd';
      ctx.lineWidth = 1;
      for (let c = startCol; c <= endCol; c++) {
        ctx.beginPath(); ctx.moveTo(c * CELL_W, cameraY); ctx.lineTo(c * CELL_W, cameraY + canvas.height); ctx.stroke();
      }
      for (let r = startRow; r <= endRow; r++) {
        ctx.beginPath(); ctx.moveTo(cameraX, r * CELL_H); ctx.lineTo(cameraX + canvas.width, r * CELL_H); ctx.stroke();
      }

      // Draw Background Data (Optimized pseudo-random)
      ctx.fillStyle = '#a6a6a6';
      ctx.font = '11px Calibri, sans-serif';
      for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
          const hash = ((c * 37) ^ (r * 13)) % 100;
          if (hash > 85) {
            ctx.fillText((hash * 123.45).toFixed(2), c * CELL_W + 5, r * CELL_H + 16);
          }
        }
      }

      // Draw Items
      gameState.items.forEach((item: any) => {
        if (!isVisible(item.x - 40, item.y - 12, 80, 24)) return;
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(item.x - 40, item.y - 12, 80, 24);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Calibri';
        const text = item.type === 'Sniper' ? '=MACRO()' : item.type === 'Shotgun' ? '=PIVOT()' : '=VLOOKUP()';
        ctx.fillText(text, item.x - 35, item.y + 4);
      });

      // Draw Players
      Object.values(gameState.players).forEach((p: any) => {
        if (p.hp > 0) {
          if (p.hidden && p.id !== myId) return;
          if (!isVisible(p.x - 40, p.y - 12, 80, 24)) return;

          const isMe = p.id === myId;
          ctx.globalAlpha = (p.hidden && isMe) ? 0.3 : 1.0;

          ctx.strokeStyle = isMe ? '#217346' : '#800080';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x - 40, p.y - 12, 80, 24);
          
          ctx.fillStyle = isMe ? '#217346' : '#800080';
          ctx.fillRect(p.x + 37, p.y + 9, 6, 6);

          ctx.fillStyle = '#000000';
          ctx.font = '12px Calibri';
          ctx.fillText(p.hp + '%', p.x - 35, p.y + 4);

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(p.angle) * 30, p.y + Math.sin(p.angle) * 30);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.globalAlpha = 1.0;
        } else if (p.id === myId) {
          ctx.fillStyle = '#e81123';
          ctx.font = 'bold 12px Calibri';
          ctx.fillText('#DIV/0!', p.x - 20, p.y + 4);
        }
      });

      // Draw Bullets (Differentiated)
      gameState.bullets.forEach((b: any) => {
        if (!isVisible(b.x - 10, b.y - 10, 20, 20)) return;
        
        if (b.weaponType === 'Sniper') {
          ctx.fillStyle = '#e81123';
          ctx.font = 'bold 16px Calibri';
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(Math.atan2(b.vy, b.vx));
          ctx.fillText('==>', -10, 5);
          ctx.restore();
        } else if (b.weaponType === 'Shotgun') {
          ctx.fillStyle = '#d2691e';
          ctx.font = 'bold 18px Calibri';
          ctx.fillText('*', b.x - 5, b.y + 5);
        } else if (b.weaponType === 'MachineGun') {
          ctx.fillStyle = '#b8860b';
          ctx.font = 'bold 20px Calibri';
          ctx.fillText('.', b.x - 3, b.y + 3);
        } else {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Calibri';
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(Math.atan2(b.vy, b.vx));
          ctx.fillText('-', -5, 5);
          ctx.restore();
        }
      });

      // Draw Obstacles (Optimized)
      staticData.obstacles.forEach((obs: any) => {
        if (!isVisible(obs.x, obs.y, obs.w, obs.d)) return;
        
        ctx.fillStyle = '#f3f2f1';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.d);
        ctx.strokeStyle = '#c8c6c4';
        ctx.lineWidth = 1;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.d);
        
        ctx.fillStyle = '#a6a6a6';
        ctx.font = '12px Calibri';
        // Only draw #REF! if the specific text is visible
        for (let x = obs.x + 5; x < obs.x + obs.w - 20; x += 40) {
          for (let y = obs.y + 15; y < obs.y + obs.d; y += 20) {
            if (isVisible(x, y-12, 30, 12)) {
              ctx.fillText('#REF!', x, y);
            }
          }
        }
      });

      // Draw Bushes (Optimized)
      staticData.bushes.forEach((bush: any) => {
        if (!isVisible(bush.x - bush.r, bush.y - bush.r, bush.r * 2, bush.r * 2)) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bush.x - bush.r, bush.y - bush.r, bush.r * 2, bush.r * 2);
        
        ctx.fillStyle = '#000000';
        ctx.font = '11px Calibri';
        // Draw fewer hashes, deterministic based on position to avoid flickering
        for (let i = 0; i < 20; i++) {
          const tx = bush.x - bush.r + (((bush.x * i) % 100) / 100) * bush.r * 2;
          const ty = bush.y - bush.r + (((bush.y * i) % 100) / 100) * bush.r * 2;
          ctx.fillText('######', tx, ty);
        }
      });

      // Draw Particles
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

      // Draw Headers (Fixed to screen)
      ctx.fillStyle = '#f3f2f1';
      ctx.fillRect(0, 0, canvas.width, 24);
      ctx.strokeStyle = '#c8c6c4';
      ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(canvas.width, 24); ctx.stroke();
      
      ctx.fillStyle = '#666666';
      ctx.font = '12px Calibri, sans-serif';
      ctx.textAlign = 'center';
      for (let c = startCol; c <= endCol; c++) {
        const x = c * CELL_W - cameraX + CELL_W / 2;
        let colName = '';
        let tempC = c;
        while (tempC >= 0) {
          colName = String.fromCharCode(65 + (tempC % 26)) + colName;
          tempC = Math.floor(tempC / 26) - 1;
        }
        ctx.fillText(colName, x, 16);
        ctx.beginPath(); ctx.moveTo(c * CELL_W - cameraX, 0); ctx.lineTo(c * CELL_W - cameraX, 24); ctx.stroke();
      }

      ctx.fillStyle = '#f3f2f1';
      ctx.fillRect(0, 0, 40, canvas.height);
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, canvas.height); ctx.stroke();
      
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      for (let r = startRow; r <= endRow; r++) {
        const y = r * CELL_H - cameraY + 16;
        ctx.fillText((r + 1).toString(), 20, y);
        ctx.beginPath(); ctx.moveTo(0, r * CELL_H - cameraY); ctx.lineTo(40, r * CELL_H - cameraY); ctx.stroke();
      }

      ctx.fillStyle = '#e1dfdd';
      ctx.fillRect(0, 0, 40, 24);
      ctx.beginPath();
      ctx.moveTo(40, 0); ctx.lineTo(40, 24); ctx.lineTo(0, 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(35, 19); ctx.lineTo(35, 24); ctx.lineTo(40, 24);
      ctx.fillStyle = '#c8c6c4';
      ctx.fill();

      ctx.textAlign = 'left';

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, staticData, myId, socket, currentRoom]);

  const handleCanvasClick = () => {
    if (gameState && gameState.players[myId] && gameState.players[myId].hp <= 0) {
      socket?.emit('respawn');
    }
  };

  // LOBBY UI
  if (!currentRoom) {
    return (
      <div className="flex w-full h-screen bg-white font-sans text-[14px] select-none">
        {/* Left Sidebar */}
        <div className="w-32 bg-[#217346] text-white flex flex-col py-4">
          <div className="px-4 py-2 hover:bg-[#1e6b40] cursor-pointer font-semibold">主页</div>
          <div className="px-4 py-2 bg-[#1e6b40] cursor-pointer font-semibold border-l-4 border-white">新建</div>
          <div className="px-4 py-2 hover:bg-[#1e6b40] cursor-pointer font-semibold">打开</div>
          <div className="mt-auto px-4 py-2 hover:bg-[#1e6b40] cursor-pointer">账户</div>
          <div className="px-4 py-2 hover:bg-[#1e6b40] cursor-pointer">选项</div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-10 bg-[#f3f2f1]">
          <h1 className="text-2xl font-light mb-6 text-gray-800">新建</h1>
          
          <div className="flex gap-6">
            <div 
              className="flex flex-col gap-2 cursor-pointer group"
              onClick={() => {
                if(roomInput.trim()) joinRoom();
              }}
            >
              <div className="w-48 h-36 bg-white border border-gray-300 group-hover:border-[#217346] shadow-sm flex items-center justify-center">
                <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-24 h-24">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="bg-gray-100 border border-gray-200"></div>
                  ))}
                </div>
              </div>
              <span className="font-semibold text-gray-700 group-hover:text-[#217346]">空白工作簿</span>
            </div>
          </div>

          <div className="mt-12 max-w-md">
            <h2 className="text-lg font-light mb-4 text-gray-800">加入或创建局域网协作</h2>
            <div className="flex flex-col gap-3">
              <label className="text-gray-600">工作簿名称 (房间号)</label>
              <input 
                type="text" 
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                className="border border-gray-400 px-3 py-2 outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346]"
                placeholder="输入文档名称..."
              />
              <button 
                onClick={joinRoom}
                className="bg-[#217346] text-white px-4 py-2 hover:bg-[#1e6b40] transition-colors w-fit"
              >
                开始协作
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GAME UI
  return (
    <div className="flex flex-col w-full h-screen bg-white font-sans text-[13px] select-none overflow-hidden">
      {/* Title Bar */}
      <div className="bg-[#217346] text-white px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h6v6h6v10H6z"/>
            <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
          </svg>
          <span className="font-semibold">{currentRoom} - Excel</span>
        </div>
        <div className="flex gap-4 text-lg leading-none cursor-default">
          <span className="hover:bg-[#1e6b40] px-2">_</span>
          <span className="hover:bg-[#1e6b40] px-2">□</span>
          <span className="hover:bg-[#e81123] px-2">×</span>
        </div>
      </div>
      
      {/* Ribbon */}
      <div className="bg-[#f3f2f1] border-b border-[#e1dfdd] flex flex-col">
        <div className="flex gap-1 px-2 pt-1 text-gray-600">
          <span className="px-3 py-1 hover:bg-gray-200 cursor-pointer">文件</span>
          <span className="px-3 py-1 bg-white border border-[#e1dfdd] border-b-white -mb-[1px] z-10 text-[#217346] font-semibold">开始</span>
          <span className="px-3 py-1 hover:bg-gray-200 cursor-pointer">插入</span>
          <span className="px-3 py-1 hover:bg-gray-200 cursor-pointer">页面布局</span>
          <span className="px-3 py-1 hover:bg-gray-200 cursor-pointer">公式</span>
          <span className="px-3 py-1 hover:bg-gray-200 cursor-pointer">数据</span>
          <span className="px-3 py-1 hover:bg-gray-200 cursor-pointer">审阅</span>
          <span className="px-3 py-1 hover:bg-gray-200 cursor-pointer">视图</span>
        </div>
        <div className="bg-white px-4 py-2 flex gap-6 items-center border-t border-[#e1dfdd]">
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
              <span className="font-bold font-serif border border-transparent hover:border-gray-300 px-2 py-0.5 cursor-pointer">B</span>
              <span className="italic font-serif border border-transparent hover:border-gray-300 px-2 py-0.5 cursor-pointer">I</span>
              <span className="underline font-serif border border-transparent hover:border-gray-300 px-2 py-0.5 cursor-pointer">U</span>
            </div>
            <span className="text-[10px] text-gray-500">字体</span>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
              <span className="border border-transparent hover:border-gray-300 px-2 py-0.5 cursor-pointer">≡</span>
              <span className="border border-transparent hover:border-gray-300 px-2 py-0.5 cursor-pointer">≡</span>
              <span className="border border-transparent hover:border-gray-300 px-2 py-0.5 cursor-pointer">≡</span>
            </div>
            <span className="text-[10px] text-gray-500">对齐方式</span>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="flex flex-col items-center gap-1">
            <span className="border border-transparent hover:border-gray-300 px-4 py-0.5 cursor-pointer">合并后居中</span>
          </div>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-[#e1dfdd] bg-white">
        <div className="w-20 text-center border border-[#e1dfdd] bg-white shadow-inner py-0.5 text-gray-700">
          {myId && gameState?.players[myId] ? `HP${gameState.players[myId].hp}` : 'A1'}
        </div>
        <div className="text-gray-400 font-serif italic font-bold text-base px-1">fx</div>
        <div className="flex-1 border border-[#e1dfdd] px-2 py-0.5 bg-white shadow-inner font-mono text-gray-700">
          {myId && gameState?.players[myId] 
            ? `=玩家(武器:"${gameState.players[myId].weapon === 'Sniper' ? '狙击枪' : gameState.players[myId].weapon === 'Shotgun' ? '霰弹枪' : gameState.players[myId].weapon === 'MachineGun' ? '机枪' : '手枪'}", 击杀:${gameState.players[myId].kills}, 死亡:${gameState.players[myId].deaths})` 
            : '=正在连接服务器()...'}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative w-full h-full" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 block"
          style={{ cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}
