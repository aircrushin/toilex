import { supabaseServer, getUserFromRequest } from "../lib/supabase.server";

// GET - Fetch all sessions for authenticated user
export async function loader({ request }: { request: Request }) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sessions, error } = await supabaseServer
    .from('toilet_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ sessions });
}

// POST - Create a new session
export async function action({ request }: { request: Request }) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const method = formData.get("_method") as string;

  // DELETE specific session
  if (method === "DELETE") {
    const sessionId = formData.get("sessionId") as string;

    const { error } = await supabaseServer
      .from('toilet_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  }

  // DELETE all sessions
  if (method === "DELETE_ALL") {
    const { error } = await supabaseServer
      .from('toilet_sessions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  }

  // CREATE new session
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const duration = parseInt(formData.get("duration") as string);
  const type = formData.get("type") as 'number1' | 'number2' | 'both';
  const notes = formData.get("notes") as string | null;

  const { data: session, error } = await supabaseServer
    .from('toilet_sessions')
    .insert({
      user_id: user.id,
      start_time: startTime,
      end_time: endTime,
      duration,
      type,
      notes,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ session });
}
