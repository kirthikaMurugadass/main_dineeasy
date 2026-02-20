import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { extractSubdomain } from "@/lib/subdomain";

/**
 * Production-ready middleware for subdomain-based multi-tenant routing
 * 
 * Handles:
 * - Subdomain detection and extraction
 * - Route rewriting for restaurant menus
 * - Admin/API route exclusion
 * - Session management
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Handle preview routes - set X-Frame-Options to SAMEORIGIN for iframe embedding
  if (pathname.startsWith("/preview")) {
    const response = await updateSession(request);
    // Override X-Frame-Options header to allow iframe embedding
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    return response;
  }

  // Skip subdomain routing for:
  // - Admin routes
  // - API routes
  // - Auth routes (including route groups)
  // - Login/signup pages (old and new)
  // - Static files and Next.js internals
  const skipSubdomainRouting =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/i);

  if (skipSubdomainRouting) {
    return await updateSession(request);
  }

  // Extract subdomain from host
  const subdomain = extractSubdomain(host);

  if (subdomain) {
    // Validate subdomain format (alphanumeric, hyphens, underscores only)
    const isValidSubdomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(subdomain);
    
    if (!isValidSubdomain) {
      // Invalid subdomain format, return 400
      return new NextResponse("Invalid subdomain format", { status: 400 });
    }

    // Root path - show default menu for this restaurant
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/public-menu/${subdomain}`;
      url.search = request.nextUrl.search;
      return NextResponse.rewrite(url);
    }

    // Extract menuId from path
    // Supports: /menu-{id}, /{menuId}, or any path segment
    const menuIdMatch = pathname.match(/^\/(menu-)?([^/]+)$/);
    if (menuIdMatch) {
      const menuId = menuIdMatch[2];
      const url = request.nextUrl.clone();
      url.pathname = `/public-menu/${subdomain}/${menuId}`;
      url.search = request.nextUrl.search;
      return NextResponse.rewrite(url);
    }

    // For nested paths, rewrite to public-menu route
    // This handles cases like /category/items etc.
    const url = request.nextUrl.clone();
    url.pathname = `/public-menu/${subdomain}${pathname}`;
    url.search = request.nextUrl.search;
    return NextResponse.rewrite(url);
  }

  // Continue with normal session update for other routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
