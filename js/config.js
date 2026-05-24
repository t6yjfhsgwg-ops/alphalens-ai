/**
 * API URL configuration.
 * - Local: uses localhost:3000 automatically
 * - Production: set your Railway/Render URL below after deploying the backend
 */
const PRODUCTION_API_URL = "https://alphalens-ai-production.up.railway.app";

function resolveApiBase() {
  const meta = document.querySelector('meta[name="api-base"]');
  if (meta?.content?.trim()) {
    return meta.content.trim().replace(/\/$/, "");
  }

  const host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3000";
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
