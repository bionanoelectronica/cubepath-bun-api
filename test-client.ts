const res = await fetch("http://localhost:3000/chat", {
  method: "POST",
  body: JSON.stringify({ messages: [{ role: "user", content: "Hi" }] }),
  headers: { "Content-Type": "application/json" }
});
console.log(res.status);
console.log(await res.text());
