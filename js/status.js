import { API_BASE } from "./config.js";

export async function initApiStatus() {
  const el = document.getElementById("api-status");
  if (!el) return;

  if (!API_BASE) {
    el.textContent = "API not configured";
    el.className = "api-status api-status-error";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.ok) {
      el.textContent = "API live";
      el.className = "api-status api-status-ok";
      el.title = data.message || "Connected";
    } else {
      throw new Error("Unhealthy");
    }
  } catch (err) {
    el.textContent = "API offline";
    el.className = "api-status api-status-error";
    el.title = err.message || "Cannot reach API";
  }
}
