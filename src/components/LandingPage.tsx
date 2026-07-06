import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Utensils, ArrowRight, ShieldCheck, Clock, Award, Star, ShoppingBag, LogIn, ChevronRight, Play, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

interface LandingPageProps {
  onExploreMenu: () => void;
  onOpenLogin: () => void;
  onViewDisplay?: () => void;
  currency?: string;
}

export default function LandingPage({ onExploreMenu, onOpenLogin, onViewDisplay, currency = "$" }: LandingPageProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const authUser = useAuthStore((state) => state.user);

  // Parallax mouse tracking for the visual stage on desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      const x = (e.clientX - window.innerWidth / 2) / 40;
      const y = (e.clientY - window.innerHeight / 2) / 40;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const featuredFoods = [
    {
      name: "Crispy Katsu Curry",
      price: 11.50,
      rating: "4.9",
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300"
    },
    {
      name: "Truffle Smash Burger",
      price: 12.99,
      rating: "5.0",
      img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300"
    },
    {
      name: "Avocado Garden Bowl",
      price: 10.50,
      rating: "4.8",
      img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080E] text-gray-100 selection:bg-amber-500 selection:text-black">
      {/* Premium Ambient Backlighting */}
      <div className="absolute top-[-20%] left-[-10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-amber-500/10 to-orange-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] h-[800px] w-[800px] rounded-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-[160px] pointer-events-none" />
      
      {/* Floating Interactive Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 1200 - 200,
              y: Math.random() * 800 + 100,
              scale: Math.random() * 0.6 + 0.4,
              opacity: Math.random() * 0.15 + 0.05,
            }}
            animate={{
              y: ["-40px", "40px", "-40px"],
              x: ["-20px", "20px", "-20px"],
            }}
            transition={{
              duration: 8 + i * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-24 h-24 rounded-full bg-amber-500/20 blur-xl"
          />
        ))}
      </div>
      
      {/* Decorative grid pattern background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,#000_75%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[900px] bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[900px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.04),transparent_50%)] pointer-events-none" />

      {/* Header Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full glass-panel px-6 py-4 md:px-12 border-b border-white/5"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <motion.img 
              whileHover={{ scale: 1.1, rotate: 5 }}
              src="/logo.svg" 
              alt="Smart Canteen Logo" 
              className="h-10 w-10 object-contain" 
            />
            <span className="font-display text-xl font-bold tracking-tight text-white">
              SMART<span className="text-amber-500">CANTEEN</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium text-gray-400 shrink-0">
            <button onClick={onExploreMenu} className="hover:text-amber-500 transition-all cursor-pointer">Browse Menu</button>
            <a href="#how-it-works" className="hover:text-amber-500 transition-all">How it Works</a>
            <a href="#benefits" className="hover:text-amber-500 transition-all">Benefits</a>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            {authUser ? (
              <motion.button 
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onExploreMenu} 
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/15 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                Go to Dashboard
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenLogin}
                className="flex items-center gap-2 rounded-xl border border-white/10 hover:border-amber-500/30 px-5 py-2.5 font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4 text-amber-500" />
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Hero Section */}
      <section className="relative mx-auto flex max-w-7xl flex-col lg:flex-row items-center justify-between px-6 pt-16 pb-36 md:px-12 gap-16">
        
        {/* Left Copy Column */}
        <div className="flex-1 text-left z-10 space-y-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-amber-400 border border-amber-500/15"
          >
            <Award className="h-3.5 w-3.5" /> Next-gen Campus Dining
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.08] font-display">
              <span className="block overflow-hidden">
                <motion.span 
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="block"
                >
                  Skip Canteen Lines.
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span 
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"
                >
                  Pre-Order Instantly.
                </motion.span>
              </span>
            </h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-400 text-lg md:text-xl max-w-xl leading-relaxed font-normal"
            >
              Order gourmet meals from your phone and enjoy fresh, hot food with absolute zero wait. Powered by real-time queue management technology.
            </motion.p>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4 pt-2"
          >
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExploreMenu}
              className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-extrabold text-black hover:brightness-110 shadow-xl shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Order Now <ArrowRight className="h-5 w-5" />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.03, bg: "rgba(255,255,255,0.06)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenLogin}
              className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/3 px-6 font-semibold text-white hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
            >
              Explore Staff Terminals
            </motion.button>

            {onViewDisplay && (
              <motion.button 
                whileHover={{ scale: 1.03, border: "rgba(245, 158, 11, 0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={onViewDisplay}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 px-6 font-semibold text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer whitespace-nowrap"
                title="View the public KFC-style overhead display board"
              >
                <Play className="h-4 w-4 text-amber-500 fill-amber-500" />
                Live TV Queue Board
              </motion.button>
            )}
          </motion.div>

          {/* Quick Info Stats Row */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 pt-8 border-t border-white/5"
          >
            <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-display">10 Min</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Avg. Time Saved</div>
              </div>
            </div>
            <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-display">99.8%</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">On-Time Hand-off</div>
              </div>
            </div>
            <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400/10" />
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-display">4.9/5</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Student Rating</div>
              </div>
            </div>
            <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-display">15k+</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Served Daily</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Visual Stage Column */}
        <div className="flex-1 relative flex items-center justify-center w-full min-h-[460px] z-10 lg:pr-12 xl:pr-16">
          
          {/* Main Plate back glow (warm glowing radial mesh behind the bowl) */}
          <div className="absolute h-[380px] w-[380px] sm:h-[480px] sm:w-[480px] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18)_0%,transparent_70%)] blur-[50px] pointer-events-none" />
          <div className="absolute h-[250px] w-[250px] sm:h-[320px] sm:w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12)_0%,transparent_70%)] blur-[40px] pointer-events-none mix-blend-screen" />

          {/* Core Plate Visual */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.3 }}
            style={{
              x: mousePos.x,
              y: mousePos.y,
            }}
            className="relative w-72 h-72 sm:w-96 sm:h-96 shrink-0"
          >
            {/* The Plate Circle itself */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-1 shadow-2xl relative">
              {/* Steam Particles */}
              <div className="absolute top-[8%] left-[45%] z-20 flex gap-2">
                <div className="steam-particle w-1.5 h-6 bg-gradient-to-t from-white/30 to-transparent rounded-full blur-[2px]" style={{ animationDelay: "0s" }} />
                <div className="steam-particle w-2 h-8 bg-gradient-to-t from-white/20 to-transparent rounded-full blur-[3px]" style={{ animationDelay: "1.2s" }} />
                <div className="steam-particle w-1.5 h-5 bg-gradient-to-t from-white/25 to-transparent rounded-full blur-[2px]" style={{ animationDelay: "0.6s" }} />
              </div>

              {/* Core Plate Image with premium frame */}
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/5 bg-[#0F111E]">
                <motion.img 
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600" 
                  alt="Signature Katsu Meal Plate" 
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 25,
                    ease: "linear"
                  }}
                  className="w-full h-full object-cover select-none scale-105 pointer-events-none"
                />
              </div>
            </div>

            {/* Floating Card 1: Matcha Craft Soda (Top-Right - Beautifully ringing around the outer safe zone) */}
            <motion.div 
              animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
              transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
              whileHover={{ scale: 1.05 }}
              className="absolute top-[2%] -right-[15%] sm:-right-[22%] lg:-right-[25%] xl:-right-[28%] z-20 w-44 p-2.5 rounded-2xl glass-panel shadow-2xl hidden md:flex items-center gap-3 border border-white/5"
            >
              <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 bg-emerald-500/10 flex items-center justify-center">
                <img src="https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=200" alt="Craft Soda" className="w-full h-full object-cover select-none" />
              </div>
              <div className="text-left overflow-hidden">
                <h4 className="text-[11px] font-black text-white truncate">Matcha Soda</h4>
                <p className="text-amber-500 text-[10px] font-bold mt-0.5">{currency}4.50</p>
                <div className="flex items-center gap-1 mt-0.5 text-[9px] text-gray-400">
                  <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" /> 4.9
                </div>
              </div>
            </motion.div>

            {/* Floating Card 2: Golden Fries (Mid-Left - Positioned perfectly outside the left edge safe zone) */}
            <motion.div 
              animate={{ y: [0, 8, 0], rotate: [-2, 1, -2] }}
              transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              className="absolute top-[38%] -left-[14%] sm:-left-[20%] lg:-left-[24%] xl:-left-[26%] z-20 w-44 p-2.5 rounded-2xl glass-panel shadow-2xl hidden md:flex items-center gap-3 border border-white/5"
            >
              <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 bg-amber-500/10 flex items-center justify-center">
                <img src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=200" alt="Waffle Fries" className="w-full h-full object-cover select-none" />
              </div>
              <div className="text-left overflow-hidden">
                <h4 className="text-[11px] font-black text-white truncate">Golden Fries</h4>
                <p className="text-amber-500 text-[10px] font-bold mt-0.5">{currency}3.99</p>
                <div className="flex items-center gap-1 mt-0.5 text-[9px] text-gray-400">
                  <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" /> 4.8
                </div>
              </div>
            </motion.div>

            {/* Floating Card 3: Queue Token Preview (Bottom-Right - Ringing around bottom-right outside the safe zone) */}
            <motion.div 
              animate={{ y: [0, -5, 0], x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 5.6, ease: "easeInOut", delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              className="absolute bottom-[2%] -right-[12%] sm:-right-[18%] lg:-right-[22%] xl:-right-[24%] z-20 w-52 p-3.5 rounded-2xl glass-panel shadow-2xl border border-white/10 hidden md:block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-widest">Token Preview</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-black text-white">Order #A24</h5>
                  <p className="text-[9px] text-gray-400 mt-0.5">Counter 2 • Ready</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 text-[8px] font-extrabold text-emerald-400 tracking-wider uppercase font-mono">
                  Ready
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity pointer-events-none hidden lg:flex">
          <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Scroll to Explore</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="flex h-7 w-4.5 justify-center rounded-full border border-gray-600 p-1"
          >
            <div className="h-1.5 w-0.5 rounded-full bg-amber-500" />
          </motion.div>
        </div>
      </section>

      {/* Feature Value Grid */}
      <section id="how-it-works" className="relative max-w-7xl mx-auto px-6 py-24 border-t border-white/5 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">Dine Smarter, Not Harder</h2>
          <p className="text-gray-400 text-sm md:text-base">Our integrated queue network eliminates campus dining friction with extreme precision.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ y: -8, border: "rgba(245,158,11,0.25)" }}
            className="p-8 rounded-3xl glass-panel hover:bg-white/5 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Instant Pre-Ordering</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Place your order from any campus device. Our kitchen receives it instantly so it is fresh and piping hot right upon arrival.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-amber-500 font-bold text-xs gap-1 group cursor-pointer" onClick={onExploreMenu}>
              Explore menu <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8, border: "rgba(59,130,246,0.25)" }}
            className="p-8 rounded-3xl glass-panel hover:bg-white/5 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <ShoppingBag className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Seamless Live Tracking</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Monitor your order's lifecycle in real-time from Placement to Ready with responsive, multi-step visual milestone timelines.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-blue-400 font-bold text-xs gap-1 group cursor-pointer" onClick={onExploreMenu}>
              Explore tracking <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8, border: "rgba(16,185,129,0.25)" }}
            className="p-8 rounded-3xl glass-panel hover:bg-white/5 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Instant QR Pickup</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Grab and go. Show your unique active QR code at the pick-up counter for safe, contactless kitchen clearance.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-emerald-400 font-bold text-xs gap-1 group cursor-pointer" onClick={onExploreMenu}>
              Explore checkouts <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
