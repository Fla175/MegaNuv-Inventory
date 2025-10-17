// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import * as jose from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/seed",
  "/api/public",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔓 Permite acesso a rotas públicas e assets do Next
  if (
    PUBLIC_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo-inventario.svg")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  // 🚫 Sem token → redireciona pro login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // ✅ Verifica token JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jose.jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    console.error("Token inválido:", err);
    // 🔁 Token inválido → redireciona pro login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/|_static/|favicon.ico|logo-inventario.svg|api/public).*)",
  ],
};
