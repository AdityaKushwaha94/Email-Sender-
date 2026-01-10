const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate OTP with expiration time (5 minutes)
 */
const generateOTPWithExpiry = () => {
  const otp = generateOTP();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  return { otp, expiry };
};

/**
 * Verify if OTP is valid and not expired
 */
const verifyOTP = (storedOTP, storedExpiry, providedOTP) => {
  if (!storedOTP || !storedExpiry || !providedOTP) {
    return false;
  }
  
  // Check if OTP is expired
  if (new Date() > new Date(storedExpiry)) {
    return false;
  }
  
  // Check if OTP matches
  return storedOTP === providedOTP.toString();
};

/**
 * Send OTP to user's email using system email
 */
const sendOTPEmail = async (toEmail, otp, userName = 'User') => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email service not configured. Missing EMAIL_USER or EMAIL_PASSWORD.');
    }

    // Create system transporter with Gmail service
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      // Add timeout and connection options for production
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 3, // Reduced from 5 to 3 to avoid Gmail rate limits
      connectionTimeout: 10000, // 10 seconds
      socketTimeout: 10000 // 10 seconds
    });

    const mailOptions = {
      from: `"Email Sender Verification" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Email Verification - OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hello ${userName},</p>
            <p>You requested to verify your email address for sending emails through our platform.</p>
            <p>Your verification code is:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; background: #fff; padding: 10px 20px; border-radius: 4px; border: 2px dashed #007bff;">${otp}</span>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in 5 minutes</li>
              <li>Do not share this code with anyone</li>
              <li>Use this code to verify your email sending credentials</li>
            </ul>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">
            This is an automated message from Email Sender Platform.
          </p>
        </div>
      `
    };

    // Add timeout to the email sending operation
    const emailPromise = transport.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout')), 15000)
    );

    await Promise.race([emailPromise, timeoutPromise]);
    return true;
  } catch (error) {
    // Log error details for debugging but don't expose sensitive info
    if (process.env.NODE_ENV === 'development') {
      console.error('OTP Email Error:', {
        code: error.code,
        message: error.message,
        command: error.command,
        stack: error.stack
      });
    }
    
    // Handle specific Gmail errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.error('Gmail connection error:', error.message);
    } else if (error.message && error.message.includes('rate')) {
      console.error('Gmail rate limit error:', error.message);
    }
    
    return false;
  }
};

/**
 * Test user's email credentials
 */
const testEmailCredentials = async (smtpHost, smtpPort, email, password) => {
  try {
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: email,
        pass: password
      }
    });

    // Verify connection
    await transport.verify();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Send test email from user's credentials
 */
const sendTestEmail = async (smtpHost, smtpPort, email, password, userName) => {
  try {
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: email,
        pass: password
      }
    });

    const mailOptions = {
      from: `"${userName}" <${email}>`,
      to: email, // Send test email to themselves
      subject: 'Email Credentials Verified Successfully!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745; text-align: center;">✅ Email Verified Successfully!</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hello ${userName},</p>
            <p>Congratulations! Your email credentials have been successfully verified and configured.</p>
            <p><strong>Verified Email:</strong> ${email}</p>
            <p><strong>SMTP Server:</strong> ${smtpHost}:${smtpPort}</p>
            <p>You can now send emails through our platform using your own email account.</p>
            <div style="background: #d4edda; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; margin: 15px 0;">
              <strong>Next Steps:</strong>
              <ul>
                <li>Start sending single emails</li>
                <li>Send emails to multiple recipients</li>
                <li>Create email campaigns (up to 100 emails)</li>
              </ul>
            </div>
            <p>Thank you for using our Email Sender Platform!</p>
          </div>
        </div>
      `
    };

    await transport.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
};

module.exports = {
  generateOTP,
  generateOTPWithExpiry,
  verifyOTP,
  sendOTPEmail,
  testEmailCredentials,
  sendTestEmail
};