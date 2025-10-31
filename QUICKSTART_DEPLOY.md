# Quick Start: Deploy Your RTS Chess Game

## ✅ Changes Made (Ready to Deploy!)

Your project has been updated with the following changes to support deployment:

### 1. **Server Configuration** (`server/src/server.js`)
- ✅ Updated CORS to use `process.env.CLIENT_URL` environment variable
- ✅ Falls back to `http://localhost:5173` for local development

### 2. **Client Configuration** (`client/src/config.js`)
- ✅ Created config file with `SERVER_URL` from environment variable
- ✅ Falls back to `http://localhost:3001` for local development

### 3. **Socket Connections Updated**
- ✅ `MultiplayerLobby.jsx` - Now uses `SERVER_URL` from config
- ✅ `MultiplayerGame.jsx` - Now uses `SERVER_URL` from config

---

## 🚀 Fastest Way to Deploy (FREE)

### **Using Render** (Recommended)

#### Step 1: Deploy Backend
1. Go to [render.com](https://render.com) and sign up
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `rts-chess-server`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variable (leave blank for now):
   - **CLIENT_URL**: *(we'll add this after frontend is deployed)*
6. Click **"Create Web Service"**
7. **Copy the URL** (e.g., `https://rts-chess-server.onrender.com`)

#### Step 2: Deploy Frontend
1. Click **"New +" → "Static Site"**
2. Connect your repository (same one)
3. Configure:
   - **Name**: `rts-chess-client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variable:
   - **Key**: `VITE_SERVER_URL`
   - **Value**: `https://rts-chess-server.onrender.com` *(your backend URL)*
5. Click **"Create Static Site"**
6. **Copy the frontend URL** (e.g., `https://rts-chess-client.onrender.com`)

#### Step 3: Update Backend CORS
1. Go back to your backend service on Render
2. Go to **"Environment"** tab
3. Update **CLIENT_URL** to your frontend URL
4. Save (it will auto-redeploy)

#### Step 4: Test! 🎮
Visit your frontend URL and try creating/joining a game!

---

## 💻 Testing Locally (Before Deploying)

Your code will work as-is for local development:

```bash
# Terminal 1 - Start backend
cd server
npm install
npm start

# Terminal 2 - Start frontend
npm install
npm run dev
```

No environment variables needed for local testing - it uses the defaults!

---

## 🔧 Environment Variables Reference

### Production Backend
```
PORT=3001              # Usually auto-set by hosting platform
CLIENT_URL=https://your-frontend-url.com
```

### Production Frontend
```
VITE_SERVER_URL=https://your-backend-url.com
```

### Local Development
No need to set anything! Defaults work automatically:
- Backend uses port 3001
- Frontend uses port 5173
- They connect to each other via localhost

---

## ⚠️ Common Issues

### CORS Errors
- Make sure `CLIENT_URL` on backend matches frontend URL exactly
- Both must use HTTPS (or both HTTP locally)

### WebSocket Connection Failed
- Check that `VITE_SERVER_URL` is correct on frontend
- Wait 30 seconds if using Render free tier (service wakes from sleep)

### Room Not Found
- Backend may have restarted (free tiers sleep after inactivity)
- Wait for backend to wake up

---

## 📚 Full Documentation

For more deployment options (Vercel, Railway, Heroku) and troubleshooting, see:
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide

---

## 🎉 That's It!

Your game is now ready to deploy. The fastest path is Render (both frontend + backend), but you can also mix services like Vercel (frontend) + Railway (backend).

Good luck! 🚀

