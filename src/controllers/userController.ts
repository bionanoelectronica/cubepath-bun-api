import { sql } from "bun";

export async function userHandler(req: Request, url: URL): Promise<Response> {
  const pathParts = url.pathname.split("/").filter(Boolean);
  const idParam = pathParts[2];
  const id = idParam ? parseInt(idParam, 10) : null;
  const subroute = pathParts[3];

  try {
    // GET /api/users
    if (req.method === "GET" && !id) {
      const users = await sql`SELECT * FROM users ORDER BY id ASC`;
      return Response.json(users);
    }

    // GET /api/users/:id
    if (req.method === "GET" && id && !subroute) {
      const users = await sql`SELECT * FROM users WHERE id = ${id}`;
      if (users.length === 0) return new Response("Not Found", { status: 404 });
      return Response.json(users[0]);
    }

    // GET /api/users/:id/messages
    if (req.method === "GET" && id && subroute === "messages") {
      const messages = await sql`SELECT * FROM messages WHERE user_id = ${id} ORDER BY created_at ASC`;
      return Response.json(messages);
    }

    // POST /api/users
    if (req.method === "POST" && !id) {
      const body: any = await req.json();
      const { username, email } = body;
      
      const result = await sql`
        INSERT INTO users (username, email) 
        VALUES (${username}, ${email}) 
        ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
        RETURNING *
      `;
      return Response.json(result[0], { status: 201 });
    }

    // DELETE /api/users/:id
    if (req.method === "DELETE" && id) {
      const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
      if (result.length === 0) return new Response("Not Found", { status: 404 });
      return new Response(null, { status: 204 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: any) {
    console.error("Database error in userHandler:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
