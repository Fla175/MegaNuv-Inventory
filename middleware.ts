// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import * as jose from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth",
  "/api/public",
  "/api/storage/upload-url",
  "/initial-setup",
  "/favicon.ico",
  "/logo-inventario.svg",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- ESCUDO DE PRIORIDADE 1: APIs PÚBLICAS E ESTÁTICOS ---
  if (
    pathname.startsWith('/api/public') || 
    pathname.startsWith('/_next/') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- ESCUDO DE PRIORIDADE 2: CHECAGEM DE SETUP ---
  // Apenas para navegação de páginas (root ou login)
  if (pathname === '/' || pathname === '/login') {
    try {
      const apiURL = new URL('/api/public/initial-check', req.url).href;
      const response = await fetch(apiURL);
      
      const contentType = response.headers.get("content-type");
      if (response.ok && contentType?.includes("application/json")) {
        const data = await response.json();
        if (data.requiresSetup && !pathname.startsWith('/initial-setup')) {
          return NextResponse.redirect(new URL("/initial-setup/register", req.url));
        }
      }
    } catch (e) {
      console.error("Erro no check de setup:", e);
      // Se a API de check falhar, não bloqueia o middleware
    }
  }

  // --- ESCUDO DE PRIORIDADE 3: ROTAS PÚBLICAS ---
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // --- ESCUDO DE PRIORIDADE 4: VALIDAÇÃO DE TOKEN ---
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    // BLINDAGEM: Se for API, retorna JSON. Nunca redirect.
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", message: "Token ausente" }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    await jose.jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    // BLINDAGEM: Se o token falhar na API, retorna JSON.
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", message: "Token expirado ou inválido" }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("auth_token");
    return res;
  }
}

// O Matcher deve ser amplo, mas o código interno do middleware filtra o que importa
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-inventario.svg).*)'],
};