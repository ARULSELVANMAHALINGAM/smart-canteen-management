import { useState, useEffect } from "react";
import { collection, doc, query, orderBy, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import LandingPage from "./components/LandingPage";
import LoginModal from "./components/LoginModal";
import CartDrawer from "./components/CartDrawer";
import MenuBrowser from "./components/MenuBrowser";
import LiveTracking from "./components/LiveTracking";
import KitchenDashboard from "./components/KitchenDashboard";
import ManagerDashboard from "./components/ManagerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PublicDisplayBoard from "./components/PublicDisplayBoard";
import PaymentPortalModal from "./components/PaymentPortalModal";
import MyTokensCornerWidget from "./components/MyTokensCornerWidget";
import DigitalReceiptModal from "./components/DigitalReceiptModal";
import StudentOrderHistory from "./components/StudentOrderHistory";
import { useAuthStore } from "./store/useAuthStore";
import { useCartStore } from "./store/useCartStore";
import { Order, MenuItem, OrderStatus, UserRole, Category } from "./types";
import { DEFAULT_MENU, DEFAULT_CATEGORIES } from "./lib/defaultMenu";
import { fetchFoodImage } from "./lib/imageFetcher";
import { LogOut, User, ShoppingBag, Utensils, Clock, LayoutDashboard, Menu as MenuIcon, Monitor, Receipt } from "lucide-react";

// Generate a daily resetting unique token, e.g. "A24"
export function generateNextToken(existingOrders: Order[]): string {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const todayOrders = existingOrders.filter(
    (o) => o.createdAt && o.createdAt.startsWith(todayStr) && o.token
  );

  if (todayOrders.length === 0) {
    return "A01";
  }

  // Find maximum numeric token part
  let maxNum = 0;
  let currentLetter = "A";
  for (const order of todayOrders) {
    const token = order.token;
    if (token && token.length >= 3) {
      const letter = token.charAt(0);
      const num = parseInt(token.slice(1));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
        currentLetter = letter;
      }
    }
  }

  const nextNum = maxNum + 1;
  if (nextNum > 99) {
    // Roll over to next letter: A -> B, etc.
    const nextLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    return `${nextLetter}01`;
  }

  return `${currentLetter}${String(nextNum).padStart(2, "0")}`;
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"landing" | "menu" | "dashboard" | "display">("landing");
  const [studentTab, setStudentTab] = useState<"menu" | "history">("menu");

  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setRole = useAuthStore((state) => state.setRole);
  
  const { items: cartItems, pickupTime, clearCart, getTotal } = useCartStore();

  // Synchronize URL path with currentView state for routing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/display") {
        setCurrentView("display");
      } else if (path === "/menu") {
        setCurrentView("menu");
      } else if (path === "/kitchen" || path === "/dashboard") {
        setCurrentView("dashboard");
      } else {
        // Only reset to landing if not logged in, otherwise auto-route
        if (authUser) {
          setCurrentView(authUser.role === "student" ? "menu" : "dashboard");
        } else {
          setCurrentView("landing");
        }
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    handlePopState(); // Initial run to capture deep links
    return () => window.removeEventListener("popstate", handlePopState);
  }, [authUser]);

  // Seed Menu Items
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);

  // Synchronize orders with Firestore in real-time
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("₹");

  // Load global currency setting from Firestore in real-time
  useEffect(() => {
    const unsubConfigs = onSnapshot(doc(db, "configs", "global"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.currency) {
          setCurrency(data.currency);
        }
      } else {
        // Seed Rupee as default global currency
        setDoc(doc(db, "configs", "global"), { currency: "₹" }).catch(err => console.warn(err));
      }
    });
    return () => unsubConfigs();
  }, []);

  useEffect(() => {
    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed initial orders into Firestore for high-quality sandbox experience on first boot
          const seedOrders: Order[] = [
            {
              id: "ORD-9482",
              token: "A01",
              userId: "user_emily",
              userName: "Emily Watson",
              items: [
                { id: "burger-01", name: "Truffle Umami Burger", price: 12.99, quantity: 1, notes: "No onions please" },
                { id: "drink-03", name: "Cold Brew Matcha Latte", price: 5.75, quantity: 1 }
              ],
              totalAmount: 21.82,
              status: "placed",
              pickupTime: "12:30 PM",
              createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
            },
            {
              id: "ORD-8421",
              token: "A02",
              userId: "user_david",
              userName: "David Miller",
              items: [
                { id: "taco-04", name: "Chipotle Cauliflower Tacos", price: 9.99, quantity: 2 }
              ],
              totalAmount: 23.08,
              status: "cooking",
              pickupTime: "12:00 PM",
              createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
            },
            {
              id: "ORD-7291",
              token: "A03",
              userId: "user_sophia",
              userName: "Sophia Li",
              items: [
                { id: "bowl-02", name: "Harvest Quinoa Bowl", price: 10.50, quantity: 1 }
              ],
              totalAmount: 12.84,
              status: "ready",
              pickupTime: "1:15 PM",
              createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
            }
          ];

          for (const order of seedOrders) {
            try {
              await setDoc(doc(db, "orders", order.id), order);
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `orders/${order.id}`);
            }
          }
        } else {
          const fetchedOrders: Order[] = [];
          snapshot.forEach((doc) => {
            fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
          });
          setOrders(fetchedOrders);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "orders");
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto-route users when role is updated
  useEffect(() => {
    if (authUser) {
      if (authUser.role === "student") {
        setCurrentView("menu");
      } else {
        setCurrentView("dashboard");
      }
    } else {
      setCurrentView("landing");
    }
  }, [authUser]);

  // Sync menu list with Firestore in real-time, seeding defaults if empty
  useEffect(() => {
    const menuCol = collection(db, "menuItems");
    const unsubscribe = onSnapshot(menuCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedMenu: MenuItem[] = [];
        const blacklist = ["kunafa", "rajma-chawal", "veg-wrap", "jjygvg", "curd-rice", "rajma chawal", "veg wrap", "curd rice"];
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const id = docSnap.id;
          const name = (data.name || "").toLowerCase();
          const idLower = id.toLowerCase();
          
          const shouldDelete = blacklist.some(term => idLower.includes(term) || name.includes(term));
          if (shouldDelete) {
            // Delete asynchronously from Firestore to keep the DB clean
            deleteDoc(doc(db, "menuItems", id)).catch(err => {
              console.warn(`Failed to auto-clean blacklisted item ${id}:`, err);
            });
          } else {
            loadedMenu.push({ id, ...data } as MenuItem);
          }
        });
        
        // Auto-upgrade check: If our new signature Indian dish is not found, seed the rest
        const hasNewMenu = loadedMenu.some(item => item.id === "paneer-butter-masala-with-roti");
        if (!hasNewMenu) {
          DEFAULT_MENU.forEach(async (item) => {
            let resolvedImageUrl = item.imageUrl;
            try {
              resolvedImageUrl = await fetchFoodImage(item.id, item.name);
            } catch (err) {
              console.warn("Error fetching image for seed:", err);
            }
            await setDoc(doc(db, "menuItems", item.id), {
              ...item,
              imageUrl: resolvedImageUrl
            });
          });
        } else {
          // If we have the Indian main course but are missing desserts/smoothies, seed them
          const hasDesserts = loadedMenu.some(item => item.category === "desserts");
          const hasSmoothies = loadedMenu.some(item => item.category === "smoothies");
          if (!hasDesserts || !hasSmoothies) {
            const extraItems = DEFAULT_MENU.filter(item => item.category === "desserts" || item.category === "smoothies");
            extraItems.forEach(async (item) => {
              let resolvedImageUrl = item.imageUrl;
              try {
                resolvedImageUrl = await fetchFoodImage(item.id, item.name);
              } catch (err) {
                console.warn("Error fetching image for seed:", err);
              }
              await setDoc(doc(db, "menuItems", item.id), {
                ...item,
                imageUrl: resolvedImageUrl
              });
            });
          }

          // Auto-seed Chicken Biriyani if missing
          const hasBiriyani = loadedMenu.some(item => item.id === "chicken-biriyani");
          if (!hasBiriyani) {
            const biriyaniItem = DEFAULT_MENU.find(item => item.id === "chicken-biriyani");
            if (biriyaniItem) {
              setDoc(doc(db, "menuItems", biriyaniItem.id), biriyaniItem).catch(err => {
                console.warn("Failed to auto-seed chicken biriyani:", err);
              });
            }
          }

          // Align existing items with new curated premium photography and updated above-average 3-star hotel pricing
          loadedMenu.forEach(async (item) => {
            const defaultItem = DEFAULT_MENU.find(d => d.id === item.id);
            if (defaultItem) {
              let needsUpdate = false;
              const updateData: Partial<MenuItem> = {};

              // 1. Align image if needed
              if (item.imageUrl !== defaultItem.imageUrl) {
                const shouldAlignImg = 
                  item.imageUrl.includes("unsplash.com") ||
                  defaultItem.imageUrl.startsWith("data:image/") ||
                  defaultItem.imageUrl.includes("encrypted-tbn0.gstatic.com");
                if (shouldAlignImg) {
                  updateData.imageUrl = defaultItem.imageUrl;
                  needsUpdate = true;
                }
              }

              // 2. Align price if current database price is different from our above-average 3-star rate
              if (item.price !== defaultItem.price) {
                updateData.price = defaultItem.price;
                needsUpdate = true;
              }

              if (needsUpdate) {
                try {
                  await setDoc(doc(db, "menuItems", item.id), {
                    ...item,
                    ...updateData
                  });
                } catch (err) {
                  console.warn(`Failed to auto-align item ${item.id}:`, err);
                }
              }
            }
          });
        }

        setMenuItems(loadedMenu);
      } else {
        // Seed default menu items if Firestore collection is empty
        setMenuItems(DEFAULT_MENU);
        DEFAULT_MENU.forEach(async (item) => {
          let resolvedImageUrl = item.imageUrl;
          try {
            resolvedImageUrl = await fetchFoodImage(item.id, item.name);
          } catch (err) {
            console.warn("Error fetching image for seed:", err);
          }
          await setDoc(doc(db, "menuItems", item.id), {
            ...item,
            imageUrl: resolvedImageUrl
          });
        });
      }
    }, (error) => {
      console.warn("Firestore menu items subscription failed, falling back to local defaults:", error);
      setMenuItems(DEFAULT_MENU);
    });
    return () => unsubscribe();
  }, []);

  // Sync categories list with Firestore in real-time, seeding defaults if empty
  useEffect(() => {
    const categoriesCol = collection(db, "categories");
    const unsubscribe = onSnapshot(categoriesCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedCategories: Category[] = [];
        snapshot.forEach((doc) => {
          loadedCategories.push({ id: doc.id, ...doc.data() } as Category);
        });

        // Auto-upgrade check: If our new Indian main course, desserts, or smoothies category is missing, seed new ones
        const hasNewCategory = loadedCategories.some(c => c.id === "main-course");
        const hasDessertsCategory = loadedCategories.some(c => c.id === "desserts");
        const hasSmoothiesCategory = loadedCategories.some(c => c.id === "smoothies");
        if (!hasNewCategory || !hasDessertsCategory || !hasSmoothiesCategory) {
          DEFAULT_CATEGORIES.forEach(async (cat) => {
            await setDoc(doc(db, "categories", cat.id), cat);
          });
        }

        loadedCategories.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tA - tB;
        });
        setCategories(loadedCategories);
      } else {
        setCategories(DEFAULT_CATEGORIES);
        DEFAULT_CATEGORIES.forEach(async (cat) => {
          await setDoc(doc(db, "categories", cat.id), cat);
        });
      }
    }, (error) => {
      console.warn("Firestore categories subscription failed, using local defaults:", error);
      setCategories(DEFAULT_CATEGORIES);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleMenuItemAvailability = async (itemId: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    try {
      await setDoc(doc(db, "menuItems", itemId), {
        ...item,
        available: !item.available
      });
      // Log event to Firestore
      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Manager Action: Toggled availability of "${item.name}" to ${!item.available ? "Available" : "Off Menu"}.`,
          source: "Manager Terminal"
        });
      } catch (logErr) {
        console.warn("Could not write manager log for availability toggle:", logErr);
      }
    } catch (e) {
      console.error("Failed to toggle availability in Firestore:", e);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, available: !item.available } : item))
      );
    }
  };

  const handleUpdatePrice = async (itemId: string, newPrice: number) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    const oldPrice = item.price;
    try {
      await setDoc(doc(db, "menuItems", itemId), {
        ...item,
        price: newPrice
      });
      // Log event to Firestore
      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Manager Action: Updated price of "${item.name}" from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}.`,
          source: "Manager Terminal"
        });
      } catch (logErr) {
        console.warn("Could not write manager log for price update:", logErr);
      }
    } catch (e) {
      console.error("Failed to update price in Firestore:", e);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, price: newPrice } : item))
      );
    }
  };

  const handleUpdateStockLevel = async (itemId: string, newStockLevel: number) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    try {
      await setDoc(doc(db, "menuItems", itemId), {
        ...item,
        stockLevel: newStockLevel
      });
      // Log event to Firestore
      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Kitchen/Manager Action: Updated stock level of "${item.name}" to ${newStockLevel}.`,
          source: "Kitchen Inventory Monitor"
        });
      } catch (logErr) {
        console.warn("Could not write manager log for stock update:", logErr);
      }
    } catch (e) {
      console.error("Failed to update stock level in Firestore:", e);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, stockLevel: newStockLevel } : item))
      );
    }
  };

  const handleAddMenuItem = async (newItem: MenuItem) => {
    try {
      await setDoc(doc(db, "menuItems", newItem.id), newItem);
    } catch (e) {
      console.error("Failed to add menu item:", e);
      handleFirestoreError(e, OperationType.WRITE, `menuItems/${newItem.id}`);
      throw e;
    }
  };

  const handleRemoveMenuItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "menuItems", itemId));
    } catch (e) {
      console.error("Failed to delete menu item:", e);
      handleFirestoreError(e, OperationType.DELETE, `menuItems/${itemId}`);
      throw e;
    }
  };

  const handleAddCategory = async (newCategory: Category) => {
    try {
      await setDoc(doc(db, "categories", newCategory.id), newCategory);
      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Manager Action: Created new category "${newCategory.name}" (${newCategory.id}).`,
          source: "Manager Terminal"
        });
      } catch (logErr) {
        console.warn("Could not write manager log for category addition:", logErr);
      }
    } catch (e) {
      console.error("Failed to add category:", e);
      handleFirestoreError(e, OperationType.WRITE, `categories/${newCategory.id}`);
      throw e;
    }
  };

  const handleUpdateCategory = async (categoryId: string, newName: string) => {
    try {
      await updateDoc(doc(db, "categories", categoryId), {
        name: newName
      });
      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Manager Action: Renamed category ID "${categoryId}" to "${newName}".`,
          source: "Manager Terminal"
        });
      } catch (logErr) {
        console.warn("Could not write manager log for category rename:", logErr);
      }
    } catch (e) {
      console.error("Failed to update category:", e);
      handleFirestoreError(e, OperationType.UPDATE, `categories/${categoryId}`);
      throw e;
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, "categories", categoryId));
      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "warning",
          message: `Manager Action: Deleted category ID "${categoryId}".`,
          source: "Manager Terminal"
        });
      } catch (logErr) {
        console.warn("Could not write manager log for category deletion:", logErr);
      }

      const remainingCats = categories.filter(c => c.id !== categoryId);
      const fallbackCatId = remainingCats.length > 0 ? remainingCats[0].id : "unassigned";

      const itemsToUpdate = menuItems.filter(item => item.category === categoryId);
      for (const item of itemsToUpdate) {
        await setDoc(doc(db, "menuItems", item.id), {
          ...item,
          category: fallbackCatId
        });
      }
    } catch (e) {
      console.error("Failed to delete category:", e);
      handleFirestoreError(e, OperationType.DELETE, `categories/${categoryId}`);
      throw e;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      // Log for the system to detect/fix rules if needed
      try {
        handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
      } catch (err) {
        console.warn("Failed to write order status back to Firestore:", err);
      }
      // Fallback local update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
      );
    }
  };

  // Student checkout flow
  const handleCheckout = async () => {
    if (!authUser) return;

    const subtotal = getTotal();
    const tax = subtotal * 0.08;
    const total = subtotal + tax + 1.50;
    const nextToken = generateNextToken(orders);

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      token: nextToken,
      userId: authUser.uid,
      userName: authUser.name,
      items: [...cartItems],
      totalAmount: total,
      status: "placed",
      pickupTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Verify simulation on custom endpoint
      try {
        await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderDetails: newOrder })
        });
      } catch (err) {
        console.warn("Mock billing service offline; continuing with direct Firestore write.");
      }

      // 2. Write order to Firestore
      await setDoc(doc(db, "orders", newOrder.id), newOrder);

      // Decrement stock levels for each ordered item in Firestore
      for (const orderItem of newOrder.items) {
        const menuItem = menuItems.find((m) => m.id === orderItem.id);
        if (menuItem && typeof menuItem.stockLevel === "number") {
          const newStock = Math.max(0, menuItem.stockLevel - orderItem.quantity);
          try {
            await setDoc(doc(db, "menuItems", menuItem.id), {
              ...menuItem,
              stockLevel: newStock
            });
          } catch (stockErr) {
            console.warn(`Failed to decrement stock for item ${menuItem.id}:`, stockErr);
          }
        }
      }

      setViewingOrderId(newOrder.id);
      clearCart();
      setIsCartOpen(false);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `orders/${newOrder.id}`);
      } catch (err) {
        console.warn("Firestore order checkout failed; falling back to local memory state.", err);
      }
      setOrders((prev) => [newOrder, ...prev]);
      setViewingOrderId(newOrder.id);
      clearCart();
      setIsCartOpen(false);
    }
  };

  // Find currently active tracking order
  const trackingOrder = orders.find((o) => o.id === viewingOrderId);

  // Student orders lists
  const studentOrders = orders.filter((o) => o.userId === authUser?.uid);
  const activeStudentOrders = studentOrders.filter(
    (o) => o.status !== "picked_up" && o.status !== "cancelled"
  );

  return (
    <div className="relative min-h-screen text-gray-100 bg-[#0A0B12]">
      
      {/* 1. Global Navigation Bar for logged-in states */}
      {authUser && (
        <header className="sticky top-0 z-40 w-full glass-panel px-6 py-4 md:px-12 border-b border-white/5">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <img src="/logo.svg" alt="Smart Canteen Logo" className="h-9 w-9 object-contain" />
              <span className="font-display text-lg font-bold tracking-tight text-white">
                SMART<span className="text-amber-500">CANTEEN</span>
              </span>
            </div>

            {/* Student specific navigations */}
            {authUser.role === "student" && (
              <nav className="flex items-center gap-1.5 sm:gap-4 text-xs sm:text-sm font-semibold text-gray-300 shrink-0">
                <button 
                  onClick={() => { setViewingOrderId(null); setStudentTab("menu"); setCurrentView("menu"); }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    currentView === "menu" && studentTab === "menu" 
                      ? "text-amber-500 bg-white/5 border border-white/5 font-extrabold" 
                      : "hover:text-amber-400 border border-transparent"
                  }`}
                >
                  <Utensils className="h-3.5 w-3.5" /> <span>Menu</span>
                </button>
                <button 
                  onClick={() => { setViewingOrderId(null); setStudentTab("history"); setCurrentView("menu"); }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    currentView === "menu" && studentTab === "history" 
                      ? "text-amber-500 bg-white/5 border border-white/5 font-extrabold" 
                      : "hover:text-amber-400 border border-transparent"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> <span>History</span>
                </button>
              </nav>
            )}

            {/* Quick role-switcher simulator in header for ease of navigation */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden lg:flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-xl shrink-0">
                <span className="text-[10px] text-gray-500 px-2 uppercase tracking-wider font-mono">Workspace Role:</span>
                {(["student", "kitchen", "manager"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setViewingOrderId(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      authUser.role === r ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Floating Cart action */}
              {authUser.role === "student" && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2.5 bg-white/5 border border-white/5 hover:border-amber-500/30 rounded-xl transition-all"
                >
                  <ShoppingBag className="h-5 w-5 text-gray-300 hover:text-white" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black font-mono text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-pulse border-2 border-[#0A0B12]">
                      {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  )}
                </button>
              )}

              {/* Live Queue Display Link */}
              <button
                onClick={() => {
                  window.history.pushState({}, "", "/display");
                  setCurrentView("display");
                }}
                className={`flex items-center gap-1.5 p-2.5 border rounded-xl transition-all text-xs font-bold shrink-0 ${
                  currentView === "display"
                    ? "bg-amber-500 text-black border-amber-500 hover:bg-amber-400 font-extrabold shadow-lg shadow-amber-500/10"
                    : "bg-white/5 border-white/5 hover:border-amber-500/30 text-gray-300 hover:text-white"
                }`}
                title="Open Public KFC-style Queue Display Board"
              >
                <Monitor className={`h-4 w-4 ${currentView === "display" ? "text-black" : "text-amber-500"}`} />
                <span className="hidden sm:inline">TV Display</span>
              </button>

              {/* User Sign Out */}
              <button
                onClick={logout}
                className="p-2.5 bg-white/5 border border-white/5 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-xl transition-all shrink-0"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 2. Main Page Render Stage */}
      <main className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <LandingPage
                onExploreMenu={() => setShowLogin(true)}
                onOpenLogin={() => setShowLogin(true)}
                onViewDisplay={() => setCurrentView("display")}
                currency={currency}
              />
            </motion.div>
          )}

          {currentView === "display" && (
            <motion.div
              key="display"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <PublicDisplayBoard 
                currentUserId={authUser?.uid}
                onBack={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView(authUser ? (authUser.role === "student" ? "menu" : "dashboard") : "landing");
                }}
                showBackButton={true}
              />
            </motion.div>
          )}

          {currentView === "menu" && authUser?.role === "student" && (
            <motion.div
              key="student-menu"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
            {studentTab === "history" ? (
              <StudentOrderHistory
                orders={studentOrders}
                onTrackOrder={(orderId) => {
                  setViewingOrderId(orderId);
                  setStudentTab("menu");
                }}
                onShowReceipt={(order) => {
                  setReceiptOrder(order);
                  setIsReceiptOpen(true);
                }}
                currency={currency}
                onBackToMenu={() => setStudentTab("menu")}
                onOpenCart={() => setIsCartOpen(true)}
              />
            ) : trackingOrder ? (
              <LiveTracking
                order={trackingOrder}
                onBack={() => setViewingOrderId(null)}
                onUpdateStatusSimulated={(status) => handleUpdateOrderStatus(trackingOrder.id, status)}
                onShowReceipt={(order) => {
                  setReceiptOrder(order);
                  setIsReceiptOpen(true);
                }}
                currency={currency}
              />
            ) : (
              <div className="space-y-8">
                {/* Active trackers header section for Student */}
                {activeStudentOrders.length > 0 && (
                  <section className="px-6 md:px-12 max-w-7xl mx-auto pt-8">
                    <div className="glass-panel border border-amber-500/20 rounded-3xl p-6 md:p-8 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden shadow-2xl">
                      {/* Background ambient glow */}
                      <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                            <Clock className="h-5 w-5 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="font-display font-extrabold text-white text-lg md:text-xl">Your Current Ordered Tokens</h3>
                            <p className="text-xs text-gray-400">Track preparation progress and get your pickup QR codes instantly.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-white/5 border border-white/5 py-1.5 px-3 rounded-lg w-fit">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live Kitchen Connection
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {activeStudentOrders.map((order) => {
                          const isReady = order.status === "ready";
                          return (
                            <div
                              key={order.id}
                              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 relative ${
                                isReady
                                  ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5"
                                  : "bg-[#10121D] border-white/5 hover:border-amber-500/20"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block">Pickup Token</span>
                                  <span className="text-5xl md:text-6xl font-black font-mono text-amber-500 tracking-tighter">
                                    {order.token}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block">Status</span>
                                  <motion.span
                                    key={order.status}
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 140, damping: 12 }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
                                      isReady
                                        ? "bg-green-500/15 text-green-400 border border-green-500/20 animate-pulse"
                                        : order.status === "cooking"
                                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                        : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                    }`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      isReady ? "bg-green-400" : "bg-blue-400"
                                    } animate-pulse`} />
                                    {order.status.replace("_", " ")}
                                  </motion.span>
                                </div>
                              </div>

                              {/* Progress bar inside each token card */}
                              <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-xs text-gray-400 font-mono">
                                  <span>Kitchen Progress</span>
                                  <span className="text-amber-500 font-bold">
                                    {order.status === "placed" && "Received"}
                                    {order.status === "accepted" && "Accepted"}
                                    {order.status === "cooking" && "Preparing Food"}
                                    {order.status === "packing" && "Packing Meal"}
                                    {order.status === "ready" && "Ready at Counter!"}
                                  </span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: 
                                        order.status === "placed" ? "20%" :
                                        order.status === "accepted" ? "40%" :
                                        order.status === "cooking" ? "60%" :
                                        order.status === "packing" ? "80%" : "100%"
                                    }}
                                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                                  />
                                </div>
                              </div>

                              <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-left w-full sm:w-auto">
                                  <span className="text-[10px] text-gray-500 font-mono block">Order ID: {order.id}</span>
                                  <span className="text-xs text-gray-300 font-medium">Est. Pickup: {order.pickupTime || "Asap"}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => {
                                      setReceiptOrder(order);
                                      setIsReceiptOpen(true);
                                    }}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Receipt className="h-4 w-4 text-amber-500" /> Receipt
                                  </button>

                                  <button
                                    onClick={() => setViewingOrderId(order.id)}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    {isReady ? "Get Pickup QR Code" : "Track Order Details"} &rarr;
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                <MenuBrowser onOpenCart={() => setIsCartOpen(true)} currency={currency} menuItems={menuItems} categories={categories} />
              </div>
            )}
          </motion.div>
        )}

        {currentView === "dashboard" && authUser?.role === "kitchen" && (
          <motion.div
            key="kitchen-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <KitchenDashboard
              orders={orders}
              menuItems={menuItems}
              onUpdateStockLevel={handleUpdateStockLevel}
              onUpdateStatus={handleUpdateOrderStatus}
              onLogout={logout}
              currency={currency}
            />
          </motion.div>
        )}

        {currentView === "dashboard" && authUser?.role === "manager" && (
          <motion.div
            key="manager-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ManagerDashboard
              orders={orders}
              menuItems={menuItems}
              categories={categories}
              onToggleMenuItemAvailability={handleToggleMenuItemAvailability}
              onUpdatePrice={handleUpdatePrice}
              onAddMenuItem={handleAddMenuItem}
              onRemoveMenuItem={handleRemoveMenuItem}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onRemoveCategory={handleRemoveCategory}
              onLogout={logout}
              currency={currency}
            />
          </motion.div>
        )}

        {currentView === "dashboard" && authUser?.role === "admin" && (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <AdminDashboard
              onLogout={logout}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer Layer Overlay */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsPaymentOpen(true);
        }}
        currency={currency}
      />

      {/* Payment Portal Overlay */}
      <PaymentPortalModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handleCheckout}
        totalAmount={getTotal() + (getTotal() * 0.08) + (getTotal() > 0 ? 1.50 : 0)}
        items={cartItems}
        currency={currency}
      />

      {/* Student Live Token Queue Widget (Floating Corner Board) */}
      {(currentView === "menu" || currentView === "display") && authUser?.role === "student" && !viewingOrderId && activeStudentOrders.length > 0 && (
        <MyTokensCornerWidget
          activeOrders={activeStudentOrders}
          onTrackOrder={(orderId) => {
            setCurrentView("menu");
            setViewingOrderId(orderId);
          }}
        />
      )}

      {/* Digital Receipt Modal Overlay */}
      <DigitalReceiptModal
        order={receiptOrder}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setReceiptOrder(null);
        }}
        currency={currency}
      />

      {/* Auth Gate Sign-in Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}

      {/* Global Footer with Developer Credits */}
      <footer className="w-full py-8 px-6 md:px-12 border-t border-white/5 bg-[#07080E]/60 text-center text-xs text-gray-500 font-mono mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Smart Canteen. All rights reserved.</p>
          <p>Developed with ❤️ by <span className="text-amber-500 font-semibold">arulselvanmahalingam</span></p>
        </div>
      </footer>
    </div>
  );
}
