import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CreditCard, ShieldCheck, Landmark, Smartphone, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { OrderItem } from "../types";

interface PaymentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  totalAmount: number;
  items: OrderItem[];
  currency?: string;
}

type PaymentMethod = "rfid" | "wallet" | "card";

export default function PaymentPortalModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  totalAmount,
  items,
  currency = "$"
}: PaymentPortalModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("rfid");
  const [rfidNumber, setRfidNumber] = useState("STUDENT-2026-9812");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success">("idle");
  const [loadingMessage, setLoadingMessage] = useState("Connecting to Secure Canteen Gateway...");

  useEffect(() => {
    if (isOpen) {
      setPaymentState("idle");
    }
  }, [isOpen]);

  const handlePay = () => {
    setPaymentState("processing");
    
    const stages = [
      { delay: 800, msg: "Verifying Account Balance..." },
      { delay: 1600, msg: "Authorizing Transaction with Canteen Server..." },
      { delay: 2400, msg: "Securing Token & Confirming Order..." }
    ];

    stages.forEach((stage) => {
      setTimeout(() => {
        setLoadingMessage(stage.msg);
      }, stage.delay);
    });

    setTimeout(() => {
      setPaymentState("success");
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 1500);
    }, 3200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={paymentState === "idle" ? onClose : undefined}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#080910]/95 p-6 md:p-8 shadow-2xl overflow-hidden z-10"
        >
          {/* Ambient light ring */}
          <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-amber-500/10 blur-[40px] pointer-events-none" />

          {/* Close button */}
          {paymentState === "idle" && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute right-6 top-6 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}

          {/* 1. Processing Screen */}
          {paymentState === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative">
                <Loader2 className="h-14 w-14 text-amber-500 animate-spin" />
                <div className="absolute inset-0 h-14 w-14 rounded-full bg-amber-500/10 blur-[10px]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white font-display">Authorizing Payment</h3>
                <p className="text-xs font-mono text-amber-500/80 tracking-wide uppercase animate-pulse">{loadingMessage}</p>
              </div>
              <p className="text-[10px] text-gray-500 max-w-xs">Connecting securely to standard network escrow routers. Do not refresh this window.</p>
            </div>
          )}

          {/* 2. Success Screen */}
          {paymentState === "success" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10"
              >
                <CheckCircle2 className="h-10 w-10" />
              </motion.div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-white font-display">Authorized Success!</h3>
                <p className="text-xs text-gray-400">Order successfully transmitted to the campus kitchen.</p>
              </div>
              <span className="inline-block px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest animate-pulse font-mono">
                Compiling Order Token...
              </span>
            </div>
          )}

          {/* 3. Idle Screen (Interactive Form) */}
          {paymentState === "idle" && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Secure Checkout Gateway
                </span>
                <h3 className="text-2xl font-black text-white mt-3 font-display">Canteen Settlement Portal</h3>
              </div>

              {/* Order summary card */}
              <div className="rounded-2xl bg-white/3 border border-white/5 p-4 flex items-center justify-between text-xs font-medium">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider font-mono">PLATE COMPOSITION</span>
                  <span className="text-white font-extrabold block mt-0.5">{items.reduce((sum, i) => sum + i.quantity, 0)} Items Selected</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider font-mono">TOTAL DUE</span>
                  <span className="text-amber-500 font-mono text-xl font-black block mt-0.5">{currency}{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Choose payment vehicle
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod("rfid")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === "rfid"
                        ? "bg-amber-500/10 border-amber-500/30 text-white"
                        : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10"
                    }`}
                  >
                    <Landmark className="h-4 w-4" />
                    <span className="text-[10px] font-bold">RFID Card</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod("wallet")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === "wallet"
                        ? "bg-amber-500/10 border-amber-500/30 text-white"
                        : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span className="text-[10px] font-bold">UPI / Phone</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === "card"
                        ? "bg-amber-500/10 border-amber-500/30 text-white"
                        : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Credit Card</span>
                  </motion.button>
                </div>
              </div>

              {/* Method Forms */}
              <div className="pt-1.5 min-h-[110px]">
                <AnimatePresence mode="wait">
                  {paymentMethod === "rfid" && (
                    <motion.div
                      key="rfid"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                          RFID Smart Card Chip ID
                        </label>
                        <input
                          type="text"
                          value={rfidNumber}
                          onChange={(e) => setRfidNumber(e.target.value)}
                          placeholder="STUDENT-YYYY-XXXX"
                          className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs font-semibold">
                        <span className="text-gray-400">Escrow Wallet Balance</span>
                        <strong className="text-emerald-400 font-mono">{currency}48.50</strong>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === "wallet" && (
                    <motion.div
                      key="wallet"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center space-y-3.5"
                    >
                      <div className="relative p-2.5 bg-white rounded-2xl shadow-xl">
                        <div className="h-28 w-28 border border-gray-100 flex items-center justify-center bg-gray-50 rounded-xl p-1">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=canteen-pay-${totalAmount}`}
                            alt="Payment QR" 
                            className="h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-center text-gray-400 max-w-xs leading-relaxed">
                        Scan the dynamic escrow QR above using standard UPI instruments (PhonePe, Google Pay, Apple Pay) to settle instantly.
                      </p>
                    </motion.div>
                  )}

                  {paymentMethod === "card" && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                            Card Number
                          </label>
                          <input
                            type="text"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                              const matches = val.match(/\d{4,16}/g);
                              const match = (matches && matches[0]) || "";
                              const parts = [];
                              for (let i = 0, len = match.length; i < len; i += 4) {
                                parts.push(match.substring(i, i + 4));
                              }
                              if (parts.length > 0) {
                                setCardNumber(parts.join(" "));
                              } else {
                                setCardNumber(val);
                              }
                            }}
                            placeholder="0000 0000 0000 0000"
                            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                            Expiry
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9]/g, "");
                              if (val.length > 2) {
                                val = val.substring(0, 2) + "/" + val.substring(2, 4);
                              }
                              setCardExpiry(val);
                            }}
                            placeholder="MM/YY"
                            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-mono text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                            CVV Code
                          </label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="***"
                            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-mono text-center"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pay Now Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePay}
                className="w-full h-13 mt-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 font-bold text-black text-xs shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
              >
                <span>Settle & Authorize Order</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-500 text-center leading-relaxed">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>SSL Encrypted Connection. Synchronous network authorization.</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
