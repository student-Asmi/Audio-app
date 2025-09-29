const { supabaseAdmin } = require('../../config/database');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId
  }

  initialize(io) {
    this.io = io;

    io.on('connection', (socket) => {
      console.log(`User ${socket.user.id} connected with socket ${socket.id}`);

      // Store user socket connection
      this.userSockets.set(socket.user.id, socket.id);

      // Update user online status
      this.updateUserOnlineStatus(socket.user.id, true);

      // Store session in database
      this.storeUserSession(socket.user.id, socket.id);

      // Call signaling events
      this.handleCallSignaling(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.user.id}:`, error);
      });
    });
  }

  handleCallSignaling(socket) {
    // Handle call offer
    socket.on('call-offer', async (data) => {
      const { callId, offer, toUserId } = data;

      try {
        // Store offer in database
        const { error } = await supabaseAdmin
          .from('call_signaling')
          .insert({
            call_id: callId,
            type: 'offer',
            sender_id: socket.user.id,
            payload: { offer }
          });

        if (error) throw error;

        // Send offer to receiver
        const receiverSocketId = this.userSockets.get(toUserId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('incoming-call', {
            callId,
            offer,
            fromUser: socket.user
          });
        }

        // Send push notification (implement separately)
        this.sendPushNotification(toUserId, {
          title: 'Incoming Call',
          body: `${socket.user.phone} is calling you`,
          data: { callId, type: 'incoming_call' }
        });

      } catch (error) {
        console.error('Error handling call offer:', error);
        socket.emit('call-error', { error: 'Failed to send call offer' });
      }
    });

    // Handle call answer
    socket.on('call-answer', async (data) => {
      const { callId, answer, toUserId } = data;

      try {
        // Store answer in database
        const { error } = await supabaseAdmin
          .from('call_signaling')
          .insert({
            call_id: callId,
            type: 'answer',
            sender_id: socket.user.id,
            payload: { answer }
          });

        if (error) throw error;

        // Update call status
        await supabaseAdmin
          .from('calls')
          .update({ status: 'ongoing', started_at: new Date().toISOString() })
          .eq('id', callId);

        // Send answer to caller
        const callerSocketId = this.userSockets.get(toUserId);
        if (callerSocketId) {
          this.io.to(callerSocketId).emit('call-answered', {
            callId,
            answer
          });
        }

      } catch (error) {
        console.error('Error handling call answer:', error);
        socket.emit('call-error', { error: 'Failed to send call answer' });
      }
    });

    // Handle ICE candidates
    socket.on('ice-candidate', async (data) => {
      const { callId, candidate, toUserId } = data;

      try {
        // Store ICE candidate in database
        const { error } = await supabaseAdmin
          .from('call_signaling')
          .insert({
            call_id: callId,
            type: 'ice-candidate',
            sender_id: socket.user.id,
            payload: { candidate }
          });

        if (error) throw error;

        // Send ICE candidate to other user
        const targetSocketId = this.userSockets.get(toUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('ice-candidate', {
            callId,
            candidate
          });
        }

      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Handle call rejection
    socket.on('call-reject', async (data) => {
      const { callId, toUserId } = data;

      try {
        // Update call status
        await supabaseAdmin
          .from('calls')
          .update({ status: 'rejected', ended_at: new Date().toISOString() })
          .eq('id', callId);

        // Notify caller
        const callerSocketId = this.userSockets.get(toUserId);
        if (callerSocketId) {
          this.io.to(callerSocketId).emit('call-rejected', { callId });
        }

      } catch (error) {
        console.error('Error handling call rejection:', error);
      }
    });

    // Handle call end
    socket.on('call-end', async (data) => {
      const { callId, toUserId, duration } = data;

      try {
        // Update call status
        await supabaseAdmin
          .from('calls')
          .update({ 
            status: 'ended', 
            ended_at: new Date().toISOString(),
            duration: duration || 0
          })
          .eq('id', callId);

        // Notify other user
        const otherUserSocketId = this.userSockets.get(toUserId);
        if (otherUserSocketId) {
          this.io.to(otherUserSocketId).emit('call-ended', { callId });
        }

      } catch (error) {
        console.error('Error handling call end:', error);
      }
    });
  }

  async updateUserOnlineStatus(userId, online) {
    try {
      await supabaseAdmin
        .from('users')
        .update({ 
          online: online,
          last_seen: online ? undefined : new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  async storeUserSession(userId, socketId) {
    try {
      await supabaseAdmin
        .from('user_sessions')
        .upsert({
          user_id: userId,
          socket_id: socketId,
          device_info: {},
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    } catch (error) {
      console.error('Error storing user session:', error);
    }
  }

  async handleDisconnect(socket) {
    console.log(`User ${socket.user.id} disconnected`);

    // Remove from active sockets
    this.userSockets.delete(socket.user.id);

    // Update online status
    this.updateUserOnlineStatus(socket.user.id, false);

    // Remove session from database
    try {
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('socket_id', socket.id);
    } catch (error) {
      console.error('Error removing user session:', error);
    }
  }

  async sendPushNotification(userId, notification) {
    // Implementation for push notifications
    // You can integrate with Firebase Cloud Messaging or OneSignal
    console.log(`Push notification to ${userId}:`, notification);
  }

  // Utility method to get socket ID by user ID
  getSocketId(userId) {
    return this.userSockets.get(userId);
  }

  // Utility method to emit event to specific user
  emitToUser(userId, event, data) {
    const socketId = this.getSocketId(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

const socketService = new SocketService();

const initializeSocket = (io) => {
  socketService.initialize(io);
};

module.exports = {
  initializeSocket,
  socketService
};