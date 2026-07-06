import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { 
  ChefHat, 
  Check, 
  Clock, 
  Box, 
  AlertCircle, 
  LogOut, 
  Flame, 
  ShoppingBag, 
  History, 
  Search,
  Timer,
  AlertTriangle,
  Plus,
  Minus,
  TrendingUp,
  QrCode,
  Sparkles,
  CheckCircle2,
  Layers
} from "lucide-react";
import { Order, OrderStatus, MenuItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

gsap.registerPlugin(Flip);

interface KitchenDashboardProps {
  orders: Order[];
  menuItems?: MenuItem[];
  onUpdateStockLevel?: (itemId: string, newStockLevel: number) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onLogout: () => void;
  currency?: string;
}

export default function KitchenDashboard({ 
  orders, 
  menuItems = [], 
  onUpdateStockLevel, 
  onUpdateStatus, 
  onLogout, 
  currency = "$" 
}: KitchenDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [showAllInventory, setShowAllInventory] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // QR & Token Scanner Simulator State
  const [scanInput, setScanInput] = useState("");
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);

  const handleScanVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError("");
    setScanSuccess(false);
    setScannedOrder(null);

    const input = scanInput.trim().toUpperCase();
    if (!input) return;

    // Find a matching order that is currently 'ready'
    // Search by full order ID, trimmed ID, or token
    const foundOrder = orders.find(
      (o) =>
        o.status === "ready" &&
        (o.token.toUpperCase() === input ||
          o.id.toUpperCase() === input ||
          o.id.toUpperCase().endsWith(input) ||
          `#${o.token.toUpperCase()}` === input)
    );

    if (foundOrder) {
      setScannedOrder(foundOrder);
      setScanSuccess(true);
    } else {
      // Check if order exists but is in cooking/placed state
      const pendingOrder = orders.find(
        (o) =>
          o.status !== "picked_up" &&
          o.status !== "cancelled" &&
          (o.token.toUpperCase() === input ||
            o.id.toUpperCase() === input ||
            o.id.toUpperCase().endsWith(input) ||
            `#${o.token.toUpperCase()}` === input)
      );

      if (pendingOrder) {
        setScanError(`Order found but status is '${pendingOrder.status.toUpperCase()}'. It must be READY to hand over.`);
      } else {
        setScanError("No active READY order found matching this Token or QR Code.");
      }
    }
  };

  const handleConfirmScanDelivery = (orderId: string) => {
    onUpdateStatus(orderId, "picked_up");
    setScannedOrder(null);
    setScanInput("");
    setScanSuccess(false);
  };

  // Clock updating time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const queueOrders = orders.filter((o) => o.status === "placed");
  const cookingOrders = orders.filter((o) => o.status === "accepted" || o.status === "cooking" || o.status === "packing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const deliveredOrders = orders
    .filter((o) => o.status === "picked_up" || o.status === "cancelled")
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  const filteredHistory = deliveredOrders.filter(
    (o) =>
      o.userName.toLowerCase().includes(historySearch.toLowerCase()) ||
      o.token.toLowerCase().includes(historySearch.toLowerCase()) ||
      o.id.toLowerCase().includes(historySearch.toLowerCase())
  );

  const activeCount = queueOrders.length + cookingOrders.length + readyOrders.length;
  const activeLoad = (activeCount / 12) * 100;

  // No-op signature since Framer Motion handles layout transitions natively and perfectly
  const orderStatesSignature = orders.map((o) => `${o.id}-${o.status}`).join(",");

  const getPrepDuration = (startIso: string, endIso: string) => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const mins = Math.max(1, Math.round((end - start) / (1000 * 60)));
    return `${mins} min`;
  };

  const getOrderAge = (createdAtIso: string) => {
    const elapsed = currentTime.getTime() - new Date(createdAtIso).getTime();
    const mins = Math.max(0, Math.floor(elapsed / (1000 * 60)));
    if (mins === 0) return "Just now";
    return `${mins}m ago`;
  };

  const allQueueSelected = queueOrders.length > 0 && queueOrders.every(o => selectedOrderIds.includes(o.id));
  const handleToggleSelectAllQueue = () => {
    if (allQueueSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !queueOrders.some(o => o.id === id)));
    } else {
      setSelectedOrderIds(prev => {
        const added = queueOrders.filter(o => !prev.includes(o.id)).map(o => o.id);
        return [...prev, ...added];
      });
    }
  };

  const allCookingSelected = cookingOrders.length > 0 && cookingOrders.every(o => selectedOrderIds.includes(o.id));
  const handleToggleSelectAllCooking = () => {
    if (allCookingSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !cookingOrders.some(o => o.id === id)));
    } else {
      setSelectedOrderIds(prev => {
        const added = cookingOrders.filter(o => !prev.includes(o.id)).map(o => o.id);
        return [...prev, ...added];
      });
    }
  };

  const allReadySelected = readyOrders.length > 0 && readyOrders.every(o => selectedOrderIds.includes(o.id));
  const handleToggleSelectAllReady = () => {
    if (allReadySelected) {
      setSelectedOrderIds(prev => prev.filter(id => !readyOrders.some(o => o.id === id)));
    } else {
      setSelectedOrderIds(prev => {
        const added = readyOrders.filter(o => !prev.includes(o.id)).map(o => o.id);
        return [...prev, ...added];
      });
    }
  };

  const handleBatchUpdateStatus = (status: OrderStatus) => {
    selectedOrderIds.forEach(id => {
      onUpdateStatus(id, status);
    });
    setSelectedOrderIds([]);
  };

  return (
    <div ref={containerRef} className="py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8 selection:bg-amber-500 selection:text-black">
      
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-extrabold">Synchronous TV Deck Live</span>
          </div>
          <h2 className="text-3xl font-black text-white font-display flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-amber-500" />
            Kitchen <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Command Console</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Real-time split-screen dashboard for token ticketing, production coordination, and prompt pickup updates.</p>
        </div>

        {/* Status indicator metrics */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/3 border border-white/5 px-4 py-2.5 rounded-2xl text-right flex flex-col justify-center min-w-[130px]">
            <span className="text-[9px] text-gray-500 uppercase font-mono font-bold tracking-widest">CLOCK TIME</span>
            <span className="text-sm font-black text-white font-mono mt-0.5">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          <div className="bg-white/3 border border-white/5 px-4 py-2.5 rounded-2xl text-right flex flex-col justify-center min-w-[150px]">
            <span className="text-[9px] text-gray-500 uppercase font-mono font-bold tracking-widest">CONGESTION LOAD</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${activeLoad > 75 ? "bg-red-500" : activeLoad > 40 ? "bg-amber-500" : "bg-emerald-500"}`} 
                  style={{ width: `${Math.min(activeLoad, 100)}%` }}
                />
              </div>
              <span className="text-xs font-black text-gray-200 font-mono">{activeCount} active</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="h-11 px-5 bg-white/3 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/10 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-xs cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Exit
          </motion.button>
        </div>
      </div>

      {/* CONTACTLESS QR & TOKEN HANDOFF SCANNER DESK */}
      <div className="bg-[#0b0c15]/60 border border-emerald-500/15 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-[30px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest">Active Verification Terminal</span>
            </div>
            <h3 className="font-display font-black text-white text-lg flex items-center gap-2.5">
              <QrCode className="h-5 w-5 text-emerald-400" />
              Contactless Handoff QR Simulator
            </h3>
            <p className="text-xs text-gray-400 max-w-xl">
              Simulate a barcode hardware gun scanning a student's mobile pickup QR code or ticket. Updates status in real-time.
            </p>
          </div>

          {/* Quick Active Suggestion Pills for Testing */}
          {readyOrders.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 max-w-md">
              <span className="text-[10px] text-gray-500 font-mono uppercase font-bold">Quick Scan Ready:</span>
              {readyOrders.slice(0, 4).map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setScanInput(o.token);
                    // Automatically trigger check
                    setTimeout(() => {
                      const input = o.token.toUpperCase();
                      const foundOrder = orders.find((ord) => ord.status === "ready" && ord.token.toUpperCase() === input);
                      if (foundOrder) {
                        setScannedOrder(foundOrder);
                        setScanSuccess(true);
                        setScanError("");
                      }
                    }, 50);
                  }}
                  className="px-2.5 py-1 text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  Token #{o.token}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleScanVerify} className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Type Token (e.g., A06) or scan QR (order ID) here..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/3 border border-white/5 focus:border-emerald-500/30 text-white placeholder-gray-500 text-xs font-mono font-bold transition-all focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/15 uppercase tracking-wider min-w-[140px]"
          >
            <CheckCircle2 className="h-4 w-4" /> Verify Code
          </button>
        </form>

        {/* Scan Status Feedback Area */}
        <AnimatePresence mode="wait">
          {scanError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4.5 bg-red-500/10 border border-red-500/15 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-400">Scan Authentication Failed</h4>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{scanError}</p>
              </div>
            </motion.div>
          )}

          {scanSuccess && scannedOrder && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/25">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-400 uppercase font-mono font-black tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">MATCH VERIFIED</span>
                    <h4 className="font-display font-black text-white text-sm mt-0.5">{scannedOrder.userName}'s Order is Ready</h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-gray-500 block">TOKEN</span>
                  <span className="text-xl font-mono text-white font-black">#{scannedOrder.token}</span>
                </div>
              </div>

              {/* Verified Items Details */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-mono uppercase font-bold">Items to Hand Over:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {scannedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 bg-white/3 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                      <span className="text-gray-200 font-bold">{item.name}</span>
                      <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-black">{item.quantity}x</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conformation action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleConfirmScanDelivery(scannedOrder.id)}
                  className="px-6 h-10 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 uppercase tracking-wider"
                >
                  <ShoppingBag className="h-4 w-4" /> Confirm & Handover Food
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* THREE-COLUMN TV DISPLAY SPLIT BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: NEW ORDERS (QUEUE) */}
        <div className="flex flex-col bg-[#0b0c15]/60 border border-indigo-500/15 rounded-3xl overflow-hidden min-h-[500px]">
          <div className="p-4.5 bg-indigo-500/10 border-b border-indigo-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-xs uppercase tracking-wider">Queue Deck</h3>
                {queueOrders.length > 0 && (
                  <button
                    onClick={handleToggleSelectAllQueue}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono font-bold uppercase underline mt-0.5 block transition-colors cursor-pointer"
                  >
                    {allQueueSelected ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>
            </div>
            <span className="bg-indigo-500 text-white font-mono text-xs font-black px-3 py-0.5 rounded-full shadow-lg shadow-indigo-500/20">
              {queueOrders.length}
            </span>
          </div>

          {/* Column Scrollable Content */}
          <div className="p-4.5 flex-1 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar">
            {queueOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 space-y-2.5">
                <Box className="h-10 w-10 text-gray-600 stroke-[1.5]" />
                <p className="text-xs font-bold font-mono tracking-wider">NO QUEUED TICKETS</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {queueOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    layoutId={order.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`kitchen-order-card bg-white/3 hover:bg-white/5 border rounded-2xl p-4.5 space-y-4.5 transition-[background-color,border-color] duration-300 relative shadow-xl ${
                      selectedOrderIds.includes(order.id) ? "border-amber-500/50 bg-amber-500/5" : "border-white/5 hover:border-indigo-500/20"
                    }`}
                  >
                    <div className="absolute top-4.5 right-4.5 text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/10">
                      {getOrderAge(order.createdAt)}
                    </div>

                    {/* Header info with Checkbox Selection */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderIds(prev => 
                            prev.includes(order.id) 
                              ? prev.filter(id => id !== order.id) 
                              : [...prev, order.id]
                          );
                        }}
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          selectedOrderIds.includes(order.id) 
                            ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                            : "border-white/20 hover:border-white/40 text-transparent"
                        }`}
                        title="Select Order for Batch Action"
                      >
                        <Check className="h-3 w-3 stroke-[4]" />
                      </button>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-500">#{order.id.slice(0, 6)}</span>
                          <span className="text-xs bg-indigo-500/15 text-indigo-400 font-mono font-black px-2 py-0.5 rounded border border-indigo-500/15">
                            TOKEN: {order.token}
                          </span>
                        </div>
                        <h4 className="font-display font-black text-white text-sm truncate">{order.userName}</h4>
                      </div>
                    </div>

                    {/* Item Breakdowns */}
                    <div className="bg-[#040508]/80 rounded-xl p-3.5 space-y-2.5 border border-white/5">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs flex justify-between items-start">
                          <div className="flex gap-2.5">
                            <span className="text-indigo-400 font-black font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/10">{item.quantity}x</span>
                            <div className="pt-0.5">
                              <span className="text-gray-200 font-bold">{item.name}</span>
                              {item.notes && <p className="text-[9px] text-amber-400 italic mt-1">"{item.notes}"</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Accept & Cook Action */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onUpdateStatus(order.id, "cooking")}
                      className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      Accept & Cook
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PREPARATION */}
        <div className="flex flex-col bg-[#0b0c15]/60 border border-amber-500/15 rounded-3xl overflow-hidden min-h-[500px]">
          <div className="p-4.5 bg-amber-500/10 border-b border-amber-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Flame className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-xs uppercase tracking-wider">Cooking Deck</h3>
                {cookingOrders.length > 0 && (
                  <button
                    onClick={handleToggleSelectAllCooking}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-bold uppercase underline mt-0.5 block transition-colors cursor-pointer"
                  >
                    {allCookingSelected ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>
            </div>
            <span className="bg-amber-500 text-black font-mono text-xs font-black px-3 py-0.5 rounded-full shadow-lg shadow-amber-500/20">
              {cookingOrders.length}
            </span>
          </div>

          {/* Column Scrollable Content */}
          <div className="p-4.5 flex-1 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar">
            {cookingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 space-y-2.5">
                <Flame className="h-10 w-10 text-gray-600 stroke-[1.5]" />
                <p className="text-xs font-bold font-mono tracking-wider">NO DISHES COOKING</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {cookingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    layoutId={order.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`kitchen-order-card bg-white/3 hover:bg-white/5 border rounded-2xl p-4.5 space-y-4.5 transition-[background-color,border-color] duration-300 relative shadow-xl ${
                      selectedOrderIds.includes(order.id) ? "border-amber-500/50 bg-amber-500/5" : "border-white/5 hover:border-amber-500/20"
                    }`}
                  >
                    <div className="absolute top-4.5 right-4.5 text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/10 animate-pulse">
                      {getOrderAge(order.updatedAt || order.createdAt)}
                    </div>

                    {/* Header info with Checkbox Selection */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderIds(prev => 
                            prev.includes(order.id) 
                              ? prev.filter(id => id !== order.id) 
                              : [...prev, order.id]
                          );
                        }}
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          selectedOrderIds.includes(order.id) 
                            ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                            : "border-white/20 hover:border-white/40 text-transparent"
                        }`}
                        title="Select Order for Batch Action"
                      >
                        <Check className="h-3 w-3 stroke-[4]" />
                      </button>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-500">#{order.id.slice(0, 6)}</span>
                          <span className="text-xs bg-amber-500/15 text-amber-400 font-mono font-black px-2 py-0.5 rounded border border-amber-500/15">
                            TOKEN: {order.token}
                          </span>
                        </div>
                        <h4 className="font-display font-black text-white text-sm truncate">{order.userName}</h4>
                      </div>
                    </div>

                    {/* Item Breakdowns */}
                    <div className="bg-[#040508]/80 rounded-xl p-3.5 space-y-2.5 border border-white/5">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs flex justify-between items-start">
                          <div className="flex gap-2.5">
                            <span className="text-amber-400 font-black font-mono bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/10">{item.quantity}x</span>
                            <div className="pt-0.5">
                              <span className="text-gray-200 font-bold">{item.name}</span>
                              {item.notes && <p className="text-[9px] text-amber-400 italic mt-1">"{item.notes}"</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ready to Deliver Action */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onUpdateStatus(order.id, "ready")}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      Ready to Deliver
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* COLUMN 3: READY TO DELIVER */}
        <div className="flex flex-col bg-[#0b0c15]/60 border border-emerald-500/15 rounded-3xl overflow-hidden min-h-[500px]">
          <div className="p-4.5 bg-emerald-500/10 border-b border-emerald-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-xs uppercase tracking-wider">Handoff Deck</h3>
                {readyOrders.length > 0 && (
                  <button
                    onClick={handleToggleSelectAllReady}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold uppercase underline mt-0.5 block transition-colors cursor-pointer"
                  >
                    {allReadySelected ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>
            </div>
            <span className="bg-emerald-500 text-black font-mono text-xs font-black px-3 py-0.5 rounded-full shadow-lg shadow-emerald-500/20">
              {readyOrders.length}
            </span>
          </div>

          {/* Column Scrollable Content */}
          <div className="p-4.5 flex-1 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar">
            {readyOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 space-y-2.5">
                <Check className="h-10 w-10 text-gray-600 stroke-[1.5]" />
                <p className="text-xs font-bold font-mono tracking-wider">COUNTER VACANT</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    layoutId={order.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`kitchen-order-card bg-white/3 hover:bg-white/5 border rounded-2xl p-4.5 space-y-4.5 transition-[background-color,border-color] duration-300 relative shadow-xl ${
                      selectedOrderIds.includes(order.id) ? "border-amber-500/50 bg-amber-500/5" : "border-white/5 hover:border-emerald-500/20"
                    }`}
                  >
                    <div className="absolute top-4.5 right-4.5 text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                      {getOrderAge(order.updatedAt || order.createdAt)}
                    </div>

                    {/* Header info with Checkbox Selection */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderIds(prev => 
                            prev.includes(order.id) 
                              ? prev.filter(id => id !== order.id) 
                              : [...prev, order.id]
                          );
                        }}
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          selectedOrderIds.includes(order.id) 
                            ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                            : "border-white/20 hover:border-white/40 text-transparent"
                        }`}
                        title="Select Order for Batch Action"
                      >
                        <Check className="h-3 w-3 stroke-[4]" />
                      </button>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-500">#{order.id.slice(0, 6)}</span>
                          <span className="text-xs bg-emerald-500/15 text-emerald-400 font-mono font-black px-2 py-0.5 rounded border border-emerald-500/15">
                            TOKEN: {order.token}
                          </span>
                        </div>
                        <h4 className="font-display font-black text-white text-sm truncate">{order.userName}</h4>
                      </div>
                    </div>

                    {/* Item Breakdowns */}
                    <div className="bg-[#040508]/80 rounded-xl p-3.5 space-y-2.5 border border-white/5">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs flex justify-between items-start">
                          <div className="flex gap-2.5">
                            <span className="text-emerald-400 font-black font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/10">{item.quantity}x</span>
                            <div className="pt-0.5">
                              <span className="text-gray-200 font-bold">{item.name}</span>
                              {item.notes && <p className="text-[9px] text-amber-400 italic mt-1">"{item.notes}"</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Complete Delivery Action */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onUpdateStatus(order.id, "picked_up")}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Complete Delivery
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>

      {/* KITCHEN INVENTORY & LOW STOCK MONITOR */}
      <div className="bg-[#0b0c15]/60 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/15">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base">Live Kitchen Inventory Monitor</h3>
              <p className="text-xs text-gray-400">Track dish stock in real-time. Decrements on student checkouts.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Threshold Configuration */}
            <div className="flex items-center gap-2.5 bg-white/3 border border-white/5 p-1.5 rounded-xl text-xs font-semibold">
              <span className="text-gray-400 pl-2 font-mono uppercase text-[9px] tracking-wider">Alert Level:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 h-8 bg-[#040508]/80 border border-white/10 rounded-lg text-center font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter Toggle Pill */}
            <div className="flex gap-1.5 bg-white/3 border border-white/5 p-1 rounded-xl">
              <button
                onClick={() => setShowAllInventory(false)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  !showAllInventory
                    ? "bg-red-500/20 text-red-400 border border-red-500/20 shadow-sm font-extrabold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Alerts ({menuItems.filter(i => (typeof i.stockLevel === 'number' ? i.stockLevel : 10) <= lowStockThreshold).length})
              </button>
              <button
                onClick={() => setShowAllInventory(true)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  showAllInventory
                    ? "bg-amber-500 text-black shadow-sm font-extrabold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All Dishes ({menuItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Cards Grid */}
        {(() => {
          const itemsToDisplay = showAllInventory 
            ? menuItems 
            : menuItems.filter(i => (typeof i.stockLevel === 'number' ? i.stockLevel : 10) <= lowStockThreshold);

          if (itemsToDisplay.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-10 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
                <h4 className="font-display font-black text-white text-sm">All Inventory Healthy</h4>
                <p className="text-xs text-gray-400 max-w-sm">No items are currently below your specified stock threshold of {lowStockThreshold}.</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {itemsToDisplay.map((item) => {
                const stock = typeof item.stockLevel === 'number' ? item.stockLevel : 10;
                const isLow = stock <= lowStockThreshold;
                const isOutOfStock = stock === 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4.5 flex flex-col justify-between space-y-4 transition-all duration-300 ${
                      isOutOfStock
                        ? "bg-red-500/5 border-red-500/20 shadow-md shadow-red-500/2"
                        : isLow
                        ? "bg-amber-500/5 border-amber-500/20 shadow-md shadow-amber-500/2"
                        : "bg-white/3 border-white/5"
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-12 w-12 rounded-xl object-cover border border-white/5 bg-white/5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">{item.category}</span>
                        <h4 className="font-display font-black text-white text-xs truncate leading-tight" title={item.name}>
                          {item.name}
                        </h4>
                        
                        {/* Alert Badge */}
                        <div className="pt-0.5">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-red-500/10">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-amber-500/15">
                              Low Stock ({stock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-500/10">
                              Healthy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-wider">Adjustment</span>
                      
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onUpdateStockLevel && onUpdateStockLevel(item.id, Math.max(0, stock - 1))}
                          className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Decrease Stock"
                          disabled={stock === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </motion.button>
                        
                        <span className="w-8 text-center font-mono text-sm font-bold text-white">
                          {stock}
                        </span>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onUpdateStockLevel && onUpdateStockLevel(item.id, stock + 1)}
                          className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Increase Stock"
                        >
                          <Plus className="h-3 w-3" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* DELIVERED ORDER HISTORY SECTION */}
      <div className="bg-[#0b0c15]/60 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/3 text-gray-400 flex items-center justify-center border border-white/5">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base">Completed Order History</h3>
              <p className="text-xs text-gray-400">All picked up and archived canteen transactions.</p>
            </div>
          </div>

          {/* History Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/3 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#040508]/40">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
              No historical logs matched
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/3 text-gray-500 font-mono font-bold text-[9px] uppercase tracking-wider">
                  <th className="py-4 px-5">Token ID</th>
                  <th className="py-4 px-5">Customer User</th>
                  <th className="py-4 px-5">Dishes Summary</th>
                  <th className="py-4 px-5">Paid</th>
                  <th className="py-4 px-5">Time Placed</th>
                  <th className="py-4 px-5">Time Delivered</th>
                  <th className="py-4 px-5">Prep Speed</th>
                  <th className="py-4 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map((order) => {
                  const isCancelled = order.status === "cancelled";
                  return (
                    <tr key={order.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                            isCancelled 
                              ? "bg-red-500/10 text-red-400 border-red-500/15" 
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                          }`}>
                            #{order.token}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div>
                          <span className="font-bold text-gray-200 block">{order.userName}</span>
                          <span className="text-[9px] text-gray-500 font-mono uppercase">UID: {order.userId.slice(0, 8)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 max-w-[240px]">
                        <div className="truncate text-gray-300 font-medium">
                          {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-amber-500 font-mono font-black">
                        {currency}{(order.totalAmount ?? 0).toFixed(2)}
                      </td>

                      <td className="py-4 px-5 text-gray-400 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className="text-[9px] text-gray-500 block">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-gray-300 font-mono">
                        {order.updatedAt ? (
                          <>
                            {new Date(order.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            <span className="text-[9px] text-gray-500 block">
                              {new Date(order.updatedAt).toLocaleDateString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {isCancelled ? (
                          <span className="text-gray-500 font-mono">-</span>
                        ) : order.updatedAt ? (
                          <div className="flex items-center gap-1.5 text-gray-300 font-mono font-bold">
                            <Timer className="h-3.5 w-3.5 text-amber-500" />
                            {getPrepDuration(order.createdAt, order.updatedAt)}
                          </div>
                        ) : (
                          <span className="text-gray-500 font-mono">-</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isCancelled 
                            ? "bg-red-500/10 text-red-400 border-red-500/20" 
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {isCancelled ? "Cancelled" : "Delivered"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FLOATING BATCH ACTIONS PANEL */}
      <AnimatePresence>
        {selectedOrderIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl bg-[#0a0b12]/95 border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center">
                <Layers className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-display font-black text-white text-sm">
                  Batch Update Console
                </h4>
                <p className="text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                  {selectedOrderIds.length} {selectedOrderIds.length === 1 ? "order" : "orders"} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setSelectedOrderIds([])}
                className="flex-1 sm:flex-initial h-10 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleBatchUpdateStatus("packing")}
                className="flex-1 sm:flex-initial h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
              >
                <Box className="h-4 w-4" /> Move to Packing
              </button>

              <button
                onClick={() => handleBatchUpdateStatus("ready")}
                className="flex-1 sm:flex-initial h-10 px-5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-lg shadow-amber-500/15"
              >
                <Check className="h-4 w-4 stroke-[3]" /> Move to Ready
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
