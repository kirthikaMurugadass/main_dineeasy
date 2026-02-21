/**
 * Subdomain URL utilities for path-based routing
 */

/**
 * Get the URL for a restaurant using path-based routing
 * Since there's only one menu per restaurant, menuId is not needed in the URL
 * @param restaurantSlug - The restaurant slug
 * @param menuId - Deprecated: Not used anymore (one menu per restaurant)
 * @returns The full URL
 */
export function getSubdomainUrl(restaurantSlug: string, menuId?: string): string {
  if (!restaurantSlug) return "";
  
  // Get the site URL from environment or detect from current location
  let appUrl: string;
  
  if (typeof window !== "undefined") {
    // Client-side: use current window location
    appUrl = `${window.location.protocol}//${window.location.host}`;
  } else {
    // Server-side: use environment variable or default
    appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dineeasy.app";
  }
  
  // Remove trailing slash if present
  appUrl = appUrl.replace(/\/$/, "");
  
  // Return URL without menuId since we have one menu per restaurant
  // Format: https://domain.com/r/restaurant-slug
  return `${appUrl}/r/${restaurantSlug}`;
}

/**
 * Extract subdomain - Currently not used
 * Kept for potential future SaaS expansion
 * @param host - The host header value
 * @returns Always null (subdomain logic disabled)
 */
export function extractSubdomain(host: string): string | null {
  // Subdomain architecture disabled → return null
  return null;
}