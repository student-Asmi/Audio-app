const cron = require('node-cron');
const { supabaseAdmin } = require('../../config/database');

class CronService {
  start() {
    // Clean up expired OTPs every hour
    cron.schedule('0 * * * *', this.cleanupExpiredOTPs);

    // Clean up old sessions daily
    cron.schedule('0 0 * * *', this.cleanupOldSessions);

    // Update user online status (mark as offline if no recent activity)
    cron.schedule('*/5 * * * *', this.updateInactiveUsers);

    console.log('Cron jobs started');
    
  }

  async cleanupExpiredOTPs() {
    try {
      const { error } = await supabaseAdmin
        .from('otp_verifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning up expired OTPs:', error);
      } else {
        console.log('Expired OTPs cleaned up successfully');
      }
    } catch (error) {
      console.error('Cron job error - cleanupExpiredOTPs:', error);
    }
  }

  async cleanupOldSessions() {
    try {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning up old sessions:', error);
      } else {
        console.log('Old sessions cleaned up successfully');
      }
    } catch (error) {
      console.error('Cron job error - cleanupOldSessions:', error);
    }
  }

  async updateInactiveUsers() {
    try {
      // Consider users inactive if they haven't been seen in 5 minutes
      const inactiveThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { error } = await supabaseAdmin
        .from('users')
        .update({ online: false })
        .eq('online', true)
        .lt('last_seen', inactiveThreshold);

      if (error) {
        console.error('Error updating inactive users:', error);
      }
    } catch (error) {
      console.error('Cron job error - updateInactiveUsers:', error);
    }
  }
}

module.exports = new CronService();