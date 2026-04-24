// lib/version.ts
// Versão dinâmica - baseada em npm_package_version (disponível durante build)
export const VERSION = process.env.npm_package_version || "1.0.0";
export const BUILD_DATE = new Date().toISOString().split("T")[0];