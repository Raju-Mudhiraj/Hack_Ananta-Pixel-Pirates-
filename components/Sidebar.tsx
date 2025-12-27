
import React from 'react';
import { LayoutDashboard, Users, PlusCircle, BrainCircuit, Leaf, Settings, UserCircle, ChefHat, History } from 'lucide-react';
import { AppView, UserRole } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, role, onRoleChange }) => {
  const allNavItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
    { id: AppView.PREDICTIONS, label: 'Strategy', icon: BrainCircuit, roles: ['ADMIN', 'STAFF'] },
    { id: AppView.KITCHEN, label: 'Kitchen', icon: ChefHat, roles: ['ADMIN', 'STAFF'] },
    { id: AppView.DATA_ENTRY, label: 'Audit', icon: PlusCircle, roles: ['ADMIN', 'STAFF'] },
    { id: AppView.STUDENT_PORTAL, label: 'Portal', icon: Users, roles: ['ADMIN', 'STAFF', 'STUDENT'] },
    { id: AppView.ORDER_HISTORY, label: 'Past Orders', icon: History, roles: ['STUDENT'] },
    { id: AppView.MENU_MANAGER, label: 'Menu', icon: Settings, roles: ['ADMIN'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white h-screen border-r border-slate-200 flex-col sticky top-0 z-50">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">SmartCanteen</h1>
        </div>

        <div className="p-4 border-b border-slate-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Identity Switcher</label>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="w-full bg-slate-50 border-none rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="ADMIN">Administrator</option>
            <option value="STAFF">Canteen Staff</option>
            <option value="STUDENT">Student Access</option>
          </select>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${isActive
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 font-bold translate-x-1'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl border border-white/40 px-2 py-2 z-[100] flex items-center justify-around shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] rounded-3xl safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-1 flex-1 py-1.5 rounded-2xl transition-all active:scale-90 ${isActive ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400'
                }`}
            >
              <Icon size={20} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}
        <div className="w-[1px] h-6 bg-slate-100 mx-1 shrink-0"></div>
        <button
          onClick={() => {
            const next = role === 'ADMIN' ? 'STAFF' : role === 'STAFF' ? 'STUDENT' : 'ADMIN';
            onRoleChange(next);
          }}
          className="flex flex-col items-center gap-1 flex-1 py-1.5 text-slate-400 active:scale-90"
        >
          <UserCircle size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">Role</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
