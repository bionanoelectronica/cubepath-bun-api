import type { AIProvider } from "./aiProvider";
import { OpenRouterProvider } from "./openrouter";
import { GroqProvider } from "./groq";
import { CerebrasProvider } from "./cerebras";

class RoundRobinService {
  private providers: AIProvider[] = [];
  private currentIndex = 0;

  constructor() {
    if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('your_test_key')) {
      this.providers.push(new OpenRouterProvider());
    }
    if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_groq_key')) {
      this.providers.push(new GroqProvider());
    }
    if (process.env.CEREBRAS_API_KEY && !process.env.CEREBRAS_API_KEY.includes('your_cerebras_key')) {
      this.providers.push(new CerebrasProvider());
    }

    if (this.providers.length === 0) {
      console.warn("No valid AI API Keys configured. Please check your .env file.");
    }
  }

  getNextProvider(): AIProvider {
    if (this.providers.length === 0) {
      throw new Error("No AI API Keys configured in .env");
    }
    const provider = this.providers[this.currentIndex]!;
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
    return provider;
  }
}

export const aiRouter = new RoundRobinService();
