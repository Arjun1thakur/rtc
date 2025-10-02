// WebRTC Meet Clone Application
class MeetApp {
  constructor() {
    this.ws = null;
    this.localStream = null;
    this.peerConnections = new Map();
    this.userId = null;
    this.roomId = null;
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    this.isSharingScreen = false;
    this.participants = new Map();
    
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.initializeElements();
    this.setupEventListeners();
    this.connectWebSocket();
  }

  initializeElements() {
    // Pre-join elements
    this.preJoinScreen = document.getElementById('preJoin');
    this.preJoinVideo = document.getElementById('preJoinVideo');
    this.preJoinCamera = document.getElementById('preJoinCamera');
    this.preJoinMic = document.getElementById('preJoinMic');
    this.roomInput = document.getElementById('roomInput');
    this.createRoomBtn = document.getElementById('createRoomBtn');
    this.joinRoomBtn = document.getElementById('joinRoomBtn');

    // Meeting interface elements
    this.meetingInterface = document.getElementById('meetingInterface');
    this.videosGrid = document.getElementById('videosGrid');
    this.roomIdDisplay = document.getElementById('roomIdDisplay');
    this.participantsCount = document.getElementById('participantsCount');

    // Control elements
    this.toggleCamera = document.getElementById('toggleCamera');
    this.toggleMic = document.getElementById('toggleMic');
    this.shareScreen = document.getElementById('shareScreen');
    this.toggleChat = document.getElementById('toggleChat');
    this.leaveCall = document.getElementById('leaveCall');

    // Chat elements
    this.sidebar = document.getElementById('sidebar');
    this.closeSidebar = document.getElementById('closeSidebar');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');

    // Notification
    this.notification = document.getElementById('notification');
  }

