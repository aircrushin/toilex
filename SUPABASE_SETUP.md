# Supabase Integration Setup Guide

This guide will help you complete the Supabase integration for Toilex.

## Step 1: Setup Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings > API**
3. Copy your **Project URL** and **anon/public key**
4. Update the `.env` file with your credentials:
   ```
   SUPABASE_URL=your_project_url_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 2: Run Database Migration

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the sidebar
3. Create a new query
4. Copy the entire contents of `supabase-schema.sql` and paste it
5. Click **Run** to execute the migration
6. This will create all necessary tables:
   - `profiles` - User profiles
   - `toilet_sessions` - Bathroom tracking data
   - `game_scores` - THE NOTHING game scores
   - `chat_rooms` & `chat_messages` - Chat functionality
   - `waiting_queue` - Chat matchmaking
   - `analyzer_results` - Poop analysis results

## Step 3: Enable Realtime (for Chat)

1. In Supabase dashboard, go to **Database > Replication**
2. Enable realtime for these tables:
   - `chat_messages`
   - `chat_rooms`
   - `waiting_queue`

## Step 4: Set up Storage (for Analyzer)

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `poop-images`
3. Set the bucket to **Public** (or configure policies as needed)
4. This will store uploaded poop images for analysis

## Step 5: Test Authentication

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:5174/auth`
3. Create a test account
4. Verify you can sign in/out

## What's Been Implemented

### ✅ Completed
- Supabase client setup (client & server)
- Database schema with all tables
- Authentication system (sign up/login/logout)
- Auth context provider
- Environment variable configuration
- API helper functions
- Tracker API routes (`/api/tracker/sessions`)
- Game API routes (`/api/game/click`, `/api/game/leaderboard`)

### 🚧 To Complete

#### Update Tracker Component
The tracker currently uses localStorage. Update `app/routes/tracker.tsx`:

```typescript
// Replace localStorage logic with API calls
import { useAuth } from "../contexts/AuthContext";
import { getAuthHeaders } from "../lib/api";

// In component:
const { user } = useAuth();

// Load sessions from API
useEffect(() => {
  const fetchSessions = async () => {
    if (!user) return;

    const headers = await getAuthHeaders();
    const response = await fetch('/api/tracker/sessions', { headers });
    const { sessions } = await response.json();
    setSessions(sessions.map(s => ({
      ...s,
      startTime: new Date(s.start_time),
      endTime: new Date(s.end_time),
    })));
  };

  fetchSessions();
}, [user]);

// Save session to API
const endSession = async () => {
  if (sessionStartTime && user) {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);

    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('startTime', sessionStartTime.toISOString());
    formData.append('endTime', endTime.toISOString());
    formData.append('duration', duration.toString());
    formData.append('type', sessionType);
    if (notes.trim()) formData.append('notes', notes);

    const response = await fetch('/api/tracker/sessions', {
      method: 'POST',
      headers,
      body: formData
    });

    const { session: newSession } = await response.json();
    // Update state with new session
  }
};
```

#### Update Game Component
Update `app/components/TheNothing.tsx`:

```typescript
import { useAuth } from "../contexts/AuthContext";
import { getAuthHeaders } from "../lib/api";

// In component:
const { user } = useAuth();

// Update click handler
const handleButtonClick = async () => {
  if (!user) return;

  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('userId', user.id);
  formData.append('username', user.user_metadata?.username || 'Anonymous');

  const response = await fetch('/api/game/click', {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await response.json();
  setPersonalScore(data.personalScore);
  setGlobalScore(data.globalScore);
  // ... rest of the logic
};
```

#### Update Game Store
Replace in-memory storage in `app/lib/gameStore.ts` with Supabase:

```typescript
import { supabaseServer } from './supabase.server';

async incrementScore(userId: string, username: string) {
  // Try to increment existing score
  const { data: existing } = await supabaseServer
    .from('game_scores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { data: updated } = await supabaseServer
      .from('game_scores')
      .update({ score: existing.score + 1 })
      .eq('user_id', userId)
      .select()
      .single();

    const { count } = await supabaseServer
      .from('game_scores')
      .select('score', { count: 'exact', head: true });

    return {
      personalScore: updated.score,
      globalScore: count || 0
    };
  } else {
    // Create new score entry
    await supabaseServer
      .from('game_scores')
      .insert({ user_id: userId, username, score: 1 });

    return { personalScore: 1, globalScore: 1 };
  }
}
```

#### Update Chat to Use Realtime
Update `app/lib/chatStore.ts` to use Supabase realtime subscriptions.

#### Update Analyzer
Add Supabase Storage upload for images before sending to OpenAI.

## Testing Checklist

- [ ] Sign up creates user and profile
- [ ] Sign in works
- [ ] Sign out works
- [ ] Tracker saves sessions to database
- [ ] Tracker loads sessions from database
- [ ] Game scores persist across sessions
- [ ] Leaderboard shows all players
- [ ] Chat creates rooms in database
- [ ] Chat messages sync in realtime
- [ ] Analyzer stores results in database

## Troubleshooting

### "Unauthorized" errors
- Check that `.env` has correct Supabase credentials
- Verify user is signed in before making API calls
- Check Row Level Security policies in Supabase

### Environment variables not loading
- Restart dev server after changing `.env`
- Check `vite.config.ts` defines the variables correctly

### Database errors
- Verify `supabase-schema.sql` ran successfully
- Check Supabase logs in dashboard

## Next Steps

1. Complete the tracker component updates
2. Update game component with auth
3. Migrate chat to Supabase Realtime
4. Add Supabase Storage to analyzer
5. Add user profile page
6. Add authentication guards to routes

Need help? Check the Supabase documentation at https://supabase.com/docs
