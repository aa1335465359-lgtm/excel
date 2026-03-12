import React from 'react';

interface MainMenuProps {
  roomInput: string;
  setRoomInput: (val: string) => void;
  joinRoom: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ roomInput, setRoomInput, joinRoom }) => {
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
};
