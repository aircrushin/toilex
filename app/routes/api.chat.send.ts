import type { Route } from "./+types/api.chat.send";
import { chatStore } from "../lib/chatStore";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const roomId = formData.get("roomId") as string;
  const message = formData.get("message") as string;

  if (!userId || !roomId || !message) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const success = chatStore.sendMessage(userId, roomId, message);

  if (!success) {
    return Response.json({ error: "Failed to send message" }, { status: 400 });
  }

  return Response.json({ success: true });
}
