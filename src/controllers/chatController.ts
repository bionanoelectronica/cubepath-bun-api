import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

export async function chatHandler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    let messages;
    try {
      const body: any = await req.json();
      messages = body.messages;
    } catch (e) {
      // Body might be empty or not JSON, fallback to default message
    }

    // Default message if not provided in the request
    if (!messages || !Array.isArray(messages)) {
      messages = [
        {
          role: "user",
          content: "How many r's are in the word 'strawberry'?",
        },
      ];
    }

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: "openrouter/free",
        stream: true,
        messages: messages,
      }
    } as any);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream as any) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // Send the raw text to the client immediately
              controller.enqueue(encoder.encode(content));
              process.stdout.write(content); // Also log it in the server console
            }
            if (chunk.usage) {
              const reasoningTokens = (chunk.usage as any).reasoningTokens;
              console.log("\\nReasoning tokens:", reasoningTokens);
            }
          }
          console.log(); // Add newline after stream ends
          controller.close();
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in chatHandler:", error);
    const statusCode = error.code || error.status || 500;
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}
