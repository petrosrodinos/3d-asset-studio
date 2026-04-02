/**
 * Parses an SSE stream from a ReadableStream into discrete { event, data } objects.
 * Create a new instance per request to keep buffers isolated.
 */
export class SSEParser {
  #buffer = "";

  /**
   * Feed a decoded text chunk and receive any complete events.
   * @param {string} chunk
   * @returns {{ event: string; data: unknown }[]}
   */
  parse(chunk) {
    this.#buffer += chunk;
    const events = [];
    const parts = this.#buffer.split("\n\n");
    this.#buffer = parts.pop() ?? "";

    for (const part of parts) {
      let event = "message";
      let data = "";
      for (const line of part.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) data = line.slice(6).trim();
      }
      if (!data) continue;
      try {
        events.push({ event, data: JSON.parse(data) });
      } catch {
        // malformed chunk — skip
      }
    }
    return events;
  }
}

/**
 * Stream POST /api/chat and yield parsed SSE events via a callback.
 * @param {string} message
 * @param {{ role: string; content: string }[]} history
 * @param {(event: string, data: unknown) => void} onEvent
 */
export async function streamChat(message, history, onEvent) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: history.slice(-20) }),
  });
  await consumeSSEStream(res, onEvent);
}

/**
 * Stream POST /api/tripo/pipeline with an image file and yield SSE events.
 * @param {File} file
 * @param {string[]} animations
 * @param {string} modelVersion
 * @param {(event: string, data: unknown) => void} onEvent
 */
export async function streamPipeline(file, animations, modelVersion, onEvent) {
  const form = new FormData();
  form.append("image", file);
  animations.forEach((a) => form.append("animations", a));
  if (modelVersion) form.append("modelVersion", modelVersion);

  const res = await fetch("/api/tripo/pipeline", { method: "POST", body: form });
  await consumeSSEStream(res, onEvent);
}

/**
 * POST /api/aiml/generate — returns parsed JSON response.
 * @param {string} prompt
 * @param {string} model
 */
export async function generateImage(prompt, model) {
  const res = await fetch("/api/aiml/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });
  return res.json();
}

/**
 * Fetch both service balances in parallel.
 * @returns {Promise<{ aiml: unknown; tripo: unknown }>}
 */
export async function fetchBalances() {
  const [aiml, tripo] = await Promise.all([
    fetch("/api/balance/aiml").then((r) => r.json()),
    fetch("/api/balance/tripo").then((r) => r.json()),
  ]);
  return { aiml, tripo };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function consumeSSEStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new SSEParser();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const { event, data } of parser.parse(chunk)) {
      onEvent(event, data);
    }
  }
}
