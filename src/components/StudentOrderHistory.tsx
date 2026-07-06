import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Order, OrderStatus, MenuItem } from "../types";
import { useCartStore } from "../store/useCartStore";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  Receipt, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  RefreshCw, 
  ShoppingBag, 
  Utensils, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star
} from "lucide-react";

interface StudentOrderHistoryProps {
  orders: Order[];
  onTrackOrder: (orderId: string) => void;
  onShowReceipt: (order: Order) => void;
  currency: string;
  onBackToMenu: () => void;
  onOpenCart: () => void;
}

export default function StudentOrderHistory({
  orders,
  onTrackOrder,
  onShowReceipt,
  currency,
  onBackToMenu,
  onOpenCart
}: StudentOrderHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>({});
  
  const addItem = useCartStore((state) => state.addItem);

  // Real-time rating action
  const handleRateItem = async (orderId: string, itemId: string, ratingValue: number) => {
    const key = `${orderId}-${itemId}`;
    if (ratingLoading[key]) return;

    setRatingLoading(prev => ({ ...prev, [key]: true }));
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as Order;
        const updatedItems = orderData.items.map(item => {
          if (item.id === itemId) {
            return { ...item, rating: ratingValue };
          }
          return item;
        });

        // 1. Update order items list in Firestore
        await updateDoc(orderRef, {
          items: updatedItems,
          updatedAt: new Date().toISOString()
        });

        // 2. Update overall average rating for the menu item
        const menuItemRef = doc(db, "menuItems", itemId);
        const menuItemSnap = await getDoc(menuItemRef);
        if (menuItemSnap.exists()) {
          const menuItemData = menuItemSnap.data();
          const currentRating = menuItemData.rating || 4.5;
          // Calculate simulated sliding average
          const newRating = parseFloat(((currentRating * 6 + ratingValue) / 7).toFixed(1));
          await updateDoc(menuItemRef, { rating: newRating });
        }
      }
    } catch (err) {
      console.error("Error saving rating:", err);
    } finally {
      setRatingLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Helper to toggle order item collapse
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  // Helper to re-add order items to the cart
  const handleOrderAgain = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    order.items.forEach(item => {
      // Reconstruct as a MenuItem to fit standard Cart Store interface
      const mockMenuItem: MenuItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        description: "",
        category: "",
        imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
        available: true,
        tags: [],
        stockLevel: 15
      };
      addItem(mockMenuItem, item.notes);
    });
    // Open the cart drawer
    onOpenCart();
  };

  // Formatting date nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Filtering & searching orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filter by Status Tab
      if (statusFilter === "active") {
        if (order.status === "picked_up" || order.status === "cancelled") return false;
      } else if (statusFilter === "completed") {
        if (order.status !== "picked_up") return false;
      } else if (statusFilter === "cancelled") {
        if (order.status !== "cancelled") return false;
      }

      // 2. Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesToken = order.token?.toLowerCase().includes(query);
        const matchesItems = order.items.some(it => it.name.toLowerCase().includes(query));
        return matchesId || matchesToken || matchesItems;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Quick state stats
  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(o => o.status !== "picked_up" && o.status !== "cancelled").length;
    const completed = orders.filter(o => o.status === "picked_up").length;
    const totalSpent = orders
      .filter(o => o.status === "picked_up")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { total, active, completed, totalSpent };
  }, [orders]);

  return (
    <div id="student-order-history-dashboard" className="px-6 md:px-12 max-w-7xl mx-auto py-8 space-y-8 selection:bg-amber-500 selection:text-black">
      
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight">
            ORDER <span className="text-amber-500">HISTORY</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Access past receipts, download PDF invoices, track active smart tokens, and duplicate past meals easily.
          </p>
        </div>
        <button
          onClick={onBackToMenu}
          className="px-4.5 py-2.5 bg-white/5 border border-white/5 hover:border-amber-500/30 text-gray-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer w-fit"
        >
          <Utensils className="h-4 w-4 text-amber-500" /> Back to Daily Menu
        </button>
      </div>

      {/* High-level summary bento cells */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel border border-white/5 p-4 rounded-2xl bg-white/2">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Total Orders</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">
            {stats.total}
          </span>
        </div>
        <div className="glass-panel border border-white/5 p-4 rounded-2xl bg-white/2">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Active Tokens</span>
          <span className="text-2xl font-black font-mono text-amber-500 mt-1 block animate-pulse">
            {stats.active}
          </span>
        </div>
        <div className="glass-panel border border-white/5 p-4 rounded-2xl bg-white/2">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Completed Pickups</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
            {stats.completed}
          </span>
        </div>
        <div className="glass-panel border border-white/5 p-4 rounded-2xl bg-white/2">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Total Spent (Canteen)</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
            {currency}{stats.totalSpent.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Search and Filters deck */}
      <div className="glass-panel border border-white/5 rounded-3xl p-5 bg-gradient-to-r from-white/1 to-transparent flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Token #, or Dish name..."
            className="w-full h-11 pl-11 pr-4 bg-[#0A0B12] border border-white/5 hover:border-white/10 focus:border-amber-500/30 text-white rounded-xl text-xs font-medium placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 transition-all font-mono"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto">
          {(["all", "active", "completed", "cancelled"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border cursor-pointer transition-all shrink-0 ${
                statusFilter === filter
                  ? "bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/15"
                  : "bg-white/3 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
              }`}
            >
              {filter === "all" ? "All Orders" : filter === "active" ? "Active Queue" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Orders history list */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="glass-panel border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4"
            >
              <div className="h-16 w-16 rounded-full bg-white/3 flex items-center justify-center border border-white/5 text-gray-500">
                <Receipt className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-display font-black text-white text-base">No Matching Orders found</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {searchQuery 
                    ? "Try adjusting your search terms or filter constraints to find your pre-ordered meals." 
                    : "You haven't placed any orders in this session yet. Check out our amazing daily menu!"}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={onBackToMenu}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Utensils className="h-4 w-4" /> Start Ordering Now
                </button>
              )}
            </motion.div>
          ) : (
            filteredOrders.map((order) => {
              const isActive = order.status !== "picked_up" && order.status !== "cancelled";
              const isReady = order.status === "ready";
              const isCancelled = order.status === "cancelled";
              const isPickedUp = order.status === "picked_up";
              const isExpanded = expandedOrders.includes(order.id);

              return (
                <motion.div
                  key={order.id}
                  layout
                  layoutId={`order-card-${order.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`glass-panel border rounded-3xl overflow-hidden transition-all duration-300 relative ${
                    isReady
                      ? "bg-amber-500/3 border-amber-500/20"
                      : isActive
                      ? "bg-indigo-500/3 border-indigo-500/15"
                      : "bg-[#0c0d15]/50 border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Glowing vertical state strip */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                    isReady ? "bg-green-500" :
                    isCancelled ? "bg-red-500" :
                    isPickedUp ? "bg-emerald-600" :
                    "bg-amber-500"
                  }`} />

                  {/* Main header layout */}
                  <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-7">
                    
                    {/* Left details */}
                    <div className="flex items-start md:items-center gap-4.5">
                      
                      {/* Token badge */}
                      <div className={`h-16 w-16 rounded-2xl shrink-0 border flex flex-col items-center justify-center font-mono ${
                        isReady 
                          ? "bg-green-500/15 border-green-500/30 text-green-400 shadow-lg shadow-green-500/5 animate-pulse" 
                          : isCancelled
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : isPickedUp
                          ? "bg-white/3 border-white/5 text-gray-400"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-500"
                      }`}>
                        <span className="text-[8px] uppercase tracking-wider font-bold">Token</span>
                        <span className="text-xl font-black">{order.token || "N/A"}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-gray-500">#{order.id}</span>
                          <span className="text-gray-500 font-mono text-xs">&bull;</span>
                          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-500" /> {formatDate(order.createdAt)}
                          </span>
                        </div>
                        
                        {/* Dishes list synopsis */}
                        <h3 className="font-display font-black text-white text-sm md:text-base leading-tight">
                          {order.items.map(it => `${it.quantity}x ${it.name}`).join(", ")}
                        </h3>

                        {/* Est pickup or timestamp */}
                        <div className="flex items-center gap-2.5 pt-1">
                          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" /> Est. Pickup: <span className="text-gray-200 font-semibold">{order.pickupTime || "As soon as possible"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right details & action block */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-end lg:self-auto w-full lg:w-auto">
                      
                      {/* Price Paid and Status display */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 px-1">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider block font-mono">Amount Paid</span>
                          <span className="text-sm font-black text-white font-mono">{currency}{order.totalAmount.toFixed(2)}</span>
                        </div>

                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            isReady 
                              ? "bg-green-500/15 text-green-400 border-green-500/20 animate-pulse" 
                              : isCancelled
                              ? "bg-red-500/10 text-red-400 border-red-500/15"
                              : isPickedUp
                              ? "bg-emerald-600/10 text-emerald-400 border-emerald-600/15"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/15"
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${
                              isReady ? "bg-green-400" : isCancelled ? "bg-red-400" : isPickedUp ? "bg-emerald-400" : "bg-amber-400"
                            } ${isActive && "animate-ping"}`} />
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Button Group */}
                      <div className="grid grid-cols-2 sm:flex items-center gap-2">
                        
                        {/* Accordion Toggle */}
                        <button
                          onClick={() => toggleOrderExpand(order.id)}
                          className="h-10 px-3 bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-bold"
                          title="View order item details"
                        >
                          {isExpanded ? (
                            <>Hide Items <ChevronUp className="h-4 w-4" /></>
                          ) : (
                            <>Show Items <ChevronDown className="h-4 w-4" /></>
                          )}
                        </button>

                        {/* View Receipt */}
                        <button
                          onClick={() => onShowReceipt(order)}
                          className="h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs font-extrabold uppercase tracking-wider"
                          title="Generate tax-compliant thermal PDF receipt"
                        >
                          <Receipt className="h-4 w-4" /> Receipt
                        </button>

                        {/* Primary Contextual Action (Track / Order Again) */}
                        {isActive ? (
                          <button
                            onClick={() => onTrackOrder(order.id)}
                            className="col-span-2 sm:col-span-1 h-10 px-5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 uppercase tracking-wider"
                          >
                            Track progress <ArrowRight className="h-4 w-4 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleOrderAgain(e, order)}
                            className="col-span-2 sm:col-span-1 h-10 px-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider text-xs font-black"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Order Again
                          </button>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* Accordion Expansion (Order breakdowns) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-t border-white/5 bg-[#07080d]/40"
                      >
                        <div className="p-5 md:p-6 pl-7 space-y-4">
                          <h4 className="font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ordered Itemized Receipt Breakdown</h4>
                          <div className="space-y-2.5">
                            {order.items.map((item, idx) => (
                              <div key={`${order.id}-item-${idx}`} className="flex items-start justify-between text-xs py-1">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono bg-white/5 text-gray-300 font-extrabold px-1.5 py-0.5 rounded text-[10px] border border-white/5">
                                      {item.quantity}x
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-2.5 h-2.5 border flex items-center justify-center p-[1px] rounded shrink-0 ${item.veg !== false ? "border-green-600 bg-green-950/20" : "border-amber-800 bg-amber-950/20"}`} title={item.veg !== false ? "Vegetarian" : "Non-Vegetarian"}>
                                        <div className={`w-1 h-1 rounded-full ${item.veg !== false ? "bg-green-500" : "bg-amber-700"}`} />
                                      </div>
                                      <span className="font-bold text-gray-200">{item.name}</span>
                                    </div>
                                  </div>
                                  {item.notes && (
                                    <p className="text-[10px] text-amber-500 font-medium italic pl-8">
                                      &ldquo;{item.notes}&rdquo;
                                    </p>
                                  )}
                                  {isPickedUp && (
                                    <div className="flex items-center gap-2 pl-8 pt-1.5 pb-0.5">
                                      <span className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider">Rate Dish:</span>
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                          const isSelected = item.rating && item.rating >= star;
                                          const isLoading = ratingLoading[`${order.id}-${item.id}`];
                                          return (
                                            <button
                                              key={star}
                                              disabled={isLoading}
                                              onClick={() => handleRateItem(order.id, item.id, star)}
                                              className={`p-0.5 transition-all duration-150 ${
                                                isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-125 cursor-pointer active:scale-95"
                                              }`}
                                            >
                                              <Star
                                                className={`h-3.5 w-3.5 ${
                                                  isSelected
                                                    ? "fill-amber-500 text-amber-500 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.4)]"
                                                    : "text-gray-600 hover:text-amber-400"
                                                }`}
                                              />
                                            </button>
                                          );
                                        })}
                                      </div>
                                      {item.rating && (
                                        <span className="text-[9px] text-emerald-400 font-black font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/15">
                                          {item.rating} / 5 Rated
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className="font-mono text-gray-300 font-medium">
                                  {currency}{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Mini totals breakdown */}
                          <div className="pt-3 border-t border-white/5 flex flex-col items-end space-y-1.5 font-mono text-[11px] text-gray-400">
                            <div className="flex justify-between w-full max-w-[240px]">
                              <span>Items Subtotal:</span>
                              <span className="text-gray-300">{currency}{(order.totalAmount - (order.totalAmount * 0.08) - 1.50).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[240px]">
                              <span>State Sales Tax (8.0%):</span>
                              <span className="text-gray-300">{currency}{((order.totalAmount - (order.totalAmount * 0.08) - 1.50) * 0.08).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[240px]">
                              <span>Autonomous Service Fee:</span>
                              <span className="text-gray-300">{currency}1.50</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[240px] pt-1.5 border-t border-white/5 font-extrabold text-white text-xs">
                              <span className="text-amber-500 uppercase">Grand Total:</span>
                              <span>{currency}{order.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
