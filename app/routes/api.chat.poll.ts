import type { Route } from "./+types/api.chat.poll";
import { chatStore } from "../lib/chatStore";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const roomId = url.searchParams.get("roomId");

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  // Get room status
  const status = chatStore.getRoomStatus(userId);

  // If in a room, get new messages
  if (status.status === 'matched' && roomId) {
    const messages = chatStore.getNewMessages(userId, roomId);
    return Response.json({
      status: 'matched',
      roomId: status.roomId,
      messages
    });
  }

  return Response.json(status);
}
