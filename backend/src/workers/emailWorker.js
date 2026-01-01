const { emailQueue } = require('../../config/redis');
const nodemailer = require('nodemailer');
const EmailCampaign = require('../models/EmailCampaign');
const User = require('../models/User');

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

// Process individual email job
emailQueue.process('sendSingleEmail', async (job) => {
  const { recipient, campaign, user, transporter } = job.data;
  
  try {
    // Create transporter from job data
    const transport = nodemailer.createTransporter(transporter);
    
    // Personalize email if needed
    let emailBody = campaign.body;
    let emailSubject = campaign.subject;
    
    if (campaign.isPersonalized && recipient.customData) {
      emailBody = interpolateTemplate(campaign.body, recipient.customData);
      emailSubject = interpolateTemplate(campaign.subject, recipient.customData);
    }
    
    // Send email
    await transport.sendMail({
      from: user.emailCredentials?.senderEmail || process.env.EMAIL_USER,
      to: recipient.email,
      subject: emailSubject,
      html: emailBody,
      // Add tracking headers
      headers: {
        'X-Campaign-ID': campaign._id,
        'X-Recipient-ID': recipient._id || recipient.email
      }
    });
    
    console.log(`📧 Email sent to ${recipient.email} for campaign ${campaign.name}`);
    return { status: 'sent', email: recipient.email };
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${recipient.email}:`, error.message);
    throw error;
  }
});

// Process bulk email campaign
emailQueue.process('processCampaign', async (job) => {
  const { campaignId, userId } = job.data;
  
  try {
    console.log(`🚀 Processing campaign ${campaignId}`);
    
    // Get campaign and user data
    const campaign = await EmailCampaign.findById(campaignId);
    const user = await User.findById(userId);
    
    if (!campaign || !user) {
      throw new Error('Campaign or user not found');
    }
    
    // Update campaign status
    campaign.status = 'running';
    await campaign.save();
    
    // Prepare transporter config
    const transporterConfig = {
      host: user.emailCredentials?.smtpHost || 'smtp.gmail.com',
      port: user.emailCredentials?.smtpPort || 587,
      secure: false,
      auth: {
        user: user.emailCredentials?.senderEmail || process.env.EMAIL_USER,
        pass: user.emailCredentials?.senderPassword || process.env.EMAIL_PASSWORD
      }
    };
    
    // Create individual email jobs
    const emailJobs = campaign.recipients.map((recipient, index) => ({
      name: 'sendSingleEmail',
      data: {
        recipient,
        campaign: {
          _id: campaign._id,
          name: campaign.name,
          subject: campaign.subject,
          body: campaign.body,
          isPersonalized: campaign.isPersonalized
        },
        user: {
          emailCredentials: user.emailCredentials
        },
        transporter: transporterConfig
      },
      opts: {
        delay: index * 1000, // Delay each email by 1 second to avoid rate limits
        attempts: 3,
        backoff: 'exponential'
      }
    }));
    
    // Add all email jobs to queue
    const jobs = await emailQueue.addBulk(emailJobs);
    console.log(`📝 Added ${jobs.length} email jobs to queue for campaign ${campaign.name}`);
    
    // Monitor job completion
    let completedJobs = 0;
    let failedJobs = 0;
    
    // Update campaign stats as jobs complete
    const updateStats = async () => {
      campaign.sentCount = completedJobs;
      campaign.failedCount = failedJobs;
      
      // Update individual recipient status
      for (let i = 0; i < campaign.recipients.length; i++) {
        const job = jobs[i];
        if (job) {
          try {
            const jobState = await job.getState();
            const jobData = await job.returnvalue;
            
            if (jobState === 'completed' && jobData) {
              campaign.recipients[i].status = 'sent';
              campaign.recipients[i].sentAt = new Date();
            } else if (jobState === 'failed') {
              campaign.recipients[i].status = 'failed';
              const failReason = await job.failedReason;
              campaign.recipients[i].error = failReason || 'Unknown error';
            }
          } catch (error) {
            console.error('Error checking job state:', error);
          }
        }
      }
      
      await campaign.save();
    };
    
    // Wait for all jobs to complete
    await Promise.allSettled(jobs.map(async (job) => {
      try {
        await job.finished();
        completedJobs++;
      } catch (error) {
        failedJobs++;
        console.error(`Job failed:`, error);
      }
    }));
    
    // Final update
    await updateStats();
    
    // Update final campaign status
    campaign.status = 'completed';
    await campaign.save();
    
    console.log(`✅ Campaign ${campaign.name} completed: ${completedJobs} sent, ${failedJobs} failed`);
    
    return {
      campaignId,
      totalSent: completedJobs,
      totalFailed: failedJobs,
      status: 'completed'
    };
    
  } catch (error) {
    console.error(`❌ Campaign processing failed:`, error);
    
    // Update campaign status to failed
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (campaign) {
        campaign.status = 'failed';
        await campaign.save();
      }
    } catch (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }
    
    throw error;
  }
});

// Queue event handlers
emailQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
  console.log(`❌ Job ${job.id} failed:`, err.message);
});

emailQueue.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

console.log('🔄 Email worker is running...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down email worker...');
  await emailQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Shutting down email worker...');
  await emailQueue.close();
  process.exit(0);
});