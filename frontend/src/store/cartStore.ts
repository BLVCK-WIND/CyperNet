import { create } from 'zustand';
import type { ItemResponse } from '@/types/item';
import type { PaymentMethod } from '@/types/order';

export interface CartItem {
  item: ItemResponse;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  isOpen: boolean;

  addItem: (item: ItemResponse) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setIsOpen: (isOpen: boolean) => void;
  clearCart: () => void;

  getTotalCount: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: 'CASH',
  isOpen: false,

  addItem: (item: ItemResponse) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.item.id === item.id);

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      set({ items: updated });
    } else {
      set({ items: [...items, { item, quantity: 1 }] });
    }
  },

  removeItem: (itemId: number) => {
    const { items } = get();
    set({ items: items.filter((i) => i.item.id !== itemId) });
  },

  updateQuantity: (itemId: number, delta: number) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.item.id === itemId);

    if (existingIndex > -1) {
      const updated = [...items];
      const newQuantity = updated[existingIndex].quantity + delta;

      if (newQuantity <= 0) {
        set({ items: items.filter((i) => i.item.id !== itemId) });
      } else {
        updated[existingIndex].quantity = newQuantity;
        set({ items: updated });
      }
    }
  },

  setPaymentMethod: (paymentMethod: PaymentMethod) => {
    set({ paymentMethod });
  },

  setIsOpen: (isOpen: boolean) => {
    set({ isOpen });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalCount: () => {
    return get().items.reduce((total, i) => total + i.quantity, 0);
  },

  getTotalAmount: () => {
    return get().items.reduce((total, i) => total + i.item.price * i.quantity, 0);
  },
}));
