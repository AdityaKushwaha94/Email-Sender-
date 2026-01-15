const nodemailer = require("nodemailer");
const EmailCampaign = require("../models/EmailCampaign");
const User = require("../models/User");
const { emailQueue, redis } = require("../../config/redis");

// Create transporter function using system email
const createTransport = async () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send single email using system email credentials
const sendSingleEmail = async (userId, { to, subject, message, name }) => {
  try {
    // Get user
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.emailCredentials?.isVerified) {
      throw new Error("Please verify your email address first");
    }

    const transport = await createTransport();
    const personalizedMessage = message.replace(/{{name}}/g, name || "there");

    const mailOptions = {
      from: `"${user.name}" <${process.env.EMAIL_USER}>`,
      replyTo: user.emailCredentials.senderEmail, // Set reply-to as user's verified email
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Hello ${name || "there"}!</h2>
          <div style="line-height: 1.6; white-space: pre-line;">
            ${personalizedMessage}
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent by ${user.name} via Email Sender Platform
          </p>
        </div>
      `,
    };

    const result = await transport.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
      to: to,
      from: process.env.EMAIL_USER,
      replyTo: user.emailCredentials.senderEmail,
    };
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send multiple emails using user's verified credentials (up to 100)
const sendMultipleEmails = async (userId, { subject, message, recipients }) => {
  const user = await User.findById(userId).select(
    "+emailCredentials.senderPassword"
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.emailCredentials?.isVerified) {
    throw new Error("Please verify your email credentials first");
  }

  if (recipients.length > 100) {
    throw new Error("Maximum 100 recipients allowed per batch");
  }

  const transport = await createTransport();
  const results = {
    sent: 0,
    failed: 0,
    total: recipients.length,
    errors: [],
    successEmails: [],
  };

  for (const recipient of recipients) {
    try {
      const personalizedMessage = message.replace(
        /{{name}}/g,
        recipient.name || "there"
      );

      const mailOptions = {
        from: `"${user.name}" <${process.env.EMAIL_USER}>`,
        replyTo: user.emailCredentials.senderEmail, // Set reply-to as user's verified email
        to: recipient.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Hello ${recipient.name || "there"}!</h2>
            <div style="line-height: 1.6; white-space: pre-line;">
              ${personalizedMessage}
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Sent by ${user.name} via Email Sender Platform
            </p>
          </div>
        `,
      };

      await transport.sendMail(mailOptions);
      results.sent++;
      results.successEmails.push(recipient.email);

      // Add small delay between emails to avoid rate limiting
      if (results.sent % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay every 10 emails
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: recipient.email,
        error: error.message,
      });
    }
  }

  return results;
};

// Helper to interpolate variables in email body
const interpolateTemplate = (template, data) => {
  let result = template;
  if (data && typeof data === "object") {
    Object.keys(data).forEach((key) => {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), data[key] || "");
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
    const job = await emailQueue.add(
      "processCampaign",
      {
        campaignId: campaignId.toString(),
      },
      {
        attempts: 3,
        backoff: "exponential",
        delay: 5000, // Start processing after 5 seconds
      }
    );

    console.log(`📝 Campaign ${campaignId} queued with job ID: ${job.id}`);

    return {
      jobId: job.id,
      status: "queued",
      message: "Campaign has been queued for processing",
    };
  } catch (error) {
    console.error("Error queuing bulk emails:", error);
    // Fallback to direct processing if queue fails
    return await processCampaignDirectly(campaignId);
  }
};

// Process campaign directly (fallback when Redis is not available)
const processCampaignDirectly = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    campaign.status = "processing";
    await campaign.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const recipient of campaign.recipients) {
      try {
        const personalizedMessage = campaign.body.replace(
          /{{name}}/g,
          recipient.name
        );

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
          `,
        };

        await transport.sendMail(mailOptions);
        sent++;
        console.log(`✅ Email sent to ${recipient.email}`);

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        console.error(`❌ Failed to send email to ${recipient.email}:`, error);
      }
    }

    campaign.status = "completed";
    campaign.sentCount = sent;
    campaign.failedCount = failed;
    await campaign.save();

    return {
      status: "completed",
      sent,
      failed,
      message: `Campaign completed: ${sent} sent, ${failed} failed`,
    };
  } catch (error) {
    console.error("Error processing campaign directly:", error);
    if (campaignId) {
      try {
        await EmailCampaign.findByIdAndUpdate(campaignId, {
          status: "failed",
          error: error.message,
        });
      } catch (updateError) {
        console.error("Error updating campaign status:", updateError);
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
      return { status: "not_found" };
    }

    const state = await job.getState();
    const progress = job.progress();

    let result = null;
    if (state === "completed") {
      result = job.returnvalue;
    } else if (state === "failed") {
      result = { error: job.failedReason };
    }

    return {
      status: state,
      progress: progress,
      result: result,
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  } catch (error) {
    console.error("Error getting job status:", error);
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
      total: waiting.length + active.length + completed.length + failed.length,
    };
  } catch (error) {
    console.error("Error getting queue stats:", error);
    throw error;
  }
};

module.exports = {
  sendSingleEmail,
  sendMultipleEmails,
  sendBulkEmails,
  getCampaignJobStatus,
  getQueueStats,
};
