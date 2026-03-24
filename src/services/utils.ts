export async function* parseSSEStream(responseBody: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
  const reader = responseBody.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
        try {
          const data = JSON.parse(trimmed.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Ignore incomplete JSON chunks
        }
      }
    }
  }
}
