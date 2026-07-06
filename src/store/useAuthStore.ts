import { create } from "zustand";
import { UserProfile, UserRole } from "../types";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, role: UserRole, name: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial user from localStorage if it exists
  const storedUser = localStorage.getItem("smart_canteen_user");
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    loading: false,
    error: null,
    login: (email, role, name) => {
      const userProfile: UserProfile = {
        uid: `user_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("smart_canteen_user", JSON.stringify(userProfile));
      set({ user: userProfile, error: null });
    },
    logout: () => {
      localStorage.removeItem("smart_canteen_user");
      set({ user: null });
    },
    setRole: (role) => {
      set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, role };
        localStorage.setItem("smart_canteen_user", JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    }
  };
});
