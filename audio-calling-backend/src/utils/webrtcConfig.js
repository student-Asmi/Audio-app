const getWebRTCConfig = () => {
  const config = {
    iceServers: [
      {
        urls: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302'
      }
    ]
  };

  // Add TURN server if configured
  if (process.env.TURN_SERVER && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    config.iceServers.push({
      urls: process.env.TURN_SERVER,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    });
  }

  return config;
};

module.exports = {
  getWebRTCConfig
};