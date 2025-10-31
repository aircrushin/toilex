# Deployment Guide for TOILEX

This guide covers deploying your TOILEX app to production.

## Architecture

TOILEX is now **100% serverless** and can be deployed entirely on Vercel! 🎉

The app uses:
- React Router v7 for the frontend and API routes
- HTTP polling for real-time chat (no WebSockets needed!)
- In-memory storage for chat sessions (works perfectly for short-lived chat sessions)

## Deploying to Vercel

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Deploy via CLI

```bash
vercel
```

Or use the Vercel dashboard to import your GitHub repository (recommended).

### 3. Set Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key (for the Turd Analyzer feature)
- `OPENAI_BASE_URL` - (Optional) Custom OpenAI endpoint

That's it! No need for separate servers or additional configuration.

### 4. Deploy

```bash
# Production deployment
vercel --prod

# Or via GitHub
# Just push to your main branch and Vercel will auto-deploy
```

## How the Serverless Chat Works

The chat feature uses a polling-based approach instead of WebSockets:

1. **Client sends a request** to start a chat session
2. **Server stores session data** in memory (within the serverless function)
3. **Client polls every second** to check for new messages
4. **Messages are sent via HTTP POST** requests

### Limitations of In-Memory Storage

**Important**: The in-memory chat store works great for the hackathon demo, but has some limitations:

- **Serverless functions are stateless**: Each request might hit a different server instance
- **Sessions may be lost**: If the serverless function restarts, chat sessions are cleared
- **Not suitable for high traffic**: Multiple instances won't share state

### Upgrading to Production (Optional)

For a production-ready version, replace the in-memory store with a persistent backend:

**Option 1: Vercel KV (Redis)**
```bash
# Install Vercel KV
npm install @vercel/kv

# Add to Vercel project
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

Then update `app/lib/chatStore.ts` to use Vercel KV instead of Map objects.

**Option 2: Upstash Redis**
- Free tier available
- Works perfectly with serverless
- Global edge network
- https://upstash.com/

**Option 3: PlanetScale (MySQL)**
- Serverless MySQL database
- Free tier available
- https://planetscale.com/

## Testing Your Deployment

1. Visit your Vercel URL
2. Navigate to the "Poop-Time Chat" feature
3. Open the same URL in an incognito window
4. Click "START DUMPING" in both windows
5. You should get matched and be able to chat

**Note**: Due to serverless limitations, if you deploy to multiple regions, users might be on different instances and won't match. For best results, deploy to a single region or use a persistent store.

## Features That Work 100% Serverless

✅ **Poop-Time Chat** - Real-time anonymous chat (polling-based)
✅ **Turd Analyzer** - AI-powered stool analysis
✅ **Poop Tracker** - Track bathroom sessions and predict next visit (uses localStorage)

All features work perfectly on Vercel's free tier!

## Environment Variables Summary

### Vercel
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_BASE_URL` - (Optional) Custom OpenAI endpoint

### Optional (for production chat)
- `KV_REST_API_URL` - Vercel KV URL (if using Vercel KV)
- `KV_REST_API_TOKEN` - Vercel KV token (if using Vercel KV)

## Cost Estimates

**Vercel Free Tier**:
- 100 GB bandwidth
- 100 GB-Hrs serverless function execution
- Unlimited deployments

**Total cost for hobby deployment**: **$0/month** 🎉

Perfect for hackathons and demos!

## Troubleshooting

### Chat not working:
- Check browser console for errors
- Ensure you're testing with two separate browser sessions
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Users not matching:
- This can happen if requests hit different serverless instances
- For demos, try using the same browser (different tabs/windows)
- For production, upgrade to persistent storage (Vercel KV)

### API routes returning 404:
- Ensure routes are registered in `app/routes.ts`
- Check that build completed successfully
- Redeploy if needed

## Differences from Socket.IO Version

The app previously used Socket.IO with a separate Node.js server. The new version:

✅ No separate server needed
✅ Works on Vercel free tier
✅ 100% serverless
✅ Uses HTTP polling instead of WebSockets
⚠️ Slightly higher latency (1-2 seconds vs instant)
⚠️ More HTTP requests (polling every second)

For a hackathon project, the trade-offs are totally worth the simplified deployment! 💩🚀
