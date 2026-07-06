import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Order } from "../types";
import { Monitor, ChevronDown, ChevronUp, Bell, Clock, Sparkles } from "lucide-react";

interface MyTokensCornerWidgetProps {
  activeOrders: Order[];
  onTrackOrder: (orderId: string) => void;
}

export default function MyTokensCornerWidget({ activeOrders, onTrackOrder }: MyTokensCornerWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (activeOrders.length === 0) return null;

  return (
    <div id="student-tv-widget" className="fixed bottom-6 right-6 z-30 max-w-sm w-80">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="rounded-3xl border border-white/10 bg-[#0c0d15]/95 backdrop-blur-xl overflow-hidden shadow-2xl shadow-amber-500/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-white/3 px-4.5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-widest font-extrabold text-gray-300 flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-amber-500" /> Active Queue HUD
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, bg: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsExpanded(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Minimize HUD"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Token List */}
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
              {activeOrders.map((order) => {
                const isReady = order.status === "ready";
                return (
                  <motion.div
                    key={order.id}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTrackOrder(order.id)}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                      isReady
                        ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/5"
                        : "bg-white/3 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {isReady && (
                      <>
                        {/* Shimmer overlay for Ready tokens */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full animate-shimmer" />
                        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black shadow-lg">
                          <Bell className="h-2.5 w-2.5 animate-bounce" />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Token display */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">YOUR TOKEN</span>
                          <span className={`font-mono text-2xl font-black tracking-tight ${
                            isReady ? "text-amber-400" : "text-white"
                          }`}>
                            #{order.token}
                          </span>
                        </div>
                      </div>

                      {/* Status display */}
                      <div className="text-right flex flex-col items-end space-y-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">STATUS</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isReady 
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/15" 
                            : order.status === "cooking" 
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                            : "bg-white/5 text-gray-400 border border-transparent"
                        }`}>
                          {isReady ? "Ready" : order.status === "cooking" ? "Cooking" : "Placed"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 group-hover:text-amber-400 transition-colors">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {isReady ? "Collect at counter!" : "Preparing fresh..."}
                      </span>
                      <span className="flex items-center gap-0.5 font-bold">
                        {isReady ? "Tap for QR Code" : "Track Order"} &rarr;
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05, border: "rgba(245,158,11,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full border border-amber-500/30 bg-[#080910] text-white transition-all cursor-pointer shadow-2xl shadow-amber-500/10 group"
          >
            <div className="relative">
              <Monitor className="h-4 w-4 text-amber-500 animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black font-mono text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#080910]">
                {activeOrders.length}
              </span>
            </div>
            <span className="text-xs font-extrabold tracking-wider uppercase">Live Queue HUD</span>
            <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
