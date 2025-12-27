import React, { useState } from "react";
import {
  ShoppingBag,
  Flame,
  Leaf,
  CheckCircle2,
  Scale,
  Minus,
  Plus,
  X,
  CreditCard,
  QrCode,
  Smartphone,
  ArrowLeft,
  Loader2,
  Timer,
  Navigation,
  Zap,
  Search,
  Calendar,
  Wand2,
  Sparkles,
  Box
} from "lucide-react";
import { MenuItem, ActiveOrder, OrderStatus, AppliedPlanItem } from "../types";

interface StudentPortalProps {
  menu: MenuItem[];
  activeOrders: ActiveOrder[];
  preOrders: Record<string, number>;
  productionPlan: Record<string, AppliedPlanItem>;
  onConfirmOrder: (order: Record<string, number>, itemComments: Record<string, string>) => void;
  onConfirmPreOrder: (order: Record<string, number>) => void;
  onAddToLastOrder: (items: Record<string, number>) => void;
}

type PortionSize = "SMALL" | "REGULAR" | "LARGE";
type PaymentMethod = "UPI" | "CARD" | null;
type CheckoutStep = "CART" | "PAYMENT_METHOD" | "PAYMENT_PROCESS" | "SUCCESS";

const StudentPortal: React.FC<StudentPortalProps> = ({
  menu,
  activeOrders,
  preOrders,
  productionPlan,
  onConfirmOrder,
  onConfirmPreOrder,
  onAddToLastOrder
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isVegMode, setIsVegMode] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, PortionSize>>({});
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPreorderMode, setIsPreorderMode] = useState(false);

  // Timing Logic for Flash Sale (Checks if we are 45 mins before 4:00 PM)
  const isFlashSaleTime = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const triggerMinutes = 15 * 60 + 15; // 3:15 PM
    const endMinutes = 16 * 60; // 4:00 PM

    // For demo purposes, we can simulate flash sale if the time is between 3:15-4:00
    return currentMinutes >= triggerMinutes && currentMinutes < endMinutes;
  };

  const isItemManualFlashActive = (item: MenuItem) => {
    if (!item.isFlashSale || !item.flashSaleStartTime) return false;
    const elapsed = Date.now() - item.flashSaleStartTime;
    return elapsed < 10 * 60 * 1000; // 10 minutes
  };

  const getSurplusItems = () => {
    if (!productionPlan) return [];
    return menu.filter(item => {
      const planned = productionPlan[item.id]?.quantity || 0;
      const ordered = Object.entries(preOrders || {}).reduce((acc, [key, qty]) => {
        const [baseId] = key.split(':');
        return baseId === item.id ? acc + (qty as number) : acc;
      }, 0);

      // If we have more than 3 extra portions, it's a surplus
      return planned > (ordered + 3);
    });
  };

  const surplusItems = getSurplusItems();
  const isFlashActive = isFlashSaleTime() && surplusItems.length > 0;
  const anyManualFlash = menu.some(item => isItemManualFlashActive(item));
  const showFlashBanner = isFlashActive || anyManualFlash;

  // Local Cart State (Composite Keys: 'itemId:size')
  const [cart, setCart] = useState<Record<string, number>>({});

  const updateCart = (itemId: string, size: PortionSize, delta: number) => {
    const cartKey = `${itemId}:${size}`;
    setCart(prev => {
      const current = prev[cartKey] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [cartKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cartKey]: next };
    });
  };

  const getDynamicPrice = (itemId: string, basePrice: number, size: PortionSize) => {
    let price = basePrice;
    const sizeMultiplier = size === "SMALL" ? 0.7 : size === "LARGE" ? 1.3 : 1;
    price = price * sizeMultiplier;

    // Apply Discounts
    if (isPreorderMode) {
      price = price * 0.95; // 5% Discount for tomorrow's booking
    } else {
      // Apply Flash Sale discount if item is in surplus OR manually activated and still within 10 mins
      const item = menu.find(i => i.id === itemId);
      const isManualFlash = item ? isItemManualFlashActive(item) : false;

      if (isFlashActive && surplusItems.some(i => i.id === itemId)) {
        price = price * 0.5; // AI surplus always 50%
      } else if (isManualFlash && item) {
        const discount = item.flashSalePercentage || 50;
        price = price * (1 - discount / 100);
      }
    }

    return Math.round(price);
  };

  // Checkout State
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("CART");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const categories = ["All", "Main", "Side", "Dessert", "Drink"];

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesVeg = !isVegMode || item.isVeg;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesVeg && matchesSearch;
  });

  const getCarbonSaving = (item: MenuItem, size: PortionSize) => {
    const factor = size === "SMALL" ? 0.7 : size === "LARGE" ? 1.3 : 1;
    return Math.round(item.carbonGrams * (1.3 - factor));
  };

  const totalOrders = Object.values(cart).reduce((a: number, b: number) => a + b, 0);

  const totalPrice = Object.entries(cart).reduce((sum, [compositeId, qty]) => {
    const [id, size] = compositeId.split(':') as [string, PortionSize];
    const item = menu.find(m => m.id === id);
    if (!item) return sum;
    const price = getDynamicPrice(item.id, item.price, size);
    return sum + (price * (qty as number));
  }, 0);

  const handleInitialCheckout = () => {
    setCheckoutStep("PAYMENT_METHOD");
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setCheckoutStep("PAYMENT_PROCESS");
  };

  const finalizePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setCheckoutStep("SUCCESS");
      if (isPreorderMode) {
        onConfirmPreOrder(cart);
      } else {
        onConfirmOrder(cart, itemComments);
      }
    }, 2000);
  };

  const resetFlow = () => {
    setCart({});
    setItemComments({});
    setIsCartOpen(false);
    setCheckoutStep("CART");
    setPaymentMethod(null);
  };

  const [fastAddSuccess, setFastAddSuccess] = useState<string | null>(null);

  const handleFastAdd = (item: MenuItem) => {
    const compositeId = `${item.id}:REGULAR`;

    // 1. Update the actual order in App.tsx
    onAddToLastOrder({ [compositeId]: 1 });

    // 2. Update local cart so the receipt UI refreshes
    setCart(prev => ({
      ...prev,
      [compositeId]: (prev[compositeId] || 0) + 1
    }));

    setFastAddSuccess(item.name);
    setTimeout(() => setFastAddSuccess(null), 3000);
  };

  const upiDeepLink = `upi://pay?pa=nagarajuraju31206@okhdfcbank&pn=Nagaraju%20Mudhiraj&am=${totalPrice}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

  // Find recent orders for this user (demo purposes: all active orders)
  const myLiveOrders = activeOrders.filter(o => o.status !== 'PICKED_UP').sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-32 space-y-12 relative min-h-screen">

      <header className="flex items-center justify-between">
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight">Zero-Waste Dining</h1>
          <p className="text-slate-500 text-lg">Portion control that saves the planet 🌍</p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition shadow-xl"
        >
          <ShoppingBag size={24} />
          {(totalOrders as number) > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
              {totalOrders}
            </span>
          )}
        </button>
      </header>

      {/* PRE-ORDER TOGGLE & COUNTDOWN */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className={`flex-1 rounded-[40px] p-8 border-2 transition-all ${isPreorderMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl shadow-indigo-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPreorderMode ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                <Calendar size={24} />
              </div>
              <div>
                <h3 className={`font-black ${isPreorderMode ? 'text-white' : 'text-slate-900'}`}>Order for Tomorrow</h3>
                <p className={`text-xs font-bold ${isPreorderMode ? 'text-indigo-100' : 'text-slate-500'}`}>Secure your meal with a <span className="text-emerald-500">5% Discount</span></p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsPreorderMode(!isPreorderMode);
                setCart({}); // Clear cart when switching modes
              }}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isPreorderMode ? 'bg-white text-indigo-600 shadow-xl' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
            >
              {isPreorderMode ? 'Switch to Today' : 'Pre-book Now'}
            </button>
          </div>
          {isPreorderMode && (
            <div className="flex items-center gap-2 text-indigo-100 font-bold text-sm animate-pulse">
              <Timer size={16} />
              <span>Pre-bookings close in 05:22:14</span>
            </div>
          )}
        </div>

        {/* FLASH SALE BANNER (Only in Today mode) */}
        {!isPreorderMode && showFlashBanner && (
          <div className="flex-[1.5] bg-gradient-to-r from-amber-500 to-orange-600 rounded-[40px] p-8 text-white shadow-2xl shadow-orange-100 relative overflow-hidden animate-in fade-in slide-in-from-right duration-700">
            <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
              <Zap size={140} fill="white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-white/30 shrink-0">
                  <Zap size={32} className="text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">Flash Sale!</h2>
                  <p className="text-orange-50 text-xs font-bold">Help us reach **Zero Waste** today!</p>
                </div>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-2xl border border-white/30">
                <span className="text-xs font-black uppercase">Active: {anyManualFlash ? "Staff Selection" : "AI"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIVE ORDER STATUS SECTION */}
      {myLiveOrders.length > 0 && (
        <div className="bg-emerald-50 rounded-[40px] p-8 border border-emerald-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Timer size={120} className="text-emerald-900" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600">
              <Timer size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Live Status</h2>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Ongoing Orders</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myLiveOrders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 relative group overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Order ID</p>
                    <h4 className="text-lg font-black text-slate-900	">{order.id}</h4>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${order.status === 'READY' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-orange-100 text-orange-600'}`}>
                    {order.status}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {Object.entries(order.items).slice(0, 2).map(([key, qty]) => {
                    const [id, size] = key.split(':');
                    const item = menu.find(m => m.id === id);
                    return item ? (
                      <div key={key} className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>{item.name} ({size})</span>
                        <span>x{qty}</span>
                      </div>
                    ) : null;
                  })}
                  {Object.keys(order.items).length > 2 && (
                    <p className="text-[10px] text-slate-400 font-bold">+ {Object.keys(order.items).length - 2} more items</p>
                  )}
                </div>

                {order.status === 'READY' ? (
                  <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3 border border-emerald-100">
                    <Navigation size={18} className="text-emerald-600" />
                    <p className="text-xs font-black text-emerald-700">Pickup @ Counter 3</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-400">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping" />
                    <p className="text-[10px] font-black uppercase tracking-wider">Estimated: 5-8 mins</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THE SECRET MENU (SURPRISE DISHES) */}
      {menu.some(item => item.isSurpriseDish) && (
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Wand2 size={200} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border border-purple-500/30 backdrop-blur-md">
                Limited Edition
              </span>
              <Sparkles className="text-amber-400 animate-pulse" size={20} />
            </div>

            <h2 className="text-4xl font-black italic tracking-tighter mb-4">THE SECRET MENU</h2>
            <p className="text-indigo-100 max-w-xl mb-10 font-medium">
              Our AI Master Chef just repurposed today's leftovers into a unique, one-time-only fusion feast. **Available only until stock lasts!**
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {menu.filter(item => item.isSurpriseDish).map(item => (
                <div key={item.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 hover:bg-white/15 transition-all group">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 border-2 border-purple-500/30">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black mb-1 leading-tight">{item.name}</h3>
                      <p className="text-purple-200 text-[10px] mb-4 line-clamp-2 italic">“{item.description}”</p>

                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Price</p>
                          <p className="text-2xl font-black text-white">₹{getDynamicPrice(item.id, item.price, 'REGULAR')}</p>
                        </div>
                        <button
                          onClick={() => updateCart(item.id, 'REGULAR', 1)}
                          className="flex-1 bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 hover:text-white transition-all shadow-lg"
                        >
                          Add to Box
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 flex gap-3 bg-white p-2 rounded-2xl border shadow-sm overflow-x-auto no-scrollbar w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl font-black text-sm transition shrink-0 ${activeCategory === cat ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}
            >
              {cat}
            </button>
          ))}
          <div className="flex items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 focus-within:ring-2 focus-within:ring-slate-200 transition-all ml-2 min-w-[200px]">
            <Search size={14} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs font-bold w-full p-0 placeholder:text-slate-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-300 hover:text-slate-500">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsVegMode(!isVegMode)}
          className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition border-2 ${isVegMode ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-transparent text-slate-400 hover:bg-slate-50"}`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isVegMode ? "border-green-600" : "border-slate-300"}`}>
            {isVegMode && <div className="w-2.5 h-2.5 bg-green-600 rounded-sm" />}
          </div>
          Veg Only
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredMenu.map(item => {
          const size = selectedSizes[item.id] || "REGULAR";
          const carbonSaved = getCarbonSaving(item, size);
          const currentPrice = getDynamicPrice(item.id, item.price, size);
          const isAutoFlash = isFlashActive && surplusItems.some(si => si.id === item.id);
          const isOnFlashSale = isAutoFlash || isItemManualFlashActive(item);
          const quantityInCartForSize = cart[`${item.id}:${size}`] || 0;

          return (
            <div key={item.id} className="bg-white rounded-[36px] overflow-hidden border shadow-sm hover:shadow-xl transition group">
              <div className="relative h-56 overflow-hidden bg-slate-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingBagIcon iconSize={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-white px-4 py-1.5 rounded-xl text-xs font-black">{item.category}</span>
                  {item.isLowCarbon && (
                    <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1">
                      <Leaf size={12} /> ECO
                    </span>
                  )}
                </div>
                {isOnFlashSale && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg animate-pulse flex items-center gap-1.5 z-10">
                    <Zap size={14} fill="white" />
                    {isAutoFlash ? "50% OFF" : `${item.flashSalePercentage || 50}% OFF`}
                  </div>
                )}
              </div>

              <div className="p-8">
                <div className="flex justify-between mb-4">
                  <h3 className="text-2xl font-black leading-tight">{item.name}</h3>
                  <div className="text-right">
                    {isOnFlashSale && (
                      <span className="block text-[10px] text-slate-400 line-through font-bold">₹{Math.round(currentPrice * 2)}</span>
                    )}
                    <span className={`text-xl font-black shrink-0 ${isOnFlashSale ? 'text-orange-600' : 'text-slate-900'}`}>₹{currentPrice}</span>
                  </div>
                </div>

                <div className="flex bg-slate-50 rounded-xl p-1 mb-6">
                  {(["SMALL", "REGULAR", "LARGE"] as PortionSize[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSizes(prev => ({ ...prev, [item.id]: s }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition ${size === s ? "bg-white shadow text-slate-900" : "text-slate-400"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between text-xs font-black mb-6">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Flame size={14} />
                    {Math.round(item.calories * (size === "SMALL" ? 0.7 : size === "LARGE" ? 1.3 : 1))} kcal
                  </span>
                  <span className="flex items-center gap-2 text-emerald-600">
                    <Scale size={14} /> Save {carbonSaved}g
                  </span>
                </div>

                {quantityInCartForSize === 0 ? (
                  <button
                    onClick={() => updateCart(item.id, size, 1)}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition"
                  >
                    <ShoppingBagIcon iconSize={18} /> Add to Cart
                  </button>
                ) : (
                  <div className="flex items-center gap-4 bg-slate-900 text-white p-2 rounded-2xl">
                    <button onClick={() => updateCart(item.id, size, -1)} className="w-12 h-10 flex items-center justify-center bg-slate-700 rounded-xl hover:bg-slate-600 transition">
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-black text-lg">{quantityInCartForSize}</span>
                    <button onClick={() => updateCart(item.id, size, 1)} className="w-12 h-10 flex items-center justify-center bg-emerald-600 rounded-xl hover:bg-emerald-500 transition">
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => isProcessingPayment ? null : setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {checkoutStep !== "CART" && checkoutStep !== "SUCCESS" && (
                  <button onClick={() => setCheckoutStep("CART")} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20} /></button>
                )}
                <h2 className="text-3xl font-black">
                  {checkoutStep === "CART" && "Your Cart"}
                  {checkoutStep === "PAYMENT_METHOD" && "Payment"}
                  {checkoutStep === "PAYMENT_PROCESS" && (paymentMethod === "UPI" ? "Scan QR" : "Card Details")}
                </h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition" disabled={isProcessingPayment}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4">
              {checkoutStep === "CART" && (
                <div className="space-y-6">
                  {Object.keys(cart).length === 0 ? (
                    <div className="text-center text-slate-400 mt-20">
                      <ShoppingBagIcon iconSize={48} className="mx-auto mb-4 opacity-50" />
                      <p>Your cart is empty.</p>
                    </div>
                  ) : (
                    Object.entries(cart).map(([compositeId, qty]) => {
                      const [id, size] = compositeId.split(':') as [string, PortionSize];
                      const item = menu.find(m => m.id === id);
                      if (!item) return null;
                      const price = getDynamicPrice(item.id, item.price, size);
                      return (
                        <div key={compositeId} className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                            {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{size}</p>
                            <p className="text-sm text-slate-500 mb-2">₹{price * (qty as number)}</p>
                            <input
                              type="text"
                              placeholder="Special instructions..."
                              value={itemComments[compositeId] || ""}
                              onChange={(e) => setItemComments(prev => ({ ...prev, [compositeId]: e.target.value }))}
                              className="w-full bg-slate-50 border-none rounded-lg p-2 text-[10px] font-medium focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-300"
                            />
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                            <button onClick={() => updateCart(id, size, -1)} className="p-1 hover:bg-white rounded-md transition shadow-sm"><Minus size={14} /></button>
                            <span className="text-sm font-bold w-4 text-center">{qty}</span>
                            <button onClick={() => updateCart(id, size, 1)} className="p-1 hover:bg-white rounded-md transition shadow-sm"><Plus size={14} /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {checkoutStep === "PAYMENT_METHOD" && (
                <div className="space-y-4 mt-4">
                  <p className="text-slate-500 mb-6">Choose how you want to pay</p>
                  <button onClick={() => handlePaymentMethodSelect("UPI")} className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-emerald-500 hover:bg-emerald-50 transition group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600"><QrCode size={24} /></div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-900">UPI / QR Code</h4>
                        <p className="text-xs text-slate-500 group-hover:text-emerald-600">GPay, PhonePe, Paytm</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => handlePaymentMethodSelect("CARD")} className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-emerald-500 hover:bg-emerald-50 transition group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600"><CreditCard size={24} /></div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-900">Card Payment</h4>
                        <p className="text-xs text-slate-500 group-hover:text-emerald-600">Credit or Debit Card</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {checkoutStep === "PAYMENT_PROCESS" && (
                <div className="mt-4">
                  {paymentMethod === "UPI" && (
                    <div className="text-center space-y-6">
                      <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-slate-200 inline-block">
                        <img src={qrCodeUrl} alt="Payment QR" className="w-48 h-48 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-black text-2xl">₹{totalPrice}</p>
                        <p className="text-slate-500 text-sm">Scan with any UPI app to pay</p>
                      </div>
                      <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Smartphone size={14} /> Waiting for payment confirmation...
                      </div>
                    </div>
                  )}

                  {paymentMethod === "CARD" && (
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <div className="bg-slate-900 text-white p-6 rounded-3xl mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard size={120} /></div>
                        <p className="text-xs text-slate-400 mb-2">Current Balance</p>
                        <h3 className="text-3xl font-black mb-8">₹{totalPrice}</h3>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">Card Holder</p>
                          <p className="font-mono tracking-wider">JOHN DOE</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase">Card Number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-50 p-4 rounded-xl font-mono" />
                      </div>
                      <div className="flex gap-4">
                        <div className="space-y-2 flex-1"><label className="text-xs font-black text-slate-400 uppercase">Expiry</label><input type="text" placeholder="MM/YY" className="w-full bg-slate-50 p-4 rounded-xl font-mono" /></div>
                        <div className="space-y-2 flex-1"><label className="text-xs font-black text-slate-400 uppercase">CVC</label><input type="text" placeholder="123" className="w-full bg-slate-50 p-4 rounded-xl font-mono" /></div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {checkoutStep === "SUCCESS" && (
                <div className="text-center mt-10 animate-in zoom-in duration-300">
                  <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-emerald-600" /></div>
                  <h3 className="text-3xl font-black mb-2 text-slate-900">Successfully Completed Payment!</h3>
                  <p className="text-slate-500 mb-8 max-w-xs mx-auto">Your transaction has been processed and your order sent to the kitchen.</p>
                  <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Amount Paid</span><span className="font-bold text-slate-900">₹{totalPrice}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Transaction ID</span><span className="font-mono text-slate-900">TXN-{Math.floor(Math.random() * 1000000)}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Date</span><span className="text-slate-900">{new Date().toLocaleDateString()}</span></div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-black text-slate-900">Grab a Drink?</h4>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ready-Made</span>
                    </div>

                    {fastAddSuccess && (
                      <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <CheckCircle2 size={14} /> Added {fastAddSuccess}!
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {menu.filter(item => item.category === 'Drink').slice(0, 4).map(drink => (
                        <button
                          key={drink.id}
                          onClick={() => handleFastAdd(drink)}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                            <img src={drink.image} alt={drink.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black text-slate-900 truncate group-hover:text-emerald-700">{drink.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">₹{drink.price}</p>
                          </div>
                          <Plus size={14} className="text-slate-300 group-hover:text-emerald-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-white">
              {checkoutStep === "CART" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xl font-black"><span>Total</span><span>₹{totalPrice}</span></div>
                  <button onClick={handleInitialCheckout} disabled={totalOrders === 0} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-lg hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">Checkout</button>
                </div>
              )}
              {checkoutStep === "PAYMENT_PROCESS" && (
                <button onClick={finalizePayment} disabled={isProcessingPayment} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2">{isProcessingPayment ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : <>Pay ₹{totalPrice}</>}</button>
              )}
              {checkoutStep === "SUCCESS" && (
                <button onClick={resetFlow} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition">Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ShoppingBagIconProps {
  iconSize?: number;
}
const ShoppingBagIcon: React.FC<ShoppingBagIconProps> = ({ iconSize = 24 }) => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
);

export default StudentPortal;
