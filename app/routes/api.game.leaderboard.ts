import { supabaseServer } from "../lib/supabase.server";
import type { Database } from "../lib/database.types";

type GameScoreRow = Database["public"]["Tables"]["game_scores"]["Row"];

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  lastUpdated: number;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "10");

  // Get leaderboard from database
  const { data: leaderboard, error: leaderboardError } = await supabaseServer
    .from("game_scores")
    .select("user_id, username, score, updated_at")
    .order("score", { ascending: false })
    .limit(limit);

  if (leaderboardError) {
    console.error("Error fetching leaderboard:", leaderboardError);
    return Response.json({ leaderboard: [], globalScore: 0 }, { status: 500 });
  }

  // Calculate global score (sum of all scores)
  const { data: globalData, error: globalError } = await supabaseServer
    .from("game_scores")
    .select("score");

  const globalScore = (globalData as Array<{ score: number }> | null)?.reduce(
    (sum, row) => sum + row.score, 
    0
  ) || 0;

  if (globalError) {
    console.error("Error fetching global score:", globalError);
  }

  // Format leaderboard to match the expected interface
  const formattedLeaderboard: LeaderboardEntry[] = (leaderboard as Array<{
    user_id: string;
    username: string;
    score: number;
    updated_at: string;
  }> | null)?.map(row => ({
    userId: row.user_id,
    username: row.username,
    score: row.score,
    lastUpdated: new Date(row.updated_at).getTime()
  })) || [];

  return Response.json({ leaderboard: formattedLeaderboard, globalScore });
}
