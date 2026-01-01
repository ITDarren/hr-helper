
import React, { useState, useRef } from 'react';
import { Upload, Plus, FileText, AlertCircle, Sparkles, Hash } from 'lucide-react';

interface Props {
  onAdd: (names: string[]) => void;
  onAddMock: (count: number) => void;
}

const ParticipantInput: React.FC<Props> = ({ onAdd, onAddMock }) => {
  const [inputText, setInputText] = useState('');
  const [mockCount, setMockCount] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkAdd = () => {
    if (!inputText.trim()) return;
    const names = inputText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;
    
    onAdd(names);
    setInputText('');
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('僅支援 .csv 或 .txt 檔案');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const names = content
        .split(/[\n\r,;]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0 && n !== 'name' && n !== '姓名');
      
      if (names.length > 0) {
        onAdd(names);
        setError(null);
      } else {
        setError('檔案中找不到有效的姓名');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="bg-indigo-600 rounded-[32px] shadow-lg p-8 text-white overflow-hidden relative group">
        <div className="relative z-10">
          <h3 className="font-black text-2xl mb-3 flex items-center gap-3">
            <Sparkles size={24} className="text-indigo-200" />
            快速開始
          </h3>
          <p className="text-indigo-100 text-lg mb-6 leading-relaxed">還沒有名單嗎？設定人數後載入範例資料進行測試。</p>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/20">
              <Hash size={20} className="text-indigo-200" />
              <label className="text-base font-black uppercase tracking-widest text-indigo-100 whitespace-nowrap">載入人數</label>
              <input 
                type="number" 
                min="1" 
                max="500" 
                value={mockCount} 
                onChange={(e) => setMockCount(parseInt(e.target.value) || 1)}
                className="bg-white/10 border-0 focus:ring-0 outline-none w-full text-right font-black text-white text-xl pr-2"
              />
            </div>
            
            <button 
              onClick={() => onAddMock(mockCount)}
              className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-md text-xl active:scale-[0.98]"
            >
              載入範例名單
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="text-indigo-600 w-7 h-7" />
          <h2 className="text-2xl font-black">快速貼上姓名</h2>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="每行一個姓名，例如：&#10;王小明&#10;李大華&#10;張美麗"
          className="w-full h-64 p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none text-lg font-medium"
        />
        <button
          onClick={handleBulkAdd}
          disabled={!inputText.trim()}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-lg shadow-indigo-100 active:scale-[0.98]"
        >
          <Plus size={24} />
          新增至名單
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="text-indigo-600 w-7 h-7" />
          <h2 className="text-2xl font-black">上傳檔案</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6 font-bold uppercase tracking-widest">支援 CSV 或 TXT 格式</p>
        
        <label className="relative flex flex-col items-center justify-center w-full h-40 border-4 border-dashed border-slate-200 rounded-[32px] hover:bg-slate-50 hover:border-indigo-300 cursor-pointer transition-all group">
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 mb-3" />
            <p className="text-lg text-slate-600 font-bold">點擊或拖放檔案</p>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".csv,.txt"
            onChange={handleFileUpload}
          />
        </label>
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-lg font-bold">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantInput;
