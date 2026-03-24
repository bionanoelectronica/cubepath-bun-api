import { sql } from "bun";

export async function conversationHandler(req: Request, url: URL): Promise<Response> {
  const pathParts = url.pathname.split("/").filter(Boolean);
  const idParam = pathParts[2];
  const id = idParam ? parseInt(idParam, 10) : null;
  const subroute = pathParts[3]; // "messages"

  try {
    // Helper: POST /api/conversations (to create a conversation)
    if (req.method === "POST" && !id) {
       const result = await sql`INSERT INTO conversations DEFAULT VALUES RETURNING *`;
       return Response.json(result[0], { status: 201 });
    }
    
    // GET /api/conversations
    if (req.method === "GET" && !id) {
      const convs = await sql`SELECT * FROM conversations ORDER BY id ASC`;
      for (const c of convs) {
        c.messages = await sql`SELECT * FROM messages WHERE conversation_id = ${c.id} ORDER BY id ASC`;
      }
      return Response.json(convs);
    }

    // GET /api/conversations/:id
    if (req.method === "GET" && id && !subroute) {
      const convs = await sql`SELECT * FROM conversations WHERE id = ${id}`;
      if (convs.length === 0) return new Response("Not Found", { status: 404 });
      const messages = await sql`SELECT * FROM messages WHERE conversation_id = ${id} ORDER BY id ASC`;
      convs[0].messages = messages;
      return Response.json(convs[0]);
    }

    // DELETE /api/conversations/:id
    if (req.method === "DELETE" && id && !subroute) {
      const result = await sql`DELETE FROM conversations WHERE id = ${id} RETURNING id`;
      if (result.length === 0) return new Response("Not Found", { status: 404 });
      return new Response(null, { status: 204 });
    }

    // GET /api/conversations/:id/messages
    if (req.method === "GET" && id && subroute === "messages") {
      const checkResult = await sql`SELECT id FROM conversations WHERE id = ${id}`;
      if (checkResult.length === 0) return new Response("Conversation Not Found", { status: 404 });

      const messages = await sql`SELECT * FROM messages WHERE conversation_id = ${id} ORDER BY id ASC`;
      return Response.json(messages);
    }

    // POST /api/conversations/:id/messages
    if (req.method === "POST" && id && subroute === "messages") {
      const checkResult = await sql`SELECT id FROM conversations WHERE id = ${id}`;
      if (checkResult.length === 0) return new Response("Conversation Not Found", { status: 404 });

      const body: any = await req.json();
      const { role, content, user_id } = body;
      
      const result = await sql`
        INSERT INTO messages (conversation_id, user_id, role, content) 
        VALUES (${id}, ${user_id || null}, ${role}, ${content}) 
        RETURNING *
      `;
      return Response.json(result[0], { status: 201 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: any) {
    console.error("Database error in conversationHandler:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
