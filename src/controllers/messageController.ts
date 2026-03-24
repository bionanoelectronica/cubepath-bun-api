import { sql } from "bun";

export async function messageHandler(req: Request, url: URL): Promise<Response> {
  const pathParts = url.pathname.split("/").filter(Boolean);
  const idParam = pathParts[2];
  const id = idParam ? parseInt(idParam, 10) : null;

  if (!id) {
     return new Response("Not Found", { status: 404 });
  }

  if (!id) {
     const messages = await sql`SELECT * FROM messages ORDER BY id ASC`;
     return Response.json(messages);
  }

  try {
    // GET /api/messages/:id
    if (req.method === "GET" && id) {
      const messages = await sql`SELECT * FROM messages WHERE id = ${id}`;
      if (messages.length === 0) return new Response("Not Found", { status: 404 });
      return Response.json(messages[0]);
    }

    // DELETE /api/messages/:id
    if (req.method === "DELETE") {
      const result = await sql`DELETE FROM messages WHERE id = ${id} RETURNING id`;
      if (result.length === 0) return new Response("Not Found", { status: 404 });
      return new Response(null, { status: 204 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: any) {
    console.error("Database error in messageHandler:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
