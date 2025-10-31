import type { Route } from "./+types/api.chat.start";
import { chatStore } from "../lib/chatStore";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  const result = chatStore.startSession(userId);
  return Response.json(result);
}
