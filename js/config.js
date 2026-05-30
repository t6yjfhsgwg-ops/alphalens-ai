/**
 * API URL configuration.
 * - Local: localhost:3000
 * - Vercel: same-origin /api (proxied to Railway via vercel.json)
 * - Other hosts: PRODUCTION_API_URL or meta api-base
 */
const PRODUCTION_API_URL = "https://alphalens-ai-production.up.railway.app";

function resolveApiBase() {
  const host = location.hostname;

  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3000";
  }

  // Vercel: /api/* rewrites to Railway — avoids CORS and wrong API URL
  if (host.endsWith(".vercel.app")) {
    return location.origin;
  }

  const meta = document.querySelector('meta[name="api-base"]');
  if (meta?.content?.trim()) {
    return meta.content.trim().replace(/\/$/, "");
  }

  if (PRODUCTION_API_URL) {
    return PRODUCTION_API_URL.replace(/\/$/, "");
  }

  return "";
}

export const API_BASE = resolveApiBase();

export function isApiConfigured() {
  return Boolean(API_BASE);
}
