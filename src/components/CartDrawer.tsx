import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Minus, ShieldCheck, ArrowRight, ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/useCartStore";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  currency?: string;
}

export default function CartDrawer({ isOpen, onClose, onCheckout, currency = "$" }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const subtotal = getTotal();
  const tax = subtotal * 0.08; // 8% tax
  const containerCharge = subtotal > 0 ? 1.50 : 0; // eco container fee
  const total = subtotal + tax + containerCharge;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Slide-in Drawer container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:max-w-md bg-[#080910] border-l border-white/5 shadow-2xl flex flex-col"
          >
            {/* Glow accent bar */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display font-black text-white text-base">Your Culinary Plate</h4>
                  <p className="text-[10px] text-gray-500">
                    Pre-ordering {items.reduce((sum, i) => sum + i.quantity, 0)} freshly prepared {items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.9, 1.05, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-16 w-16 rounded-3xl bg-white/3 flex items-center justify-center text-gray-500 border border-white/5"
                  >
                    <Trash2 className="h-7 w-7 text-gray-600" />
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-white">Your plate is currently vacant</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                      Choose from our curated freshly prepped meals to construct your personalized pre-order pickup ticket.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors flex gap-4"
                    >
                      {item.imageUrl && (
                        <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/5">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <div className={`w-3 h-3 border flex items-center justify-center p-[1.5px] rounded shrink-0 ${item.veg !== false ? "border-green-600 bg-green-950/20" : "border-amber-800 bg-amber-950/20"}`} title={item.veg !== false ? "Vegetarian" : "Non-Vegetarian"}>
                              <div className={`w-1.5 h-1.5 rounded-full ${item.veg !== false ? "bg-green-500" : "bg-amber-700"}`} />
                            </div>
                            <h4 className="font-display font-bold text-white text-sm truncate">{item.name}</h4>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeItem(item.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-amber-500 text-sm font-bold font-mono">
                            {currency}{(item.price * item.quantity).toFixed(0)}
                          </span>

                          {/* Quantity and Controls */}
                          <div className="flex items-center gap-2 bg-[#090A10] border border-white/5 rounded-xl p-1 h-8">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </motion.button>
                            <span className="font-mono text-xs font-bold text-white w-5 text-center">
                              {item.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary calculations (Sticky Bottom) */}
            {items.length > 0 && (
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="p-6 border-t border-white/5 bg-[#0C0D15] space-y-5"
              >
                {/* Billing Summary List */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Menu Items Subtotal</span>
                    <span className="font-mono font-bold text-white">{currency}{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Eco Container Packaging Fee</span>
                    <span className="font-mono font-bold text-white">{currency}{containerCharge.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>State Sales Tax (8.0%)</span>
                    <span className="font-mono font-bold text-white">{currency}{tax.toFixed(0)}</span>
                  </div>
                  
                  <div className="border-t border-white/5 my-2 pt-3 flex justify-between text-white font-extrabold font-display">
                    <span className="text-sm uppercase tracking-wider">Total Value Due</span>
                    <span className="font-mono text-base text-amber-500">{currency}{total.toFixed(0)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCheckout}
                    className="w-full h-13 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 font-bold text-black text-sm shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2.5 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Proceed to Payment <ArrowRight className="h-4 w-4" />
                  </motion.button>

                  <p className="text-[9px] text-gray-500 text-center flex items-center justify-center gap-1.5 leading-relaxed">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Fully integrated escrow clearance & secure checkout.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
