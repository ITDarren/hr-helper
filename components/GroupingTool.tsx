
import React, { useState } from 'react';
import { LayoutGrid, Shuffle, Download, UsersRound, FileDown } from 'lucide-react';
import { Participant, Group } from '../types';

interface Props {
  participants: Participant[];
}

const GroupingTool: React.FC<Props> = ({ participants }) => {
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGrouping, setIsGrouping] = useState(false);

  const performGrouping = () => {
    if (participants.length === 0) {
      alert('請先輸入參與者名單！');
      return;
    }

    setIsGrouping(true);
    
    setTimeout(() => {
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const newGroups: Group[] = [];
      
      let groupIndex = 1;
      for (let i = 0; i < shuffled.length; i += groupSize) {
        newGroups.push({
          id: crypto.randomUUID(),
          name: `第 ${groupIndex} 組`,
          members: shuffled.slice(i, i + groupSize)
        });
        groupIndex++;
      }
      
      setGroups(newGroups);
      setIsGrouping(false);
    }, 600);
  };

  const downloadCSV = () => {
    if (groups.length === 0) return;
    
    const header = "組別,姓名\n";
    const rows = groups.flatMap(group => 
      group.members.map(member => `${group.name},${member.name}`)
    ).join("\n");
    
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `分組結果_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-800">自動分組工具</h2>
            <p className="text-xl text-slate-500 font-medium">將 {participants.length} 位參與者分配到小組中</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-4">
              <label className="text-lg font-black text-slate-600 whitespace-nowrap">每組人數</label>
              <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
                <button 
                  onClick={() => setGroupSize(Math.max(2, groupSize - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-indigo-600 transition-colors text-xl font-black"
                >-</button>
                <span className="w-16 text-center font-black text-2xl text-indigo-700">{groupSize}</span>
                <button 
                  onClick={() => setGroupSize(Math.min(20, groupSize + 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-indigo-600 transition-colors text-xl font-black"
                >+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={performGrouping}
                disabled={isGrouping || participants.length === 0}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                  isGrouping || participants.length === 0
                    ? 'bg-slate-200 text-slate-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                }`}
              >
                <Shuffle size={22} className={isGrouping ? 'animate-spin' : ''} />
                {isGrouping ? '分組中...' : '開始隨機分組'}
              </button>

              {groups.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl text-lg font-black border-4 border-slate-100 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <FileDown size={22} />
                  匯出名單
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {groups.map((group, idx) => (
            <div key={group.id} className="bg-white rounded-[40px] shadow-sm border-2 border-slate-200 overflow-hidden hover:shadow-xl transition-all">
              <div className={`p-6 border-b-2 flex items-center justify-between ${
                [
                  'bg-blue-50 border-blue-100 text-blue-700',
                  'bg-emerald-50 border-emerald-100 text-emerald-700',
                  'bg-amber-50 border-amber-100 text-amber-700',
                  'bg-rose-50 border-rose-100 text-rose-700',
                  'bg-purple-50 border-purple-100 text-purple-700',
                  'bg-sky-50 border-sky-100 text-sky-700'
                ][idx % 6]
              }`}>
                <h4 className="text-xl font-black flex items-center gap-3">
                  <UsersRound size={22} />
                  {group.name}
                </h4>
                <span className="text-base font-black opacity-60 bg-white/40 px-2 py-1 rounded-full">{group.members.length} 人</span>
              </div>
              <ul className="p-6 space-y-2">
                {group.members.map((member, mIdx) => (
                  <li key={member.id} className="flex items-center gap-3 py-2 px-4 bg-slate-50 rounded-xl group hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors">
                    <span className="text-base font-black text-slate-300 w-5">{mIdx + 1}</span>
                    <span className="text-lg font-black text-slate-800 truncate">{member.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[60px] border-4 border-dashed border-slate-200 opacity-60">
          <LayoutGrid size={70} className="mx-auto text-slate-200 mb-5" />
          <h3 className="text-xl font-black text-slate-400">尚未進行分組</h3>
          <p className="text-slate-400 text-base mt-2 font-medium">設定每組人數並點擊上方按鈕開始</p>
        </div>
      )}
    </div>
  );
};

export default GroupingTool;
