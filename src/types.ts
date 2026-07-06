export type UserRole = "student" | "kitchen" | "manager" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  tags: string[];
  stockLevel?: number;
  veg?: boolean;
  rating?: number;
  prepTime?: number;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes?: string;
  veg?: boolean;
  rating?: number;
}

export type OrderStatus =
  | "placed"
  | "accepted"
  | "cooking"
  | "packing"
  | "ready"
  | "picked_up"
  | "cancelled";

export interface Order {
  id: string;
  token: string; // unique short token/order number (e.g. "A24", format: letter + 2 digits)
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  pickupTime: string; // e.g., "12:30 PM"
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}
