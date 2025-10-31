import { gameStore } from "../lib/gameStore";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const username = formData.get("username") as string;

  if (!userId || !username) {
    return Response.json({ error: "Missing userId or username" }, { status: 400 });
  }

  const result = gameStore.incrementScore(userId, username);
  return Response.json(result);
}
