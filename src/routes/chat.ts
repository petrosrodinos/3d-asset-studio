import { Router } from "express";
import { ChatMessage } from "../integrations/aimlapi/types";
import { sseHeaders, sseWrite } from "../lib/sse";
import { agentModel, getAiml, getHandlers, getTools } from "../services";

const router = Router();

router.post("/", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history: ChatMessage[];
  };

  sseHeaders(res);

  const aiml = getAiml();
  const tools = getTools();
  const handlers = getHandlers();
  const model = agentModel();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an API operations agent for 3D figure generation. Use tools to execute user requests. " +
        "For 3D models use Tripo tools. For images or AI tasks use AIML tools. Be concise.",
    },
    ...(history as ChatMessage[]),
    { role: "user", content: message },
  ];

  try {
    for (let round = 0; round < 8; round++) {
      const response = await aiml.chatCompletion({
        model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2,
      });

      const choice = response.choices[0];
      if (!choice) break;

      const assistantMsg = choice.message;
      const toolCalls = assistantMsg.tool_calls ?? [];

      messages.push({
        role: "assistant",
        content: assistantMsg.content ?? "",
        tool_calls: assistantMsg.tool_calls,
      });

      if (!toolCalls.length) {
        sseWrite(res, "text", { content: assistantMsg.content ?? "Done." });
        break;
      }

      for (const call of toolCalls) {
        sseWrite(res, "tool_call", {
          id: call.id,
          name: call.function.name,
          arguments: call.function.arguments,
        });

        try {
          const args = call.function.arguments
            ? (JSON.parse(call.function.arguments) as Record<string, unknown>)
            : {};
          const handler = handlers[call.function.name];
          if (!handler) throw new Error(`Unknown tool: ${call.function.name}`);

          const result = await handler(args);
          const resultStr = JSON.stringify(result, null, 2);

          sseWrite(res, "tool_result", {
            id: call.id,
            name: call.function.name,
            result: resultStr,
          });
          messages.push({ role: "tool", tool_call_id: call.id, content: resultStr });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sseWrite(res, "tool_error", { id: call.id, name: call.function.name, error: msg });
          messages.push({ role: "tool", tool_call_id: call.id, content: `Tool error: ${msg}` });
        }
      }
    }
  } catch (err) {
    sseWrite(res, "error", { message: err instanceof Error ? err.message : String(err) });
  } finally {
    sseWrite(res, "done", {});
    res.end();
  }
});

export default router;
