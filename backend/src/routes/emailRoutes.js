const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const mammoth = require("mammoth");
const auth = require("../middleware/auth");
const EmailCampaign = require("../models/EmailCampaign");
const {
  sendSingleEmail,
  sendMultipleEmails,
  sendBulkEmails,
  getCampaignJobStatus,
  getQueueStats,
} = require("../controllers/emailController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Send single email
router.post("/send-single", auth, async (req, res) => {
  try {
    const { to, subject, message, name } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await sendSingleEmail(req.userId, {
      to,
      subject,
      message,
      name: name || "Valued Customer",
    });

    res.json({
      success: true,
      message: "Email sent successfully",
      details: {
        to: result.to,
        from: result.from,
        messageId: result.messageId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send multiple emails (up to 100)
router.post("/send-multiple", auth, async (req, res) => {
  try {
    const { subject, message, recipients } = req.body;

    if (!subject || !message || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (recipients.length > 100) {
      return res.status(400).json({ error: "Maximum 100 recipients allowed" });
    }

    const results = await sendMultipleEmails(req.userId, {
      subject,
      message,
      recipients,
    });

    res.json({
      success: true,
      message: `Emails sent to ${results.sent} out of ${results.total} recipients`,
      results: {
        sent: results.sent,
        failed: results.failed,
        total: results.total,
        successEmails: results.successEmails,
        errors: results.errors,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send bulk emails with file upload
router.post("/send-bulk", auth, upload.single("file"), async (req, res) => {
  try {
    const { name, subject, message } = req.body;

    if (!req.file || !name || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields or file" });
    }

    let recipients = [];
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();

    if (["xlsx", "xls", "csv"].includes(fileExtension)) {
      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      recipients = data
        .map((row) => ({
          email: row.email || row.Email || row.EMAIL,
          name: row.name || row.Name || row.NAME || "Customer",
        }))
        .filter((r) => r.email && isValidEmail(r.email));
    } else if (["docx", "doc"].includes(fileExtension)) {
      // For Word documents, extract text and then find emails
      if (fileExtension === "docx") {
        const result = await mammoth.extractRawText({
          buffer: req.file.buffer,
        });
        const text = result.value;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailRegex) || [];

        recipients = emails.map((email, index) => ({
          email: email,
          name: `Customer ${index + 1}`,
        }));
      } else {
        // For older .doc files, try to parse as text
        const text = req.file.buffer.toString("utf8");
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailRegex) || [];

        recipients = emails.map((email, index) => ({
          email: email,
          name: `Customer ${index + 1}`,
        }));
      }
    } else {
      return res.status(400).json({ error: "Unsupported file format" });
    }

    if (recipients.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid email addresses found in file" });
    }

    // Create campaign
    const campaign = new EmailCampaign({
      userId: req.userId,
      name,
      subject,
      body: message,
      recipients,
      totalRecipients: recipients.length,
      status: "pending",
    });

    await campaign.save();

    // Start bulk email job
    await sendBulkEmails(campaign._id);

    res.json({
      success: true,
      campaignId: campaign._id,
      totalRecipients: recipients.length,
      message: "Bulk email campaign created and started",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Create email campaign
router.post("/campaigns", auth, async (req, res) => {
  try {
    const { name, subject, body, recipients, isPersonalized } = req.body;

    const campaign = new EmailCampaign({
      userId: req.userId,
      name,
      subject,
      body,
      recipients,
      isPersonalized,
      totalRecipients: recipients.length,
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Excel file and create recipients
router.post("/upload-excel", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Parse recipients from Excel
    const recipients = data
      .map((row) => ({
        email: row.email || row.Email,
        name: row.name || row.Name || "",
        customData: row,
      }))
      .filter((r) => r.email);

    res.json({ recipients, count: recipients.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send campaign emails
router.post("/campaigns/:id/send", auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.status = "queued";
    await campaign.save();

    // Send emails via Redis queue
    const result = await sendBulkEmails(campaign, req.userId);

    res.json({
      message: "Email campaign queued for processing",
      campaignId: campaign._id,
      jobId: result.jobId,
      status: result.status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job status
router.get("/campaigns/:id/job-status/:jobId", auth, async (req, res) => {
  try {
    const jobStatus = await getCampaignJobStatus(req.params.jobId);
    res.json(jobStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get queue statistics
router.get("/queue/stats", auth, async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaigns
router.get("/campaigns", auth, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign details
router.get("/campaigns/:id", auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
