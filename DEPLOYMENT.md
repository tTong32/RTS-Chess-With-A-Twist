# Deployment Guide for RTS Chess With A Twist

## Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket)
- Accounts on deployment platforms (free tiers available)

---

## Option 1: Render (Recommended - Easiest)

Render offers free hosting for both frontend and backend with WebSocket support.

### Deploy Backend (Server)

1. **Go to [Render.com](https://render.com)** and sign up
2. **Click "New +" → "Web Service"**
3. **Connect your repository**
4. **Configure the web service:**
   - **Name**: `rts-chess-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Add Environment Variable:**
   - **Key**: `CLIENT_URL`
   - **Value**: (leave blank for now, we'll update after deploying frontend)

6. **Click "Create Web Service"**
7. **Copy the backend URL** (e.g., `https://rts-chess-server.onrender.com`)

### Deploy Frontend (Client)

1. **Click "New +" → "Static Site"**
2. **Connect your repository**
3. **Configure:**
   - **Name**: `rts-chess-client`
   - **Root Directory**: `/`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variable:**
   - **Key**: `VITE_SERVER_URL`
   - **Value**: `https://rts-chess-server.onrender.com` (your backend URL)

5. **Click "Create Static Site"**
6. **Copy the frontend URL** (e.g., `https://rts-chess-client.onrender.com`)

### Update Backend with Frontend URL

1. Go back to your backend service on Render
2. **Environment** → Edit `CLIENT_URL`
3. Set it to your frontend URL (e.g., `https://rts-chess-client.onrender.com`)
4. Save changes (service will redeploy automatically)

---

## Option 2: Vercel (Frontend) + Railway (Backend)

### Deploy Backend on Railway

1. **Go to [Railway.app](https://railway.app)** and sign up
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Add variables in the Railway dashboard:**
   - `CLIENT_URL`: (leave blank initially)
   - `PORT`: `3001`
5. **Configure the service:**
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. **Generate Domain** for your service
7. **Copy the railway domain** (e.g., `https://your-app.railway.app`)

### Deploy Frontend on Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up
2. **Click "Add New..." → "Project"**
3. **Import your Git repository**
4. **Configure:**
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Add Environment Variable:**
   - **Key**: `VITE_SERVER_URL`
   - **Value**: Your Railway backend URL
6. **Deploy**
7. **Update Railway backend** with your Vercel URL in the `CLIENT_URL` variable

---

## Option 3: Heroku (Full Stack)

### Deploy Backend

1. **Install Heroku CLI**: `npm install -g heroku`
2. **Login**: `heroku login`
3. **Create app for server:**
   ```bash
   cd server
   heroku create rts-chess-server
   ```
4. **Set environment variables:**
   ```bash
   heroku config:set CLIENT_URL=https://your-frontend-url.herokuapp.com
   ```
5. **Create Procfile in server directory:**
   ```
   web: node src/server.js
   ```
6. **Deploy:**
   ```bash
   git subtree push --prefix server heroku main
   ```

### Deploy Frontend

1. **Create another Heroku app:**
   ```bash
   cd ..
   heroku create rts-chess-client
   ```
2. **Set buildpack:**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```
3. **Set environment variables:**
   ```bash
   heroku config:set VITE_SERVER_URL=https://rts-chess-server.herokuapp.com
   ```
4. **Add serve to dependencies** (for serving the built static files)
5. **Deploy frontend**

---

## Required Code Changes

### 1. Update Socket.IO Client Connection

Create or update `client/src/config.js`:

```javascript
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
```

### 2. Update Socket.IO imports in your components

Wherever you initialize socket.io-client (likely in `MultiplayerLobby.jsx` and `MultiplayerGame.jsx`), update:

```javascript
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config';

const socket = io(SERVER_URL);
```

### 3. Server CORS Configuration (Already Done ✅)

The server has been updated to use `process.env.CLIENT_URL`.

---

## Environment Variables Summary

### Backend (.env for local development)
```
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Frontend (.env for local development)
```
VITE_SERVER_URL=http://localhost:3001
```

### Production Environment Variables

**Backend:**
- `PORT` - Provided by platform (usually automatic)
- `CLIENT_URL` - Your deployed frontend URL

**Frontend:**
- `VITE_SERVER_URL` - Your deployed backend URL

---

## Testing Your Deployment

1. **Visit your frontend URL**
2. **Open browser console** (F12) to check for connection errors
3. **Try creating a room** in multiplayer mode
4. **Open a second browser/incognito window** and join the room
5. **Test gameplay** to ensure WebSocket communication works

---

## Troubleshooting

### CORS Errors
- Ensure `CLIENT_URL` on backend matches your frontend URL exactly
- Check that both URLs use HTTPS (not mixing HTTP/HTTPS)

### WebSocket Connection Failed
- Ensure your backend platform supports WebSocket connections
- Check that port is correctly configured
- Verify `VITE_SERVER_URL` is set correctly

### Room Not Found Errors
- Backend may have restarted (free tiers sleep after inactivity)
- Wait 30 seconds for backend to wake up

### Render Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading for production use

---

## Recommended: Render (Best Free Option)

**Pros:**
- ✅ Free tier with WebSocket support
- ✅ Automatic HTTPS
- ✅ Easy deployment from Git
- ✅ No credit card required
- ✅ Auto-deploy on push

**Cons:**
- ⚠️ Services sleep after 15 min inactivity
- ⚠️ Slow cold starts (30-60 seconds)

---

## Next Steps After Deployment

1. **Test thoroughly** with multiple users
2. **Monitor logs** on your deployment platform
3. **Set up custom domain** (optional)
4. **Configure auto-deploy** from your main branch
5. **Add analytics** (optional - Google Analytics, Plausible, etc.)

---

## Need Help?

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Socket.IO Deployment**: https://socket.io/docs/v4/

Good luck with your deployment! 🚀

