"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // menu_item id
  title: Record<string, string>; // Multi-language title
  description: Record<string, string | null>; // Multi-language description
  price: number; // price_chf
  image_url: string | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  restaurantSlug: string | null;
  menuId: string | null;
  
  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (restaurantId: string, restaurantSlug: string, menuId: string) => void;
  
  // Computed
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantSlug: null,
      menuId: null,

      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          // Increase quantity if item already exists
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          // Add new item with quantity 1
          set({
            items: [...currentItems, { ...item, quantity: 1 }],
          });
        }
      },

      removeItem: (itemId) => {
        set({
          items: get().items.filter((item) => item.id !== itemId),
        });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({
          items: [],
          restaurantId: null,
          restaurantSlug: null,
          menuId: null,
        });
      },

      setRestaurant: (restaurantId, restaurantSlug, menuId) => {
        const current = get();
        // If switching restaurants, clear cart
        if (current.restaurantId && current.restaurantId !== restaurantId) {
          set({
            items: [],
            restaurantId,
            restaurantSlug,
            menuId,
          });
        } else {
          set({
            restaurantId,
            restaurantSlug,
            menuId,
          });
        }
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "dineeasy-cart",
      // Only persist cart data, not computed values
    }
  )
);
