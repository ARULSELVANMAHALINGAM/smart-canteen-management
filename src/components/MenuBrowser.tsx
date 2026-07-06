import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Star, Utensils, Heart, Plus, Minus, Tag, ShieldAlert, Clock } from "lucide-react";
import { MenuItem, Category } from "../types";
import { useCartStore } from "../store/useCartStore";

interface MenuBrowserProps {
  onOpenCart: () => void;
  currency?: string;
  menuItems?: MenuItem[];
  categories?: Category[];
}

export default function MenuBrowser({ onOpenCart, currency = "$", menuItems: propMenuItems, categories: propCategories }: MenuBrowserProps) {
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  
  const { items: cartItems, addItem, updateQuantity } = useCartStore();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleAddToPlate = (e: React.MouseEvent<HTMLButtonElement>, item: MenuItem) => {
    addItem(item);
    const id = Date.now() + Math.random();
    setParticles((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 800);
  };

  const menuItems = propMenuItems || localMenuItems;

  // Fetch seed data from Express REST API if props aren't provided
  useEffect(() => {
    if (propMenuItems && propMenuItems.length > 0) {
      setLoading(false);
      return;
    }
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setLocalMenuItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading menu:", err);
        setLoading(false);
      });
  }, [propMenuItems]);

  const defaultCategories = ["all", "main-course", "south-indian", "burgers-wraps", "snacks", "mocktails-beverages", "desserts", "smoothies"];
  const categoriesList = propCategories && propCategories.length > 0
    ? ["all", ...propCategories.map(c => c.id)]
    : defaultCategories;

  const getCategoryName = (catId: string) => {
    if (catId === "all") return "All Culinary";
    if (propCategories) {
      const found = propCategories.find(c => c.id === catId);
      if (found) return found.name;
    }
    if (catId === "main-course") return "Main Course";
    if (catId === "south-indian") return "South Indian";
    if (catId === "burgers-wraps") return "Burgers & Wraps";
    if (catId === "snacks") return "Snacks";
    if (catId === "mocktails-beverages") return "Mocktails & Beverages";
    return catId.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    let matchesDiet = true;
    if (dietFilter === "veg") {
      matchesDiet = item.veg === true;
    } else if (dietFilter === "non-veg") {
      matchesDiet = item.veg === false;
    }

    return matchesSearch && matchesCategory && matchesDiet;
  });

  const toggleLike = (id: string) => {
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="py-12 px-6 md:px-12 max-w-7xl mx-auto space-y-10">
      {/* Search and Filters Header bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold text-white mb-2 font-display flex items-center gap-2.5">
            <Utensils className="h-7 w-7 text-amber-500" />
            Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Daily Kitchen</span>
          </h2>
          <p className="text-gray-400 text-xs md:text-sm">Select from freshly sourced, chef-inspired meals prepared on campus.</p>
        </div>

        {/* Diet Toggles & Search Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Diet filter button group */}
          <div className="flex bg-[#080910] border border-white/5 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setDietFilter("all")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                dietFilter === "all"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All Diet
            </button>
            <button
              onClick={() => setDietFilter("veg")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                dietFilter === "veg"
                  ? "bg-green-500/15 border border-green-500/20 text-green-400"
                  : "text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Veg
            </button>
            <button
              onClick={() => setDietFilter("non-veg")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                dietFilter === "non-veg"
                  ? "bg-amber-500/15 border border-amber-500/20 text-amber-400"
                  : "text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Non-Veg
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search chef creations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/30 focus:bg-white/10 transition-all font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        {categoriesList.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold capitalize transition-all border whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? "bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-black shadow-lg shadow-amber-500/15"
                : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
            }`}
          >
            {getCategoryName(cat)}
          </motion.button>
        ))}
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl bg-white/3 border border-white/5 h-[390px] p-4 space-y-4 animate-pulse">
              <div className="h-44 bg-white/5 rounded-2xl w-full" />
              <div className="h-5 bg-white/5 rounded w-2/3" />
              <div className="h-10 bg-white/5 rounded w-full" />
              <div className="h-10 bg-white/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-20 bg-white/3 border border-white/5 rounded-3xl p-8 max-w-md mx-auto space-y-4"
        >
          <Search className="h-12 w-12 text-gray-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-white">No culinary items found</h3>
            <p className="text-xs text-gray-400">Try refining your keyword query or switching to another food category.</p>
          </div>
        </motion.div>
      ) : (
        /* Real food grid list */
        <motion.div 
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const isOutOfStock = item.stockLevel === 0;
              const cartItem = cartItems.find((i) => i.id === item.id);
              const isMaxStockReached = cartItem ? cartItem.quantity >= (item.stockLevel ?? 999) : false;

              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group rounded-3xl bg-white/3 border border-white/5 hover:border-amber-500/20 flex flex-col justify-between overflow-hidden transition-colors"
                >
                  {/* Photo Section & Tags */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 select-none"
                    />
                    
                    {/* Dark gradient mask for text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />

                    {/* Tags */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                      {item.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-black uppercase tracking-wider bg-black/60 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/10 shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Like Button */}
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleLike(item.id)}
                      className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          likedItems[item.id] ? "fill-red-500 text-red-500" : "text-gray-300"
                        }`}
                      />
                    </motion.button>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        {/* Veg/Non-veg indicator & Category Name */}
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 border-2 flex items-center justify-center p-[2px] rounded shrink-0 ${item.veg !== false ? "border-green-600 bg-green-950/20" : "border-amber-800 bg-amber-950/20"}`} title={item.veg !== false ? "Vegetarian" : "Non-Vegetarian"}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.veg !== false ? "bg-green-500" : "bg-amber-700"}`} />
                          </div>
                          <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest font-mono">
                            {getCategoryName(item.category)}
                          </span>
                        </div>

                        {/* Stock status badge */}
                        <div>
                          {isOutOfStock ? (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">
                              Sold Out
                            </span>
                          ) : typeof item.stockLevel === "number" && item.stockLevel <= 5 ? (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-md border border-orange-500/20">
                              Only {item.stockLevel} Left
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 px-2 py-0.5 rounded-md border border-green-500/20">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-display font-black text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {item.name}
                      </h3>

                      {/* Rating & Prep time row */}
                      <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-gray-400 pb-1 pt-0.5">
                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/10">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {item.rating || "4.5"}
                        </span>
                        <span className="flex items-center gap-1 bg-white/3 px-2 py-0.5 rounded-md border border-white/5">
                          <Clock className="h-3 w-3 text-gray-400" /> {item.prepTime || "10"} mins
                        </span>
                      </div>

                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                      <span className="font-mono text-lg font-black text-white">{currency}{item.price.toFixed(0)}</span>
                      
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="h-9 px-4 rounded-xl bg-white/5 border border-white/10 font-bold text-gray-500 text-xs cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      ) : cartItem ? (
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 h-9">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
                            title="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </motion.button>
                          <span className="font-mono text-xs font-black text-amber-500 w-5 text-center">
                            {cartItem.quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => !isMaxStockReached && updateQuantity(item.id, 1)}
                            disabled={isMaxStockReached}
                            className={`p-1 rounded-lg ${
                              isMaxStockReached
                                ? "text-gray-600 cursor-not-allowed"
                                : "text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                            }`}
                            title={isMaxStockReached ? "Max stock reached" : "Increase"}
                          >
                            <Plus className="h-3 w-3" />
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleAddToPlate(e, item)}
                          className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 font-extrabold text-black text-xs shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Add to Plate
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Flying Plate Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x - 16, y: p.y - 16, scale: 1, opacity: 1, rotate: 0 }}
            animate={{
              x: window.innerWidth - 80,
              y: 28,
              scale: 0.1,
              opacity: 0,
              rotate: 360,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-50 h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white pointer-events-none shadow-lg shadow-amber-500/35"
          >
            <Plus className="h-4 w-4 text-black stroke-[3.5px]" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
