const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store rooms and users
const rooms = new Map();
const users = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateUserId() {
  return Math.random().toString(36).substring(2, 15);
}

wss.on('connection', function connection(ws) {
  const userId = generateUserId();
  users.set(userId, { ws, roomId: null });
  
  console.log(`User ${userId} connected`);

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      const user = users.get(userId);
      
      switch (data.type) {
        case 'join-room':
          handleJoinRoom(userId, data.roomId);
          break;
        case 'create-room':
          handleCreateRoom(userId);
          break;
        case 'leave-room':
          handleLeaveRoom(userId);
          break;
        case 'offer':
        case 'answer':
        case 'candidate':
          // Forward signaling data to specific target user
          if (user.roomId && data.targetUserId) {
            const targetUser = users.get(data.targetUserId);
            if (targetUser && targetUser.ws.readyState === WebSocket.OPEN) {
              targetUser.ws.send(JSON.stringify({
                ...data,
                userId: userId
              }));
            }
          }
          break;
        case 'chat-message':
          // Forward chat message to other users in the same room (sender displays locally)
          if (user.roomId) {
            broadcastToRoom(user.roomId, data, userId);
          }
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', function() {
    console.log(`User ${userId} disconnected`);
    handleLeaveRoom(userId);
    users.delete(userId);
  });

  // Send user ID to client
  ws.send(JSON.stringify({ type: 'user-id', userId }));
});

function handleCreateRoom(userId) {
  const roomId = generateRoomId();
  const user = users.get(userId);
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  
  rooms.get(roomId).add(userId);
  user.roomId = roomId;
  
  user.ws.send(JSON.stringify({ 
    type: 'room-created', 
    roomId,
    participants: Array.from(rooms.get(roomId))
  }));
  
  console.log(`Room ${roomId} created by user ${userId}`);
}

function handleJoinRoom(userId, roomId) {
  const user = users.get(userId);
  
  if (!rooms.has(roomId)) {
    user.ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }
  
  // Leave current room if in one
  if (user.roomId) {
    handleLeaveRoom(userId);
  }
  
  rooms.get(roomId).add(userId);
  user.roomId = roomId;
  
  const participants = Array.from(rooms.get(roomId));
  
  // Notify user they joined
  user.ws.send(JSON.stringify({ 
    type: 'room-joined', 
    roomId,
    participants
  }));
  
  // Notify other participants
  broadcastToRoom(roomId, { 
    type: 'user-joined', 
    userId,
    participants
  }, userId);
  
  console.log(`User ${userId} joined room ${roomId}`);
}

function handleLeaveRoom(userId) {
  const user = users.get(userId);
  
  if (user && user.roomId) {
    const roomId = user.roomId;
    const room = rooms.get(roomId);
    
    if (room) {
      room.delete(userId);
      
      // Notify other participants
      broadcastToRoom(roomId, { 
        type: 'user-left', 
        userId,
        participants: Array.from(room)
      }, userId);
      
      // Remove empty rooms
      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
    }
    
    user.roomId = null;
    console.log(`User ${userId} left room ${roomId}`);
  }
}

function broadcastToRoom(roomId, data, excludeUserId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.forEach(userId => {
    if (userId !== excludeUserId) {
      const user = users.get(userId);
      if (user && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(data));
      }
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
