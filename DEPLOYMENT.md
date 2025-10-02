# 🚀 Deployment Guide

## Quick Deploy Options (Recommended)

### 1. Railway (Easiest - Free Tier)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. ✅ Done! Railway auto-detects and deploys

**Pros:** Zero configuration, free tier, automatic HTTPS
**Cons:** Limited free hours (500/month)

### 2. Render (Great Free Option)
**Steps:**
1. Go to [render.com](https://render.com)
2. Connect GitHub account
3. Create "New Web Service"
4. Repository: Select your repo
5. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. ✅ Deploy!

**Pros:** Good free tier (750 hours), reliable
**Cons:** Can be slower on free tier

### 3. Vercel (For Static + Serverless)
**Note:** Requires modification for serverless functions
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

### 4. Netlify (Static Sites)
**Note:** Requires serverless functions setup
1. Drag and drop your folder to netlify.com
2. Or connect GitHub repository

## Manual Deployment Options

### Heroku
```bash
# Install Heroku CLI first
heroku login
heroku create your-app-name
git push heroku main
```

### DigitalOcean App Platform
1. Create account at DigitalOcean
2. Go to App Platform
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000

### AWS EC2 (Advanced)
```bash
# On your EC2 instance
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
git clone your-repo-url
cd rtc
npm install
npm start
```

### Google Cloud Platform
```bash
# Using Cloud Run
gcloud run deploy --source .
```

## Environment Setup

### Required Files (Already Created)
- ✅ `package.json` - Dependencies and scripts
- ✅ `Procfile` - For Heroku deployment
- ✅ `.gitignore` - Ignore unnecessary files
- ✅ `README.md` - Documentation

### Environment Variables
No environment variables required! The app auto-configures:
- **PORT**: Uses `process.env.PORT` or defaults to 3000
- **Protocol**: Auto-detects HTTP/HTTPS for WebSocket connections

## Post-Deployment Checklist

### ✅ Test Your Deployment
1. Open your deployed URL
2. Allow camera/microphone permissions
3. Create a test room
4. Open another browser/incognito tab
5. Join the same room
6. Test all features:
   - Video calling
   - Audio toggle
   - Screen sharing
   - Chat functionality

### 🔒 Security Considerations
For production use, consider adding:
- User authentication
- Room passwords
- Rate limiting
- Input sanitization
- TURN servers for better connectivity

### 📊 Monitoring
- Check server logs for errors
- Monitor WebSocket connections
- Watch for memory usage
- Set up uptime monitoring

## Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
- Ensure your hosting platform supports WebSockets
- Check if HTTPS is required for your domain

**2. Camera/Microphone Not Working**
- HTTPS is required for getUserMedia() in production
- Check browser permissions

**3. Screen Sharing Not Working**
- Requires HTTPS in production
- Some browsers block screen sharing on HTTP

**4. Connection Issues Between Peers**
- May need TURN servers for users behind strict NATs
- Consider adding additional STUN servers

### Platform-Specific Notes

**Railway:**
- Automatically provides HTTPS
- WebSockets work out of the box
- No additional configuration needed

**Render:**
- Free tier may sleep after inactivity
- Supports WebSockets on all plans
- HTTPS provided automatically

**Heroku:**
- Requires paid plan (free tier discontinued)
- WebSockets supported
- May need to configure dyno types

## Need Help?

1. Check the main README.md for usage instructions
2. Look at browser console for error messages
3. Test locally first: `npm start`
4. Ensure all dependencies are installed: `npm install`

---

**Happy Deploying! 🎉**
