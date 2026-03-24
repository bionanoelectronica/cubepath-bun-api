import type { AIProvider } from "./aiProvider";
import { parseSSEStream } from "./utils";

export class CerebrasProvider implements AIProvider {
  name = "cerebras";

  async *chatStream(messages: any[]): AsyncGenerator<string, void, unknown> {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3.1-8b", // Generic open model on Cerebras
        messages,
        stream: true
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cerebras API Error: ${res.status} HTTP -> ${text}`);
    }

    if (!res.body) return;
    yield* parseSSEStream(res.body);
  }
}
