// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import * as jose from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth",
  "/api/public",
  "/api/hello",
  "/initial-setup",
  "/favicon.svg",
  "/logo-inventory.svg",
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
  // if (pathname === '/' || pathname === '/login') {
  //   try {
  //     const baseApiURL = process.env.NEXT_SERVER_API_URL || req.nextUrl.origin;
  //     const apiURL = new URL('/api/public/initial-check', baseApiURL).href;
  //     const response = await fetch(apiURL);
  //
  //     const contentType = response.headers.get("content-type");
  //     if (response.ok && contentType?.includes("application/json")) {
  //       const data = await response.json();
  //       if (data.requiresSetup && !pathname.startsWith('/initial-setup')) {
  //         return NextResponse.redirect(new URL("/initial-setup/register", req.url));
  //       }
  //     }
  //   } catch (e) {
  //     toast.showError(`Erro no check de setup: ${e}`);
  //   }
  // }
  // Nota: este escudo está comentado (client-side em pages/login.tsx). Fragilidade conhecida.

  // --- ESCUDO DE PRIORIDADE 3: ROTAS PÚBLICAS ---
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // --- ESCUDO DE PRIORIDADE 4: VALIDAÇÃO DE TOKEN ---
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
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
  } catch {
    if (pathname.startsWith("/api/")) {
      // Em vez de redirect, retornamos um erro JSON puro que o componente consegue ler
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", message: "Sessão expirada. Recarregue a página." }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("auth_token");
    return res;
  }
}

export const config = {
  // Apenas estáticos do Next e assets públicos ficam fora do middleware.
  // `qrcode` e `api/qrcode` saíram da exclusão: com o endpoint tornado privado,
  // a proteção de rota e a do handler passam a ser coerentes.
  matcher: ['/((?!_next/static|_next/image|favicon.svg|logo-inventory.svg).*)'],
};
