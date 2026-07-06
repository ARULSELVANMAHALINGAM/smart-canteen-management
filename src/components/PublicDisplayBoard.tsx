import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Order, OrderStatus } from "../types";
import { Volume2, VolumeX, Clock, Monitor, RefreshCw, ChefHat, Sparkles, CheckCircle, Bell, ArrowLeft } from "lucide-react";

gsap.registerPlugin(Flip);

interface PublicDisplayBoardProps {
  onBack?: () => void;
  showBackButton?: boolean;
  currentUserId?: string;
}

export default function PublicDisplayBoard({ onBack, showBackButton, currentUserId }: PublicDisplayBoardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const boardRef = useRef<HTMLDivElement>(null);
  const prevReadyTokensRef = useRef<string[]>([]);

  // Synthesize harmonious KFC-style chime
  const playCanteenChime = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Chime notes: E5 followed quickly by A5/C#6 chord
      const playNote = (freq: number, startDelay: number, duration: number, volume: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startDelay);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startDelay);
        gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + startDelay + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startDelay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + startDelay);
        osc.stop(audioCtx.currentTime + startDelay + duration + 0.1);
      };

      // Play double-chime note pattern
      playNote(659.25, 0, 0.6, 0.25);      // E5
      playNote(880.00, 0.15, 0.8, 0.2);     // A5
      playNote(1109.73, 0.15, 0.8, 0.15);  // C#6
    } catch (err) {
      console.warn("Web Audio API not supported or blocked:", err);
    }
  };

  // 1. Digital Clock display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Real-time Firestore query for Active Orders
  useEffect(() => {
    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });

        // Filter for active non-completed/non-cancelled states for the public board
        const activeOrders = fetchedOrders.filter(
          (o) => o.status !== "picked_up" && o.status !== "cancelled"
        );

        // Analyze if any order just changed status to "ready" to trigger chime and flash
        const currentReadyTokens = activeOrders
          .filter((o) => o.status === "ready")
          .map((o) => o.token || o.id);

        const newlyReady = currentReadyTokens.filter(
          (t) => !prevReadyTokensRef.current.includes(t)
        );

        if (newlyReady.length > 0) {
          // Play sound
          playCanteenChime();

          // Highlight newly ready item
          setTimeout(() => {
            newlyReady.forEach((token) => {
              const el = document.getElementById(`token-ready-${token}`);
              if (el) {
                gsap.timeline()
                  .to(el, { backgroundColor: "#10B981", color: "#ffffff", scale: 1.15, duration: 0.2, repeat: 5, yoyo: true })
                  .to(el, { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981", scale: 1, duration: 0.3 });
              }
            });
          }, 100);
        }

        prevReadyTokensRef.current = currentReadyTokens;
        setOrders(activeOrders);
        setLoading(false);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, "orders");
        } catch (e) {
          console.error("Firestore error on display board:", error);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [audioEnabled]);

  const prevOrdersRef = useRef<Order[]>(orders);
  const flipStateRef = useRef<any>(null);

  if (orders !== prevOrdersRef.current) {
    const tokenChips = document.querySelectorAll(".token-chip");
    if (tokenChips.length > 0) {
      flipStateRef.current = Flip.getState(".token-chip");
    }
    prevOrdersRef.current = orders;
  }

  // Group tokens based on statuses
  // "In Queue": "placed" or "accepted"
  // "Preparing": "cooking" or "packing"
  // "Ready for Pickup": "ready"
  const queueOrders = orders.filter((o) => o.status === "placed" || o.status === "accepted");
  const preparingOrders = orders.filter((o) => o.status === "cooking" || o.status === "packing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  // GSAP FLIP transition when lists change
  useLayoutEffect(() => {
    if (flipStateRef.current) {
      Flip.from(flipStateRef.current, {
        duration: 0.8,
        ease: "back.out(1.1)",
        stagger: 0.04,
        absolute: true, // Smooth position transitions across columns
        scale: true,
        onEnter: (elements) => gsap.fromTo(elements, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }),
        onLeave: (elements) => gsap.to(elements, { opacity: 0, scale: 0.5, duration: 0.4, ease: "power2.in" }),
        onComplete: () => {
          flipStateRef.current = null;
        }
      });
    } else if (!loading) {
      gsap.fromTo(
        ".token-chip",
        { scale: 0.8, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [orders, loading]);

  return (
    <div
      ref={boardRef}
      className="min-h-screen bg-[#06070B] text-white flex flex-col justify-between overflow-hidden p-6 md:p-10 selection:bg-amber-500 selection:text-black font-sans"
    >
      {/* Decorative overhead subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.05),transparent_60%)] pointer-events-none" />

      {/* Header Bar: TV style */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div className="flex items-center gap-3.5">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-amber-500 transition-all mr-1"
              title="Back to Previous Page"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/20">
            <Monitor className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display text-white uppercase">
              SMART<span className="text-amber-500">CANTEEN</span> Live Board
            </h1>
            <p className="text-xs text-gray-400 font-medium">Please present your QR code at the pickup counter once Ready.</p>
          </div>
        </div>

        {/* Live status indicators & audio toggle */}
        <div className="flex items-center gap-4">
          {/* Audio toggle */}
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              // Play a test chime if enabling
              if (!audioEnabled) {
                setTimeout(playCanteenChime, 100);
              }
            }}
            className={`h-11 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border ${
              audioEnabled
                ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/15"
                : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {audioEnabled ? "Audio Chime: ON" : "Audio Chime: OFF"}
          </button>

          {/* Time Display */}
          <div className="bg-white/3 border border-white/5 px-4 h-11 rounded-xl flex items-center font-mono text-amber-500 text-sm font-bold shadow-inner">
            <Clock className="h-4 w-4 mr-2" />
            {currentTime}
          </div>
        </div>
      </div>

      {/* Main TV Board Columns */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 py-8">
        {/* Column 1: IN QUEUE */}
        <div className="flex flex-col rounded-3xl bg-white/[0.02] border border-white/5 p-6 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <h2 className="text-lg font-black uppercase tracking-wider font-display text-gray-400 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              In Queue
            </h2>
            <span className="font-mono text-sm font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/10">
              {queueOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none space-y-4">
            {queueOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 py-12">
                <ChefHat className="h-10 w-10 mb-2 opacity-20" />
                <span className="text-xs">No orders in queue</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {queueOrders.map((order) => (
                  <div
                    key={order.id}
                    data-flip-id={order.id}
                    className={`token-chip p-5 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 shadow-md ${
                      currentUserId && order.userId === currentUserId
                        ? "bg-blue-500/15 border-blue-500/50 animate-pulse border-2 shadow-lg shadow-blue-500/10"
                        : "bg-white/3 border border-white/5 hover:border-white/15"
                    }`}
                  >
                    <span className={`font-mono text-4xl font-extrabold tracking-tight ${
                      currentUserId && order.userId === currentUserId ? "text-blue-400" : "text-white"
                    }`}>
                      {order.token || "ORD"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 font-semibold uppercase truncate w-full text-center flex items-center justify-center gap-1.5">
                      {order.userName.split(" ")[0]}
                      {currentUserId && order.userId === currentUserId && (
                        <span className="text-blue-400 font-bold font-mono text-[9px] bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-500/30">You</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: PREPARING */}
        <div className="flex flex-col rounded-3xl bg-white/[0.02] border border-white/5 p-6 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <h2 className="text-lg font-black uppercase tracking-wider font-display text-amber-500 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              Preparing
            </h2>
            <span className="font-mono text-sm font-black bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/10">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none space-y-4">
            {preparingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 py-12">
                <Sparkles className="h-10 w-10 mb-2 opacity-20" />
                <span className="text-xs">No orders in prep</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {preparingOrders.map((order) => (
                  <div
                    key={order.id}
                    data-flip-id={order.id}
                    className={`token-chip p-5 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 shadow-lg shadow-amber-500/5 ${
                      currentUserId && order.userId === currentUserId
                        ? "bg-amber-500/15 border-amber-500 animate-pulse border-2 shadow-lg shadow-amber-500/10"
                        : "bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30"
                    }`}
                  >
                    <span className="font-mono text-4xl font-extrabold text-amber-500 tracking-tight animate-pulse">
                      {order.token || "ORD"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 font-semibold uppercase truncate w-full text-center flex items-center justify-center gap-1.5">
                      {order.userName.split(" ")[0]}
                      {currentUserId && order.userId === currentUserId && (
                        <span className="text-amber-500 font-bold font-mono text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 animate-pulse">You</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: READY FOR PICKUP */}
        <div className="flex flex-col rounded-3xl bg-emerald-950/10 border border-emerald-500/10 p-6 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15 mb-6">
            <h2 className="text-lg font-black uppercase tracking-wider font-display text-emerald-400 flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-400 animate-bounce" />
              Ready for Pickup
            </h2>
            <span className="font-mono text-sm font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/10">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none space-y-4">
            {readyOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-emerald-500/10 py-12">
                <CheckCircle className="h-10 w-10 mb-2 opacity-20" />
                <span className="text-xs">No orders ready</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {readyOrders.map((order) => (
                  <div
                    id={`token-ready-${order.token || order.id}`}
                    key={order.id}
                    data-flip-id={order.id}
                    className={`token-chip p-6 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 shadow-xl hover:scale-105 ${
                      currentUserId && order.userId === currentUserId
                        ? "bg-emerald-500/20 border-emerald-400 animate-pulse border-2 shadow-emerald-500/20"
                        : "bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/5"
                    }`}
                  >
                    <span className="font-mono text-5xl font-black text-emerald-400 tracking-tight">
                      {order.token || "ORD"}
                    </span>
                    <span className="text-xs font-bold text-emerald-300 mt-1.5 uppercase tracking-wide flex items-center gap-1.5 justify-center">
                      <Sparkles className="h-3 w-3 text-amber-400 animate-spin" />
                      {order.userName.split(" ")[0]}
                      {currentUserId && order.userId === currentUserId && (
                        <span className="text-emerald-400 font-bold font-mono text-[9px] bg-emerald-500/20 px-1.5 rounded border border-emerald-500/30">You</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer banner scrolling message ticker */}
      <div className="relative z-10 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Kitchen stream active & connected to Firestore</span>
        </div>
        <div className="font-mono bg-white/2 border border-white/5 px-3 py-1 rounded-lg text-gray-400">
          SYSTEM_STATE: STABLE_DESKTOP_TV_MODE
        </div>
      </div>
    </div>
  );
}
