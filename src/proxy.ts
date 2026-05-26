import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  // Protect Onboarding and Dashboard pathways from guest access
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  if (isProtectedRoute && !token) {
    // Dynamic absolute redirect to main landing page
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Map edge routes to invoke middleware only on key user pathways
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*"
  ]
};