  setupEventListeners() {
    // Pre-join controls
    this.preJoinCamera.addEventListener('click', () => this.togglePreJoinCamera());
    this.preJoinMic.addEventListener('click', () => this.togglePreJoinMic());
    this.createRoomBtn.addEventListener('click', () => this.createRoom());
    this.joinRoomBtn.addEventListener('click', () => this.joinRoom());

    // Meeting controls
    this.toggleCamera.addEventListener('click', () => this.toggleVideo());
    this.toggleMic.addEventListener('click', () => this.toggleAudio());
    this.shareScreen.addEventListener('click', () => this.toggleScreenShare());
    this.toggleChat.addEventListener('click', () => this.toggleChatSidebar());
    this.leaveCall.addEventListener('click', () => this.leaveCall());

    // Chat
    this.closeSidebar.addEventListener('click', () => this.toggleChatSidebar());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });

    // Room input enter key
    this.roomInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.initializePreJoinCamera();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleSignalingData(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      if (this.roomId) {
        this.showNotification('Connection lost. Attempting to reconnect...', 'error');
        // Try to reconnect after a delay
        setTimeout(() => {
          if (this.ws.readyState === WebSocket.CLOSED) {
            this.connectWebSocket();
          }
        }, 3000);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.showNotification('Connection error occurred.', 'error');
    };
  }

  async initializePreJoinCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      this.preJoinVideo.srcObject = stream;
      this.localStream = stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      this.showNotification('Could not access camera/microphone', 'error');
    }
  }

  togglePreJoinCamera() {
    this.isVideoEnabled = !this.isVideoEnabled;
    this.preJoinCamera.classList.toggle('active', this.isVideoEnabled);
    
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = this.isVideoEnabled;
      }
    }
    
    const icon = this.preJoinCamera.querySelector('i');
    icon.className = this.isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
  }

  togglePreJoinMic() {
    this.isAudioEnabled = !this.isAudioEnabled;
    this.preJoinMic.classList.toggle('active', this.isAudioEnabled);
    
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = this.isAudioEnabled;
      }
    }
    
    const icon = this.preJoinMic.querySelector('i');
    icon.className = this.isAudioEnabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
  }

  createRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'create-room' }));
    }
  }

  joinRoom() {
    const roomId = this.roomInput.value.trim();
    if (!roomId) {
      this.showNotification('Please enter a room ID', 'error');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ 
        type: 'join-room', 
        roomId: roomId 
      }));
    }
  }

  enterMeeting(roomId) {
    this.roomId = roomId;
    this.preJoinScreen.classList.add('hidden');
    this.meetingInterface.classList.remove('hidden');
    this.roomIdDisplay.textContent = `Room: ${roomId}`;
    
    // Add local video to grid only if not already added
    if (!this.participants.has(this.userId)) {
      this.addVideoToGrid(this.userId, this.localStream, true);
    }
    
    this.showNotification(`Joined room: ${roomId}`);
  }

  addVideoToGrid(userId, stream, isLocal = false) {
    // Check if participant already exists
    if (this.participants.has(userId)) {
      console.log(`Video for user ${userId} already exists`);
      return;
    }

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    videoWrapper.id = `video-${userId}`;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = isLocal;
    video.srcObject = stream;

    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    overlay.innerHTML = `
      <i class="fas fa-microphone"></i>
      <span>${isLocal ? 'You' : `User ${userId.substring(0, 6)}`}</span>
    `;

    videoWrapper.appendChild(video);
    videoWrapper.appendChild(overlay);
    this.videosGrid.appendChild(videoWrapper);

    // Store participant info
    this.participants.set(userId, { videoWrapper, video, overlay, stream });
    
    console.log(`Added video for user: ${userId}, isLocal: ${isLocal}`);
  }

  removeVideoFromGrid(userId) {
    const participant = this.participants.get(userId);
    if (participant) {
      participant.videoWrapper.remove();
      this.participants.delete(userId);
    }
  }

  async createPeerConnection(userId) {
    const pc = new RTCPeerConnection(this.config);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
          targetUserId: userId
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream from:', userId);
      this.addVideoToGrid(userId, event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removeVideoFromGrid(userId);
        this.peerConnections.delete(userId);
      }
    };

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    this.peerConnections.set(userId, pc);
    return pc;
  }

  async handleSignalingData(data) {
    console.log('Received signaling data:', data);

    switch (data.type) {
      case 'user-id':
        this.userId = data.userId;
        break;

      case 'room-created':
        this.enterMeeting(data.roomId);
        this.updateParticipantsCount(data.participants.length);
        break;

      case 'room-joined':
        this.enterMeeting(data.roomId);
        this.updateParticipantsCount(data.participants.length);
        
        // Create peer connections for existing participants
        for (const participantId of data.participants) {
          if (participantId !== this.userId) {
            const pc = await this.createPeerConnection(participantId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            this.ws.send(JSON.stringify({
              type: 'offer',
              offer: offer,
              targetUserId: participantId
            }));
          }
        }
        break;

      case 'user-joined':
        this.updateParticipantsCount(data.participants.length);
        this.showNotification(`User ${data.userId.substring(0, 6)} joined`);
        break;

      case 'user-left':
        this.updateParticipantsCount(data.participants.length);
        this.removeVideoFromGrid(data.userId);
        
        // Close and remove peer connection
        const pc = this.peerConnections.get(data.userId);
        if (pc) {
          pc.close();
          this.peerConnections.delete(data.userId);
        }
        
        this.showNotification(`User ${data.userId.substring(0, 6)} left`);
        break;

    case 'offer':
        await this.handleOffer(data);
      break;

    case 'answer':
        await this.handleAnswer(data);
      break;

    case 'candidate':
        await this.handleCandidate(data);
        break;

      case 'chat-message':
        // Only display if it's not from ourselves (we already displayed it locally)
        if (data.userId !== this.userId) {
          this.displayChatMessage(data);
        }
        break;

      case 'error':
        this.showNotification(data.message, 'error');
      break;
  }
}

  async handleOffer(data) {
    const pc = await this.createPeerConnection(data.userId);
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.ws.send(JSON.stringify({
      type: 'answer',
      answer: answer,
      targetUserId: data.userId
    }));
  }

  async handleAnswer(data) {
    const pc = this.peerConnections.get(data.userId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  }

  async handleCandidate(data) {
    const pc = this.peerConnections.get(data.userId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  toggleVideo() {
    this.isVideoEnabled = !this.isVideoEnabled;
    this.toggleCamera.classList.toggle('active', this.isVideoEnabled);
    
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = this.isVideoEnabled;
      }
    }
    
    const icon = this.toggleCamera.querySelector('i');
    icon.className = this.isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
  }

  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    this.toggleMic.classList.toggle('active', this.isAudioEnabled);
    
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = this.isAudioEnabled;
      }
    }
    
    const icon = this.toggleMic.querySelector('i');
    icon.className = this.isAudioEnabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
    
    // Update local video overlay
    const localParticipant = this.participants.get(this.userId);
    if (localParticipant) {
      localParticipant.overlay.classList.toggle('muted', !this.isAudioEnabled);
    }
  }

  async toggleScreenShare() {
    if (!this.isSharingScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        
        this.peerConnections.forEach(async (pc) => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        });
        
        // Update local video
        const localParticipant = this.participants.get(this.userId);
        if (localParticipant) {
          localParticipant.video.srcObject = screenStream;
        }
        
        // Handle screen share end
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
        
        this.isSharingScreen = true;
        this.shareScreen.classList.add('active');
        this.showNotification('Screen sharing started');
        
      } catch (error) {
        console.error('Error starting screen share:', error);
        this.showNotification('Could not start screen sharing', 'error');
      }
    } else {
      this.stopScreenShare();
    }
  }

  async stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      // Replace screen share track with camera track
      this.peerConnections.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local video
      const localParticipant = this.participants.get(this.userId);
      if (localParticipant) {
        localParticipant.video.srcObject = this.localStream;
      }
    }
    
    this.isSharingScreen = false;
    this.shareScreen.classList.remove('active');
    this.showNotification('Screen sharing stopped');
  }

  toggleChatSidebar() {
    this.sidebar.classList.toggle('open');
  }

  sendChatMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;
    
    const chatData = {
      type: 'chat-message',
      message: message,
      userId: this.userId,
      timestamp: Date.now()
    };
    
    // Display own message immediately
    this.displayChatMessage(chatData);
    
    // Send to server to broadcast to others
    this.ws.send(JSON.stringify(chatData));
    
    this.chatInput.value = '';
  }

  displayChatMessage(data) {
    const messageDiv = document.createElement('div');
    const isOwnMessage = data.userId === this.userId;
    
    messageDiv.className = `chat-message ${isOwnMessage ? 'own' : 'other'}`;
    
    const senderName = isOwnMessage ? 'You' : `User ${data.userId.substring(0, 6)}`;
    
    messageDiv.innerHTML = `
      <div class="sender">${senderName}</div>
      <div>${this.escapeHtml(data.message)}</div>
    `;
    
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    // Show notification if chat is closed and it's not own message
    if (!this.sidebar.classList.contains('open') && !isOwnMessage) {
      this.showNotification(`New message from ${senderName}`);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateParticipantsCount(count) {
    this.participantsCount.innerHTML = `<i class="fas fa-users"></i> ${count}`;
  }

  leaveCall() {
    console.log('Leaving call...');
    
    // Send leave message to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'leave-room' }));
    }
    
    // Clean up peer connections
    this.peerConnections.forEach((pc, userId) => {
      console.log(`Closing connection with ${userId}`);
      pc.close();
    });
    this.peerConnections.clear();
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      this.localStream = null;
    }
    
    // Clear participants
    this.participants.clear();
    
    // Reset room info
    this.roomId = null;
    this.userId = null;
    
    // Reset UI
    this.meetingInterface.classList.add('hidden');
    this.preJoinScreen.classList.remove('hidden');
    this.videosGrid.innerHTML = '';
    this.chatMessages.innerHTML = '';
    this.sidebar.classList.remove('open');
    
    // Reset control states
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    this.isSharingScreen = false;
    this.toggleCamera.classList.add('active');
    this.toggleMic.classList.add('active');
    this.shareScreen.classList.remove('active');
    
    // Reinitialize camera for pre-join
    setTimeout(() => {
      this.initializePreJoinCamera();
    }, 100);
    
    this.showNotification('Left the meeting');
  }

  showNotification(message, type = 'info') {
    this.notification.textContent = message;
    this.notification.className = `notification ${type} show`;
    
    setTimeout(() => {
      this.notification.classList.remove('show');
    }, 3000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MeetApp();
});


