import { useState } from "react";
import { parseSSE } from "@/hooks/useSSE";

export interface AnimateResult {
  animations: Array<{ animationKey: string; gcsGlbUrl: string; status: string }>;
}

export function useAnimate(onComplete: (r: AnimateResult) => void) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(model3dId: string, animations: string[]) {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline/animate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model3dId, animations }),
      });

      for await (const evt of parseSSE(res.body!)) {
        const data = JSON.parse(evt.data) as Record<string, unknown>;
        if (evt.event === "complete") {
          onComplete(data as unknown as AnimateResult);
          break;
        }
        if (evt.event === "error") throw new Error((data as { message?: string }).message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Animation failed");
    } finally {
      setRunning(false);
    }
  }

  return { running, error, run };
}
