const RESTAURANT_NAME_KEY = "dineeasy:restaurantName";
const RESTAURANT_ID_KEY = "dineeasy:restaurantId";

export function getCachedRestaurantName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(RESTAURANT_NAME_KEY) || "";
}

export function getCachedRestaurantId(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(RESTAURANT_ID_KEY) || "";
}

export function setCachedRestaurant(data: { id?: string | null; name?: string | null }) {
  if (typeof window === "undefined") return;
  if (data.name) window.localStorage.setItem(RESTAURANT_NAME_KEY, data.name);
  if (data.id) window.localStorage.setItem(RESTAURANT_ID_KEY, data.id);
}

export function clearCachedRestaurant() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RESTAURANT_NAME_KEY);
  window.localStorage.removeItem(RESTAURANT_ID_KEY);
}
