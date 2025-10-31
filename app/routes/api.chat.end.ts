import type { Route } from "./+types/api.chat.end";
import { chatStore } from "../lib/chatStore";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const roomId = formData.get("roomId") as string;

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  if (roomId) {
    chatStore.endSession(userId, roomId);
  } else {
    // Remove from waiting queue
    chatStore.removeFromQueue(userId);
  }

  return Response.json({ success: true });
}
