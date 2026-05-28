const mongoose = require('mongoose');

const SmsSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    receiver: {
      type: String,
      trim: true,
      default: '',
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'received'],
      default: function () {
        return this.type === 'incoming' ? 'received' : 'pending';
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    simSlot: {
      type: Number,
      default: 0,
    },
    deviceId: {
      type: String,
      default: 'unknown',
    },
  },
  {
    timestamps: true,
  }
);

// Add index on sender, timestamp, and deviceId for quick searches
SmsSchema.index({ sender: 1, timestamp: -1 });
SmsSchema.index({ type: 1, status: 1 });

// Post-save hook to automatically delete the oldest messages when count exceeds 10
SmsSchema.post('save', async function (doc) {
  try {
    const SmsModel = mongoose.model('Sms');
    const devId = doc.deviceId;
    if (devId && devId !== 'any' && devId !== 'unknown') {
      const messages = await SmsModel.find({ deviceId: devId }).sort({ timestamp: -1 });
      if (messages.length > 10) {
        const idsToDelete = messages.slice(10).map(m => m._id);
        await SmsModel.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`[SMS Capping] Deleted ${idsToDelete.length} older messages for device ${devId}. Count is back to 10.`);
      }
    }
  } catch (err) {
    console.error('Error auto-capping SMS database logs:', err);
  }
});

module.exports = mongoose.model('Sms', SmsSchema);
