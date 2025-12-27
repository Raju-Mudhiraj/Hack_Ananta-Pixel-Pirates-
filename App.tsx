
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentPortal from './components/StudentPortal';
import DataEntry from './components/DataEntry';
import PredictionView from './components/PredictionView';
import MenuManager from './components/MenuManager';
import KitchenDisplay from './components/KitchenDisplay';
import OrderHistory from './components/OrderHistory';
import { AppView, DailyEntry, MenuItem, UserRole, OptimizationMode, PortionSize, AppliedPlanItem, ActiveOrder, OrderStatus, Notification } from './types';
import { INITIAL_MENU, INITIAL_HISTORY } from './mockData';
import { Bell, Search, User, Zap, Leaf, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('sc_role') as UserRole) || 'ADMIN';
  });
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('sc_menu_v10');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [history, setHistory] = useState<DailyEntry[]>(() => {
    const saved = localStorage.getItem('sc_history');
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });

  const [preOrders, setPreOrders] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sc_preorders');
    return saved ? JSON.parse(saved) : {};
  });

  const [tomorrowPreOrders, setTomorrowPreOrders] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sc_tomorrow_preorders');
    return saved ? JSON.parse(saved) : {};
  });

  const [productionPlan, setProductionPlan] = useState<Record<string, AppliedPlanItem>>(() => {
    const saved = localStorage.getItem('sc_plan');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>(() => {
    const saved = localStorage.getItem('sc_active_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>(() => {
    return (localStorage.getItem('sc_opt_mode') as OptimizationMode) || 'NORMAL';
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('sc_notifications');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'System Live', message: 'SmartCanteen Core is now operational.', timestamp: Date.now() - 3600000, isRead: false, type: 'SUCCESS' },
      { id: '2', title: 'AI Forecast Ready', message: 'Tomorrow\'s demand prediction is available for review.', timestamp: Date.now() - 1800000, isRead: false, type: 'INFO' }
    ];
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Persistence
  useEffect(() => { localStorage.setItem('sc_menu_v10', JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem('sc_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('sc_preorders', JSON.stringify(preOrders)); }, [preOrders]);
  useEffect(() => { localStorage.setItem('sc_tomorrow_preorders', JSON.stringify(tomorrowPreOrders)); }, [tomorrowPreOrders]);
  useEffect(() => { localStorage.setItem('sc_plan', JSON.stringify(productionPlan)); }, [productionPlan]);
  useEffect(() => { localStorage.setItem('sc_active_orders', JSON.stringify(activeOrders)); }, [activeOrders]);
  useEffect(() => { localStorage.setItem('sc_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('sc_opt_mode', optimizationMode); }, [optimizationMode]);
  useEffect(() => { localStorage.setItem('sc_role', role); }, [role]);

  const addNotification = (title: string, message: string, type: Notification['type'] = 'INFO', targetRole?: UserRole) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      timestamp: Date.now(),
      isRead: false,
      type,
      role: targetRole
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    if (status === 'READY') {
      addNotification('Order Ready', `Order ${orderId} is now ready for pickup at Counter 3.`, 'SUCCESS', 'STUDENT');
    } else if (status === 'PICKED_UP') {
      addNotification('Pickup Complete', `Order ${orderId} has been successfully handed over.`, 'INFO', 'STUDENT');
    }
  };

  // Routing Logic
  useEffect(() => {
    if (role === 'STUDENT' && currentView !== AppView.STUDENT_PORTAL && currentView !== AppView.ORDER_HISTORY) {
      setCurrentView(AppView.STUDENT_PORTAL);
    }
  }, [role, currentView]);



  const handleUpdateOrder = (itemId: string, delta: number) => {
    setPreOrders(prev => {
      const newCount = (prev[itemId] || 0) + delta;
      if (newCount <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: newCount };
    });
  };

  const handleSaveEntry = (entry: DailyEntry) => {
    setHistory(prev => [...prev, entry]);
    setPreOrders(prev => {
      const next = { ...prev };
      delete next[entry.menuItemId];
      return next;
    });
    setCurrentView(AppView.DASHBOARD);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyPlan = (plan: Record<string, AppliedPlanItem>) => {
    setProductionPlan(plan);
    addNotification('Plan Applied', 'New production plan synchronized with the kitchen.', 'SUCCESS', 'STAFF');
  };

  const handleLogWaste = (itemId: string, quantity: number) => {
    // 1. Calculate how many were "confirmed" (ordered)
    const ordered = Object.entries(preOrders).reduce((acc, [key, qty]) => {
      const [baseId] = key.split(':');
      return baseId === itemId ? acc + (qty as number) : acc;
    }, 0);

    // 2. Create a history entry
    const entry: DailyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      menuItemId: itemId,
      prepared: ordered + quantity,
      consumed: ordered,
      waste: quantity,
      preOrders: ordered,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      isHoliday: false
    };

    setHistory(prev => [...prev, entry]);

    // 3. Clear those items from the kitchen queue (preOrders)
    setPreOrders(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key.startsWith(`${itemId}:`) || key === itemId) {
          delete next[key];
        }
      });
      return next;
    });

    // 4. Return to Dashboard to see updated stats
    addNotification('Audit Logged', `Waste data for ${itemId} saved to historical records.`, 'INFO', 'ADMIN');
    setCurrentView(AppView.DASHBOARD);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard history={history} menu={menu} onNavigate={setCurrentView} preOrders={preOrders} />;
      case AppView.STUDENT_PORTAL:
        return (
          <StudentPortal
            menu={menu}
            activeOrders={activeOrders}
            preOrders={preOrders}
            productionPlan={productionPlan}
            onConfirmOrder={(newOrder, itemComments) => {
              const orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;

              // 1. Add to individual tracking
              const newActiveOrder: ActiveOrder = {
                id: orderId,
                items: newOrder,
                itemComments: itemComments,
                status: 'PREPARING',
                timestamp: Date.now()
              };
              setActiveOrders(prev => [...prev, newActiveOrder]);

              addNotification('Order Confirmed', `Order ${orderId} has been sent to the kitchen.`, 'SUCCESS', 'STUDENT');

              // 2. Merge into aggregate kitchen queue
              setPreOrders(prev => {
                const next = { ...prev };
                Object.entries(newOrder).forEach(([id, qty]) => {
                  next[id] = (next[id] || 0) + (qty as number);
                });
                return next;
              });
            }}
            onAddToLastOrder={(newItems) => {
              setActiveOrders(prev => {
                if (prev.length === 0) return prev;
                const lastOrder = prev[prev.length - 1];
                const updatedItems = { ...lastOrder.items };
                Object.entries(newItems).forEach(([id, qty]) => {
                  updatedItems[id] = (updatedItems[id] || 0) + (qty as number);
                });
                return [...prev.slice(0, -1), { ...lastOrder, items: updatedItems }];
              });

              setPreOrders(prev => {
                const next = { ...prev };
                Object.entries(newItems).forEach(([id, qty]) => {
                  next[id] = (next[id] || 0) + (qty as number);
                });
                return next;
              });

              addNotification('Total Updated', 'New items added to your current receipt.', 'SUCCESS', 'STUDENT');
            }}
            onConfirmPreOrder={(newOrder) => {
              setTomorrowPreOrders(prev => {
                const next = { ...prev };
                Object.entries(newOrder).forEach(([id, qty]) => {
                  next[id] = (next[id] || 0) + (qty as number);
                });
                return next;
              });
              addNotification('Pre-order Confirmed', 'Your booking for tomorrow is secured with a 5% discount!', 'SUCCESS', 'STUDENT');
            }}
          />
        );
      case AppView.ORDER_HISTORY:
        return <OrderHistory activeOrders={activeOrders} menu={menu} />;
      case AppView.DATA_ENTRY:
        return <DataEntry menu={menu} onSave={handleSaveEntry} productionPlan={productionPlan} />;
      case AppView.PREDICTIONS:
        return (
          <PredictionView
            history={history}
            menu={menu}
            preOrders={tomorrowPreOrders}
            onApplyPlan={handleApplyPlan}
            currentPlan={productionPlan}
            activeMode={optimizationMode}
            onModeChange={setOptimizationMode}
          />
        );
      case AppView.MENU_MANAGER:
        return <MenuManager menu={menu} onUpdateMenu={setMenu} />;
      case AppView.KITCHEN:
        return (
          <KitchenDisplay
            menu={menu}
            preOrders={preOrders}
            activeOrders={activeOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onLogWaste={handleLogWaste}
            onUpdateMenu={setMenu}
          />
        );
      default:
        return <Dashboard history={history} menu={menu} onNavigate={setCurrentView} preOrders={preOrders} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC]">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        role={role}
        onRoleChange={setRole}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 lg:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-12 sticky top-0 z-40">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="lg:hidden bg-emerald-600 p-2 rounded-lg sm:rounded-xl shadow-lg shadow-emerald-600/20 shrink-0">
              <Leaf size={16} className="text-white" />
            </div>
            <div className="hidden md:flex items-center bg-slate-50 px-4 py-2.5 lg:px-6 lg:py-3 rounded-2xl w-48 lg:w-80 border border-slate-200 transition-all focus-within:ring-4 focus-within:ring-emerald-500/10">
              <Search size={14} className="text-slate-400 mr-3" />
              <input type="text" placeholder="Audit query..." className="bg-transparent border-none focus:ring-0 text-xs font-bold w-full" />
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-emerald-700 font-bold text-[9px] lg:text-[10px] shrink-0">
              <Zap size={12} className="hidden xs:block" /> Live Core
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-8 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 lg:p-2.5 rounded-lg lg:rounded-xl transition-all shrink-0 ${showNotifications ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <Bell size={18} />
              {notifications.filter(n => !n.role || n.role === role).some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 z-[100] animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900">
                    {role === 'STUDENT' ? 'Your Alerts' : 'System Alerts'}
                  </h3>
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(n =>
                        (n.role === role || !n.role) ? { ...n, isRead: true } : n
                      ));
                      setShowNotifications(false);
                    }}
                    className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.filter(n => !n.role || n.role === role).length > 0 ? (
                    notifications.filter(n => !n.role || n.role === role).map(n => (
                      <div key={n.id} className={`p-4 rounded-2xl flex gap-4 transition-all ${n.isRead ? 'bg-slate-50/50 grayscale' : 'bg-white border border-slate-100 shadow-sm'}`}>
                        <div className={`p-2 rounded-xl h-fit ${n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : n.type === 'WARNING' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {n.type === 'SUCCESS' ? <CheckCircle size={14} /> : n.type === 'WARNING' ? <AlertTriangle size={14} /> : <Info size={14} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-800 leading-tight mb-1">{n.title}</p>
                          <p className="text-[10px] font-medium text-slate-500 leading-normal">{n.message}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-sm font-black text-slate-300">No new updates</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 lg:gap-4 group cursor-pointer" onClick={() => {
              const next: UserRole = role === 'ADMIN' ? 'STAFF' : role === 'STAFF' ? 'STUDENT' : 'ADMIN';
              setRole(next);
            }}>
              <div className="text-right hidden sm:block">
                <p className="text-[9px] lg:text-xs font-black text-slate-800 leading-none">
                  {role === 'STUDENT' ? 'Student' : role === 'STAFF' ? 'Staff' : 'Admin'}
                </p>
                <p className="text-[7px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 lg:mt-1">ID: #SC-992</p>
              </div>
              <div className="w-9 h-9 lg:w-14 lg:h-14 bg-slate-900 text-white rounded-xl lg:rounded-[22px] flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-slate-200 shrink-0">
                <User size={18} className="lg:w-6 lg:h-6" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 flex-1 overflow-y-auto max-w-[1600px] mx-auto w-full no-scrollbar">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
