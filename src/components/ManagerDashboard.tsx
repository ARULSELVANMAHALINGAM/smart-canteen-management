import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  PenTool, 
  Sparkles, 
  Plus, 
  AlertCircle, 
  Users, 
  ChefHat, 
  Trash2, 
  X,
  ClipboardList,
  Search
} from "lucide-react";
import { MenuItem, Order, Category } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface ManagerDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  categories?: Category[];
  onToggleMenuItemAvailability: (itemId: string) => void;
  onUpdatePrice: (itemId: string, newPrice: number) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
  onRemoveMenuItem: (itemId: string) => void;
  onAddCategory?: (newCategory: Category) => void;
  onUpdateCategory?: (categoryId: string, newName: string) => void;
  onRemoveCategory?: (categoryId: string) => void;
  onLogout: () => void;
  currency?: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "manager" | "kitchen";
  createdAt: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
  source?: string;
}

const parseFirestoreTimestamp = (timestampVal: any): string => {
  if (!timestampVal) return new Date().toISOString();
  if (typeof timestampVal === "string") {
    const d = new Date(timestampVal);
    if (!isNaN(d.getTime())) return timestampVal;
    return new Date().toISOString();
  }
  if (timestampVal && typeof timestampVal.toDate === "function") {
    return timestampVal.toDate().toISOString();
  }
  if (timestampVal && timestampVal.seconds) {
    return new Date(timestampVal.seconds * 1000).toISOString();
  }
  if (timestampVal instanceof Date) {
    return timestampVal.toISOString();
  }
  try {
    const d = new Date(timestampVal);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {}
  return new Date().toISOString();
};

const formatLogTimestamp = (timestampStr: string): string => {
  try {
    const d = new Date(timestampStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString([], { dateStyle: "short", timeStyle: "medium" });
    }
  } catch (e) {}
  return new Date().toLocaleString([], { dateStyle: "short", timeStyle: "medium" });
};

export default function ManagerDashboard({
  orders,
  menuItems,
  categories,
  onToggleMenuItemAvailability,
  onUpdatePrice,
  onAddMenuItem,
  onRemoveMenuItem,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
  onLogout,
  currency = "$"
}: ManagerDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "menu" | "categories" | "staff" | "manager_logs">("analytics");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");

  // Category modification and creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Real-time Staff Members from Firestore
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"manager" | "kitchen">("manager");

  // Real-time Manager Logs from Firestore
  const [managerLogs, setManagerLogs] = useState<SystemLog[]>([]);
  const [managerLogSearch, setManagerLogSearch] = useState("");

  // Feedback states for staff action
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  // Add Food form states
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodDescription, setNewFoodDescription] = useState("");
  const [newFoodPrice, setNewFoodPrice] = useState("");
  const [newFoodCategory, setNewFoodCategory] = useState("main-course");
  const [newFoodImageUrl, setNewFoodImageUrl] = useState("");
  const [newFoodTags, setNewFoodTags] = useState("");
  const [newFoodVeg, setNewFoodVeg] = useState("veg");
  const [submittingFood, setSubmittingFood] = useState(false);
  const [foodError, setFoodError] = useState<string | null>(null);
  const [foodSuccess, setFoodSuccess] = useState<string | null>(null);

  // Sync default category once categories load
  useEffect(() => {
    if (categories && categories.length > 0 && !categories.some(c => c.id === newFoodCategory)) {
      setNewFoodCategory(categories[0].id);
    }
  }, [categories]);

  // Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "staff" | "food" | "category";
    id: string;
    name: string;
    extra?: string;
  } | null>(null);

  const getCategoryName = (catId: string) => {
    if (categories) {
      const found = categories.find(c => c.id === catId);
      if (found) return found.name;
    }
    return catId;
  };

  // Default seed staff fallback
  const defaultStaff: StaffMember[] = [
    { id: "s1", name: "Sarah Jenkins", email: "manager@smartcanteen.com", role: "manager", createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
    { id: "s2", name: "Chef Martinez", email: "kitchen@smartcanteen.com", role: "kitchen", createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() }
  ];

  // Subscribe to Staff List in Firestore
  useEffect(() => {
    const staffCol = collection(db, "staff_members");
    const unsubStaff = onSnapshot(staffCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedStaff: StaffMember[] = [];
        snapshot.forEach((docSnap) => {
          loadedStaff.push({ id: docSnap.id, ...docSnap.data() } as StaffMember);
        });
        setStaffList(loadedStaff);
      } else {
        setStaffList(defaultStaff);
        defaultStaff.forEach(async (member) => {
          await setDoc(doc(db, "staff_members", member.id), {
            name: member.name,
            email: member.email,
            role: member.role,
            createdAt: member.createdAt
          });
        });
      }
    }, (error) => {
      console.warn("Firestore staff subscription failed, utilizing fallback.", error);
      setStaffList(defaultStaff);
    });

    // Manager Logs Listener
    const mLogsCol = collection(db, "manager_logs");
    const unsubMLogs = onSnapshot(mLogsCol, (snapshot) => {
      try {
        if (!snapshot.empty) {
          const loadedMLogs: SystemLog[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedMLogs.push({
              id: docSnap.id,
              timestamp: parseFirestoreTimestamp(data.timestamp),
              level: data.level || "info",
              message: data.message || "",
              source: data.source || "Manager"
            });
          });
          loadedMLogs.sort((a, b) => {
            const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tB - tA;
          });
          setManagerLogs(loadedMLogs);
        } else {
          setManagerLogs([]);
        }
      } catch (err) {
        console.error("Error processing manager logs snapshot:", err);
      }
    }, (error) => {
      console.warn("Firestore logs subscription failed, utilizing empty state", error);
      setManagerLogs([]);
    });

    return () => {
      unsubStaff();
      unsubMLogs();
    };
  }, []);

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    setSubmittingStaff(true);
    setStaffError(null);
    setStaffSuccess(null);

    const tempId = `staff_${Date.now()}`;
    const newStaff: StaffMember = {
      id: tempId,
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      createdAt: new Date().toISOString()
    };

    setStaffList((prev) => {
      if (prev.some((m) => m.email.toLowerCase() === newStaffEmail.toLowerCase())) {
        return prev;
      }
      return [...prev, newStaff];
    });

    try {
      await setDoc(doc(db, "staff_members", tempId), {
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        createdAt: newStaff.createdAt
      });

      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Manager Action: Authorized new ${newStaffRole} account for "${newStaffName}".`,
          source: "Manager Terminal"
        });
      } catch (err) {
        console.warn("Could not write system log:", err);
      }

      setStaffSuccess(`Successfully authorized ${newStaffName}!`);
      setNewStaffName("");
      setNewStaffEmail("");
      
      setTimeout(() => {
        setIsAddingStaff(false);
        setStaffSuccess(null);
      }, 1500);

    } catch (err) {
      console.error("Failed to add staff to Firestore:", err);
      setStaffError("Cloud sync failed. Staff profile added locally.");
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleRemoveStaffClick = (id: string, name: string, role: string) => {
    setDeleteConfirm({
      type: "staff",
      id,
      name,
      extra: role
    });
  };

  const handleConfirmExecute = async () => {
    if (!deleteConfirm) return;

    const { type, id, name, extra } = deleteConfirm;
    setDeleteConfirm(null);

    setFoodError(null);
    setFoodSuccess(null);
    setCategoryError(null);
    setCategorySuccess(null);

    if (type === "staff") {
      setStaffList((prev) => prev.filter((member) => member.id !== id));

      try {
        await deleteDoc(doc(db, "staff_members", id));
        try {
          await addDoc(collection(db, "manager_logs"), {
            timestamp: new Date().toISOString(),
            level: "warning",
            message: `Manager Action: Access revoked for ${extra || "staff"} profile "${name}".`,
            source: "Manager Terminal"
          });
        } catch (err) {
          console.warn("Could not write system log:", err);
        }
      } catch (err: any) {
        console.error("Failed to remove staff from Firestore:", err);
        setStaffError(err?.message || "Failed to revoke staff system access.");
      }
    } else if (type === "food") {
      try {
        if (onRemoveMenuItem) {
          await onRemoveMenuItem(id);
        }
        setFoodSuccess(`Successfully deleted "${name}" from the menu.`);
        setTimeout(() => setFoodSuccess(null), 3000);

        try {
          await addDoc(collection(db, "manager_logs"), {
            timestamp: new Date().toISOString(),
            level: "warning",
            message: `Manager Action: Removed dish "${name}" from active menu.`,
            source: "Manager Terminal"
          });
        } catch (err) {
          console.warn("Could not write system log:", err);
        }
      } catch (err: any) {
        console.error("Failed to remove menu item:", err);
        let niceMsg = "Failed to delete dish. Permission denied.";
        if (err?.message) {
          try {
            const parsed = JSON.parse(err.message);
            niceMsg = parsed.error || err.message;
          } catch {
            niceMsg = err.message;
          }
        }
        setFoodError(niceMsg);
        setTimeout(() => setFoodError(null), 5000);
      }
    } else if (type === "category") {
      try {
        if (onRemoveCategory) {
          await onRemoveCategory(id);
        }
        setCategorySuccess(`Successfully deleted category "${name}".`);
        setTimeout(() => setCategorySuccess(null), 3000);
      } catch (err: any) {
        console.error("Failed to delete category:", err);
        let niceMsg = "Failed to delete category. Permission denied.";
        if (err?.message) {
          try {
            const parsed = JSON.parse(err.message);
            niceMsg = parsed.error || err.message;
          } catch {
            niceMsg = err.message;
          }
        }
        setCategoryError(niceMsg);
        setTimeout(() => setCategoryError(null), 5000);
      }
    }
  };

  const handleAddFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName || !newFoodPrice || submittingFood) return;

    const parsedPrice = parseFloat(newFoodPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFoodError("Please enter a valid price.");
      return;
    }

    setSubmittingFood(true);
    setFoodError(null);
    setFoodSuccess(null);

    const tagsArray = newFoodTags
      ? newFoodTags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const defaultImg = newFoodCategory === "drinks"
      ? "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400"
      : newFoodCategory === "burgers"
      ? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400"
      : newFoodCategory === "bowls"
      ? "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400"
      : "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400";

    const newItemId = `${newFoodCategory}-${Date.now()}`;

    const newItem: MenuItem = {
      id: newItemId,
      name: newFoodName,
      description: newFoodDescription,
      price: parsedPrice,
      category: newFoodCategory,
      imageUrl: newFoodImageUrl || defaultImg,
      available: true,
      tags: tagsArray,
      veg: newFoodVeg === "veg"
    };

    try {
      if (onAddMenuItem) {
        await onAddMenuItem(newItem);
      }

      setFoodSuccess(`Successfully added "${newFoodName}" to the menu!`);
      setNewFoodName("");
      setNewFoodDescription("");
      setNewFoodPrice("");
      setNewFoodImageUrl("");
      setNewFoodTags("");
      setNewFoodVeg("veg");

      try {
        await addDoc(collection(db, "manager_logs"), {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Manager Action: Added new dish "${newFoodName}" (${newFoodCategory}) for ${currency}${parsedPrice.toFixed(2)}.`,
          source: "Manager Terminal"
        });
      } catch (err) {
        console.warn("Could not write system log:", err);
      }

      setTimeout(() => {
        setIsAddingFood(false);
        setFoodSuccess(null);
      }, 1800);
    } catch (err: any) {
      console.error("Failed to add menu item:", err);
      let niceMsg = "Failed to add dish. Permission denied.";
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          niceMsg = parsed.error || err.message;
        } catch {
          niceMsg = err.message;
        }
      }
      setFoodError(niceMsg);
    } finally {
      setSubmittingFood(false);
    }
  };

  const handleRemoveFoodClick = (itemId: string, name: string) => {
    setDeleteConfirm({
      type: "food",
      id: itemId,
      name
    });
  };

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const completedCount = orders.filter((o) => o.status === "picked_up").length;
  const activeCount = orders.filter((o) => o.status !== "picked_up" && o.status !== "cancelled").length;
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  const analyticsData = [
    { hour: "08:00 AM", revenue: 120, orders: 12 },
    { hour: "10:00 AM", revenue: 240, orders: 18 },
    { hour: "12:00 PM", revenue: 850, orders: 62 },
    { hour: "01:00 PM", revenue: 1100, orders: 84 },
    { hour: "02:00 PM", revenue: 450, orders: 32 },
    { hour: "04:00 PM", revenue: 150, orders: 11 },
    { hour: "06:00 PM", revenue: 640, orders: 48 }
  ];

  const bestSellers = [
    { name: "Truffle Umami Burger", sales: 142, revenue: 1844.58, color: "#F59E0B" },
    { name: "Crispy Katsu Curry", sales: 115, revenue: 1322.50, color: "#3B82F6" },
    { name: "Harvest Quinoa Bowl", sales: 98, revenue: 1029.00, color: "#10B981" },
    { name: "Cold Brew Matcha", sales: 76, revenue: 437.00, color: "#EC4899" }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".manager-stat-card", {
        scale: 0.95,
        opacity: 0,
        stagger: 0.08,
        duration: 0.5,
        ease: "power3.out"
      });

      gsap.from(".manager-chart-box", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out"
      });

      gsap.from(".manager-row-animate", {
        opacity: 0,
        x: -10,
        stagger: 0.03,
        duration: 0.4,
        ease: "power2.out"
      });
    }, containerRef);

    return () => ctx.revert();
  }, [activeTab]);

  const handlePriceSave = (itemId: string) => {
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdatePrice(itemId, parsed);
    }
    setEditingPriceId(null);
  };

  return (
    <div ref={containerRef} className="py-12 px-6 md:px-12 max-w-7xl mx-auto space-y-10 selection:bg-amber-500 selection:text-black">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white font-display flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-amber-500" />
            Executive <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Operations HUD</span>
          </h2>
          <p className="text-gray-400 text-sm">Full administrative clearance over pricing indexes, roster allocations, and financial performance streams.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white/3 border border-white/5 rounded-2xl p-1">
            {["analytics", "menu", "categories", "staff", "manager_logs"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab ? "bg-amber-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="p-2.5 bg-white/3 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/10 rounded-xl transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {activeTab === "analytics" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="manager-stat-card p-6 rounded-3xl bg-white/3 border border-white/5 flex flex-col justify-between h-36">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-500" /> TOTAL SALES
              </span>
              <div className="mt-2 space-y-1">
                <span className="text-3xl font-black text-white font-mono">{currency}{totalRevenue.toFixed(2)}</span>
                <p className="text-[10px] text-green-400 flex items-center gap-1 font-bold">
                  <TrendingUp className="h-3.5 w-3.5" /> +14.2% from peak
                </p>
              </div>
            </div>

            <div className="manager-stat-card p-6 rounded-3xl bg-white/3 border border-white/5 flex flex-col justify-between h-36">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-500" /> ACTIVE TICKETS
              </span>
              <div className="mt-2 space-y-1">
                <span className="text-3xl font-black text-amber-500 font-mono">{activeCount}</span>
                <p className="text-[10px] text-gray-400 font-bold">Awaiting kitchen checkouts</p>
              </div>
            </div>

            <div className="manager-stat-card p-6 rounded-3xl bg-white/3 border border-white/5 flex flex-col justify-between h-36">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" /> PICKED UP
              </span>
              <div className="mt-2 space-y-1">
                <span className="text-3xl font-black text-white font-mono">{completedCount}</span>
                <p className="text-[10px] text-gray-400 font-bold font-mono">Contactless QR clearances</p>
              </div>
            </div>

            <div className="manager-stat-card p-6 rounded-3xl bg-white/3 border border-white/5 flex flex-col justify-between h-36">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-500" /> AVERAGE VALUE
              </span>
              <div className="mt-2 space-y-1">
                <span className="text-3xl font-black text-white font-mono">{currency}{averageTicket.toFixed(2)}</span>
                <p className="text-[10px] text-gray-400 font-bold">Weighted single purchase index</p>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Charts */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="manager-chart-box lg:col-span-2 p-6 rounded-3xl bg-[#0b0c15]/60 border border-white/5 space-y-4">
              <div>
                <h3 className="font-display font-black text-lg text-white">Hourly Sales Velocity</h3>
                <p className="text-xs text-gray-400">Transaction amounts mapped against campus checkout traffic</p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="hour" stroke="#6B7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0c0d15", borderColor: "rgba(255,255,255,0.1)", borderRadius: "16px" }}
                      labelStyle={{ color: "#F59E0B", fontWeight: "black" }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="manager-chart-box p-6 rounded-3xl bg-[#0b0c15]/60 border border-white/5 space-y-4">
              <div>
                <h3 className="font-display font-black text-lg text-white">Best Selling Plates</h3>
                <p className="text-xs text-gray-400">Top-tier daily checkout totals</p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bestSellers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={10} width={100} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0c0d15", borderColor: "rgba(255,255,255,0.1)", borderRadius: "16px" }}
                    />
                    <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
                      {bestSellers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "menu" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/3 border border-white/5">
            <div>
              <h3 className="font-display font-black text-lg text-white">Dishes Index Panel</h3>
              <p className="text-xs text-gray-400">Instantly provision novel food items or decommission expired ingredients.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingFood(!isAddingFood)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
            >
              {isAddingFood ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isAddingFood ? "Cancel" : "Add Dish"}
            </motion.button>
          </div>

          {foodError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
              &gt; ERROR: {foodError}
            </div>
          )}
          {foodSuccess && (
            <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-mono">
              &gt; SUCCESS: {foodSuccess}
            </div>
          )}

          <AnimatePresence>
            {isAddingFood && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="p-6 rounded-3xl bg-[#0b0c15] border border-amber-500/20 space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <ChefHat className="h-4 w-4" /> Provision Food Item
                  </span>
                </div>

                <form onSubmit={handleAddFoodSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">DISH NAME *</label>
                    <input
                      type="text"
                      required
                      disabled={submittingFood}
                      value={newFoodName}
                      onChange={(e) => setNewFoodName(e.target.value)}
                      placeholder="e.g. Garlic Truffle Fries"
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">DISH DESCRIPTION</label>
                    <input
                      type="text"
                      disabled={submittingFood}
                      value={newFoodDescription}
                      onChange={(e) => setNewFoodDescription(e.target.value)}
                      placeholder="e.g. Hand-cut potatoes with white truffle drizzle"
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">PRICE ({currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      disabled={submittingFood}
                      value={newFoodPrice}
                      onChange={(e) => setNewFoodPrice(e.target.value)}
                      placeholder="8.99"
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/30 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">CATEGORY</label>
                    <select
                      disabled={submittingFood}
                      value={newFoodCategory}
                      onChange={(e) => setNewFoodCategory(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-[#080910] border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 capitalize disabled:opacity-50"
                    >
                      {categories && categories.length > 0 ? (
                        categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="main-course">Main Course</option>
                          <option value="south-indian">South Indian</option>
                          <option value="burgers-wraps">Burgers & Wraps</option>
                          <option value="snacks">Snacks</option>
                          <option value="mocktails-beverages">Mocktails & Beverages</option>
                          <option value="desserts">Desserts</option>
                          <option value="smoothies">Smoothies</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">FOOD TYPE (VEG / NON-VEG)</label>
                    <select
                      disabled={submittingFood}
                      value={newFoodVeg}
                      onChange={(e) => setNewFoodVeg(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-[#080910] border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 capitalize disabled:opacity-50"
                    >
                      <option value="veg">🟢 Vegetarian</option>
                      <option value="non-veg">🔴 Non-Vegetarian</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">IMAGE URL (OPTIONAL)</label>
                    <input
                      type="url"
                      disabled={submittingFood}
                      value={newFoodImageUrl}
                      onChange={(e) => setNewFoodImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">TAGS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      disabled={submittingFood}
                      value={newFoodTags}
                      onChange={(e) => setNewFoodTags(e.target.value)}
                      placeholder="Specialty, Spicy, Veg"
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 disabled:opacity-50"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      disabled={submittingFood}
                      onClick={() => setIsAddingFood(false)}
                      className="px-5 py-2.5 rounded-xl bg-white/3 border border-white/5 text-gray-300 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submittingFood}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingFood ? "Publishing..." : "Publish Dish"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIVE ITEMS TABLE */}
          <div className="rounded-3xl bg-[#0b0c15]/60 border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-display font-black text-lg text-white">Active Daily Items</h3>
              <p className="text-xs text-gray-400">Synchronously update indices, pricing catalogs, and item availability logs.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold font-mono uppercase text-gray-500 bg-white/2">
                    <th className="p-5">Dish Details</th>
                    <th className="p-5">Category</th>
                    <th className="p-5">Unit Price</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="manager-row-animate hover:bg-white/2 transition-colors">
                      <td className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-black text-white text-sm block">{item.name}</span>
                            {item.tags && item.tags.map(tag => (
                              <span key={tag} className="text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/15 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest">{tag}</span>
                            ))}
                          </div>
                          <span className="text-gray-500 text-[11px] truncate max-w-xs block mt-0.5">{item.description}</span>
                        </div>
                      </td>

                      <td className="p-5">
                        <span className="bg-white/5 text-gray-300 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full border border-white/5 uppercase font-mono">
                          {getCategoryName(item.category)}
                        </span>
                      </td>

                      <td className="p-5 font-mono">
                        {editingPriceId === item.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold">{currency}</span>
                            <input
                              type="text"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-16 h-8 px-2 rounded bg-white/10 border border-amber-500 text-white font-mono text-xs focus:outline-none"
                            />
                            <button
                              onClick={() => handlePriceSave(item.id)}
                              className="text-[10px] font-black text-green-400 hover:underline uppercase"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{currency}{item.price.toFixed(2)}</span>
                            <button
                              onClick={() => {
                                setEditingPriceId(item.id);
                                setTempPrice(item.price.toFixed(2));
                              }}
                              className="text-gray-500 hover:text-amber-500 transition-colors p-1"
                            >
                              <PenTool className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-5">
                        {item.available ? (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Off Menu
                          </span>
                        )}
                      </td>

                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onToggleMenuItemAvailability(item.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                              item.available
                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/10"
                                : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/10"
                            }`}
                          >
                            {item.available ? "Deactivate" : "Activate"}
                          </motion.button>

                          <button
                            onClick={() => handleRemoveFoodClick(item.id, item.name)}
                            className="p-1.5 bg-white/3 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/10 rounded-xl transition-all"
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "staff" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/3 border border-white/5">
            <div>
              <h3 className="font-display font-black text-lg text-white">Staff Credential HUD</h3>
              <p className="text-xs text-gray-400">Authorize server-side kitchen access metrics or suspend active credentials.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingStaff(!isAddingStaff)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
            >
              {isAddingStaff ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isAddingStaff ? "Cancel" : "Authorize Staff"}
            </motion.button>
          </div>

          <AnimatePresence>
            {isAddingStaff && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="p-6 rounded-3xl bg-[#0b0c15] border border-amber-500/20 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Users className="h-4 w-4" /> AUTHORIZE NEW MEMBER
                  </span>
                </div>

                {staffError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{staffError}</span>
                  </div>
                )}

                {staffSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>{staffSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddStaffSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Staff Name *</label>
                    <input
                      type="text"
                      required
                      disabled={submittingStaff}
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Rachel Adams"
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Authorized Email *</label>
                    <input
                      type="email"
                      required
                      disabled={submittingStaff}
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="e.g. manager@smartcanteen.com"
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Security Clearance Role</label>
                    <select
                      disabled={submittingStaff}
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as any)}
                      className="w-full h-11 px-4 rounded-xl bg-[#080910] border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30"
                    >
                      <option value="manager">Manager</option>
                      <option value="kitchen">Kitchen Staff</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      disabled={submittingStaff}
                      onClick={() => setIsAddingStaff(false)}
                      className="px-5 py-2.5 rounded-xl bg-white/3 border border-white/5 text-gray-300 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submittingStaff}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Authorize Account
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STAFF ROSTER TABLE */}
          <div className="rounded-3xl bg-[#0b0c15]/60 border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-display font-black text-lg text-white">Active Authorized Staff</h3>
              <p className="text-xs text-gray-400">View active employees or suspend credentials instantly.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 text-[10px] font-bold font-mono uppercase text-gray-500">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Security Clearance</th>
                    <th className="py-4 px-6">Date Registered</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {staffList.map((member) => (
                    <tr key={member.id} className="manager-row-animate hover:bg-white/2 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-amber-500 uppercase border border-white/5">
                          {member.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{member.name}</span>
                          <span className="text-[9px] text-gray-500 font-mono">UID: {member.id}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-gray-300 font-medium font-mono">
                        {member.email}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          member.role === "manager"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/15"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/15"
                        }`}>
                          {member.role}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-gray-400 font-mono font-medium">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveStaffClick(member.id, member.name, member.role)}
                          className="p-2 bg-white/3 hover:bg-red-500/15 text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/10 rounded-xl transition-all cursor-pointer"
                          title="Revoke Credentials"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CATEGORIES/SECTIONS MANAGEMENT */}
      {activeTab === "categories" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-black font-display text-lg flex items-center gap-2.5">
                <ChefHat className="h-5 w-5 text-amber-500" /> Menu Categories & Sections
              </h3>
              <p className="text-xs text-gray-400">Add, rename, or delete the dynamic categories that organize your canteen's offerings.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingCategory(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Plus className="h-4 w-4" /> Create Category
            </motion.button>
          </div>

          <AnimatePresence>
            {isAddingCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 border border-white/5 rounded-3xl bg-[#0b0c15]/80 space-y-4">
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest text-amber-500 font-mono">&gt; Create New Menu Category</h4>
                  
                  {categoryError && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
                      &gt; ERROR: {categoryError}
                    </div>
                  )}
                  {categorySuccess && (
                    <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-mono">
                      &gt; SUCCESS: {categorySuccess}
                    </div>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newCategoryName.trim() || submittingCategory) return;
                      
                      setSubmittingCategory(true);
                      setCategoryError(null);
                      setCategorySuccess(null);

                      // slugify the name for the ID, e.g. "Mexican Tacos" -> "mexican-tacos"
                      const catId = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                      if (!catId) {
                        setCategoryError("Invalid category name. Please use alphanumeric characters.");
                        setSubmittingCategory(false);
                        return;
                      }
                      
                      // Check for duplicates
                      if (categories && categories.some(c => c.id === catId)) {
                        setCategoryError("A category with this name or slug already exists.");
                        setSubmittingCategory(false);
                        return;
                      }

                      try {
                        if (onAddCategory) {
                          await onAddCategory({
                            id: catId,
                            name: newCategoryName.trim(),
                            createdAt: new Date().toISOString()
                          });
                        }
                        setCategorySuccess(`Successfully created category "${newCategoryName.trim()}"!`);
                        setNewCategoryName("");
                        setTimeout(() => {
                          setIsAddingCategory(false);
                          setCategorySuccess(null);
                        }, 1800);
                      } catch (err: any) {
                        console.error("Error creating category:", err);
                        setCategoryError(err?.message || "Failed to create category on Firestore.");
                      } finally {
                        setSubmittingCategory(false);
                      }
                    }}
                    className="grid sm:grid-cols-3 gap-6 items-end"
                  >
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category Name *</label>
                      <input
                        type="text"
                        required
                        disabled={submittingCategory}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Desserts, Sandwiches, Smoothies"
                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium disabled:opacity-50"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={submittingCategory}
                        onClick={() => setIsAddingCategory(false)}
                        className="flex-1 h-11 rounded-xl bg-white/3 border border-white/5 text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingCategory}
                        className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center"
                      >
                        {submittingCategory ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CATEGORIES TABLE */}
          <div className="rounded-3xl bg-[#0b0c15]/60 border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wider font-mono">&gt; Active Menu Categories</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 text-[10px] font-bold font-mono uppercase text-gray-500">
                    <th className="py-4 px-6">Category Name</th>
                    <th className="py-4 px-6">System slug ID</th>
                    <th className="py-4 px-6">Date Added</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-white/2 transition-colors animate-in fade-in">
                        <td className="py-4 px-6">
                          {editingCategoryId === cat.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!tempCategoryName.trim()) return;
                                if (onUpdateCategory) {
                                  onUpdateCategory(cat.id, tempCategoryName.trim());
                                }
                                setEditingCategoryId(null);
                              }}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                required
                                value={tempCategoryName}
                                onChange={(e) => setTempCategoryName(e.target.value)}
                                className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                              />
                              <button
                                type="submit"
                                className="h-9 px-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryId(null)}
                                className="h-9 px-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold cursor-pointer transition-all"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <span className="font-bold text-white text-sm capitalize">{cat.name}</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-gray-400 font-mono text-[11px]">
                          {cat.id}
                        </td>

                        <td className="py-4 px-6 text-gray-400 font-mono text-[11px]">
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : "System Default"}
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          {editingCategoryId !== cat.id && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setTempCategoryName(cat.name);
                                }}
                                className="p-2 bg-white/3 hover:bg-amber-500/10 text-gray-400 hover:text-amber-500 border border-white/5 hover:border-amber-500/10 rounded-xl transition-all cursor-pointer inline-flex items-center text-xs"
                                title="Rename Category"
                              >
                                <PenTool className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    type: "category",
                                    id: cat.id,
                                    name: cat.name
                                  });
                                }}
                                className="p-2 bg-white/3 hover:bg-red-500/15 text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/10 rounded-xl transition-all cursor-pointer inline-flex items-center text-xs"
                                title="Delete Category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-500 font-mono text-xs">
                        &gt; NO CATEGORIES DEFINED.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANAGER ACTION LOGS */}
      {activeTab === "manager_logs" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-1">
            <h3 className="text-white font-black font-display text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-500" /> Administrative Access Logs
            </h3>
            <p className="text-xs text-gray-400">Exclusive log auditing for state changes, employee credentials adjustments, and daily menu modifications.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#0b0c15]/60 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">STREAM CONFIG</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] uppercase font-black tracking-widest">
                VERIFIED AUDITS
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search audit console..."
                value={managerLogSearch}
                onChange={(e) => setManagerLogSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/3 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/30 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-[#040508]/80 border border-white/5 rounded-2xl overflow-hidden font-mono text-[10px] p-6 space-y-3.5 max-h-[450px] overflow-y-auto custom-scrollbar shadow-inner">
            
            <div className="flex items-center gap-1.5 pb-2 border-b border-white/5 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
              <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
              MGR ADMIN STREAM SECURE PORT
            </div>

            {(() => {
              const filteredMLogs = managerLogs.filter((log) => {
                const searchLower = managerLogSearch.toLowerCase();
                const messageText = log.message ? log.message.toLowerCase() : "";
                const sourceText = log.source ? log.source.toLowerCase() : "";
                return messageText.includes(searchLower) || sourceText.includes(searchLower);
              });

              if (filteredMLogs.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-600 font-mono text-xs">
                    &gt; LOG STREAM VACANT.
                  </div>
                );
              }

              return filteredMLogs.map((log) => {
                const isWarning = log.level === "warning";
                return (
                  <div 
                    key={log.id} 
                    className={`flex items-start gap-4 p-3 rounded-xl transition-colors border ${
                      isWarning ? "bg-red-500/5 hover:bg-red-500/10 border-red-500/10" :
                      "bg-white/1 hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className="text-gray-500 font-bold shrink-0">
                      [{formatLogTimestamp(log.timestamp)}]
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 w-24 text-center border ${
                      isWarning ? "bg-red-500/20 text-red-400 border-red-500/15" :
                      "bg-amber-500/20 text-amber-400 border-amber-500/15"
                    }`}>
                      {isWarning ? "REVOCATION" : "COMMIT"}
                    </span>

                    <div className="flex-1 text-gray-300 leading-relaxed">
                      <span className="font-bold text-gray-400 mr-2 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {log.source || "Manager"}
                      </span>
                      {log.message}
                    </div>
                  </div>
                );
              });
            })()}

            <div className="pt-2 text-gray-600 italic">
              &gt; Handshake verification complete. Operations HUD aligned.
            </div>

          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060b]/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-md bg-[#0d0e16] border border-red-500/20 rounded-3xl p-6.5 shadow-2xl relative overflow-hidden"
            >
              {/* Alert icon background glow */}
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-3.5 mb-5">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-white font-black font-display text-base uppercase tracking-tight">
                    Confirm Action
                  </h4>
                  <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
                    Destructive Action Required
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-300 leading-relaxed mb-6">
                {deleteConfirm.type === "staff" ? (
                  <>
                    Are you sure you want to revoke system access for staff member <span className="text-white font-black bg-white/5 px-2 py-0.5 rounded border border-white/5">{deleteConfirm.name}</span>? This action cannot be undone and will immediately disable their login session.
                  </>
                ) : deleteConfirm.type === "category" ? (
                  <>
                    Are you sure you want to delete the category <span className="text-white font-black bg-white/5 px-2 py-0.5 rounded border border-white/5">{deleteConfirm.name}</span>? Any menu items currently under this category will need to be reassigned.
                  </>
                ) : (
                  <>
                    Are you sure you want to remove <span className="text-white font-black bg-white/5 px-2 py-0.5 rounded border border-white/5">{deleteConfirm.name}</span> from the active menu index?
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3.5">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/3 border border-white/5 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmExecute}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-red-600/10 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
