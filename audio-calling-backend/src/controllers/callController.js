const { supabaseAdmin } = require('../../config/database');

class CallController {
  async getCallHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: calls, error, count } = await supabaseAdmin
        .from('calls')
        .select(`
          *,
          caller:caller_id(id, phone, gender),
          receiver:receiver_id(id, phone, gender)
        `, { count: 'exact' })
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching call history:', error);
        return res.status(500).json({ error: 'Failed to fetch call history' });
      }

      res.json({
        calls: calls || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Get call history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async startCall(req, res) {
    try {
      const callerId = req.user.id;
      const { receiver_id, call_type } = req.body;

      if (!receiver_id || !call_type) {
        return res.status(400).json({ 
          error: 'Receiver ID and call type are required' 
        });
      }

      // Check if receiver exists and is online
      const { data: receiver, error: receiverError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', receiver_id)
        .single();

      if (receiverError || !receiver) {
        return res.status(404).json({ error: 'Receiver not found' });
      }

      // Create call record
      const { data: call, error } = await supabaseAdmin
        .from('calls')
        .insert({
          caller_id: callerId,
          receiver_id: receiver_id,
          call_type: call_type,
          status: 'calling'
        })
        .select(`
          *,
          caller:caller_id(id, phone, gender),
          receiver:receiver_id(id, phone, gender)
        `)
        .single();

      if (error) {
        console.error('Error creating call:', error);
        return res.status(500).json({ error: 'Failed to start call' });
      }

      res.json({ 
        message: 'Call started successfully', 
        call 
      });
    } catch (error) {
      console.error('Start call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async endCall(req, res) {
    try {
      const userId = req.user.id;
      const { call_id, duration = 0 } = req.body;

      if (!call_id) {
        return res.status(400).json({ error: 'Call ID is required' });
      }

      // Verify user is part of the call
      const { data: call, error: callError } = await supabaseAdmin
        .from('calls')
        .select('*')
        .eq('id', call_id)
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .single();

      if (callError || !call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Update call record
      const { error } = await supabaseAdmin
        .from('calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration: duration
        })
        .eq('id', call_id);

      if (error) {
        console.error('Error ending call:', error);
        return res.status(500).json({ error: 'Failed to end call' });
      }

      res.json({ message: 'Call ended successfully' });
    } catch (error) {
      console.error('End call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCallStats(req, res) {
    try {
      const userId = req.user.id;

      const { data: stats, error } = await supabaseAdmin
        .from('calls')
        .select('call_type, status, created_at')
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) {
        console.error('Error fetching call stats:', error);
        return res.status(500).json({ error: 'Failed to fetch call statistics' });
      }

      const totalCalls = stats.length;
      const audioCalls = stats.filter(call => call.call_type === 'audio').length;
      const videoCalls = stats.filter(call => call.call_type === 'video').length;
      const missedCalls = stats.filter(call => call.status === 'missed').length;

      // Calculate average call duration for completed calls
      const completedCalls = stats.filter(call => 
        call.status === 'ended' && call.duration
      );
      const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const avgDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;

      res.json({
        total_calls: totalCalls,
        audio_calls: audioCalls,
        video_calls: videoCalls,
        missed_calls: missedCalls,
        average_duration: Math.round(avgDuration),
        completed_calls: completedCalls.length
      });
    } catch (error) {
      console.error('Get call stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new CallController();