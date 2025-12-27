import React, { useState } from 'react';
import { MenuItem, ActiveOrder, OrderStatus } from '../types';
import {
    ChefHat,
    Clock,
    CheckCircle2,
    AlertCircle,
    Flame,
    Trash2,
    X,
    ArrowRight,
    Scale,
    AlertTriangle,
    ListTodo,
    Timer,
    Zap,
    Sparkles,
    Wand2,
    Loader2,
    ShoppingBag
} from 'lucide-react';
import { generateSurpriseDish } from '../services/geminiService';

interface KitchenDisplayProps {
    menu: MenuItem[];
    preOrders: Record<string, number>;
    activeOrders: ActiveOrder[];
    onLogWaste?: (itemId: string, quantity: number) => void;
    onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
    onUpdateMenu?: (menu: MenuItem[]) => void;
}

const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ menu, preOrders, activeOrders, onLogWaste, onUpdateOrderStatus, onUpdateMenu }) => {
    const [prepared, setPrepared] = useState<Record<string, number>>({});
    const [showWasteModal, setShowWasteModal] = useState<string | null>(null); // itemId
    const [wasteQuantity, setWasteQuantity] = useState<number>(0);
    const [view, setView] = useState<'AGGREGATE' | 'LIVE_ORDERS'>('AGGREGATE');
    const [isGeneratingSurprise, setIsGeneratingSurprise] = useState(false);

    const handleMarkPrepared = (id: string, qty: number) => {
        setPrepared(prev => ({
            ...prev,
            [id]: (prev[id] || 0) + qty
        }));
    };

    const submitWasteLog = () => {
        if (showWasteModal && onLogWaste) {
            onLogWaste(showWasteModal, wasteQuantity);
            setShowWasteModal(null);
            setWasteQuantity(0);
        }
    };

    const toggleFlashSale = (itemId: string, percentage: number = 50) => {
        if (!onUpdateMenu) return;
        const newMenu = menu.map(item => {
            if (item.id === itemId) {
                const isEnabling = !item.isFlashSale;
                return {
                    ...item,
                    isFlashSale: isEnabling,
                    flashSaleStartTime: isEnabling ? Date.now() : undefined,
                    flashSalePercentage: isEnabling ? percentage : undefined
                };
            }
            return item;
        });
        onUpdateMenu(newMenu);
    };

    const updateFlashPercentage = (itemId: string, percentage: number) => {
        if (!onUpdateMenu) return;
        const newMenu = menu.map(item =>
            item.id === itemId ? { ...item, flashSalePercentage: percentage } : item
        );
        onUpdateMenu(newMenu);
    };

    const isItemManualFlashActive = (item: MenuItem) => {
        if (!item.isFlashSale || !item.flashSaleStartTime) return false;
        const elapsed = Date.now() - item.flashSaleStartTime;
        return elapsed < 10 * 60 * 1000; // 10 minutes
    };

    const handleGenerateAlchemist = async () => {
        if (!onUpdateMenu) return;

        // Find items that have been prepared (likely leftovers)
        let leftovers = menu.filter(item => (prepared[item.id] || 0) > 0);

        // Demo Fallback: If nothing is prepared, use a few random items to showcase the feature
        if (leftovers.length === 0) {
            const confirmDemo = window.confirm("No items have been 'Marked Prepared' yet. Would you like the Alchemist to use random ingredients from the menu for this demo?");
            if (confirmDemo) {
                leftovers = [...menu].sort(() => 0.5 - Math.random()).slice(0, 3);
            } else {
                return;
            }
        }

        setIsGeneratingSurprise(true);
        try {
            const surpriseData = await generateSurpriseDish(leftovers);
            const newSurpriseDish: MenuItem = {
                id: `surprise-${Date.now()}`,
                name: surpriseData.name || "Chef's Surprise",
                category: 'Main',
                description: surpriseData.description,
                unit: 'Portion',
                baseQuantity: 20,
                price: 150, // Base price
                calories: surpriseData.calories || 500,
                allergens: surpriseData.allergens || [],
                isLowCarbon: true,
                isVeg: true,
                carbonGrams: 50,
                popularityScore: 100,
                isFlashSale: true,
                flashSaleStartTime: Date.now(),
                flashSalePercentage: 40, // 40% OFF as requested
                isSurpriseDish: true,
                ingredients: surpriseData.ingredients,
                image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"
            };

            onUpdateMenu([...menu, newSurpriseDish]);
        } finally {
            setIsGeneratingSurprise(false);
        }
    };

    const removeSurpriseDish = (itemId: string) => {
        if (!onUpdateMenu) return;
        const newMenu = menu.filter(item => item.id !== itemId);
        onUpdateMenu(newMenu);
    };

    // Sort items: Priority to those with highest PENDING (Ordered - Prepared) count
    const itemsWithCounts = menu.map(item => {
        // Handle both simple keys (legacy) and composite keys (new size-based)
        const ordered = Object.entries(preOrders).reduce((acc, [key, qty]) => {
            const [baseId] = key.split(':');
            return baseId === item.id ? acc + (qty as number) : acc;
        }, 0);

        // Track breakdown of sizes for better kitchen info
        const breakdownRaw = Object.entries(preOrders)
            .filter(([key, qty]) => key.startsWith(`${item.id}:`) && (qty as number) > 0)
            .map(([key, qty]) => ({ size: key.split(':')[1], qty: qty as number }));

        const done = prepared[item.id] || 0;
        const pending = Math.max(0, ordered - done);
        return { ...item, ordered, done, pending, breakdown: breakdownRaw };
    }).sort((a, b) => b.pending - a.pending);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <ChefHat size={32} className="text-orange-500" />
                        Kitchen Display System
                    </h2>
                    <p className="text-slate-500 font-medium ml-11">Live incoming orders and prep management.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGenerateAlchemist}
                        disabled={isGeneratingSurprise}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:shadow-2xl hover:shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isGeneratingSurprise ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                        {isGeneratingSurprise ? "Mixing Potions..." : "Leftover Alchemist"}
                    </button>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setView('AGGREGATE')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${view === 'AGGREGATE' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListTodo size={18} />
                            Prep List
                        </button>
                        <button
                            onClick={() => setView('LIVE_ORDERS')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${view === 'LIVE_ORDERS' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Timer size={18} />
                            Live Orders
                            {activeOrders.filter(o => o.status === 'PREPARING').length > 0 && (
                                <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] animate-pulse">
                                    {activeOrders.filter(o => o.status === 'PREPARING').length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* GRID VIEW: AGGREGATE PREP */}
            {view === 'AGGREGATE' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {itemsWithCounts.map(item => (
                        <div
                            key={item.id}
                            className={`
                  relative overflow-hidden rounded-[32px] border-2 transition-all duration-300
                  ${(item.pending > 0 || isItemManualFlashActive(item)) ? 'bg-white border-orange-100 shadow-xl shadow-orange-100/50' : 'bg-slate-50 border-slate-100 opacity-60 grayscale-[0.5]'}
                `}
                        >
                            <div
                                className="absolute bottom-0 left-0 h-1.5 bg-green-500 transition-all duration-500"
                                style={{ width: `${item.ordered > 0 ? (item.done / item.ordered) * 100 : 0}%` }}
                            />

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{item.name}</h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg text-slate-500">
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                    {item.pending > 0 && (
                                        <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-black animate-pulse">
                                            {item.pending} PENDING
                                        </div>
                                    )}
                                </div>

                                {item.breakdown && item.breakdown.length > 0 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                                        {item.breakdown.map((b, i) => (
                                            <div key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shrink-0">
                                                <span className="text-[10px] font-black text-slate-400 block uppercase">{b.size}</span>
                                                <span className="text-sm font-black text-slate-700">{b.qty} ord</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                        <span className="block text-[10px] uppercase font-black text-slate-400">Total Ordered</span>
                                        <span className="text-2xl font-black text-slate-900">{item.ordered}</span>
                                    </div>
                                    <div className="bg-green-50 rounded-2xl p-3 text-center">
                                        <span className="block text-[10px] uppercase font-black text-green-600">Prepared</span>
                                        <span className="text-2xl font-black text-green-700">{item.done}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleMarkPrepared(item.id, 1)}
                                        disabled={item.pending === 0}
                                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-sm hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={16} /> Mark 1 Done
                                    </button>
                                    <button
                                        onClick={() => setShowWasteModal(item.id)}
                                        className="px-4 bg-red-50 text-red-500 rounded-xl font-black text-sm hover:bg-red-100 transition-all"
                                        title="Log waste & complete shift"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => toggleFlashSale(item.id)}
                                            className={`px-4 py-2 rounded-xl font-black text-sm transition-all border-2 ${isItemManualFlashActive(item) ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 animate-pulse' : 'bg-white text-orange-400 border-orange-100 hover:border-orange-200'}`}
                                            title={isItemManualFlashActive(item) ? "Flash Sale Active" : "Activate Flash Sale"}
                                        >
                                            <Zap size={18} fill={isItemManualFlashActive(item) ? "currentColor" : "none"} />
                                        </button>
                                        {isItemManualFlashActive(item) && (
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                className="w-full bg-orange-100 border-none rounded-lg px-2 py-1 text-[10px] font-black text-orange-600 focus:outline-none text-center"
                                                value={item.flashSalePercentage || 50}
                                                onChange={(e) => updateFlashPercentage(item.id, parseInt(e.target.value) || 50)}
                                            />
                                        )}
                                    </div>
                                    {item.isSurpriseDish && (
                                        <button
                                            onClick={() => removeSurpriseDish(item.id)}
                                            className="px-4 bg-purple-100 text-purple-600 rounded-xl font-black text-sm hover:bg-purple-200 transition-all flex items-center justify-center h-[42px] self-start"
                                            title="Remove Alchemist Dish"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* LIVE ORDERS VIEW: INDIVIDUAL ORDERS */}
            {view === 'LIVE_ORDERS' && (
                <div className="space-y-6">
                    {activeOrders.filter(o => o.status !== 'PICKED_UP').sort((a, b) => b.timestamp - a.timestamp).map(order => (
                        <div key={order.id} className={`bg-white rounded-[32px] border-2 p-8 transition-all duration-300 ${order.status === 'READY' ? 'border-emerald-500 shadow-xl shadow-emerald-50' : 'border-slate-100'}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${order.status === 'READY' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black text-slate-900">{order.id}</h3>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'READY' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold mt-1">
                                            Placed {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {order.status === 'PREPARING' ? (
                                    <button
                                        onClick={() => onUpdateOrderStatus?.(order.id, 'READY')}
                                        className="w-full md:w-auto bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={24} />
                                        Mark Ready for Pickup
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Waiting for Student</span>
                                            <div className="flex items-center gap-2 text-emerald-600 font-black">
                                                <span className="text-sm">Ready for Handover</span>
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onUpdateOrderStatus?.(order.id, 'PICKED_UP')}
                                            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} />
                                            Complete Pickup
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(order.items).map(([compositeKey, qty]) => {
                                    const [id, size] = compositeKey.split(':');
                                    const item = menu.find(m => m.id === id);
                                    if (!item) return null;
                                    return (
                                        <div key={compositeKey} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-slate-900 line-clamp-1">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{size}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">Qty: {qty}</span>
                                                </div>
                                                {order.itemComments?.[compositeKey] && (
                                                    <div className="mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                        <p className="text-[10px] font-black text-amber-700 leading-tight italic">
                                                            "{order.itemComments[compositeKey]}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {activeOrders.filter(o => o.status !== 'PICKED_UP').length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                            <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-black text-slate-400">No active orders yet. Let's cook!</h3>
                        </div>
                    )}
                </div>
            )}

            {/* WASTE MODAL */}
            {showWasteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div className="bg-red-50 p-4 rounded-3xl">
                                <Scale size={32} className="text-red-500" />
                            </div>
                            <button onClick={() => setShowWasteModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8">
                            <h3 className="text-3xl font-black text-slate-900 mb-2 leading-tight">Close Out Item</h3>
                            <p className="text-slate-500 font-medium mb-8">Logging waste helps the AI predict better for tomorrow.</p>

                            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 mb-8">
                                <div className="text-center mb-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Quantity Wasted</span>
                                    <div className="flex items-center justify-center gap-6">
                                        <button onClick={() => setWasteQuantity(q => Math.max(0, q - 1))} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-xl">-</button>
                                        <span className="text-5xl font-black text-slate-900 w-20">{wasteQuantity}</span>
                                        <button onClick={() => setWasteQuantity(q => q + 1)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-xl">+</button>
                                    </div>
                                </div>
                            </div>

                            <button onClick={submitWasteLog} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} /> Finalize & Log Waste
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KitchenDisplay;
