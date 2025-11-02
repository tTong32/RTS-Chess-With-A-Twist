import nodemailer from 'nodemailer';

// Email configuration - in production, use environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// In development, just log the verification link
const isDevelopment = process.env.NODE_ENV !== 'production';

class EmailService {
  async sendVerificationEmail(email, username, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"RTS Chess" <${emailConfig.auth.user}>`,
      to: email,
      subject: 'Verify Your RTS Chess Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to RTS Chess, ${username}!</h2>
          <p>Thank you for signing up. Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            If you didn't create an account with RTS Chess, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Welcome to RTS Chess, ${username}!
        
        Thank you for signing up. Please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with RTS Chess, please ignore this email.
      `
    };

    if (isDevelopment || !emailConfig.auth.user) {
      console.log('=== EMAIL VERIFICATION (DEV MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Verification Link: ${verificationUrl}`);
      console.log('====================================');
      return { success: true };
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      // In development, still return success even if email fails
      if (isDevelopment) {
        console.log('=== EMAIL VERIFICATION (DEV MODE) ===');
        console.log(`To: ${email}`);
        console.log(`Verification Link: ${verificationUrl}`);
        console.log('====================================');
        return { success: true };
      }
      return { success: false, error: 'Failed to send verification email' };
    }
  }

  async sendPasswordResetEmail(email, username, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"RTS Chess" <${emailConfig.auth.user}>`,
      to: email,
      subject: 'Reset Your RTS Chess Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <p>
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello ${username},
        
        We received a request to reset your password. Click the link below to set a new password:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
      `
    };

    if (isDevelopment || !emailConfig.auth.user) {
      console.log('=== PASSWORD RESET EMAIL (DEV MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Reset Link: ${resetUrl}`);
      console.log('======================================');
      return { success: true };
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      if (isDevelopment) {
        console.log('=== PASSWORD RESET EMAIL (DEV MODE) ===');
        console.log(`To: ${email}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('======================================');
        return { success: true };
      }
      return { success: false, error: 'Failed to send password reset email' };
    }
  }
}

export default new EmailService();

