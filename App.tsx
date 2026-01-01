
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Users, Trash2, UserCheck, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { Participant, ToolMode, Prize, Winner } from './types';
import ParticipantInput from './components/ParticipantInput';
import RaffleTool from './components/RaffleTool';
import GroupingTool from './components/GroupingTool';

const ITEMS_PER_PAGE = 30; // 3 欄 x 10 列 = 30 人

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<ToolMode>(ToolMode.MANAGE);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [managePage, setManagePage] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 持久化抽籤狀態
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [raffleConfig, setRaffleConfig] = useState({
    drawBatchSize: '1',
    celebrationSeconds: '3',
    allowRepeat: false,
    activePrizeId: ''
  });

  // 當確認狀態開啟時，3秒後自動重設
  useEffect(() => {
    let timer: number;
    if (isConfirmingClear) {
      timer = window.setTimeout(() => setIsConfirmingClear(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [isConfirmingClear]);

  const handleAddParticipants = useCallback((newNames: string[]) => {
    const newParticipants: Participant[] = newNames.map(name => ({
      id: crypto.randomUUID(),
      name: name.trim()
    })).filter(p => p.name.length > 0);
    
    setParticipants(prev => [...prev, ...newParticipants]);
    setManagePage(1); 
  }, []);

  const handleGenerateMockData = (count: number) => {
    const baseNames = [
      "陳小明", "林大華", "李美玲", "張雅婷", "王大同", 
      "蔡依林", "張學友", "郭富城", "王力宏", "謝霆鋒", 
      "周星馳", "梁朝偉", "古天樂", "吳彥祖", "彭于晏", 
      "許光漢", "柯佳嬿", "桂綸鎂", "舒淇", "賈靜雯",
      "趙又廷", "張鈞甯", "阮經天", "陳意涵", "柯震東",
      "周杰倫", "昆凌", "林俊傑", "蔡康永", "徐熙娣",
      "王大陸", "郭雪芙", "曾之喬", "炎亞綸", "畢書盡"
    ];
    
    const finalNames: string[] = [];
    for (let i = 0; i < count; i++) {
      const base = baseNames[i % baseNames.length];
      const suffix = i >= baseNames.length ? ` ${Math.floor(i / baseNames.length) + 1}` : '';
      finalNames.push(`${base}${suffix}`);
    }
    
    handleAddParticipants(finalNames);
  };

  const handleClearParticipants = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }
    setParticipants([]);
    setIsConfirmingClear(false);
    setManagePage(1);
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set();
    const uniqueParticipants = participants.filter(p => {
      const isDuplicate = seen.has(p.name);
      seen.add(p.name);
      return !isDuplicate;
    });
    setParticipants(uniqueParticipants);
    setManagePage(1);
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const duplicates = useMemo(() => {
    const nameCounts = new Map<string, number>();
    participants.forEach(p => {
      nameCounts.set(p.name, (nameCounts.get(p.name) || 0) + 1);
    });
    return nameCounts;
  }, [participants]);

  const hasDuplicates = useMemo(() => {
    return Array.from(duplicates.values()).some((count: number) => count > 1);
  }, [duplicates]);

  // 分頁邏輯
  const totalPages = Math.max(1, Math.ceil(participants.length / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const start = (managePage - 1) * ITEMS_PER_PAGE;
    return participants.slice(start, start + ITEMS_PER_PAGE);
  }, [participants, managePage]);

  const gridSlots = useMemo(() => {
    const slots = [...currentItems];
    while (slots.length < ITEMS_PER_PAGE) {
      slots.push(null as any);
    }
    return slots;
  }, [currentItems]);

  const tabs = [
    { id: ToolMode.MANAGE, label: '名單管理' },
    { id: ToolMode.RAFFLE, label: '獎品抽籤' },
    { id: ToolMode.GROUPING, label: '自動分組' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm">
              <Users className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">HR Pro Toolkit</h1>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-lg font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile Toggle Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Collapse Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-xl animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col p-4 gap-2">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full px-6 py-4 rounded-xl text-left text-lg font-black transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-6 flex flex-col min-h-0">
        {activeTab === ToolMode.MANAGE && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0">
            <div className="lg:col-span-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <ParticipantInput onAdd={handleAddParticipants} onAddMock={handleGenerateMockData} />
            </div>
            
            <div className="lg:col-span-8 flex flex-col min-h-0">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 flex-shrink-0">
                  <div>
                    <h2 className="text-2xl font-black">參與者名單 ({participants.length})</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {hasDuplicates && (
                      <button onClick={handleRemoveDuplicates} className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-base font-bold">
                        <UserCheck size={18} /> 移除重複
                      </button>
                    )}
                    {participants.length > 0 && (
                      <button onClick={handleClearParticipants} className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-base font-bold border ${isConfirmingClear ? 'bg-red-600 text-white border-red-600 animate-pulse' : 'text-red-500 hover:bg-red-50 border-transparent'}`}>
                        <Trash2 size={18} /> {isConfirmingClear ? '確定清除？' : '清除名單'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-grow p-8 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                  {participants.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center h-full">
                      <Users className="text-slate-200 mb-6 w-20 h-20" />
                      <p className="text-slate-400 text-xl font-bold">尚無名單，請手動新增或載入範例資料</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-grow content-start">
                      {gridSlots.map((p, idx) => {
                        if (!p) return <div key={`empty-${idx}`} className="h-[60px] border border-transparent"></div>;
                        const isDuplicate = (duplicates.get(p.name) || 0) > 1;
                        return (
                          <div key={p.id} className={`group flex items-center justify-between p-4 rounded-2xl border transition-all h-[60px] ${isDuplicate ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span className={`font-black text-xl truncate ${isDuplicate ? 'text-amber-900' : 'text-slate-800'}`}>{p.name}</span>
                              {isDuplicate && <span className="text-base bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-md uppercase font-black shrink-0">重複</span>}
                            </div>
                            <button onClick={() => removeParticipant(p.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {totalPages > 0 && (
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                    <button 
                      onClick={() => setManagePage(p => Math.max(1, p - 1))}
                      disabled={managePage === 1}
                      className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors font-bold text-slate-600 shadow-sm"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={28} />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum = managePage - 2 + i;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (managePage <= 3) pageNum = i + 1;
                        else if (managePage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        
                        if (pageNum < 1 || pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setManagePage(pageNum)}
                            className={`w-14 h-14 rounded-2xl text-lg font-black transition-all ${managePage === pageNum ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => setManagePage(p => Math.min(totalPages, p + 1))}
                      disabled={managePage === totalPages}
                      className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors font-bold text-slate-600 shadow-sm"
                      aria-label="Next Page"
                    >
                      <ChevronRight size={28} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === ToolMode.RAFFLE && (
          <RaffleTool 
            participants={participants} 
            prizes={prizes}
            setPrizes={setPrizes}
            winners={winners}
            setWinners={setWinners}
            config={raffleConfig}
            setConfig={setRaffleConfig}
          />
        )}

        {activeTab === ToolMode.GROUPING && (
          <GroupingTool participants={participants} />
        )}
      </main>

      <footer className="h-12 border-t border-slate-200 bg-white flex items-center justify-center text-slate-400 text-sm font-medium flex-shrink-0">
        &copy; {new Date().getFullYear()} HR Pro Toolkit • 讓企業活動更有儀式感
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
