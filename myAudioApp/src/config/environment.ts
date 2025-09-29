export const Config = {
  API_BASE_URL: 'http://localhost:3000/api', // Change to your backend URL
  SOCKET_URL: 'http://localhost:3000', // Change to your backend URL
  
  // WebRTC Configuration
  WEBRTC_CONFIG: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  },
};

export default Config;