const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  recipients: [{
    email: String,
    name: String,
    customData: Object, // For personalization
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    error: String
  }],
  totalRecipients: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending','processing', 'scheduled', 'queued', 'running', 'completed', 'failed'],
    default: 'draft'
  },
  jobId: {
    type: String, // Redis Bull job ID
    sparse: true
  },
  isPersonalized: {
    type: Boolean,
    default: false
  },
  scheduledTime: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);
