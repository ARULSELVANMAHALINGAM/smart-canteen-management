import React, { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Check, Clock, QrCode, Sparkles, ChefHat, Box, ShoppingBag, ArrowLeft, RefreshCw, Receipt, ShieldAlert } from "lucide-react";
import { Order, OrderStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LiveTrackingProps {
  order: Order;
  onBack: () => void;
  onUpdateStatusSimulated?: (newStatus: OrderStatus) => void;
  onShowReceipt?: (order: Order) => void;
  currency?: string;
}

export default function LiveTracking({ order, onBack, onUpdateStatusSimulated, onShowReceipt, currency = "$" }: LiveTrackingProps) {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  const statuses: { label: string; status: OrderStatus; icon: any }[] = [
    { label: "Placed", status: "placed", icon: ShoppingBag },
    { label: "Accepted", status: "accepted", icon: Clock },
    { label: "Cooking", status: "cooking", icon: ChefHat },
    { label: "Packing", status: "packing", icon: Box },
    { label: "Ready", status: "ready", icon: QrCode },
    { label: "Picked Up", status: "picked_up", icon: Check }
  ];

  const currentStep = statuses.findIndex((s) => s.status === currentOrder.status);

  // Live synchronization with Firestore
  useEffect(() => {
    setCurrentOrder(order);
    if (!order.id) return;

    const docRef = doc(db, "orders", order.id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentOrder({ id: docSnap.id, ...data } as Order);
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, `orders/${order.id}`);
        } catch (e) {
          console.warn("Firestore live subscription error:", err);
        }
      }
    );

    return () => unsubscribe();
  }, [order.id]);

  const handleUpdateStatusSimulated = async (newStatus: OrderStatus) => {
    try {
      const docRef = doc(db, "orders", currentOrder.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      if (onUpdateStatusSimulated) {
        onUpdateStatusSimulated(newStatus);
      }
    } catch (err) {
      console.warn("Failed to write simulation state back to Firestore:", err);
      setCurrentOrder(prev => ({ ...prev, status: newStatus }));
      if (onUpdateStatusSimulated) {
        onUpdateStatusSimulated(newStatus);
      }
    }
  };

  return (
    <div className="py-12 px-6 md:px-12 max-w-4xl mx-auto space-y-10 relative">
      {/* Background radial gradient glow */}
      <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Back button and title bar */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-all duration-250 hover:-translate-x-1 cursor-pointer text-sm"
        >
          <ArrowLeft className="h-4 w-4 text-amber-500" /> Back to Dashboard
        </button>

        <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest bg-white/3 border border-white/5 px-2.5 py-1 rounded-lg">
          ID: {currentOrder.id}
        </span>
      </div>

      {/* KFC Token Banner Card */}
      <div 
        className="relative z-10 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/15 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl transition-all duration-300"
      >
        <div className="text-center md:text-left space-y-1">
          <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black font-mono">YOUR PICKUP TOKEN</span>
          <h2 className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
            #{currentOrder.token || "A01"}
          </h2>
          <p className="text-xs text-gray-400 pt-1">
            Watch the <span className="text-amber-500 font-extrabold">Overhead Canteen TV Board</span> for this token!
          </p>
        </div>
        
        <div className="bg-black/40 border border-white/5 py-4.5 px-6 rounded-2xl flex flex-col items-center md:items-end justify-center">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold font-mono">ACTIVE DECK</span>
          <span className="text-base font-black mt-1 text-white uppercase tracking-wider font-display flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            {currentStep <= 1 ? "📥 In Queue" : currentStep <= 3 ? "🍳 Preparing" : "✅ Ready"}
          </span>
        </div>
      </div>

      {/* Main Order Card Status */}
      <div 
        className="rounded-3xl bg-white/3 border border-white/5 p-6 md:p-8 space-y-8 relative z-10 transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-black text-white flex items-center gap-2.5">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Tracking Milestones
            </h3>
            <p className="text-xs text-gray-400">
              Your order is managed synchronously across kitchen terminals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider font-mono">LATEST</span>
            <span
              className="bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border border-amber-500/15 flex items-center gap-2 transition-all duration-200"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              {currentOrder.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Dynamic Timeline Grid */}
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 py-6">
          {/* Connector line for Desktop */}
          <div className="absolute left-[27px] md:left-[5%] md:right-[5%] top-8 bottom-8 md:bottom-auto md:h-1 bg-white/5 -z-10 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(Math.max(0, currentStep) / (statuses.length - 1)) * 100}%` }}
            />
          </div>

          {statuses.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;

            return (
              <div
                key={step.status}
                className="flex md:flex-col items-center gap-4 md:gap-3 md:text-center flex-1 z-10 w-full"
              >
                <div
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
                    isCompleted
                      ? "bg-gradient-to-br from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/15"
                      : isActive
                      ? "bg-[#0c0d15] border-2 border-amber-500 text-amber-400 shadow-xl"
                      : "bg-[#0a0b12] border border-white/5 text-gray-600"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-2xl border border-amber-500 animate-ping opacity-25" />
                  )}
                  <Icon className={`h-6 w-6 ${isActive ? "animate-pulse" : ""}`} />
                </div>
                <div className="text-left md:text-center">
                  <h4
                    className={`font-display text-sm font-bold ${
                      isActive ? "text-amber-400" : isCompleted ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold font-mono">
                    {isCompleted ? "Done" : isActive ? "Active" : "Wait"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* QR Code Hand-off Panel */}
        {currentOrder.status === "ready" && (
          <div
            className="flex flex-col items-center text-center p-8 rounded-3xl bg-amber-500/5 border border-amber-500/15 max-w-sm mx-auto shadow-2xl space-y-4 transition-all duration-300"
          >
            <div className="relative p-3.5 bg-white rounded-3xl shadow-2xl">
              <QrCode className="h-40 w-40 text-black" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display text-lg font-black text-white flex items-center gap-2 justify-center">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Order is Ready!
              </h4>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Show this dynamic pickup QR ticket at the kitchen window to authorize and clear your order immediately.
              </p>
            </div>
          </div>
        )}

        {/* Selected Items Breakdown summary */}
        <div className="border-t border-white/5 pt-6">
          <h4 className="font-display font-black text-white text-base mb-4 uppercase tracking-wider text-xs text-gray-400">Order Items Details</h4>
          <div className="space-y-3.5">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm py-1 border-b border-white/2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/15">
                    {item.quantity}x
                  </span>
                  <span className="text-gray-300 font-semibold">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-white">{currency}{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-bold text-white">
            <div className="flex justify-between sm:justify-start gap-2.5 w-full items-center">
              <span className="text-gray-400 text-xs uppercase tracking-wider font-display font-bold">Total Transacted:</span>
              <span className="font-mono text-lg text-amber-500 font-black">{currency}{currentOrder.totalAmount.toFixed(2)}</span>
            </div>
            {onShowReceipt && (
              <button
                onClick={() => onShowReceipt(currentOrder)}
                className="w-full sm:w-auto px-4.5 py-2.5 rounded-xl bg-white/3 border border-white/5 hover:border-amber-500/30 hover:bg-white/5 text-xs font-extrabold text-gray-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-102 active:scale-98"
              >
                <Receipt className="h-4 w-4 text-amber-500" /> View Digital Receipt
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Helper Panel */}
      <div className="p-6 rounded-3xl bg-[#0c0d15] border border-white/5 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-amber-500" /> Synchronous Order Simulator
          </h4>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">Fast Track</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Settle or clear different kitchen states instantly to view overhead monitor board updates.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {statuses.map((s) => (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              key={s.status}
              onClick={() => handleUpdateStatusSimulated(s.status)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                currentOrder.status === s.status
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg"
                  : "bg-white/3 border border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
