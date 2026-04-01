import { TOOLS } from "./constants.js";
import { fetchBalances } from "./api.js";
import { addSystemMessage } from "./chat.js";

// ── Public: boot the sidebar ──────────────────────────────────────────────────

export function initSidebar() {
  populateToolList();
}

// ── Public: toggle tool list visibility ──────────────────────────────────────

export function toggleToolList() {
  const list = document.getElementById("tool-list");
  const icon = document.getElementById("tool-list-icon");
  if (!list) return;
  const hidden = list.classList.toggle("hidden");
  if (icon) icon.textContent = hidden ? "+" : "−";
}

// ── Public: fetch and display balances ────────────────────────────────────────

export async function checkBalance() {
  const display = document.getElementById("balance-display");
  if (display) display.classList.remove("hidden");

  setBalanceText("balance-aiml-value", "…");
  setBalanceText("balance-tripo-value", "…");

  try {
    const { aiml, tripo } = await fetchBalances();

    const aimlText = aiml?.balance != null
      ? `$${parseFloat(aiml.balance).toFixed(4)}`
      : aiml?.error ?? "—";
    const tripoText = tripo?.data?.balance != null
      ? String(tripo.data.balance)
      : tripo?.error ?? "—";

    setBalanceText("balance-aiml-value", aimlText);
    setBalanceText("balance-tripo-value", tripoText);

    addSystemMessage(`Balance — AIML: ${aimlText} · Tripo: ${tripoText}`);
  } catch (err) {
    setBalanceText("balance-aiml-value", "Error");
    setBalanceText("balance-tripo-value", "Error");
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

function populateToolList() {
  const container = document.getElementById("tool-list");
  if (!container) return;

  for (const tool of TOOLS) {
    const div = document.createElement("div");
    div.className = "tool-item font-mono";
    div.textContent = tool;
    // Let app.js handle what happens on click via custom event, or just set input directly
    div.addEventListener("click", () => {
      const input = /** @type {HTMLTextAreaElement} */ (document.getElementById("chat-input"));
      if (input) {
        input.value = `use ${tool}`;
        input.dispatchEvent(new Event("input"));
        input.focus();
      }
    });
    container.appendChild(div);
  }
}

function setBalanceText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
