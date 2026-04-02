/** Escape a string for safe HTML insertion. */
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(text ?? "")));
  return div.innerHTML;
}

/** Current time formatted as HH:MM. */
export function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Minimal markdown → HTML: bold, italic, inline code, fenced code blocks, line breaks.
 * Escapes HTML first to prevent injection.
 */
export function renderMarkdown(text) {
  return escapeHtml(text)
    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre>$1</pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

/** Scroll the messages container to the bottom. */
export function scrollToBottom() {
  const el = document.getElementById("messages");
  if (el) el.scrollTop = el.scrollHeight;
}

/** Update the status bar text. */
export function updateStatus(text) {
  const el = document.getElementById("status-bar");
  if (el) el.textContent = text;
}
