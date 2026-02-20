/**
 * Subdomain URL utilities for multi-tenant routing
 */

/**
 * Get the subdomain URL for a restaurant
 * @param restaurantSlug - The restaurant slug (subdomain)
 * @param menuId - Optional menu ID to include in the path
 * @returns The full subdomain URL
 */
/**
 * Get the subdomain URL for a restaurant
 * Uses environment variables for production domain configuration
 */
export function getSubdomainUrl(restaurantSlug: string, menuId?: string): string {
  const isDevelopment = process.env.NODE_ENV === "development";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "dineeasy.app";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${appDomain}`;

  if (typeof window !== "undefined") {
    // Client-side: use current window location
    const host = window.location.host;
    const protocol = window.location.protocol;

    if (isDevelopment || host.includes("localhost")) {
      const port = host.includes(":") ? host.split(":")[1] : "3000";
      const baseUrl = `${protocol}//${restaurantSlug}.localhost:${port}`;
      return menuId ? `${baseUrl}/${menuId}` : baseUrl;
    } else {
      // Production: use configured domain
      const baseUrl = `${protocol}//${restaurantSlug}.${appDomain}`;
      return menuId ? `${baseUrl}/${menuId}` : baseUrl;
    }
  } else {
    // Server-side: construct from environment
    if (isDevelopment) {
      const baseUrl = `http://${restaurantSlug}.localhost:3000`;
      return menuId ? `${baseUrl}/${menuId}` : baseUrl;
    } else {
      // Use configured domain from environment
      const baseUrl = `https://${restaurantSlug}.${appDomain}`;
      return menuId ? `${baseUrl}/${menuId}` : baseUrl;
    }
  }
}

/**
 * Extract subdomain from host header
 * Supports both localhost (development) and production domains
 * @param host - The host header value (e.g., "subdomain.dineeasy.app" or "subdomain.localhost:3000")
 * @returns The subdomain or null if not a subdomain
 */
export function extractSubdomain(host: string): string | null {
  if (!host) return null;

  const isLocalhost = host.includes("localhost");
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "dineeasy.app";
  const isProduction = host.includes(appDomain);

  if (!isLocalhost && !isProduction) return null;

  const hostParts = host.split(":");
  const hostname = hostParts[0];
  const parts = hostname.split(".");

  // Handle localhost subdomains: subdomain.localhost
  if (isLocalhost && parts.length > 1 && parts[1] === "localhost") {
    const subdomain = parts[0];
    // Exclude main domain indicators
    if (subdomain === "localhost" || subdomain === "www" || subdomain === "127" || !subdomain) {
      return null;
    }
    return subdomain;
  }

  // Handle production: subdomain.{appDomain}
  if (isProduction && parts.length >= 3) {
    const subdomain = parts[0];
    // Exclude main domain indicators
    if (subdomain === "www" || subdomain === appDomain.split(".")[0] || !subdomain) {
      return null;
    }
    return subdomain;
  }

  return null;
}
