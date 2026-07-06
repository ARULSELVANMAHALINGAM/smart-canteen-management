import { create } from "zustand";
import { OrderItem, MenuItem } from "../types";

interface CartState {
  items: OrderItem[];
  pickupTime: string;
  addItem: (item: MenuItem, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  setPickupTime: (time: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  pickupTime: "As soon as possible",
  addItem: (item, notes = "") => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += 1;
        if (notes) updatedItems[existingIndex].notes = notes;
        return { items: updatedItems };
      }
      const newItem: OrderItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        imageUrl: item.imageUrl,
        notes,
        veg: item.veg
      };
      return { items: [...state.items, newItem] };
    });
  },
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId)
    }));
  },
  updateQuantity: (itemId, delta) => {
    set((state) => {
      const updatedItems = state.items
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
      return { items: updatedItems };
    });
  },
  updateNotes: (itemId, notes) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      )
    }));
  },
  setPickupTime: (time) => set({ pickupTime: time }),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}));
