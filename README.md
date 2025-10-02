# 🎥 Meet Clone - Video Conference App

A Google Meet-like video conferencing application built with WebRTC, featuring video calls, screen sharing, audio controls, and real-time chat.

## ✨ Features

- 📹 **Video Calling** - High-quality peer-to-peer video communication
- 🖥️ **Screen Sharing** - Share your screen with other participants
- 🎤 **Audio Controls** - Mute/unmute microphone with visual indicators
- 💬 **Real-time Chat** - Text messaging during meetings
- 🏠 **Room System** - Create or join meeting rooms with unique IDs
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Clean, Google Meet-inspired interface

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd rtc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   - Go to `http://localhost:3000`
   - Allow camera and microphone permissions
   - Create a room or join an existing one

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Free)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select this repository
5. Railway will automatically deploy your app!

### Option 2: Render (Free Tier Available)

1. Go to [render.com](https://render.com)
2. Connect your GitHub account
3. Create "New Web Service"
4. Select this repository
5. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Option 3: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`

### Option 4: DigitalOcean App Platform

1. Go to DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`

## 🔧 Environment Variables

No environment variables are required for basic functionality. The app will automatically:
- Use port 3000 locally or the PORT environment variable in production
- Detect HTTP/HTTPS protocol for WebSocket connections

## 📱 How to Use

### Creating a Meeting
1. Open the app in your browser
2. Allow camera/microphone permissions
3. Click "Create New Room"
4. Share the room ID with participants

### Joining a Meeting
1. Open the app in your browser
2. Enter the room ID provided by the host
3. Click "Join Room"

### During the Meeting
- **Toggle Camera**: Click the video icon to turn camera on/off
- **Toggle Microphone**: Click the microphone icon to mute/unmute
- **Screen Share**: Click the desktop icon to share your screen
- **Chat**: Click the chat icon to open the sidebar and send messages
- **Leave**: Click the red phone icon to leave the meeting

## 🛠️ Technical Details

### Built With
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, WebSocket (ws library)
- **WebRTC**: For peer-to-peer video/audio communication
- **STUN Servers**: Google's public STUN servers for NAT traversal

### Architecture
- **Signaling Server**: Handles room management and WebRTC signaling
- **Peer-to-Peer**: Direct video/audio streams between participants
- **Real-time Messaging**: WebSocket-based chat system

## 🔒 Security Notes

- This is a demo application without authentication
- For production use, consider adding:
  - User authentication
  - Room passwords
  - TURN servers for better connectivity
  - Rate limiting
  - Input validation and sanitization

## 📄 License

ISC License - Feel free to use this project for learning and development!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Ensure camera/microphone permissions are granted
3. Try refreshing the page
4. Test with different browsers (Chrome/Firefox recommended)

---

**Enjoy your video conferencing app! 🎉**
