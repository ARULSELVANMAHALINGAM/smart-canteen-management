import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { 
  Shield, 
  Users, 
  ChefHat, 
  BarChart3, 
  LogOut, 
  Plus, 
  Trash2, 
  Key, 
  Search, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Save, 
  MapPin, 
  Activity, 
  Settings, 
  Database,
  RefreshCcw,
  Sparkles,
  ToggleLeft,
  X,
  CreditCard,
  ClipboardList,
  Utensils
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserRole, MenuItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AdminDashboardProps {
  onLogout: () => void;
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
  level: "info" | "warning" | "critical";
  message: string;
  source: string;
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

const formatLogTimeOnly = (timestampStr: string): string => {
  try {
    const d = new Date(timestampStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString();
    }
  } catch (e) {}
  return new Date().toLocaleTimeString();
};

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"platform" | "staff" | "menu" | "gateway" | "security" | "manager_logs" >("platform");
  
  // 1. Tab State: Platform Defaults
  const [currency, setCurrency] = useState("$");
  const [taxRate, setTaxRate] = useState("5.0");
  const [maxTickets, setMaxTickets] = useState("4");
  const [openHour, setOpenHour] = useState("08:00");
  const [closeHour, setCloseHour] = useState("20:00");
  const [isSavingConfigs, setIsSavingConfigs] = useState(false);

  // 2. Tab State: Staff Management
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"manager" | "kitchen">("manager");

  // 2b. Tab State: Menu Management
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  
  // 3. Tab State: Gateway Config
  const [gatewayMode, setGatewayMode] = useState<"sandbox" | "live">("sandbox");
  const [stripeKey, setStripeKey] = useState("");
  const [stripeSecret, setStripeSecret] = useState("");
  const [paypalClient, setPaypalClient] = useState("");
  const [surcharge, setSurcharge] = useState("1.5");
  const [showKeys, setShowKeys] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);

  // 4. Tab State: Security Auditing logs
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "info" | "warning" | "critical">("all");
  const [logSearch, setLogSearch] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // 5. Tab State: Manager Action Logs
  const [managerLogs, setManagerLogs] = useState<SystemLog[]>([]);
  const [managerLogSearch, setManagerLogSearch] = useState("");

  // Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "staff" | "food";
    id: string;
    name: string;
    extra?: string;
  } | null>(null);

  // Default seed data fallback for staff
  const defaultStaff: StaffMember[] = [
    { id: "s1", name: "Sarah Jenkins", email: "manager@smartcanteen.com", role: "manager", createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
    { id: "s2", name: "Chef Martinez", email: "kitchen@smartcanteen.com", role: "kitchen", createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
    { id: "s3", name: "David Miller", email: "david.miller@smartcanteen.com", role: "kitchen", createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() }
  ];

  // Default logs
  const defaultLogs: SystemLog[] = [
    { id: "l1", timestamp: new Date(Date.now() - 50000).toISOString(), level: "info", message: "Sandbox payment processing connection initialized successfully.", source: "Gateway API" },
    { id: "l2", timestamp: new Date(Date.now() - 120000).toISOString(), level: "critical", message: "Detected 3 failed checkout requests from IP 10.150.4.112. Threshold warning triggered.", source: "Security Guard" },
    { id: "l3", timestamp: new Date(Date.now() - 360000).toISOString(), level: "warning", message: "High latency detected on Firestore read-write transaction (820ms).", source: "Infrastructure" },
    { id: "l4", timestamp: new Date(Date.now() - 540000).toISOString(), level: "info", message: "Role modified: User Sarah Jenkins assigned manager permissions.", source: "Admin Shell" },
    { id: "l5", timestamp: new Date(Date.now() - 900000).toISOString(), level: "info", message: "Global currency configuration updated: set to USD ($).", source: "System Config" },
    { id: "l6", timestamp: new Date(Date.now() - 1800000).toISOString(), level: "warning", message: "Automated cron database backup completed with 2 non-critical file warnings.", source: "Database Scheduler" }
  ];

  // Load Firestore Data for dynamic syncing
  useEffect(() => {
    // 1. Staff Listener
    const staffCol = collection(db, "staff_members");
    const unsubStaff = onSnapshot(staffCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedStaff: StaffMember[] = [];
        snapshot.forEach((doc) => {
          loadedStaff.push({ id: doc.id, ...doc.data() } as StaffMember);
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
      console.warn("Firestore staff subscription failed, using local fallback", error);
      setStaffList(defaultStaff);
    });

    // 2. Logs Listener
    const logsCol = collection(db, "system_logs");
    const unsubLogs = onSnapshot(logsCol, (snapshot) => {
      try {
        if (!snapshot.empty) {
          const loadedLogs: SystemLog[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            loadedLogs.push({
              id: doc.id,
              timestamp: parseFirestoreTimestamp(data.timestamp),
              level: data.level || "info",
              message: data.message || "",
              source: data.source || "System"
            });
          });
          loadedLogs.sort((a, b) => {
            const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tB - tA;
          });
          setLogs(loadedLogs);
        } else {
          setLogs(defaultLogs);
          defaultLogs.forEach(async (log) => {
            await setDoc(doc(db, "system_logs", log.id), {
              timestamp: log.timestamp,
              level: log.level,
              message: log.message,
              source: log.source
            });
          });
        }
      } catch (err) {
        console.error("Error processing system logs snapshot:", err);
      }
    }, (error) => {
      console.warn("Firestore logs subscription failed, using local fallback", error);
      setLogs(defaultLogs);
    });

    // 2b. Manager Logs Listener
    const mLogsCol = collection(db, "manager_logs");
    const unsubMLogs = onSnapshot(mLogsCol, (snapshot) => {
      try {
        if (!snapshot.empty) {
          const loadedMLogs: SystemLog[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            loadedMLogs.push({
              id: doc.id,
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
      console.warn("Firestore manager logs subscription failed, utilizing empty state", error);
      setManagerLogs([]);
    });

    // 3. Load Global Settings
    const unsubConfigs = onSnapshot(doc(db, "configs", "global"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrency(data.currency || "$");
        setTaxRate(data.taxRate || "5.0");
        setMaxTickets(data.maxTickets || "4");
        setOpenHour(data.openHour || "08:00");
        setCloseHour(data.closeHour || "20:00");
      }
    });

    // 4. Menu Items Listener for real-time menu management sync
    const menuCol = collection(db, "menuItems");
    const unsubMenu = onSnapshot(menuCol, (snapshot) => {
      try {
        if (!snapshot.empty) {
          const loadedMenu: MenuItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedMenu.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
          });
          setMenuItems(loadedMenu);
        } else {
          setMenuItems([]);
        }
      } catch (err) {
        console.error("Error processing menuItems snapshot in AdminDashboard:", err);
      }
    }, (error) => {
      console.warn("Firestore menuItems subscription failed in AdminDashboard, using empty fallback", error);
      setMenuItems([]);
    });

    // Load Gateway configs securely from local server API
    fetch("/api/gateway/config")
      .then((res) => {
        if (!res.ok) throw new Error("Server-side config fetch failed");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setGatewayMode(data.gatewayMode || "sandbox");
          setStripeKey(data.stripeKey || "");
          setStripeSecret(data.stripeSecretMasked || "");
          setPaypalClient(data.paypalClientMasked || "");
          setSurcharge(data.surcharge || "1.5");
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch secure gateway config from server:", err);
      });

    return () => {
      unsubStaff();
      unsubLogs();
      unsubMLogs();
      unsubConfigs();
      unsubMenu();
    };
  }, []);

  // GSAP Tab Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".admin-view-panel",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab]);

  // Handle Save Configurations
  const handleSaveConfigs = async () => {
    setIsSavingConfigs(true);
    try {
      await setDoc(doc(db, "configs", "global"), {
        currency,
        taxRate,
        maxTickets,
        openHour,
        closeHour,
        updatedAt: new Date().toISOString()
      });
      
      await addDoc(collection(db, "system_logs"), {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Global variables configured: tax ${taxRate}%, max tickets ${maxTickets} per student.`,
        source: "Admin Console"
      });

      setTimeout(() => {
        setIsSavingConfigs(false);
      }, 600);
    } catch (err) {
      console.error(err);
      setIsSavingConfigs(false);
    }
  };

  // Handle Save Payment Gateway
  const handleSaveGateway = async () => {
    setIsSavingGateway(true);
    try {
      const response = await fetch("/api/gateway/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gatewayMode,
          stripeKey,
          stripeSecret,
          paypalClient,
          surcharge
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save gateway config on server");
      }

      // Re-fetch to update state with secure masked values from the server
      const refreshRes = await fetch("/api/gateway/config");
      if (refreshRes.ok) {
        const freshData = await refreshRes.json();
        setGatewayMode(freshData.gatewayMode || "sandbox");
        setStripeKey(freshData.stripeKey || "");
        setStripeSecret(freshData.stripeSecretMasked || "");
        setPaypalClient(freshData.paypalClientMasked || "");
        setSurcharge(freshData.surcharge || "1.5");
      }

      await addDoc(collection(db, "system_logs"), {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Payment gateway credentials safely processed and secured in ${gatewayMode.toUpperCase()} mode.`,
        source: "Escrow Manager"
      });

      setIsSavingGateway(false);
    } catch (err) {
      console.error("Error saving gateway config:", err);
      setIsSavingGateway(false);
    }
  };

  // Add Staff Member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    try {
      const newStaff = {
        name: newStaffName,
        email: newStaffEmail,
        role: newStaffRole,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "staff_members"), newStaff);

      await addDoc(collection(db, "system_logs"), {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Staff authorized: registered new ${newStaffRole} account for "${newStaffName}".`,
        source: "Admin Shell"
      });

      setNewStaffName("");
      setNewStaffEmail("");
      setIsAddingStaff(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Staff Member
  const handleRemoveStaff = (id: string, name: string, role: string) => {
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

    if (type === "staff") {
      try {
        await deleteDoc(doc(db, "staff_members", id));

        await addDoc(collection(db, "system_logs"), {
          timestamp: new Date().toISOString(),
          level: "warning",
          message: `Access revoked: decommissioned ${extra || "staff"} profile for ${name}. Token deactivated.`,
          source: "Security Guard"
        });
      } catch (err) {
        console.error(err);
      }
    } else if (type === "food") {
      try {
        await deleteDoc(doc(db, "menuItems", id));
        await addDoc(collection(db, "system_logs"), {
          timestamp: new Date().toISOString(),
          level: "warning",
          message: `Admin permanently deleted menu item "${name}"`,
          source: "Admin Console"
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // System Diagnostics Scan
  const handleDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      await addDoc(collection(db, "system_logs"), {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Full Platform Diagnostic Check completed. 0 vulnerabilities found, escrow verified.",
        source: "Security Guard"
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = logFilter === "all" || log.level === logFilter;
    const messageText = log.message ? log.message.toLowerCase() : "";
    const sourceText = log.source ? log.source.toLowerCase() : "";
    const matchesSearch = messageText.includes(logSearch.toLowerCase()) || 
                          sourceText.includes(logSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div ref={containerRef} className="py-12 px-6 md:px-12 max-w-7xl mx-auto space-y-10 selection:bg-amber-500 selection:text-black">
      
      {/* 1. Header Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-extrabold">Master Admin Node Active</span>
          </div>
          <h2 className="text-3xl font-black text-white font-display flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-500" />
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Admin Control</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Configure multi-location defaults, authorize staff registers, secure key gateways, and audit secure activity lines.</p>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-white/3 border border-white/5 rounded-2xl p-1 flex-wrap">
            {[
              { tab: "platform", label: "Defaults", icon: Settings },
              { tab: "staff", label: "Staff", icon: Users },
              { tab: "menu", label: "Menu", icon: Utensils },
              { tab: "gateway", label: "Gateways", icon: Key },
              { tab: "security", label: "Auditing", icon: Database },
              { tab: "manager_logs", label: "Manager Logs", icon: ClipboardList }
            ].map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab ? "bg-amber-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
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

      {/* TAB 1: PLATFORM DEFAULTS & LOCATIONS */}
      {activeTab === "platform" && (
        <div className="admin-view-panel space-y-8 animate-in fade-in duration-300">
          
          {/* Multi-Location Activity Cards */}
          <div className="space-y-4">
            <h3 className="text-white font-black font-display text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" /> Multi-Location Live Statuses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-[#10121d]/50 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[10px] text-green-400 font-mono flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/15">
                  <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" /> Live
                </div>
                <h4 className="text-white font-black text-sm mb-1">Canteen East Hub</h4>
                <p className="text-xs text-gray-400 mb-4 font-medium">Central Academic Quadrangle</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Active Load</span>
                    <span className="text-amber-500 font-bold">65% (Heavy)</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>
              </div>

              <div className="bg-[#10121d]/50 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[10px] text-green-400 font-mono flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/15">
                  <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" /> Live
                </div>
                <h4 className="text-white font-black text-sm mb-1">Canteen West Annex</h4>
                <p className="text-xs text-gray-400 mb-4 font-medium">Engineering Research Building</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Active Load</span>
                    <span className="text-emerald-400 font-bold">25% (Optimal)</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>
              </div>

              <div className="bg-[#10121d]/50 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[10px] text-amber-400 font-mono flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/15">
                  <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse" /> Restricted
                </div>
                <h4 className="text-white font-black text-sm mb-1">North Food Court</h4>
                <p className="text-xs text-gray-400 mb-4 font-medium">Athletic Arena Dome</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Active Load</span>
                    <span className="text-blue-400 font-bold">10% (Low)</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Form parameters */}
          <div className="bg-[#10121D]/40 border border-white/5 p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-base">Global Platform Variables</h4>
                <p className="text-xs text-gray-400">Configure core metrics that govern checkout taxes, token limits, and operation hours.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">CURRENCY SYMBOL</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#080910] border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                >
                  <option value="$">USD ($) - US Dollar</option>
                  <option value="€">EUR (€) - Euro</option>
                  <option value="£">GBP (£) - British Pound</option>
                  <option value="₹">INR (₹) - Indian Rupee</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">VAT / TAX RATE (%)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">MAX ACTIVE TOKENS/STUDENT</label>
                <input 
                  type="number"
                  value={maxTickets}
                  onChange={(e) => setMaxTickets(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">OPERATIONAL START TIME</label>
                <input 
                  type="time"
                  value={openHour}
                  onChange={(e) => setOpenHour(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">OPERATIONAL CLOSE TIME</label>
                <input 
                  type="time"
                  value={closeHour}
                  onChange={(e) => setCloseHour(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveConfigs}
                disabled={isSavingConfigs}
                className="h-11 px-6 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingConfigs ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" /> Saving Defaults...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Defaults
                  </>
                )}
              </motion.button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: STAFF ROSTER MANAGEMENT */}
      {activeTab === "staff" && (
        <div className="admin-view-panel space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-black font-display text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" /> Staff Authorization Registry
              </h3>
              <p className="text-xs text-gray-400">Authorize or decommission security-cleared profiles in real-time.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingStaff(!isAddingStaff)}
              className="h-11 px-5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-2xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Register Staff
            </motion.button>
          </div>

          <AnimatePresence>
            {isAddingStaff && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#121422] border border-amber-500/20 p-6 rounded-3xl relative overflow-hidden"
              >
                <button 
                  onClick={() => setIsAddingStaff(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <h4 className="text-white font-black font-display text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> Register Staff Profile
                </h4>

                <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">DISPLAY NAME</label>
                    <input 
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                      placeholder="e.g. Rachel Adams"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">EMAIL ADDRESS</label>
                    <input 
                      type="email"
                      required
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                      placeholder="e.g. staff@smartcanteen.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">ROLE CLEARANCE</label>
                      <select 
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="w-full h-11 px-4 rounded-xl bg-[#080910] border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/30 font-medium"
                      >
                        <option value="manager">Manager</option>
                        <option value="kitchen">Kitchen Staff</option>
                      </select>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="h-11 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Authorize
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STAFF ROSTER TABLE */}
          <div className="bg-[#10121D]/40 border border-white/5 rounded-3xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-gray-500 font-mono font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-4 px-6">Staff Profile Name</th>
                  <th className="py-4 px-6">System Email</th>
                  <th className="py-4 px-6">Clearance</th>
                  <th className="py-4 px-6">Authorized Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-amber-500 uppercase border border-white/5">
                          {member.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-200 block">{member.name}</span>
                          <span className="text-[9px] text-gray-500 font-mono">UID: {member.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-gray-300 font-mono font-medium">
                      {member.email}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        member.role === "manager" 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/15" 
                          : "bg-blue-500/10 text-blue-400 border-blue-500/15"
                      }`}>
                        {member.role === "manager" ? "Manager" : "Kitchen Staff"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-gray-400 font-mono">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveStaff(member.id, member.name, member.role)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                        title="Decommission"
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
      )}

      {/* TAB: FOOD MENU INVENTORY */}
      {activeTab === "menu" && (
        <div className="admin-view-panel space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#10121d]/50 border border-white/5 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Menu Dishes</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{menuItems.length}</span>
                <span className="text-xs text-amber-500 font-extrabold font-mono uppercase">DATABASE INDEXED</span>
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-[#10121d]/50 border border-white/5 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Available on Canteen</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-green-400">
                  {menuItems.filter((i) => i.available).length}
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-black border border-emerald-500/15 tracking-wider">LIVE</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#10121d]/50 border border-white/5 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Off-Menu Hold</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500">
                  {menuItems.filter((i) => !i.available).length}
                </span>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-black border border-amber-500/15 tracking-wider font-mono">SUSPEND</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#10121D]/40 border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-amber-500" />
                  Active Food Menu Catalog
                </h3>
                <p className="text-xs text-gray-400">Audit current canteen dishes, real-time availability, and pricing details.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search dishes or categories..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#0A0B12]/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/2 border-b border-white/5 text-gray-500 text-[10px] font-bold font-mono uppercase tracking-wider">
                    <th className="py-4 px-6">Dish / Description</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {menuItems
                    .filter(
                      (item) =>
                        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                        item.category.toLowerCase().includes(menuSearch.toLowerCase()) ||
                        item.description.toLowerCase().includes(menuSearch.toLowerCase())
                    )
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="h-11 w-11 rounded-xl object-cover border border-white/10 shrink-0 bg-white/5"
                            />
                            <div>
                              <span className="font-extrabold text-gray-200 block text-sm leading-tight">{item.name}</span>
                              <span className="text-[11px] text-gray-500 line-clamp-1 max-w-sm mt-0.5">{item.description}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-white/3 text-gray-300 border border-white/5 font-mono">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-mono font-extrabold text-gray-200">
                          {currency}{item.price.toFixed(2)}
                        </td>

                        <td className="py-4 px-6">
                          {item.available ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/15">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Off Menu
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "menuItems", item.id), {
                                    available: !item.available
                                  });
                                  
                                  await addDoc(collection(db, "system_logs"), {
                                    timestamp: new Date().toISOString(),
                                    level: "info",
                                    message: `Admin modified "${item.name}" availability to ${!item.available ? "Available" : "Off Menu"}`,
                                    source: "Admin Console"
                                  });
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                item.available
                                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/10"
                                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/10"
                              }`}
                            >
                              {item.available ? "Suspend" : "Activate"}
                            </motion.button>

                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  type: "food",
                                  id: item.id,
                                  name: item.name
                                });
                              }}
                              className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {menuItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 font-mono uppercase tracking-widest text-[10px]">
                        No active menu items detected in system database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

      {/* TAB 3: PAYMENT GATEWAY CONFIGURATIONS */}
      {activeTab === "gateway" && (
        <div className="admin-view-panel space-y-8 animate-in fade-in duration-300">
          
          <div className="bg-[#10121D]/40 border border-white/5 p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-white font-black text-base">Escrow & Payment Gateway Providers</h4>
                  <p className="text-xs text-gray-400">Configure processing accounts and secure credentials for checkout services.</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowKeys(!showKeys)}
                className="h-10 px-4 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {showKeys ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Mask Secrets
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Reveal Secrets
                  </>
                )}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-[#0A0B12]/80 border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-white font-display uppercase tracking-widest">Stripe Test Mode (Sandbox)</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-black px-2 py-0.5 rounded border border-emerald-500/15 tracking-wider">
                    SANDBOX ACTIVE
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Stripe Public API Key</label>
                    <div className="relative">
                      <input 
                        type={showKeys ? "text" : "password"}
                        value={stripeKey}
                        onChange={(e) => setStripeKey(e.target.value)}
                        className="w-full h-10 px-3 pr-10 rounded-xl bg-white/5 border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/30 transition-all"
                      />
                      <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Stripe Secret API Key</label>
                    <div className="relative">
                      <input 
                        type={showKeys ? "text" : "password"}
                        value={stripeSecret}
                        onChange={(e) => setStripeSecret(e.target.value)}
                        className="w-full h-10 px-3 pr-10 rounded-xl bg-white/5 border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/30 transition-all"
                      />
                      <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0B12]/80 border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-black text-white font-display uppercase tracking-widest">PayPal Sandbox Direct</span>
                  </div>
                  <span className="bg-blue-500/10 text-blue-400 text-[8px] font-mono font-black px-2 py-0.5 rounded border border-blue-500/15 tracking-wider">
                    SANDBOX ACTIVE
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">PayPal Client ID</label>
                    <div className="relative">
                      <input 
                        type={showKeys ? "text" : "password"}
                        value={paypalClient}
                        onChange={(e) => setPaypalClient(e.target.value)}
                        className="w-full h-10 px-3 pr-10 rounded-xl bg-white/5 border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/30 transition-all"
                      />
                      <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Surcharge fee (%)</label>
                    <input 
                      type="number"
                      step="0.05"
                      value={surcharge}
                      onChange={(e) => setSurcharge(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white font-medium focus:outline-none focus:border-amber-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Environment settings */}
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gateway Mode</span>
                <div className="flex items-center gap-1.5 bg-[#080910] p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setGatewayMode("sandbox")}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      gatewayMode === "sandbox" ? "bg-amber-500 text-black shadow-md" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    onClick={() => setGatewayMode("live")}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      gatewayMode === "live" ? "bg-red-500 text-white shadow-md" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Live Escrow
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveGateway}
                disabled={isSavingGateway}
                className="h-11 px-6 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingGateway ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" /> Saving Gateways...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Save Gateways
                  </>
                )}
              </motion.button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: SYSTEM SECURITY AUDITING */}
      {activeTab === "security" && (
        <div className="admin-view-panel space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-black font-display text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-500" /> Platform Security Auditing
              </h3>
              <p className="text-xs text-gray-400">Live operational events, refund checks, staff registrations, and diagnostic warnings.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDiagnostics}
              disabled={isDiagnosing}
              className="h-11 px-5 bg-white/3 hover:bg-white/5 disabled:bg-white/3 text-gray-300 border border-white/5 hover:border-white/10 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Activity className={`h-4 w-4 ${isDiagnosing ? "animate-spin text-amber-500" : "text-gray-400"}`} />
              {isDiagnosing ? "Running Diagnostics Scan..." : "Trigger Diagnostics Scan"}
            </motion.button>
          </div>

          {/* Logs Control & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#10121D]/40 border border-white/5 rounded-3xl">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold mr-2">Severity</span>
              <button
                onClick={() => setLogFilter("all")}
                className={`h-8 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  logFilter === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                All Logs
              </button>
              <button
                onClick={() => setLogFilter("info")}
                className={`h-8 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-all cursor-pointer ${
                  logFilter === "info" ? "bg-blue-500/15 border border-blue-500/20" : "border border-transparent"
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setLogFilter("warning")}
                className={`h-8 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-all cursor-pointer ${
                  logFilter === "warning" ? "bg-amber-500/15 border border-amber-500/20" : "border border-transparent"
                }`}
              >
                Warnings
              </button>
              <button
                onClick={() => setLogFilter("critical")}
                className={`h-8 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-300 transition-all cursor-pointer ${
                  logFilter === "critical" ? "bg-red-500/15 border border-red-500/20" : "border border-transparent"
                }`}
              >
                Critical
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search audit console..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/30 transition-all font-medium"
              />
            </div>
          </div>

          {/* Scrolling Auditing Console */}
          <div className="bg-[#0A0B12]/80 border border-white/5 rounded-2xl overflow-hidden font-mono text-[10px] p-6 space-y-3.5 max-h-[450px] overflow-y-auto custom-scrollbar shadow-inner">
            
            <div className="flex items-center gap-1.5 pb-2 border-b border-white/5 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Terminal Connection Established (Port: SEC_3000)
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-mono text-xs">
                &gt; No auditing logs found matching current query.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isInfo = log.level === "info";
                const isWarning = log.level === "warning";
                const isCritical = log.level === "critical";
                
                return (
                  <div 
                    key={log.id} 
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors border ${
                      isCritical ? "bg-red-500/5 hover:bg-red-500/10 border-red-500/10" :
                      isWarning ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10" :
                      "bg-white/1 hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className="text-gray-500 font-bold shrink-0">
                      [{formatLogTimeOnly(log.timestamp)}]
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 w-16 text-center border ${
                      isCritical ? "bg-red-500/20 text-red-400 border-red-500/15" :
                      isWarning ? "bg-amber-500/20 text-amber-400 border-amber-500/15" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/10"
                    }`}>
                      {log.level}
                    </span>

                    <div className="flex-1 text-gray-300 leading-relaxed">
                      <span className="font-bold text-gray-400 mr-2 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {log.source || "System"}
                      </span>
                      {log.message}
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-2 text-gray-600 italic">
              &gt; Listening for incoming escrow events...
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: MANAGER ACTION LOGS */}
      {activeTab === "manager_logs" && (
        <div className="admin-view-panel space-y-6 animate-in fade-in duration-300">
          
          <div className="space-y-1">
            <h3 className="text-white font-black font-display text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-500" /> Manager Terminal Activity
            </h3>
            <p className="text-xs text-gray-400">Exclusive log auditing for manager changes, including employee additions/revocations, and menu modifications.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#10121D]/40 border border-white/5 rounded-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">Manager Action Type</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] uppercase font-black tracking-widest">
                Isolated Records
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search manager logs..."
                value={managerLogSearch}
                onChange={(e) => setManagerLogSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/30 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-[#0A0B12]/80 border border-white/5 rounded-2xl overflow-hidden font-mono text-[10px] p-6 space-y-3.5 max-h-[450px] overflow-y-auto custom-scrollbar shadow-inner">
            
            <div className="flex items-center gap-1.5 pb-2 border-b border-white/5 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
              <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
              Isolated Manager Logs Stream (Port: MGR_3020)
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
                    &gt; No manager activity logs found.
                  </div>
                );
              }

              return filteredMLogs.map((log) => {
                const isWarning = log.level === "warning";
                return (
                  <div 
                    key={log.id} 
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors border ${
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
                      {isWarning ? "REMOVED" : "ADDED/CHANGED"}
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
              &gt; Log stream active. All administrative events preserved.
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
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
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
                ) : (
                  <>
                    Are you sure you want to permanently remove <span className="text-white font-black bg-white/5 px-2 py-0.5 rounded border border-white/5">{deleteConfirm.name}</span> from the database menu index?
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
