import React from "react";
import { History, PackageCheck } from "lucide-react";
import { MenuItem, ActiveOrder } from "../types";

interface OrderHistoryProps {
    activeOrders: ActiveOrder[];
    menu: MenuItem[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ activeOrders, menu }) => {
    const myPastOrders = activeOrders
        .filter((o) => o.status === "PICKED_UP")
        .sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 min-h-screen">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-slate-200">
                    <History size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Order History</h1>
                    <p className="text-slate-500 font-medium">Review your past sustainable meals 🥗</p>
                </div>
            </div>

            {myPastOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myPastOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-[36px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                                <PackageCheck size={120} />
                            </div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt ID</p>
                                    <h4 className="text-xl font-black text-slate-900">#{order.id.split('-')[1]}</h4>
                                </div>
                                <div className="bg-slate-100 px-4 py-2 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <PackageCheck size={14} /> Received
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 relative z-10">
                                {Object.entries(order.items).map(([key, qty]) => {
                                    const [id, size] = key.split(":");
                                    const item = menu.find((m) => m.id === id);
                                    return item ? (
                                        <div key={key} className="flex justify-between items-center group/item">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-700">{item.name}</span>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{size}</span>
                                            </div>
                                            <span className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-black text-slate-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">x{qty}</span>
                                        </div>
                                    ) : null;
                                })}
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="text-xs font-bold">{new Date(order.timestamp).toLocaleDateString()}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-xs font-bold">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <History size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No past orders yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Start your zero-waste journey by placing your first order in the portal!</p>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
