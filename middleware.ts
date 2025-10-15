import { NextResponse, NextRequest } from "next/server";
import * as jose from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api",
  "/favicon.ico",
  "/logo-inventario.svg",
];

// Middleware principal
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Libera rotas públicas e _next
  if (
    PUBLIC_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    // Nenhum token → redireciona para login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jose.jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    console.error("JWT inválido:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// matcher sem capturing group
export const config = {
  matcher: ["/((?!_next/|_static/|api/|favicon.ico|logo-inventario.svg).*)"],
};
