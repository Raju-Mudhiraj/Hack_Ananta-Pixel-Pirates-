
import React, { useState, useRef, useEffect } from 'react';
import { MenuItem, DailyEntry, AppliedPlanItem } from '../types';
import { Save, Calendar, BarChart3, Info, Camera, X, Loader2, Sparkles, AlertCircle, RefreshCcw } from 'lucide-react';
import { identifyFoodAndWaste } from '../services/geminiService';

interface DataEntryProps {
  menu: MenuItem[];
  onSave: (entry: DailyEntry) => void;
  productionPlan: Record<string, AppliedPlanItem>;
}

const DataEntry: React.FC<DataEntryProps> = ({ menu, onSave, productionPlan }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    menuItemId: menu[0]?.id || '',
    prepared: 100,
    consumed: 90,
  });

  useEffect(() => {
    const planned = productionPlan[formData.menuItemId];
    if (planned) {
      setFormData(prev => ({ ...prev, prepared: planned.quantity }));
    } else {
      const menuItem = menu.find(m => m.id === formData.menuItemId);
      if (menuItem) {
        setFormData(prev => ({ ...prev, prepared: menuItem.baseQuantity }));
      }
    }
  }, [formData.menuItemId, productionPlan, menu]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanningLoading, setScanningLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ reasoning?: string; confidence?: number; wasteEstimate?: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setScanResult(null);
    setCameraError(null);
    setIsScanning(true);
    
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        setCameraError("Camera blocked. Please check permissions.");
        setIsScanning(false);
      }
    }, 100);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanningLoading(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        const result = await identifyFoodAndWaste(base64, menu);
        if (result.menuItemId) {
          const wastePercent = (result.wasteEstimate || 0) / 100;
          const wasteUnits = Math.round(formData.prepared * wastePercent);
          setFormData(prev => ({
            ...prev,
            menuItemId: result.menuItemId || prev.menuItemId,
            consumed: Math.max(0, prev.prepared - wasteUnits)
          }));
        }
        setScanResult(result);
        stopCamera();
      }
    } catch (err) {
      setCameraError("Vision analysis timed out.");
    } finally {
      setScanningLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const waste = Math.max(0, formData.prepared - formData.consumed);
    const dateObj = new Date(formData.date);
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      waste,
      preOrders: 0,
      dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      isHoliday: false,
      qualitativeFeedback: scanResult?.reasoning
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500 pb-10">
      <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-xl overflow-hidden relative">
        
        {isScanning && (
          <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in">
            <div className="p-4 sm:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 safe-area-top">
              <h3 className="text-white font-black text-sm flex items-center gap-2">
                <Camera size={18} className="text-emerald-400" /> AI SCANNER
              </h3>
              <button onClick={stopCamera} className="bg-white/10 text-white p-2 rounded-xl backdrop-blur-md active:scale-90">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-slate-900 relative">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-64 h-64 sm:w-80 sm:h-80 border-2 border-emerald-400/50 rounded-[40px] shadow-[0_0_0_2000px_rgba(0,0,0,0.6)]">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 scan-line"></div>
                 </div>
              </div>
            </div>

            <div className="p-8 sm:p-12 bg-gradient-to-t from-black to-transparent flex flex-col items-center gap-6 safe-area-bottom">
              <p className="text-white/60 text-xs font-bold text-center max-w-xs">Align tray within the frame for optimal audit accuracy.</p>
              <button onClick={captureAndAnalyze} disabled={scanningLoading} className="bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-90 disabled:opacity-50 transition-transform">
                {scanningLoading ? <Loader2 className="animate-spin text-slate-900" size={32} /> : <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-slate-900 rounded-full" />}
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="p-6 sm:p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">Waste Audit Log</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Verify actual vs AI predicted surplus.</p>
          </div>
          <button onClick={startCamera} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs sm:text-sm hover:bg-emerald-600 transition-all shadow-xl active:scale-95">
            <Camera size={18} /> Vision Scan
          </button>
        </div>

        {scanResult && (
          <div className="mx-6 sm:mx-10 mt-6 bg-emerald-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-100 flex items-start gap-3 sm:gap-4 animate-in slide-in-from-top-2">
            <Sparkles className="text-emerald-500 shrink-0 mt-0.5 sm:mt-1" size={18} />
            <div className="flex-1">
              <p className="text-emerald-900 font-bold text-xs sm:text-sm leading-tight">AI Insights Applied</p>
              <p className="text-emerald-700 text-[10px] sm:text-xs italic mt-1 leading-relaxed opacity-80">"{scanResult.reasoning}"</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6 sm:space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-2 sm:space-y-4">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14} /> Audit Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-100 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 text-base sm:text-lg font-bold focus:ring-2 focus:ring-emerald-500/20" />
            </div>

            <div className="space-y-2 sm:space-y-4">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} /> Menu Item</label>
              <select value={formData.menuItemId} onChange={(e) => setFormData({...formData, menuItemId: e.target.value})} className="w-full bg-slate-100 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 text-base sm:text-lg font-bold focus:ring-2 focus:ring-emerald-500/20">
                {menu.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>

            <div className="space-y-2 sm:space-y-4">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Prepared (Actual Units)</label>
              <div className="relative">
                <input type="number" value={formData.prepared} onChange={(e) => setFormData({...formData, prepared: parseInt(e.target.value)})} className="w-full bg-slate-100 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 text-base sm:text-lg font-bold focus:ring-2 focus:ring-emerald-500/20" />
                {productionPlan[formData.menuItemId] && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md hidden sm:block">PLAN SYNC</span>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-4">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Consumed (Actual Units)</label>
              <input type="number" value={formData.consumed} onChange={(e) => setFormData({...formData, consumed: parseInt(e.target.value)})} className="w-full bg-slate-100 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 text-base sm:text-lg font-bold focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>

          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Info className="text-slate-400 shrink-0" size={16} />
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-none">Surplus: <span className="font-bold text-slate-900">{Math.max(0, formData.prepared - formData.consumed)} units</span></p>
            </div>
            <div className="w-full sm:w-auto text-center sm:text-right">
              <span className="text-[10px] sm:text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full whitespace-nowrap">
                {(formData.prepared > 0 ? (formData.consumed / formData.prepared) * 100 : 0).toFixed(1)}% Efficiency
              </span>
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 sm:py-6 rounded-2xl sm:rounded-[32px] text-base sm:text-xl font-black hover:bg-emerald-500 transition-all shadow-2xl flex items-center justify-center gap-2 active:scale-95">
            <Save size={18} /> Commit Log
          </button>
        </form>
      </div>
    </div>
  );
};

export default DataEntry;
