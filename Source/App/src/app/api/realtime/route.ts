import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection handshake
  writer.write(
    encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId: session.id, role: session.role })}\n\n`)
  );

  // Periodic heartbeat every 15 seconds to keep connection alive
  const interval = setInterval(async () => {
    try {
      await writer.write(
        encoder.encode(`event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`)
      );
    } catch (e) {
      clearInterval(interval);
    }
  }, 15000);

  request.signal.addEventListener("abort", () => {
    clearInterval(interval);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
