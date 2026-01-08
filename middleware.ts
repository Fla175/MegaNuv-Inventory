// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import * as jose from "jose";

/**
 * Rotas públicas (exatas ou prefixos).
 * Inclui a rota de checagem de setup e a rota de cadastro inicial.
 */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/seed",
  "/api/public", // Permite acesso a /api/public/*
  "/initial-setup", // Permite acesso a /initial-setup/*
  "/favicon.ico",
  "/logo-inventario.svg",
];

// Função helper pra checar se um pathname é público (startsWith)
function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`[middleware] interceptado: ${pathname}`);

  // Permite _next e assets sempre
  if (pathname.startsWith("/_next/") || pathname.startsWith("/static/")) {
    return NextResponse.next();
  }
  
  // ------------------------------------------------
  // NOVO: VERIFICAÇÃO DE CONFIGURAÇÃO INICIAL (SETUP)
  // ------------------------------------------------
  // Executa a checagem no endpoint de API público
  if (pathname === '/' || pathname === '/login') {
      const apiURL = new URL('/api/public/initial-check', req.url).href;
      
      try {
          // Nota: Você DEVE garantir que /api/public/initial-check.ts está criado!
          const response = await fetch(apiURL);
          const data = await response.json();

          if (data.requiresSetup) {
              if (!pathname.startsWith('/initial-setup')) {
                  console.log("[middleware] 0 usuários -> redirecionando para /initial-setup/register");
                  return NextResponse.redirect(new URL("/initial-setup/register", req.url));
              }
          }
      } catch (error) {
          console.error("Erro ao verificar setup inicial:", error);
          // Em caso de erro (DB off), assuma que precisa de setup
          if (!pathname.startsWith('/initial-setup')) {
              return NextResponse.redirect(new URL("/initial-setup/register", req.url));
          }
      }
  }
  // ------------------------------------------------
  
  // Rotas públicas (Após a checagem, verifica o caminho atual)
  if (isPublicPath(pathname)) {
    console.log(`[middleware] rota pública permitida: ${pathname}`);
    return NextResponse.next();
  }

  // Se não é rota pública, exige token
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    console.log("[middleware] token ausente -> redirecionando para /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // verifica token (Mantida a lógica jose para a Edge Runtime)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    await jose.jwtVerify(token, secret);

    // Token ok
    console.log("[middleware] token válido");
    return NextResponse.next();
  } catch (err) {
    console.error("[middleware] token inválido ou erro ao verificar:", err);
    const res = NextResponse.redirect(new URL("/login", req.url));
    // limpa cookie
    res.cookies.delete("auth_token");
    return res;
  }
}

/**
 * Matcher que garante que o middleware será invocado para todas as rotas
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo-inventario.svg).*)',
    '/'
  ],
};