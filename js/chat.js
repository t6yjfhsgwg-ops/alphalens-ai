import { sendChatMessage } from "./api.js";

const WELCOME =
  "Hi! I'm **AlphaLens AI**. Ask about any stock — e.g. \"Analyze NVDA\" or \"How is Apple doing?\"";

const SUGGESTIONS = ["Analyze NVDA", "Compare AAPL and MSFT", "What is AI Score?"];

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatReply(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );
  html = html.replace(/\n/g, "<br>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  return html;
}

function getPageTicker() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("ticker");
  return t && /^[A-Z.]{1,10}$/i.test(t) ? t.toUpperCase() : null;
}

export function initChat() {
  if (document.getElementById("alphalens-chat-root")) return;

  const pageTicker = getPageTicker();
  const root = document.createElement("div");
  root.id = "alphalens-chat-root";
  root.innerHTML = `
    <button type="button" class="chat-fab" id="chat-fab" aria-label="Open AI chat" aria-expanded="false">
      <span class="chat-fab-icon">α</span>
    </button>
    <div class="chat-panel hidden" id="chat-panel" role="dialog" aria-label="AlphaLens AI chat">
      <div class="chat-header">
        <div>
          <strong>AlphaLens AI</strong>
          <span class="chat-header-sub">Stock assistant</span>
        </div>
        <button type="button" class="chat-close" id="chat-close" aria-label="Close chat">×</button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-suggestions" id="chat-suggestions"></div>
      <form class="chat-form" id="chat-form">
        <input type="text" id="chat-input" placeholder="Ask about a stock…" maxlength="500" autocomplete="off" />
        <button type="submit" class="btn btn-primary chat-send" id="chat-send">Send</button>
      </form>
    </div>
  `;
  document.body.appendChild(root);

  const fab = document.getElementById("chat-fab");
  const panel = document.getElementById("chat-panel");
  const messages = document.getElementById("chat-messages");
  const suggestions = document.getElementById("chat-suggestions");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  let busy = false;

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `chat-msg chat-msg-${role}`;
    div.innerHTML = role === "user" ? escapeHtml(text) : formatReply(text);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderSuggestions() {
    const items = pageTicker && !SUGGESTIONS.includes(`Analyze ${pageTicker}`)
      ? [`Analyze ${pageTicker}`, ...SUGGESTIONS]
      : SUGGESTIONS;
    suggestions.innerHTML = items
      .map((s) => `<button type="button" class="chat-chip" data-prompt="${escapeHtml(s)}">${escapeHtml(s)}</button>`)
      .join("");
    suggestions.querySelectorAll(".chat-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.prompt;
        form.requestSubmit();
      });
    });
  }

  function setOpen(open) {
    panel.classList.toggle("hidden", !open);
    fab.setAttribute("aria-expanded", String(open));
    if (open && messages.childElementCount === 0) {
      addMessage("assistant", WELCOME);
      renderSuggestions();
      if (pageTicker) input.placeholder = `Ask about ${pageTicker}…`;
      input.focus();
    }
  }

  fab.addEventListener("click", () => setOpen(panel.classList.contains("hidden")));
  document.getElementById("chat-close").addEventListener("click", () => setOpen(false));

  async function handleSend(text) {
    const msg = text.trim();
    if (!msg || busy) return;

    busy = true;
    sendBtn.disabled = true;
    suggestions.innerHTML = "";
    addMessage("user", msg);
    input.value = "";

    const typing = document.createElement("div");
    typing.className = "chat-msg chat-msg-assistant chat-typing";
    typing.textContent = "Analyzing…";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const { reply } = await sendChatMessage(msg);
      typing.remove();
      addMessage("assistant", reply);
    } catch (err) {
      typing.remove();
      const errText =
        err?.code === "NOT_CONFIGURED"
          ? "API URL is not configured. Set **PRODUCTION_API_URL** in config.js."
          : err?.code === "OFFLINE"
            ? "Cannot reach the API. Make sure the server is running."
            : err?.message || "Something went wrong. Try again.";
      addMessage("assistant", errText);
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSend(input.value);
  });
}
