const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

// Route to sync incoming SMS from mobile devices
router.post('/sync', smsController.syncIncomingSms);

// Route to get list of stored SMS
router.get('/', smsController.getSmsList);

// Route to queue an outgoing SMS (for mobile app to send)
router.post('/queue', smsController.queueOutgoingSms);

// Route to fetch pending outgoing SMS
router.get('/pending', smsController.getPendingOutgoingSms);

// Route to update status of an outgoing SMS
router.put('/:id/status', smsController.updateSmsStatus);

// Route to get the latest 3 SMS messages
router.get('/latest', smsController.getLatestSms);

module.exports = router;
