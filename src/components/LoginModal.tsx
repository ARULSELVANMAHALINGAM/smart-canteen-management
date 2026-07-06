import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Users, ChefHat, BarChart3, AlertCircle, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { UserRole } from "../types";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const loginSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["student", "kitchen", "manager", "admin"] as const)
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const login = useAuthStore((state) => state.login);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "Alex Johnson",
      email: "student@smartcanteen.com",
      role: "student"
    }
  });

  const selectedRole = watch("role");

  const onSubmit = (data: LoginFormValues) => {
    login(data.email, data.role, data.name);
    onSuccess();
    onClose();
  };

  const handleRoleSelect = (role: UserRole) => {
    setValue("role", role);
    if (role === "student") {
      setValue("name", "Alex Johnson");
      setValue("email", "student@smartcanteen.com");
    } else if (role === "kitchen") {
      setValue("name", "Chef Martinez");
      setValue("email", "kitchen@smartcanteen.com");
    } else if (role === "manager") {
      setValue("name", "Sarah Jenkins");
      setValue("email", "manager@smartcanteen.com");
    } else if (role === "admin") {
      setValue("name", "Admin Controller");
      setValue("email", "admin@smartcanteen.com");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Background close handle */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.92, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-panel-heavy shadow-2xl p-8 border border-white/10 z-10"
      >
        {/* Glow ambient accent corner */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/10 blur-[40px] pointer-events-none" />

        {/* Close Button */}
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </motion.button>

        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-2xl font-black text-white font-display">Workspace Access</h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
            Choose a mock account role below to instantly generate secure full-stack simulation credentials.
          </p>
        </div>

        {/* Role Selector Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleRoleSelect("student")}
            className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              selectedRole === "student"
                ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5"
            }`}
          >
            <Users className={`h-5 w-5 mb-2 transition-colors ${selectedRole === "student" ? "text-amber-500" : "text-gray-400"}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Student</span>
            <span className="text-[9px] opacity-50 mt-1">Order & Live Track</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleRoleSelect("kitchen")}
            className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              selectedRole === "kitchen"
                ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5"
            }`}
          >
            <ChefHat className={`h-5 w-5 mb-2 transition-colors ${selectedRole === "kitchen" ? "text-amber-500" : "text-gray-400"}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Kitchen Staff</span>
            <span className="text-[9px] opacity-50 mt-1">Manage Fulfilments</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleRoleSelect("manager")}
            className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              selectedRole === "manager"
                ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5"
            }`}
          >
            <BarChart3 className={`h-5 w-5 mb-2 transition-colors ${selectedRole === "manager" ? "text-amber-500" : "text-gray-400"}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Manager</span>
            <span className="text-[9px] opacity-50 mt-1">Roster & Pricing</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleRoleSelect("admin")}
            className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              selectedRole === "admin"
                ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5"
            }`}
          >
            <Shield className={`h-5 w-5 mb-2 transition-colors ${selectedRole === "admin" ? "text-amber-500" : "text-gray-400"}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider">System Admin</span>
            <span className="text-[9px] opacity-50 mt-1">System Gateway Config</span>
          </motion.button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Display Account Name</label>
            <input 
              {...register("name")}
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/30 transition-all font-medium"
              placeholder="e.g. Alex Johnson"
            />
            {errors.name && (
              <p className="text-red-400 text-[10px] flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3 w-3 shrink-0" /> {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
            <input 
              {...register("email")}
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/30 transition-all font-medium"
              placeholder="e.g. student@smartcanteen.com"
            />
            {errors.email && (
              <p className="text-red-400 text-[10px] flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3 w-3 shrink-0" /> {errors.email.message}
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 font-bold text-black text-xs shadow-lg shadow-amber-500/10 transition-all mt-4 cursor-pointer uppercase tracking-wider"
          >
            Launch Selected Terminal &rarr;
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
