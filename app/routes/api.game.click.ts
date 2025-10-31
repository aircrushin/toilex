import { supabaseServer, getUserFromRequest } from "../lib/supabase.server";

export async function action({ request }: { request: Request }) {
  // Authenticate user from request
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const username = formData.get("username") as string;

  if (!username) {
    return Response.json({ error: "Missing username" }, { status: 400 });
  }

  const userId = user.id;

  // Check if user already has a score
  const { data: existingScore, error: fetchError } = await supabaseServer
    .from("game_scores")
    .select("score")
    .eq("user_id", userId)
    .single();

  let personalScore: number;

  if (existingScore) {
    // Update existing score
    const newScore = existingScore.score + 1;
    const { error: updateError } = await supabaseServer
      .from("game_scores")
      .update({ score: newScore })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating score:", updateError);
      return Response.json({ error: "Failed to update score" }, { status: 500 });
    }
    personalScore = newScore;
  } else {
    // Insert new score
    const { error: insertError } = await supabaseServer
      .from("game_scores")
      .insert({ user_id: userId, username, score: 1 });

    if (insertError) {
      console.error("Error inserting score:", insertError);
      return Response.json({ error: "Failed to insert score" }, { status: 500 });
    }
    personalScore = 1;
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

  return Response.json({ personalScore, globalScore });
}
