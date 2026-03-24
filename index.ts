import { chatHandler } from "./src/controllers/chatController";
import { userHandler } from "./src/controllers/userController";
import { initDb } from "./src/db/init";
import { conversationHandler } from "./src/controllers/conversationController";
import { messageHandler } from "./src/controllers/messageController";

// Run table creation script on startup
await initDb();

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/") {
      return new Response(Bun.file("./public/index.html"));
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (url.pathname === "/chat") {
      return chatHandler(req);
    }

    if (url.pathname.startsWith("/api/users")) {
      return userHandler(req, url);
    }

    if (url.pathname.startsWith("/api/conversations")) {
      return conversationHandler(req, url);
    }

    if (url.pathname.startsWith("/api/messages")) {
      return messageHandler(req, url);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);