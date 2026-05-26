export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/img-proxy?url=<encoded-image-url>
 *
 * Server-side image proxy — fetches the image from the remote URL
 * (no CORS restrictions on the server) and streams it back to the client
 * with permissive CORS headers.
 *
 * Used by face-api.js in the onboarding step to load Google profile photos,
 * which do NOT support CORS `anonymous` from the browser directly.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Basic allowlist — only proxy known image origins
  const allowed = [
    "googleusercontent.com",
    "res.cloudinary.com",
    "firebasestorage.googleapis.com",
  ];
  const isAllowed = allowed.some((host) => url.includes(host));
  if (!isAllowed) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Cheerio2026/1.0" },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream fetch failed" },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[img-proxy] error:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
