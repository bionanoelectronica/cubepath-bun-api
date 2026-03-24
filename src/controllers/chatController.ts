import { OpenRouter } from "@openrouter/sdk";
import { sql } from "bun";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

export async function chatHandler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    let messages;
    let userFromReq;
    try {
      const body: any = await req.json();
      messages = body.messages;
      userFromReq = body.user;
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

    let userId = null;
    let conversationId = null;

    if (userFromReq && userFromReq.username && userFromReq.email) {
      try {
        const userResult = await sql`
          INSERT INTO users (username, email) VALUES (${userFromReq.username}, ${userFromReq.email})
          ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
          RETURNING id
        `;
        userId = userResult[0].id;
        
        const convResult = await sql`INSERT INTO conversations DEFAULT VALUES RETURNING id`;
        conversationId = convResult[0].id;

        const lastMsg = messages[messages.length - 1]?.content;
        if (lastMsg) {
          await sql`
            INSERT INTO messages (conversation_id, user_id, role, content)
            VALUES (${conversationId}, ${userId}, 'user', ${lastMsg})
          `;
        }
      } catch (dbErr) {
        console.error("DB Save Error:", dbErr);
      }
    }

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: "openrouter/free",
        stream: true,
        messages: messages,
      }
    } as any);

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream as any) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
              process.stdout.write(content);
            }
            if (chunk.usage) {
              const reasoningTokens = (chunk.usage as any).reasoningTokens;
              console.log("\\nReasoning tokens:", reasoningTokens);
            }
          }
          console.log(); // Add newline after stream ends
          
          if (userId && conversationId && fullResponse) {
             try {
               await sql`
                 INSERT INTO messages (conversation_id, user_id, role, content)
                 VALUES (${conversationId}, ${userId}, 'assistant', ${fullResponse})
               `;
             } catch (dbErr) {
               console.error("DB Save AI Message Error:", dbErr);
             }
          }

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
