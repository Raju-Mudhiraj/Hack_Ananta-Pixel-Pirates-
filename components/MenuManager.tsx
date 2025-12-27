
import React, { useState } from 'react';
import { MenuItem } from '../types';
import { Plus, Trash2, Edit3, Save, X, Leaf, Info, Scale, Zap } from 'lucide-react';

interface MenuManagerProps {
  menu: MenuItem[];
  onUpdateMenu: (menu: MenuItem[]) => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({ menu, onUpdateMenu }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    category: 'Main',
    unit: 'Portions',
    baseQuantity: 100,
    price: 0,
    calories: 0,
    isLowCarbon: false,
    carbonGrams: 0,
    popularityScore: 50,
    allergens: [],
    isFlashSale: false,
    flashSalePercentage: 50
  });

  const isItemManualFlashActive = (item: MenuItem) => {
    if (!item.isFlashSale || !item.flashSaleStartTime) return false;
    const elapsed = Date.now() - item.flashSaleStartTime;
    return elapsed < 10 * 60 * 1000; // 10 minutes
  };

  const handleSave = () => {
    if (!formData.name) return;

    let newMenu;
    if (editingId) {
      const existingItem = menu.find(item => item.id === editingId);
      const isActivatingFlash = formData.isFlashSale && !existingItem?.isFlashSale;
      const startTime = isActivatingFlash ? Date.now() : (formData.isFlashSale ? (existingItem?.flashSaleStartTime || Date.now()) : undefined);

      newMenu = menu.map(item => item.id === editingId ? { ...item, ...formData, flashSaleStartTime: startTime, flashSalePercentage: formData.isFlashSale ? (formData.flashSalePercentage || 50) : undefined } as MenuItem : item);
    } else {
      const newItem: MenuItem = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        allergens: formData.allergens || [],
        flashSaleStartTime: formData.isFlashSale ? Date.now() : undefined,
        flashSalePercentage: formData.isFlashSale ? (formData.flashSalePercentage || 50) : undefined
      } as MenuItem;
      newMenu = [...menu, newItem];
    }

    onUpdateMenu(newMenu);
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', category: 'Main', unit: 'Portions', price: 0, carbonGrams: 0, popularityScore: 50, isFlashSale: false });
  };

  const removeId = (id: string) => {
    if (confirm("Are you sure you want to remove this item from the active menu?")) {
      onUpdateMenu(menu.filter(item => item.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Menu Control Center</h2>
          <p className="text-slate-500 font-medium">Define seasonal dishes and sustainability metrics.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={20} /> New Dish
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[48px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{editingId ? 'Edit Dish' : 'Draft New Dish'}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Sustainability Audit Config</p>
              </div>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-white p-2 rounded-xl text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
                <X size={24} />
              </button>
            </div>

            <div className="p-12 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                  <input className="w-full bg-slate-100 border-none rounded-2xl p-5 text-lg font-black" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select className="w-full bg-slate-100 border-none rounded-2xl p-5 font-bold" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                    <option value="Main">Main Course</option>
                    <option value="Side">Side</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Drink">Drink</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (₹)</label>
                  <input type="number" className="w-full bg-slate-100 border-none rounded-2xl p-5 font-bold" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Scale size={14} /> Carbon (g CO2)
                  </label>
                  <input type="number" className="w-full bg-slate-100 border-none rounded-2xl p-5 font-bold" value={formData.carbonGrams} onChange={e => setFormData({ ...formData, carbonGrams: parseInt(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} /> Popularity Score
                  </label>
                  <input type="range" min="0" max="100" className="w-full" value={formData.popularityScore} onChange={e => setFormData({ ...formData, popularityScore: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${formData.isLowCarbon ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'} transition-all`}>
                  <Leaf size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-emerald-900">Sustainability Badge</p>
                  <p className="text-xs text-emerald-600 font-medium">Mark as a verified low-carbon choice for students.</p>
                </div>
                <button onClick={() => setFormData(f => ({ ...f, isLowCarbon: !f.isLowCarbon }))} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${formData.isLowCarbon ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {formData.isLowCarbon ? 'Enabled' : 'Disable'}
                </button>
              </div>

              <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${formData.isFlashSale ? 'bg-orange-500 text-white' : 'bg-white text-slate-300'} transition-all`}>
                  <Zap size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-orange-900">Flash Sale Activation</p>
                  {formData.isFlashSale && (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        className="w-16 bg-white border border-orange-200 rounded-lg px-2 py-1 text-xs font-bold text-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={formData.flashSalePercentage}
                        onChange={e => setFormData({ ...formData, flashSalePercentage: parseInt(e.target.value) || 50 })}
                      />
                      <span className="text-xs font-bold text-orange-500">% OFF</span>
                    </div>
                  )}
                  <p className="text-xs text-orange-600 font-medium">Trigger selected discount for students.</p>
                </div>
                <button onClick={() => setFormData(f => ({ ...f, isFlashSale: !f.isFlashSale }))} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${formData.isFlashSale ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {formData.isFlashSale ? 'Enabled' : 'Activate'}
                </button>
              </div>

              <button onClick={handleSave} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 shadow-2xl">
                <Save size={24} /> {editingId ? 'Update Catalog' : 'Add to Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menu.map(item => (
          <div key={item.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-all group relative overflow-hidden">
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
                <img src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-black text-slate-900">{item.name}</h4>
                  {item.isLowCarbon && <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><Leaf size={14} /></div>}
                  {isItemManualFlashActive(item) && <div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg animate-pulse"><Zap size={14} fill="currentColor" /></div>}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{item.category}</span>
                  <span className="text-sm font-black text-slate-800">₹{item.price}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button onClick={() => { setEditingId(item.id); setFormData(item); }} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                <Edit3 size={20} />
              </button>
              <button onClick={() => removeId(item.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuManager;
