const { supabaseAdmin } = require('../../config/database');
const { generateToken } = require('../middleware/auth');
const twilio = require('twilio');
const crypto = require('crypto');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class AuthController {
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      const { error } = await supabaseAdmin
        .from('otp_verifications')
        .upsert({
          phone,
          otp,
          expires_at: expiresAt.toISOString(),
          verified: false
        });

      if (error) {
        console.error('Error storing OTP:', error);
        return res.status(500).json({ error: 'Failed to send OTP' });
      }

      // Send OTP via Twilio (in production)
      if (process.env.NODE_ENV === 'production') {
        try {
          await twilioClient.messages.create({
            body: `Your Social Calling App verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
          });
        } catch (twilioError) {
          console.error('Twilio error:', twilioError);
          // Continue anyway for demo purposes
        }
      }

      // In development, return OTP for testing
      const response = {
        message: 'OTP sent successfully',
        ...(process.env.NODE_ENV !== 'production' && { demo_otp: otp })
      };

      res.json(response);
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { phone, otp, gender, dateOfBirth } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
      }

      // Verify OTP
      const { data: otpRecord, error } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .eq('phone', phone)
        .eq('otp', otp)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Mark OTP as verified
      await supabaseAdmin
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      // Check if user exists
      let user;
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existingUser) {
        user = existingUser;
        
        // Update online status
        await supabaseAdmin
          .from('users')
          .update({ online: true, last_seen: new Date().toISOString() })
          .eq('id', user.id);
      } else {
        // Create new user
        if (!gender || !dateOfBirth) {
          return res.status(400).json({ 
            error: 'Gender and date of birth are required for new users' 
          });
        }

        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            phone,
            gender,
            date_of_birth: dateOfBirth,
            online: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return res.status(500).json({ error: 'Failed to create user' });
        }

        user = newUser;
      }

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          phone: user.phone,
          gender: user.gender,
          date_of_birth: user.date_of_birth,
          online: user.online
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refreshToken(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Verify user exists
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const token = generateToken(user.id);

      res.json({
        message: 'Token refreshed successfully',
        token,
        user: {
          id: user.id,
          phone: user.phone,
          gender: user.gender,
          date_of_birth: user.date_of_birth,
          online: user.online
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Update user online status
      await supabaseAdmin
        .from('users')
        .update({ 
          online: false, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', userId);

      // Remove user sessions
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();