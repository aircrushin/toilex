import { gameStore } from "../lib/gameStore";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const leaderboard = gameStore.getLeaderboard(limit);
  const globalScore = gameStore.getGlobalScore();

  return Response.json({ leaderboard, globalScore });
}
