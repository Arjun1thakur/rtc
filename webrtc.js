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
    this.isSelfViewVisible = true;
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
    this.toggleSelfView = document.getElementById('toggleSelfView');
    this.leaveCall = document.getElementById('leaveCall');

    // Chat elements
    this.sidebar = document.getElementById('sidebar');
    this.closeSidebar = document.getElementById('closeSidebar');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');

    // Share elements
    this.shareRoomBtn = document.getElementById('shareRoomBtn');
    this.shareModal = document.getElementById('shareModal');
    this.shareLink = document.getElementById('shareLink');
    this.copyLinkBtn = document.getElementById('copyLinkBtn');
    this.shareViaEmail = document.getElementById('shareViaEmail');
    this.shareViaWhatsApp = document.getElementById('shareViaWhatsApp');
    this.closeShareModal = document.getElementById('closeShareModal');

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
    this.toggleSelfView.addEventListener('click', () => this.toggleSelfViewVisibility());
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

    // Share functionality
    this.shareRoomBtn.addEventListener('click', () => this.showShareModal());
    this.copyLinkBtn.addEventListener('click', () => this.copyShareLink());
    this.shareViaEmail.addEventListener('click', () => this.shareViaEmail());
    this.shareViaWhatsApp.addEventListener('click', () => this.shareViaWhatsApp());
    this.closeShareModal.addEventListener('click', () => this.hideShareModal());
    
    // Close modal when clicking outside
    this.shareModal.addEventListener('click', (e) => {
      if (e.target === this.shareModal) this.hideShareModal();
    });
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.checkForRoomInURL();
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
    
    // Add double-click to minimize for local video
    if (isLocal) {
      videoWrapper.addEventListener('dblclick', () => {
        this.minimizeSelfView();
      });
    }
    
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
          video: {
            cursor: 'always',
            displaySurface: 'monitor'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        
        // Store original stream for later restoration
        this.originalStream = this.localStream;
        
        // Replace both video and audio tracks in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        const audioTrack = screenStream.getAudioTracks()[0];
        
        this.peerConnections.forEach(async (pc) => {
          // Replace video track
          const videoSender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (videoSender && videoTrack) {
            await videoSender.replaceTrack(videoTrack);
          }
          
          // Replace or add audio track for screen share
          if (audioTrack) {
            const audioSender = pc.getSenders().find(s => 
              s.track && s.track.kind === 'audio'
            );
            if (audioSender) {
              await audioSender.replaceTrack(audioTrack);
            } else {
              // Add audio track if not present
              pc.addTrack(audioTrack, screenStream);
            }
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
        
        // Store screen stream reference
        this.screenStream = screenStream;
        this.isSharingScreen = true;
        this.shareScreen.classList.add('active');
        this.showNotification('Screen sharing with audio started');
        
      } catch (error) {
        console.error('Error starting screen share:', error);
        if (error.name === 'NotAllowedError') {
          this.showNotification('Screen sharing permission denied', 'error');
        } else {
          this.showNotification('Could not start screen sharing', 'error');
        }
      }
    } else {
      this.stopScreenShare();
    }
  }

  async stopScreenShare() {
    // Stop screen stream tracks
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        track.stop();
      });
      this.screenStream = null;
    }
    
    // Restore original camera and microphone
    if (this.originalStream) {
      const videoTrack = this.originalStream.getVideoTracks()[0];
      const audioTrack = this.originalStream.getAudioTracks()[0];
      
      // Replace tracks back to camera/microphone
      this.peerConnections.forEach(async (pc) => {
        // Restore video track
        const videoSender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
        }
        
        // Restore audio track
        const audioSender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'audio'
        );
        if (audioSender && audioTrack) {
          await audioSender.replaceTrack(audioTrack);
        }
      });
      
      // Update local video
      const localParticipant = this.participants.get(this.userId);
      if (localParticipant) {
        localParticipant.video.srcObject = this.originalStream;
      }
      
      // Restore local stream reference
      this.localStream = this.originalStream;
      this.originalStream = null;
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
    
    // Confirm before leaving if there are other participants
    const participantCount = this.participants.size - 1; // Exclude self
    if (participantCount > 0) {
      const confirmLeave = confirm(`Are you sure you want to leave the meeting? There ${participantCount === 1 ? 'is' : 'are'} ${participantCount} other participant${participantCount === 1 ? '' : 's'} in the call.`);
      if (!confirmLeave) {
        return;
      }
    }
    
    this.forceLeaveCall();
  }

  forceLeaveCall() {
    console.log('Force leaving call...');
    
    // Send leave message to server multiple times to ensure delivery
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'leave-room' }));
          }
        }, i * 100);
      }
    }
    
    // Stop screen sharing if active
    if (this.isSharingScreen) {
      try {
        this.stopScreenShare();
      } catch (error) {
        console.error('Error stopping screen share:', error);
      }
    }
    
    // Clean up peer connections aggressively
    this.peerConnections.forEach((pc, userId) => {
      console.log(`Force closing connection with ${userId}`);
      try {
        if (pc.connectionState !== 'closed') {
          pc.close();
        }
      } catch (error) {
        console.error(`Error closing connection with ${userId}:`, error);
      }
    });
    this.peerConnections.clear();
    
    // Stop all stream tracks aggressively
    const streamsToStop = [this.localStream, this.screenStream, this.originalStream];
    
    streamsToStop.forEach((stream, index) => {
      if (stream) {
        stream.getTracks().forEach(track => {
          try {
            if (track.readyState !== 'ended') {
              track.stop();
              console.log(`Stopped ${track.kind} track from stream ${index}`);
            }
          } catch (error) {
            console.error(`Error stopping track:`, error);
          }
        });
      }
    });
    
    // Clear all stream references
    this.localStream = null;
    this.screenStream = null;
    this.originalStream = null;
    
    // Clear participants
    this.participants.clear();
    
    // Reset room info
    this.roomId = null;
    
    // Hide share modal if open
    this.hideShareModal();
    
    // Reset UI completely
    this.meetingInterface.classList.add('hidden');
    this.preJoinScreen.classList.remove('hidden');
    this.videosGrid.innerHTML = '';
    this.chatMessages.innerHTML = '';
    this.sidebar.classList.remove('open');
    
    // Reset all control states
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    this.isSharingScreen = false;
    this.isSelfViewVisible = true;
    
    // Reset button states
    this.toggleCamera.classList.add('active');
    this.toggleMic.classList.add('active');
    this.shareScreen.classList.remove('active');
    this.toggleSelfView.classList.add('active');
    
    // Update all icons
    this.toggleCamera.querySelector('i').className = 'fas fa-video';
    this.toggleMic.querySelector('i').className = 'fas fa-microphone';
    this.toggleSelfView.querySelector('i').className = 'fas fa-eye';
    
    // Clear URL parameters
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Reinitialize camera for pre-join with delay
    setTimeout(() => {
      this.initializePreJoinCamera();
    }, 1000);
    
    this.showNotification('Successfully left the meeting');
  }

  toggleSelfViewVisibility() {
    const localParticipant = this.participants.get(this.userId);
    if (!localParticipant) return;
    
    this.isSelfViewVisible = !this.isSelfViewVisible;
    
    if (this.isSelfViewVisible) {
      // Show self view
      localParticipant.videoWrapper.classList.remove('hidden', 'minimized');
      this.toggleSelfView.classList.add('active');
      this.toggleSelfView.querySelector('i').className = 'fas fa-eye';
      this.showNotification('Self view shown');
    } else {
      // Hide self view
      localParticipant.videoWrapper.classList.add('hidden');
      this.toggleSelfView.classList.remove('active');
      this.toggleSelfView.querySelector('i').className = 'fas fa-eye-slash';
      this.showNotification('Self view hidden');
    }
  }

  minimizeSelfView() {
    const localParticipant = this.participants.get(this.userId);
    if (!localParticipant || !this.isSelfViewVisible) return;
    
    localParticipant.videoWrapper.classList.add('minimized');
    
    // Add click handler to restore
    localParticipant.videoWrapper.onclick = () => {
      localParticipant.videoWrapper.classList.remove('minimized');
      localParticipant.videoWrapper.onclick = null;
    };
  }

  checkForRoomInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (roomId) {
      // Auto-fill room input and show join button prominently
      this.roomInput.value = roomId;
      this.roomInput.style.borderColor = '#4285f4';
      this.joinRoomBtn.style.background = '#4285f4';
      this.joinRoomBtn.textContent = 'Join Meeting';
      this.showNotification(`Ready to join room: ${roomId}`);
    }
  }

  showShareModal() {
    if (!this.roomId) {
      this.showNotification('No active room to share', 'error');
      return;
    }
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
    this.shareLink.value = shareUrl;
    this.shareModal.classList.remove('hidden');
  }

  hideShareModal() {
    this.shareModal.classList.add('hidden');
  }

  async copyShareLink() {
    try {
      await navigator.clipboard.writeText(this.shareLink.value);
      this.showNotification('Link copied to clipboard!');
      this.copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
      
      setTimeout(() => {
        this.copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
      }, 2000);
    } catch (error) {
      // Fallback for older browsers
      this.shareLink.select();
      document.execCommand('copy');
      this.showNotification('Link copied!');
    }
  }

  shareViaEmail() {
    const subject = encodeURIComponent('Join my video meeting');
    const body = encodeURIComponent(`Hi! Join my video meeting using this link:\n\n${this.shareLink.value}\n\nSee you there!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  shareViaWhatsApp() {
    const text = encodeURIComponent(`Join my video meeting: ${this.shareLink.value}`);
    window.open(`https://wa.me/?text=${text}`);
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


