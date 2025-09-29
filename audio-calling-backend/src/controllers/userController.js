const { supabaseAdmin } = require('../../config/database');

class UserController {
  async getUsers(req, res) {
    try {
      const { gender, search, page = 1, limit = 20 } = req.query;
      const currentUser = req.user;

      let query = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' })
        .neq('id', currentUser.id)
        .order('online', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply gender filter
      if (gender && gender !== 'all') {
        query = query.eq('gender', gender);
      }

      // Apply search filter
      if (search) {
        query = query.ilike('phone', `%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);

      const { data: users, error, count } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }

      res.json({
        users: users || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req, res) {
    try {
      const user = req.user;
      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { gender, date_of_birth } = req.body;

      const updates = {};
      if (gender) updates.gender = gender;
      if (date_of_birth) updates.date_of_birth = date_of_birth;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      res.json({ 
        message: 'Profile updated successfully', 
        user 
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateOnlineStatus(req, res) {
    try {
      const userId = req.user.id;
      const { online } = req.body;

      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          online: online,
          last_seen: online ? req.user.last_seen : new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating online status:', error);
        return res.status(500).json({ error: 'Failed to update online status' });
      }

      res.json({ 
        message: `User is now ${online ? 'online' : 'offline'}` 
      });
    } catch (error) {
      console.error('Update online status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async savePushToken(req, res) {
    try {
      const userId = req.user.id;
      const { token, platform } = req.body;

      if (!token || !platform) {
        return res.status(400).json({ 
          error: 'Token and platform are required' 
        });
      }

      const { error } = await supabaseAdmin
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          platform
        });

      if (error) {
        console.error('Error saving push token:', error);
        return res.status(500).json({ error: 'Failed to save push token' });
      }

      res.json({ message: 'Push token saved successfully' });
    } catch (error) {
      console.error('Save push token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new UserController();