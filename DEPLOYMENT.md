# Deployment Guide for TOILEX

This guide covers deploying your TOILEX app to production.

## Architecture

TOILEX consists of two parts:
1. **React Router App** - The main web application (can be deployed on Vercel)
2. **Socket.IO Server** - Handles real-time chat (needs to be deployed separately)

## Deploying the React Router App to Vercel

### 1. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel
```

Or use the Vercel dashboard to import your GitHub repository.

### 2. Set Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key (for the Turd Analyzer feature)
- `OPENAI_BASE_URL` - (Optional) Custom OpenAI endpoint
- `VITE_SOCKET_URL` - URL of your deployed Socket.IO server (see below)

## Deploying the Socket.IO Server

The Socket.IO server (`socket-server.js`) needs to run on a platform that supports WebSocket connections. **Vercel doesn't support WebSockets**, so you need to deploy it elsewhere.

### Option 1: Deploy to Railway (Recommended)

Railway is perfect for WebSocket servers and has a generous free tier.

1. **Create a `package.json` for the socket server** (if deploying separately):

```json
{
  "name": "toilex-socket-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node socket-server.js"
  },
  "dependencies": {
    "socket.io": "^4.8.1"
  }
}
```

2. **Sign up for Railway**: https://railway.app/

3. **Deploy**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the Node.js app
   - Set the start command to: `node socket-server.js`
   - Add environment variable: `SOCKET_PORT=3001` (optional)

4. **Get your URL**:
   - Railway will give you a URL like `https://your-app.railway.app`
   - Copy this URL

5. **Update Vercel environment variable**:
   - Go back to Vercel
   - Set `VITE_SOCKET_URL` to your Railway URL (e.g., `https://your-app.railway.app`)

### Option 2: Deploy to Render

1. Sign up at https://render.com/
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node socket-server.js`
5. Deploy and copy the service URL
6. Update `VITE_SOCKET_URL` in Vercel to this URL

### Option 3: Deploy to Fly.io

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Create `fly.toml`:

```toml
app = "toilex-socket"

[build]
  builder = "heroku/buildpacks:20"

[[services]]
  http_checks = []
  internal_port = 3001
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. Deploy:
```bash
flyctl launch
flyctl deploy
```

### Option 4: Single Deployment (Keep Both Together)

If you want to keep everything together, you can deploy the entire app to a platform that supports WebSockets:

**Deploy to Render:**
1. Deploy as a "Web Service" on Render
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. This will run both the React Router app and socket server together

## Testing Your Deployment

1. Visit your Vercel URL
2. Navigate to the "Poop-Time Chat" feature
3. Open the same URL in an incognito window
4. Click "START DUMPING" in both windows
5. You should get matched and be able to chat

## Troubleshooting

### Chat not connecting:
- Check that `VITE_SOCKET_URL` is set correctly in Vercel
- Verify your Socket.IO server is running (visit the URL in a browser)
- Check browser console for connection errors
- Ensure CORS is enabled on the socket server (already configured in `socket-server.js`)

### "localhost:3001" errors in production:
- You forgot to set `VITE_SOCKET_URL` environment variable in Vercel
- Or you need to redeploy after adding the environment variable

### Socket server keeps crashing:
- Check that the PORT environment variable is set correctly
- Some platforms use `PORT` instead of `SOCKET_PORT`
- Update `socket-server.js` line 64 to: `const port = process.env.PORT || process.env.SOCKET_PORT || 3001;`

## Environment Variables Summary

### Vercel (React Router App)
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_BASE_URL` - (Optional) Custom OpenAI endpoint
- `VITE_SOCKET_URL` - Socket.IO server URL

### Socket Server (Railway/Render/etc.)
- `SOCKET_PORT` or `PORT` - Port to listen on (usually auto-assigned)

## Cost Estimates

- **Vercel**: Free tier is sufficient
- **Railway**: Free tier includes 500 hours/month (more than enough)
- **Render**: Free tier available (goes to sleep after inactivity)
- **Fly.io**: Free tier available

Total cost for hobby deployment: **$0/month** 🎉
