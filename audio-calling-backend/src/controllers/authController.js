const { supabaseAdmin } = require('../../config/database');
const { generateToken } = require('../middleware/auth');
const twilio = require('twilio');
const crypto = require('crypto');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class AuthController {
  // ✅ Send OTP
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP in DB
      const { error } = await supabaseAdmin
        .from('otp_verifications')
        .insert([
          {
            phone,
            otp,
            expires_at: expiresAt.toISOString(),
            verified: false,
          },
        ])
        .select();

      if (error) {
        console.error('Error storing OTP:', error);
        return res.status(500).json({ error: 'Failed to save OTP' });
      }

      // ✅ Production: send OTP via Twilio
      if (process.env.NODE_ENV === 'production') {
        try {
          await twilioClient.messages.create({
            body: `Your Social Calling App verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
          });
        } catch (twilioError) {
          console.error('Twilio error:', twilioError);
          return res
            .status(500)
            .json({ error: 'Failed to send OTP via SMS' });
        }
      }

      // ✅ Development: return OTP in response
      const response = {
        message: 'OTP sent successfully',
        ...(process.env.NODE_ENV !== 'production' && { demo_otp: otp }),
      };

      return res.json(response);
    } catch (error) {
      console.error('Send OTP error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ✅ Verify OTP
  async verifyOTP(req, res) {
    try {
      const { phone, otp, gender, dateOfBirth } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
      }

      // Find OTP record
      const { data: otpRecord, error } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .eq('phone', phone)
        .eq('otp', otp)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Mark OTP as verified
      await supabaseAdmin
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      // ✅ Check if user exists
      let user;
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (existingUser) {
        user = existingUser;

        // Update status
        await supabaseAdmin
          .from('users')
          .update({
            online: true,
            last_seen: new Date().toISOString(),
          })
          .eq('id', user.id);
      } else {
        // New user → needs gender & DOB
        if (!gender || !dateOfBirth) {
          return res.status(400).json({
            error: 'Gender and date of birth are required for new users',
          });
        }

        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              phone,
              gender,
              date_of_birth: dateOfBirth,
              online: true,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return res.status(500).json({ error: 'Failed to create user' });
        }

        user = newUser;
      }

      // Generate JWT
      const token = generateToken(user.id);

      return res.json({
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          phone: user.phone,
          gender: user.gender,
          date_of_birth: user.date_of_birth,
          online: true,
        },
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ✅ Refresh token
  async refreshToken(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const token = generateToken(user.id);

      return res.json({
        message: 'Token refreshed successfully',
        token,
        user,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ✅ Logout
  async logout(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Set user offline
      await supabaseAdmin
        .from('users')
        .update({
          online: false,
          last_seen: new Date().toISOString(),
        })
        .eq('id', userId);

      return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();
