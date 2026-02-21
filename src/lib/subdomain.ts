/**
 * Subdomain URL utilities for path-based routing
 */

/**
 * Get the URL for a restaurant using path-based routing
 * @param restaurantSlug - The restaurant slug
 * @param menuId - Optional menu ID to include in the path
 * @returns The full URL
 */
export function getSubdomainUrl(restaurantSlug: string, menuId?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dineeasy.app";
  const baseUrl = `${appUrl}/r/${restaurantSlug}`;
  return menuId ? `${baseUrl}/${menuId}` : baseUrl;
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