// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import * as jose from "jose";

/**
 * Rotas públicas (exatas ou prefixos)
 * mantenha aqui tudo que precisa ser acessível sem auth.
 */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/seed",
  "/api/public",
  "/favicon.ico",
  "/logo-inventario.svg",
];

// Função helper pra checar se um pathname é público (startsWith)
function isPublicPath(pathname: string) {
  // Checa igualdade exata ou prefixo para rotas de API
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // LOG: sempre escreva quando o middleware for invocado
  console.log(`[middleware] interceptado: ${pathname}`);

  // Permite _next e assets sempre
  if (pathname.startsWith("/_next/") || pathname.startsWith("/static/")) {
    console.log(`[middleware] permitindo asset: ${pathname}`);
    return NextResponse.next();
  }

  // Rotas públicas
  if (isPublicPath(pathname)) {
    console.log(`[middleware] rota pública permitida: ${pathname}`);
    return NextResponse.next();
  }

  // Lê cookie auth_token
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    console.log("[middleware] token ausente -> redirecionando para /login");
    const res = NextResponse.redirect(new URL("/login", req.url));
    // marca header pra teste
    res.headers.set("x-middleware-result", "no-token");
    return res;
  }

  try {
    // verifica token (TextEncoder para chave em string)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    await jose.jwtVerify(token, secret);

    // Token ok
    console.log("[middleware] token válido");
    const res = NextResponse.next();
    res.headers.set("x-middleware-result", "auth-ok");
    return res;
  } catch (err) {
    console.error("[middleware] token inválido ou erro ao verificar:", err);
    const res = NextResponse.redirect(new URL("/login", req.url));
    // limpa cookie
    res.cookies.delete("auth_token");
    res.headers.set("x-middleware-result", "invalid-token");
    return res;
  }
}

/**
 * Matcher que garante que o middleware será invocado para todas as rotas
 * (incluindo a raiz '/'). Depois filtramos as rotas públicas no próprio código.
 */
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (Rotas de API)
     * - _next/static (Arquivos estáticos do Next.js)
     * - _next/image (Otimização de imagem do Next.js)
     * - favicon.ico (Arquivo Favicon)
     * - assets públicos (svg, png, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-inventario.svg).*)',
    '/' // Garante que a raiz também seja verificada
  ],
};
