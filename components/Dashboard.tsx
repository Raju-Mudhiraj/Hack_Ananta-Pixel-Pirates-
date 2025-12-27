
import React, { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { DailyEntry, MenuItem } from '../types';
import { TrendingDown, Leaf, Activity, Zap, Compass, Download, Clock, UserPlus, Flame } from 'lucide-react';

interface DashboardProps {
  history: DailyEntry[];
  menu: MenuItem[];
  onNavigate: (view: any) => void;
  preOrders: Record<string, number>;
}

const Dashboard: React.FC<DashboardProps> = ({ history, menu, preOrders }) => {
  const [liveActivities, setLiveActivities] = useState<any[]>([]);

  useEffect(() => {
    const activities = [
      { id: 1, type: 'preorder', user: 'User 882', item: 'Chicken Curry', impact: '-240g', time: 'Just now' },
      { id: 2, type: 'log', user: 'Kitchen S1', item: 'Garden Salad', impact: 'Audit Saved', time: '12m ago' },
      { id: 3, type: 'goal', user: 'Campus', item: 'Weekly Target', impact: '88% Reached', time: '1h ago' },
    ];
    setLiveActivities(activities);

    const interval = setInterval(() => {
      const newItem = {
        id: Date.now(),
        type: Math.random() > 0.5 ? 'preorder' : 'log',
        user: `User ${Math.floor(Math.random() * 900) + 100}`,
        item: menu[Math.floor(Math.random() * menu.length)]?.name || 'Item',
        impact: Math.random() > 0.5 ? `-${Math.floor(Math.random() * 300)}g` : 'Logged',
        time: 'Just now'
      };
      setLiveActivities(prev => [newItem, ...prev.slice(0, 4)]);
    }, 15000);
    return () => clearInterval(interval);
  }, [menu]);

  const exportLogs = () => {
    if (history.length === 0) {
      alert("No logs available to export.");
      return;
    }
    const headers = ['Date', 'Menu Item', 'Prepared', 'Consumed', 'Waste', 'Pre-Orders', 'Efficiency %'];
    const rows = history.map(e => {
      const menuItem = menu.find(m => m.id === e.menuItemId)?.name || 'Unknown';
      const efficiency = e.prepared > 0 ? ((e.consumed / e.prepared) * 100).toFixed(1) : '0';
      return [e.date, `"${menuItem}"`, e.prepared, e.consumed, e.waste, e.preOrders, `${efficiency}%`].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smartcanteen_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const latestEntries = history.slice(-7);
  const chartData = latestEntries.map(e => ({
    date: e.date,
    waste: e.waste,
    consumed: e.consumed,
    prepared: e.prepared,
    confidenceHigh: e.prepared + 5,
    confidenceLow: Math.max(0, e.prepared - 5)
  }));

  const totalWaste = history.reduce((sum, e) => sum + e.waste, 0);
  const totalPrepared = history.reduce((sum, e) => sum + e.prepared, 0);
  const avgEfficiency = totalPrepared > 0 ? (((totalPrepared - totalWaste) / totalPrepared) * 100).toFixed(1) : "0";
  const carbonSaved = totalWaste * 180;

  const pieData = [
    { name: 'Optimization', value: 45, color: '#10b981' },
    { name: 'Plate Waste', value: 25, color: '#ef4444' },
    { name: 'Unpredictable', value: 30, color: '#64748b' },
  ];

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">Campus Efficiency Core</h2>
          <p className="text-slate-500 text-sm sm:text-base font-medium">Monitoring real-time carbon delta.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={exportLogs}
            className="flex-1 sm:flex-none bg-white text-slate-900 px-5 py-3 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-sm font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={16} /> <span className="hidden xs:inline">Export</span> Logs
          </button>
          <div className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Carbon Saved', val: `${(carbonSaved / 1000).toFixed(1)}kg`, icon: Leaf, color: 'emerald', trend: '↑ 14%' },
          { label: 'Avg Efficiency', val: `${avgEfficiency}%`, icon: Activity, color: 'blue', trend: '↑ 2.1%' },
          { label: 'Plate Waste', val: `${totalWaste} units`, icon: TrendingDown, color: 'red', trend: '↓ 8.5%' },
          { label: 'Prediction Sync', val: '94%', icon: Zap, color: 'orange', trend: 'Stable' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`bg-${card.color}-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6`}>
              <card.icon className={`text-${card.color}-500 w-5 h-5 sm:w-6 sm:h-6`} />
            </div>
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">{card.label}</p>
            <h3 className="text-2xl sm:text-3xl font-black mt-1 text-slate-800 tracking-tight">{card.val}</h3>
            <div className={`mt-3 sm:mt-4 text-[9px] sm:text-[10px] font-black text-${card.color}-600 bg-${card.color}-50 w-fit px-2 py-1 rounded-lg`}>{card.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h4 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
                <Compass className="text-emerald-500" /> Confidence Corridors
              </h4>
              <div className="flex gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Consumed</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-100 rounded-sm"></div> Confidence</span>
              </div>
            </div>
            <div className="h-[250px] sm:h-[350px] lg:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="confidenceHigh" stroke="none" fill="#10b981" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="confidenceLow" stroke="none" fill="#f8fafc" fillOpacity={1} />
                  <Area type="monotone" dataKey="consumed" stroke="#10b981" fill="url(#colorConf)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            <div className="w-full md:w-1/2 h-[200px] sm:h-[300px]">
              <h4 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 tracking-tighter text-center md:text-left">Waste Attribution</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius="65%" outerRadius="85%" paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3 sm:space-y-4">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 sm:p-6 bg-slate-50 rounded-[24px] sm:rounded-[28px] border border-slate-100">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm sm:text-lg font-black text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-base sm:text-xl font-black text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="bg-slate-900 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 text-white min-h-[500px] flex flex-col relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8 sm:mb-10">
                <h4 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 sm:gap-3">
                  <Clock className="text-emerald-500" /> Live Feed
                </h4>
                <div className="bg-emerald-500/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase text-emerald-400">Live</div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {liveActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 sm:gap-4 animate-in slide-in-from-right-4">
                    <div className="bg-white/5 p-2 rounded-lg sm:p-2.5 sm:rounded-xl border border-white/10 shrink-0">
                      {act.type === 'preorder' ? <UserPlus size={14} className="text-emerald-400" /> : <Activity size={14} className="text-blue-400" />}
                    </div>
                    <div className="flex-1 border-b border-white/5 pb-3 sm:pb-4">
                      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        <p className="text-xs sm:text-sm font-black text-white">{act.user}</p>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500">{act.time}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-2">Reserved <span className="text-white font-bold">{act.item}</span></p>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Leaf size={10} className="text-emerald-500" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-500">{act.impact} saved</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto relative z-10 pt-8 sm:pt-10">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 text-center">
                <Flame size={24} className="text-orange-500 mx-auto mb-3" />
                <h5 className="text-base sm:text-lg font-black mb-1">Campus Streak</h5>
                <p className="text-[10px] sm:text-xs text-slate-400">Zero-waste target active!</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-500/5 blur-[100px] rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
