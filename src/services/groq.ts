import type { AIProvider } from "./aiProvider";
import { parseSSEStream } from "./utils";

export class GroqProvider implements AIProvider {
  name = "groq";

  async *chatStream(messages: any[]): AsyncGenerator<string, void, unknown> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", // Use a generic available Groq model
        messages,
        stream: true
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq API Error: ${res.status} HTTP -> ${text}`);
    }

    if (!res.body) return;
    yield* parseSSEStream(res.body);
  }
}
