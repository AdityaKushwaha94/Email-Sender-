const nodemailer = require('nodemailer');
const EmailCampaign = require('../models/EmailCampaign');
const User = require('../models/User');
const { emailQueue, redis } = require('../../config/redis');

// Create transporter function
const createTransporter = async (user) => {
  // Use user's custom email settings if available
  if (user.emailCredentials && user.emailCredentials.smtpHost) {
    return nodemailer.createTransporter({
      host: user.emailCredentials.smtpHost,
      port: user.emailCredentials.smtpPort || 587,
      secure: false,
      auth: {
        user: user.emailCredentials.senderEmail,
        pass: user.emailCredentials.senderPassword,
      },
    });
  } else {
    // Use default Gmail SMTP
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
};

// Send single email
const sendSingleEmail = async ({ to, subject, message, name }) => {
  try {
    // For now, use system email credentials
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const personalizedMessage = message.replace(/{{name}}/g, name);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Hello ${name}!</h2>
          <div style="line-height: 1.6; white-space: pre-line;">
            ${personalizedMessage}
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent via Email Sender Application
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Single email sent to ${to}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
};

// Send multiple emails (up to 10)
const sendMultipleEmails = async ({ subject, message, recipients }) => {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const recipient of recipients) {
    try {
      const personalizedMessage = message.replace(/{{name}}/g, recipient.name);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Hello ${recipient.name}!</h2>
            <div style="line-height: 1.6; white-space: pre-line;">
              ${personalizedMessage}
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This email was sent via Email Sender Application
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      results.sent++;
      console.log(`✅ Email sent to ${recipient.email}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: recipient.email,
        error: error.message
      });
      console.error(`❌ Failed to send email to ${recipient.email}:`, error);
    }
  }

  return results;
};

// Helper to interpolate variables in email body
const interpolateTemplate = (template, data) => {
  let result = template;
  if (data && typeof data === 'object') {
    Object.keys(data).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
    });
  }
  return result;
};

// Send bulk emails using Redis Queue
const sendBulkEmails = async (campaignId) => {
  try {
    console.log(`🚀 Queuing campaign ${campaignId} for processing`);
    
    if (!emailQueue) {
      // If Redis is not available, process immediately
      return await processCampaignDirectly(campaignId);
    }
    
    // Add campaign to Redis queue for background processing
    const job = await emailQueue.add('processCampaign', {
      campaignId: campaignId.toString()
    }, {
      attempts: 3,
      backoff: 'exponential',
      delay: 5000 // Start processing after 5 seconds
    });
    
    console.log(`📝 Campaign ${campaignId} queued with job ID: ${job.id}`);
    
    return {
      jobId: job.id,
      status: 'queued',
      message: 'Campaign has been queued for processing'
    };
    
  } catch (error) {
    console.error('Error queuing bulk emails:', error);
    // Fallback to direct processing if queue fails
    return await processCampaignDirectly(campaignId);
  }
};

// Process campaign directly (fallback when Redis is not available)
const processCampaignDirectly = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = 'processing';
    await campaign.save();

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const recipient of campaign.recipients) {
      try {
        const personalizedMessage = campaign.body.replace(/{{name}}/g, recipient.name);
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: recipient.email,
          subject: campaign.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Hello ${recipient.name}!</h2>
              <div style="line-height: 1.6; white-space: pre-line;">
                ${personalizedMessage}
              </div>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                Campaign: ${campaign.name}
              </p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        sent++;
        console.log(`✅ Email sent to ${recipient.email}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        console.error(`❌ Failed to send email to ${recipient.email}:`, error);
      }
    }

    campaign.status = 'completed';
    campaign.sentCount = sent;
    campaign.failedCount = failed;
    await campaign.save();

    return {
      status: 'completed',
      sent,
      failed,
      message: `Campaign completed: ${sent} sent, ${failed} failed`
    };
  } catch (error) {
    console.error('Error processing campaign directly:', error);
    if (campaignId) {
      try {
        await EmailCampaign.findByIdAndUpdate(campaignId, { 
          status: 'failed',
          error: error.message 
        });
      } catch (updateError) {
        console.error('Error updating campaign status:', updateError);
      }
    }
    throw error;
  }
};

// Get campaign job status
const getCampaignJobStatus = async (jobId) => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (!job) {
      return { status: 'not_found' };
    }
    
    const state = await job.getState();
    const progress = job.progress();
    
    let result = null;
    if (state === 'completed') {
      result = job.returnvalue;
    } else if (state === 'failed') {
      result = { error: job.failedReason };
    }
    
    return {
      status: state,
      progress: progress,
      result: result,
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null
    };
    
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
};

// Get queue stats
const getQueueStats = async () => {
  try {
    const waiting = await emailQueue.getWaiting();
    const active = await emailQueue.getActive();
    const completed = await emailQueue.getCompleted();
    const failed = await emailQueue.getFailed();
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
};

module.exports = { 
  sendSingleEmail,
  sendMultipleEmails,
  sendBulkEmails, 
  getCampaignJobStatus, 
  getQueueStats 
};