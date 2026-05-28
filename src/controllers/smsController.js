const Sms = require('../models/Sms');

/**
 * Sync / Receive incoming SMS from mobile devices
 * Supports both a single SMS object and an array of SMS objects (bulk upload)
 */
exports.syncIncomingSms = async (req, res) => {
  try {
    let smsData = req.body;

    if (!smsData) {
      return res.status(400).json({ success: false, message: 'No SMS data provided' });
    }

    // Convert single object to array for uniform processing
    if (!Array.isArray(smsData)) {
      smsData = [smsData];
    }

    const savedSms = [];
    const duplicates = [];

    for (const item of smsData) {
      const { sender, body, timestamp, simSlot, deviceId } = item;

      if (!sender || !body) {
        continue; // Skip invalid entries
      }

      console.log(`[SMS Sync/Received] From: ${sender} | Device: ${deviceId || 'unknown'} | Msg: ${body}`);

      const smsTime = timestamp ? new Date(timestamp) : new Date();

      // Simple duplicate prevention check (same sender, body, and timestamp within 2 seconds)
      const timeWindowStart = new Date(smsTime.getTime() - 2000);
      const timeWindowEnd = new Date(smsTime.getTime() + 2000);

      const existing = await Sms.findOne({
        sender,
        body,
        timestamp: { $gte: timeWindowStart, $lte: timeWindowEnd },
        type: 'incoming',
      });

      if (existing) {
        duplicates.push(item);
        continue;
      }

      const newSms = new Sms({
        sender,
        body,
        type: 'incoming',
        status: 'received',
        timestamp: smsTime,
        simSlot: simSlot || 0,
        deviceId: deviceId || 'unknown',
      });

      await newSms.save();
      savedSms.push(newSms);
    }

    res.status(200).json({
      success: true,
      message: `Processed ${smsData.length} SMS. Saved ${savedSms.length} new, skipped ${duplicates.length} duplicates.`,
      savedCount: savedSms.length,
      duplicateCount: duplicates.length,
    });
  } catch (error) {
    console.error('Error syncing incoming SMS:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get list of SMS messages stored on the server
 */
exports.getSmsList = async (req, res) => {
  try {
    const { type, sender, status, deviceId, limit = 20, page = 1 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (sender) query.sender = new RegExp(sender, 'i');
    if (status) query.status = status;
    if (deviceId) query.deviceId = deviceId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const smsList = await Sms.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sms.countDocuments(query);

    res.status(200).json({
      success: true,
      count: smsList.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: smsList,
    });
  } catch (error) {
    console.error('Error fetching SMS list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Queue a new outgoing SMS to be sent by a mobile client
 */
exports.queueOutgoingSms = async (req, res) => {
  try {
    const { receiver, body, deviceId } = req.body;

    if (!receiver || !body) {
      return res.status(400).json({ success: false, message: 'Receiver and body are required' });
    }

    const newSms = new Sms({
      sender: 'server', // Placed by server
      receiver,
      body,
      type: 'outgoing',
      status: 'pending',
      timestamp: new Date(),
      deviceId: deviceId || 'any', // Can target a specific device or 'any' device
    });

    console.log(`[SMS Outgoing Queued] Target: ${receiver} | Device: ${deviceId || 'any'} | Msg: ${body}`);

    await newSms.save();

    res.status(201).json({
      success: true,
      message: 'SMS queued successfully',
      data: newSms,
    });
  } catch (error) {
    console.error('Error queuing outgoing SMS:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Fetch pending outgoing SMS for a specific mobile device to send
 */
exports.getPendingOutgoingSms = async (req, res) => {
  try {
    const { deviceId } = req.query;

    // Fetch SMS that are outgoing and pending, matching this deviceId or tagged as 'any'
    const query = {
      type: 'outgoing',
      status: 'pending',
    };

    if (deviceId) {
      query.$or = [{ deviceId }, { deviceId: 'any' }];
    }

    const pendingList = await Sms.find(query).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: pendingList.length,
      data: pendingList,
    });
  } catch (error) {
    console.error('Error fetching pending outgoing SMS:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update the status of an outgoing SMS (e.g. marked as sent or failed by the app)
 */
exports.updateSmsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, error } = req.body;

    if (!['sent', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateFields = { status };
    if (error) {
      updateFields.error = error; // We can dynamically store errors or update body
    }

    const sms = await Sms.findByIdAndUpdate(id, updateFields, { new: true });

    if (!sms) {
      return res.status(404).json({ success: false, message: 'SMS record not found' });
    }

    console.log(`[SMS Status Update] ID: ${id} | Recipient: ${sms.receiver} | Status: ${status} ${error ? `| Error: ${error}` : ''}`);

    res.status(200).json({
      success: true,
      message: `SMS status updated to ${status}`,
      data: sms,
    });
  } catch (error) {
    console.error('Error updating SMS status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get the latest 3 SMS messages
 */
exports.getLatestSms = async (req, res) => {
  try {
    const smsList = await Sms.find()
      .sort({ timestamp: -1 })
      .limit(3);

    console.log(`[GET Latest SMS] Fetched the 3 most recent messages.`);

    res.status(200).json({
      success: true,
      count: smsList.length,
      data: smsList,
    });
  } catch (error) {
    console.error('Error fetching latest SMS:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
