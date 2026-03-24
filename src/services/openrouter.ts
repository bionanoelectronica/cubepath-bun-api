import type { AIProvider } from "./aiProvider";
import { OpenRouter } from "@openrouter/sdk";

export class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  private client: OpenRouter;

  constructor() {
    this.client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
  }

  async *chatStream(messages: any[]): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.chat.send({
      chatGenerationParams: {
        model: "openrouter/free",
        stream: true,
        messages: messages,
      }
    } as any);

    for await (const chunk of stream as any) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
