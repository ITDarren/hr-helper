
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Gift, RotateCcw, Trophy, Settings2, Sparkles, UserPlus, Layers, ChevronLeft, ChevronRight, X, Clock, Plus, Trash2, List, ChevronDown, FileUp, Download } from 'lucide-react';
import { Participant, Winner, Prize } from '../types';

interface Props {
  participants: Participant[];
  prizes: Prize[];
  setPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
  winners: Winner[];
  setWinners: React.Dispatch<React.SetStateAction<Winner[]>>;
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}

const ITEMS_PER_PAGE_SIDE = 7;

const RaffleTool: React.FC<Props> = ({ 
  participants, prizes, setPrizes, winners, setWinners, config, setConfig 
}) => {
  const prizeFileInputRef = useRef<HTMLInputElement>(null);

  const participantPool = useMemo(() => {
    if (config.allowRepeat) return participants;
    const winnerIds = new Set(winners.map(w => w.participant.id));
    return participants.filter(p => !winnerIds.has(p.id));
  }, [participants, winners, config.allowRepeat]);

  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeQty, setNewPrizeQty] = useState<string>('1');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<string>('等待開獎');
  const [lastDrawTimestamp, setLastDrawTimestamp] = useState<number | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationQueue, setCelebrationQueue] = useState<Participant[]>([]);
  const [celebrationPrizeName, setCelebrationPrizeName] = useState<string>('');
  const [currentCelebratingIndex, setCurrentCelebratingIndex] = useState(0);
  const [winnersPage, setWinnersPage] = useState(1);
  const [prizesPage, setPrizesPage] = useState(1);
  const [activeSideTab, setActiveSideTab] = useState<'winners' | 'prizes'>('winners');
  
  const timerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  const currentPrize = useMemo(() => prizes.find(p => p.id === config.activePrizeId), [prizes, config.activePrizeId]);

  useEffect(() => {
    if (currentPrize && !isDrawing) {
      const remainingPool = participantPool.length;
      setConfig((prev: any) => ({
        ...prev,
        drawBatchSize: String(Math.max(1, Math.min(currentPrize.quantity, remainingPool)))
      }));
    }
  }, [config.activePrizeId]);

  const handleDrawBatchBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val <= 0) {
      setConfig((prev: any) => ({ ...prev, drawBatchSize: '1' }));
    }
  };

  const handleCelebrationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || val <= 0) {
      setConfig((prev: any) => ({ ...prev, celebrationSeconds: '1' }));
    }
  };

  const loadExamplePrizes = () => {
    const examples: Prize[] = [
      { id: 'p1', name: '特等獎：MacBook Pro', quantity: 1, totalQuantity: 1 },
      { id: 'p2', name: '一等獎：iPhone 16', quantity: 2, totalQuantity: 2 },
      { id: 'p3', name: '二等獎：iPad Air', quantity: 5, totalQuantity: 5 },
      { id: 'p4', name: '參加獎：500元禮券', quantity: 10, totalQuantity: 10 },
    ];
    setPrizes(examples);
    setConfig((prev: any) => ({ ...prev, activePrizeId: 'p1' }));
    setPrizesPage(1);
  };

  const handlePrizeCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const rows = content.split(/[\n\r]+/);
      const newPrizes: Prize[] = [];

      rows.forEach(row => {
        const parts = row.split(',').map(s => s.trim());
        const name = parts[0];
        const qty = parseInt(parts[1]);
        if (name && !isNaN(qty)) {
          newPrizes.push({
            id: crypto.randomUUID(),
            name,
            quantity: qty,
            totalQuantity: qty
          });
        }
      });

      if (newPrizes.length > 0) {
        setPrizes(prev => [...prev, ...newPrizes]);
        if (!config.activePrizeId) setConfig((prev: any) => ({ ...prev, activePrizeId: newPrizes[0].id }));
        setPrizesPage(1);
      }
      if (prizeFileInputRef.current) prizeFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleAddPrize = () => {
    if (!newPrizeName.trim()) return;
    const qty = Math.max(1, parseInt(newPrizeQty) || 1);
    const newPrize: Prize = { id: crypto.randomUUID(), name: newPrizeName, quantity: qty, totalQuantity: qty };
    setPrizes(prev => [...prev, newPrize]);
    setNewPrizeName('');
    setNewPrizeQty('1');
    if (!config.activePrizeId) setConfig((prev: any) => ({ ...prev, activePrizeId: newPrize.id }));
  };

  const removePrize = (id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id));
    if (config.activePrizeId === id) setConfig((prev: any) => ({ ...prev, activePrizeId: '' }));
  };

  const exportWinners = () => {
    if (winners.length === 0) return;
    
    // 姓名, 獎項
    const header = "姓名,獎項\n";
    const rows = winners.map(w => `"${w.participant.name}","${w.prize}"`).join("\n");
    
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `中獎名單_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (isCelebrating && celebrationQueue.length > 0) {
      if (currentCelebratingIndex < celebrationQueue.length) {
        const duration = (parseFloat(config.celebrationSeconds) || 3) * 1000;
        celebrationTimerRef.current = window.setTimeout(() => {
          setCurrentCelebratingIndex(prev => prev + 1);
        }, duration);
      } else {
        setIsCelebrating(false);
        setCelebrationQueue([]);
        setCelebrationPrizeName('');
        setCurrentCelebratingIndex(0);
      }
    }
    return () => { if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current); };
  }, [isCelebrating, currentCelebratingIndex, celebrationQueue, config.celebrationSeconds]);

  const startDraw = () => {
    if (!currentPrize) { alert('請先選擇或建立一個獎項！'); return; }
    if (participantPool.length === 0) { alert('名單池已空！'); return; }
    if (currentPrize.quantity <= 0) { alert('該獎項名額已抽完！'); return; }

    const batch = Math.min(parseInt(config.drawBatchSize) || 1, currentPrize.quantity, participantPool.length);
    setIsDrawing(true);
    const startTime = Date.now();
    const duration = 2000;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const randomIndex = Math.floor(Math.random() * participantPool.length);
      setCurrentDisplay(participantPool[randomIndex].name);
      if (elapsed < duration) {
        timerRef.current = window.setTimeout(animate, 60);
      } else {
        finalizeBatchDraw(batch);
      }
    };
    animate();
  };

  const finalizeBatchDraw = (count: number) => {
    if (!currentPrize) return;
    
    const prizeNameAtMoment = currentPrize.name;
    const shuffled = [...participantPool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    const timestamp = Date.now();
    const newWinnerEntries: Winner[] = selected.map(p => ({
      participant: p,
      prize: prizeNameAtMoment,
      timestamp: timestamp
    }));

    setWinners(prev => [...newWinnerEntries, ...prev]);
    setLastDrawTimestamp(timestamp);
    setCurrentDisplay(selected.length === 1 ? selected[0].name : `${selected.length} 位得獎者`);
    setIsDrawing(false);
    
    setCelebrationPrizeName(prizeNameAtMoment);
    setCelebrationQueue(selected);
    setCurrentCelebratingIndex(0);
    setIsCelebrating(true);
    
    setPrizes(prev => {
      const updatedPrizes = prev.map(p => 
        p.id === config.activePrizeId ? { ...p, quantity: Math.max(0, p.quantity - count) } : p
      );
      
      const updatedCurrent = updatedPrizes.find(p => p.id === config.activePrizeId);
      if (updatedCurrent && updatedCurrent.quantity <= 0) {
        const nextAvailable = updatedPrizes.find(p => p.quantity > 0);
        if (nextAvailable) {
          setTimeout(() => {
            setConfig((prevConfig: any) => ({ ...prevConfig, activePrizeId: nextAvailable.id }));
          }, 100);
        }
      }
      return updatedPrizes;
    });

    setWinnersPage(1);
  };

  const handleReset = () => {
    if (!isConfirmingReset) { setIsConfirmingReset(true); return; }
    setWinners([]);
    setPrizes(prev => prev.map(p => ({ ...p, quantity: p.totalQuantity })));
    setLastDrawTimestamp(null);
    setCurrentDisplay('等待開獎');
    setIsConfirmingReset(false);
    setWinnersPage(1);
  };

  const totalWinnersPages = Math.ceil(winners.length / ITEMS_PER_PAGE_SIDE);
  const paginatedWinners = winners.slice((winnersPage - 1) * ITEMS_PER_PAGE_SIDE, winnersPage * ITEMS_PER_PAGE_SIDE);
  const totalPrizesPages = Math.ceil(prizes.length / ITEMS_PER_PAGE_SIDE);
  const paginatedPrizes = prizes.slice((prizesPage - 1) * ITEMS_PER_PAGE_SIDE, prizesPage * ITEMS_PER_PAGE_SIDE);

  const getVisiblePages = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const getAdaptiveFontSize = (name: string) => {
    const len = name.length;
    if (len <= 3) return 'text-5xl sm:text-7xl md:text-9xl lg:text-[12rem] tracking-tight';
    if (len <= 6) return 'text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] tracking-tighter';
    if (len <= 12) return 'text-3xl sm:text-5xl md:text-7xl lg:text-[8rem] tracking-tighter';
    return 'text-2xl sm:text-4xl md:text-6xl lg:text-[6rem] tracking-tighter';
  };

  // 根據目前顯示的文字動態計算字體大小，避免換行
  const getDisplayBoxFontSize = (text: string) => {
    if (text === '等待開獎') {
      return 'text-4xl md:text-6xl lg:text-8xl';
    }
    if (text.includes('位得獎者')) {
      // 針對「X 位得獎者」模式，使用稍微縮小的比例
      return 'text-4xl sm:text-5xl md:text-7xl lg:text-8xl';
    }
    // 預設（通常是人名）
    const len = text.length;
    if (len <= 4) return 'text-5xl sm:text-6xl md:text-8xl lg:text-9xl';
    if (len <= 8) return 'text-4xl sm:text-5xl md:text-7xl lg:text-8xl';
    return 'text-3xl sm:text-4xl md:text-6xl lg:text-7xl';
  };

  return (
    <div className="relative h-full flex flex-col min-h-0">
      {/* 全螢幕遮罩 */}
      {isCelebrating && celebrationQueue[currentCelebratingIndex] && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in duration-500 overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 left-0 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-indigo-500 rounded-full blur-[100px] sm:blur-[180px] animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-purple-500 rounded-full blur-[100px] sm:blur-[180px] animate-pulse delay-700"></div>
          </div>
          <button 
            onClick={() => setIsCelebrating(false)} 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/50 hover:text-white transition-colors p-2 sm:p-4 z-[110]"
          >
            <X size={32} className="sm:hidden" />
            <X size={54} className="hidden sm:block" />
          </button>
          
          <div className="text-center space-y-6 sm:space-y-10 max-w-6xl w-full relative z-[105] flex flex-col items-center overflow-y-auto no-scrollbar py-10">
            <div className="flex justify-center">
              <div className="bg-yellow-400 p-4 sm:p-8 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.4)] sm:shadow-[0_0_80px_rgba(250,204,21,0.6)] animate-bounce">
                <Trophy size={40} className="sm:hidden text-yellow-900" />
                <Trophy size={80} className="hidden sm:block text-yellow-900" />
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-4">
              <p className="text-yellow-400 font-black tracking-[0.4em] sm:tracking-[0.6em] text-lg sm:text-2xl uppercase drop-shadow-lg">恭喜中獎</p>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tight max-w-full truncate px-4">
                {celebrationPrizeName}
              </h2>
            </div>
            
            <div className="py-10 px-6 sm:py-20 sm:px-12 bg-white/5 rounded-[30px] sm:rounded-[60px] backdrop-blur-3xl border border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.4)] sm:shadow-[0_30px_70px_rgba(0,0,0,0.6)] w-full max-w-4xl border-t-white/30 border-l-white/10">
              <p className="text-indigo-200 text-lg sm:text-2xl mb-4 sm:mb-6 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">WINNER</p>
              <h3 className={`${getAdaptiveFontSize(celebrationQueue[currentCelebratingIndex].name)} font-black text-white break-words drop-shadow-2xl leading-tight px-4 transition-all duration-300`}>
                {celebrationQueue[currentCelebratingIndex].name}
              </h3>
            </div>
            
            <div className="flex flex-col items-center gap-4 sm:gap-6 mt-4 sm:mt-6 w-full">
              <div className="w-64 sm:w-80 md:w-[400px] h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-1000 linear" 
                  style={{ width: `${((currentCelebratingIndex + 1) / celebrationQueue.length) * 100}%` }}
                />
              </div>
              <p className="text-white/40 text-sm sm:text-lg font-black animate-pulse tracking-[0.2em] sm:tracking-[0.4em] uppercase text-center px-4">
                {celebrationQueue.length > 1 
                  ? `NEXT IN ${config.celebrationSeconds}S (${currentCelebratingIndex + 1}/${celebrationQueue.length})` 
                  : `CLOSE IN ${config.celebrationSeconds}S`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-full min-h-0">
        <div className="lg:col-span-7 flex flex-col gap-6 min-h-0">
          <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col flex-shrink-0">
            <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-black tracking-tight truncate px-4">
                  {currentPrize ? `正在進行：${currentPrize.name}` : '尚未選取獎項'}
                </h2>
                <div className="flex items-center justify-center gap-6 mt-4 text-lg font-bold">
                   <span className="bg-white/10 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-inner">剩餘：{currentPrize?.quantity || 0} / {currentPrize?.totalQuantity || 0}</span>
                   <span className="bg-white/10 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-inner">抽籤池：{participantPool.length}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>

            <div className="p-10 flex-grow flex flex-col items-center justify-center space-y-10 min-h-[450px]">
              <div className="w-full max-w-xl">
                 <div className={`flex items-center justify-center ${getDisplayBoxFontSize(currentDisplay)} font-black min-h-[18rem] py-16 rounded-[60px] border-8 transition-all duration-500 px-6 break-normal whitespace-nowrap overflow-hidden leading-tight shadow-2xl ${
                   isDrawing 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 animate-pulse' 
                    : lastDrawTimestamp 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700 scale-[1.03] shadow-emerald-100 border-emerald-400' 
                      : 'bg-slate-50 border-slate-100 text-slate-800'
                 }`}>
                  {currentDisplay}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-2xl px-6">
                <button
                  onClick={startDraw}
                  disabled={isDrawing || !currentPrize || currentPrize.quantity <= 0 || participantPool.length === 0}
                  className={`w-full sm:flex-1 px-8 sm:px-16 py-6 rounded-[32px] text-2xl sm:text-3xl font-black shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-5 ${
                    isDrawing || !currentPrize || currentPrize.quantity <= 0 || participantPool.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-indigo-100'
                  }`}
                >
                  <Gift size={36} /> {isDrawing ? '抽取中...' : '開始抽獎'}
                </button>
                <button
                  onClick={handleReset}
                  className={`w-full sm:w-auto px-8 sm:px-10 py-6 rounded-[32px] font-black transition-all border-4 text-xl shadow-sm flex items-center justify-center gap-4 ${isConfirmingReset ? 'bg-orange-500 border-orange-500 text-white animate-pulse' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                >
                  <RotateCcw size={28} /> {isConfirmingReset ? '確定？' : '重置'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 overflow-y-auto custom-scrollbar flex-grow min-h-0">
            <div className="flex items-center gap-3 mb-8 border-b pb-4 border-slate-100">
              <Settings2 className="text-indigo-600 w-7 h-7" />
              <h3 className="font-black text-xl text-slate-800 uppercase tracking-wide">抽籤控制台</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 flex flex-col md:flex-row gap-8">
                <div className="flex-grow space-y-3 min-w-0">
                  <label className="text-base font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <List size={16}/> 目前獎項
                  </label>
                  <div className="relative group">
                    <select 
                      value={config.activePrizeId} 
                      onChange={(e) => setConfig((prev: any) => ({ ...prev, activePrizeId: e.target.value }))}
                      className="w-full p-4 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 font-black text-indigo-700 text-lg appearance-none transition-all cursor-pointer hover:border-indigo-300 hover:shadow-md shadow-sm pr-14"
                    >
                      {prizes.length === 0 ? (
                        <option value="">請先新增獎項</option>
                      ) : (
                        prizes.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (剩餘 {p.quantity})
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 group-hover:text-indigo-600 transition-colors">
                      <ChevronDown size={28} className="stroke-[3]" />
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-36 space-y-3 flex-shrink-0">
                  <label className="text-base font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <UserPlus size={16}/> 抽取人數
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    value={config.drawBatchSize} 
                    onChange={(e) => setConfig((prev: any) => ({ ...prev, drawBatchSize: e.target.value }))} 
                    onBlur={handleDrawBatchBlur}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 font-black text-indigo-700 text-xl shadow-sm text-center" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-base font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={16}/> 慶祝停留秒數</label>
                <input 
                  type="number" 
                  min="1" 
                  step="0.5" 
                  value={config.celebrationSeconds} 
                  onChange={(e) => setConfig((prev: any) => ({ ...prev, celebrationSeconds: e.target.value }))} 
                  onBlur={handleCelebrationBlur}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 font-black text-indigo-700 text-xl shadow-sm" 
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-base font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={16}/> 抽籤重複規則</label>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[22px] shadow-inner border border-slate-200">
                  <button onClick={() => setConfig((prev: any) => ({ ...prev, allowRepeat: false }))} className={`flex-1 py-3.5 rounded-2xl text-base font-black transition-all ${!config.allowRepeat ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px] border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}>不重複</button>
                  <button onClick={() => setConfig((prev: any) => ({ ...prev, allowRepeat: true }))} className={`flex-1 py-3.5 rounded-2xl text-base font-black transition-all ${config.allowRepeat ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px] border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}>允許重複</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col min-h-0">
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 h-full flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 flex-shrink-0">
              <button onClick={() => { setActiveSideTab('winners'); setWinnersPage(1); }} className={`flex-1 py-4 flex items-center justify-center gap-3 font-black text-xl rounded-2xl transition-all ${activeSideTab === 'winners' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Trophy size={20}/> 中獎紀錄 ({winners.length})
              </button>
              <button onClick={() => { setActiveSideTab('prizes'); setPrizesPage(1); }} className={`flex-1 py-4 flex items-center justify-center gap-3 font-black text-xl rounded-2xl transition-all ${activeSideTab === 'prizes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={20}/> 獎項清單 ({prizes.length})
              </button>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
                {activeSideTab === 'winners' ? (
                  winners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-24">
                      <Trophy size={70} className="mb-4 text-slate-300"/>
                      <p className="text-lg font-black uppercase tracking-widest">目前尚無開獎紀錄</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end mb-2">
                        <button 
                          onClick={exportWinners}
                          className="flex items-center gap-2 text-base font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm transition-all hover:bg-emerald-100"
                        >
                          <Download size={14}/> 匯出名單
                        </button>
                      </div>
                      {paginatedWinners.map((w, idx) => (
                        <div key={`${w.participant.id}-${w.timestamp}-${idx}`} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${w.timestamp === lastDrawTimestamp ? 'bg-emerald-50 border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-3' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-black text-slate-800 text-xl truncate leading-tight">{w.participant.name}</div>
                            <div className="text-base text-slate-400 font-black mt-2 uppercase tracking-tighter">
                              {w.prize} • {new Date(w.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <Trophy size={22} className={w.timestamp === lastDrawTimestamp ? 'text-emerald-500' : 'text-slate-200'} />
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-8">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-5 flex-shrink-0 shadow-inner">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                           <Plus className="text-indigo-600" size={18}/>
                           <h4 className="text-xl font-black text-slate-500 uppercase tracking-widest">管理獎項</h4>
                        </div>
                        <button onClick={() => prizeFileInputRef.current?.click()} className="flex items-center gap-2 text-base font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm transition-all hover:bg-indigo-50">
                          <FileUp size={14}/> CSV 匯入
                        </button>
                        <input ref={prizeFileInputRef} type="file" accept=".csv" className="hidden" onChange={handlePrizeCSVUpload} />
                      </div>
                      <input type="text" placeholder="獎項名稱" value={newPrizeName} onChange={(e) => setNewPrizeName(e.target.value)} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold" />
                      <div className="flex gap-3">
                        <input type="number" min="1" placeholder="數量" value={newPrizeQty} onChange={(e) => setNewPrizeQty(e.target.value)} className="w-28 p-4 bg-white border-2 border-slate-100 rounded-xl text-xl outline-none font-bold" />
                        <button onClick={handleAddPrize} className="flex-1 bg-indigo-600 text-white font-black rounded-xl text-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">新增獎項</button>
                      </div>
                      <button onClick={loadExamplePrizes} className="w-full text-base text-slate-400 font-black hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">載入預設獎項範例</button>
                    </div>
                    <div className="space-y-3">
                      {paginatedPrizes.map(p => (
                        <div key={p.id} onClick={() => setConfig((prev: any) => ({ ...prev, activePrizeId: p.id }))} className={`group flex items-center justify-between p-5 rounded-2xl border-4 cursor-pointer transition-all ${config.activePrizeId === p.id ? 'bg-indigo-50 border-indigo-400 shadow-md' : 'bg-white border-slate-50 hover:border-slate-200'}`}>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className={`font-black text-lg truncate ${config.activePrizeId === p.id ? 'text-indigo-700' : 'text-slate-700'}`}>{p.name}</div>
                            <div className="text-base text-slate-400 font-bold mt-2 uppercase tracking-widest">剩餘 {p.quantity} / 共 {p.totalQuantity}</div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removePrize(p.id); }} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={22}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {((activeSideTab === 'winners' && totalWinnersPages > 1) || (activeSideTab === 'prizes' && totalPrizesPages > 1)) && (
                <div className="p-6 border-t border-slate-100 flex flex-col gap-4 bg-slate-50/80 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <button onClick={() => activeSideTab === 'winners' ? setWinnersPage(p => Math.max(1, p - 1)) : setPrizesPage(p => Math.max(1, p - 1))} disabled={(activeSideTab === 'winners' ? winnersPage : prizesPage) === 1} className="p-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-20 shadow-sm">
                      <ChevronLeft size={24}/>
                    </button>
                    <div className="flex gap-2 max-w-[320px] overflow-x-auto no-scrollbar justify-center px-2">
                      {getVisiblePages(
                        activeSideTab === 'winners' ? winnersPage : prizesPage, 
                        activeSideTab === 'winners' ? totalWinnersPages : totalPrizesPages
                      ).map(p => (
                        <button 
                          key={p} 
                          onClick={() => activeSideTab === 'winners' ? setWinnersPage(p) : setPrizesPage(p)} 
                          className={`min-w-[52px] h-10 px-3 rounded-2xl text-sm font-black transition-all ${((activeSideTab === 'winners' ? winnersPage : prizesPage) === p) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => activeSideTab === 'winners' ? setWinnersPage(p => Math.min(totalWinnersPages, p + 1)) : setPrizesPage(p => Math.min(totalPrizesPages, p + 1))} disabled={(activeSideTab === 'winners' ? winnersPage : prizesPage) === (activeSideTab === 'winners' ? totalWinnersPages : totalPrizesPages)} className="p-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-20 shadow-sm">
                      <ChevronRight size={24}/>
                    </button>
                  </div>
                  
                  {/* 跳頁選單 */}
                  <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-3">
                    <span className="text-base font-black text-slate-400 uppercase tracking-widest">跳至第</span>
                    <select 
                      value={activeSideTab === 'winners' ? winnersPage : prizesPage}
                      onChange={(e) => {
                        const page = Number(e.target.value);
                        activeSideTab === 'winners' ? setWinnersPage(page) : setPrizesPage(page);
                      }}
                      className="bg-white border-2 border-slate-200 rounded-xl px-2 py-1 text-base font-black text-indigo-600 outline-none focus:border-indigo-400 transition-colors cursor-pointer"
                    >
                      {Array.from({ length: activeSideTab === 'winners' ? totalWinnersPages : totalPrizesPages }, (_, i) => i + 1).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <span className="text-base font-black text-slate-400 uppercase tracking-widest">頁</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleTool;
