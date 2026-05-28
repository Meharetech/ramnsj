const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route to submit payment details
router.post('/', paymentController.createPayment);

// Route to get payment records
router.get('/', paymentController.getPayments);

module.exports = router;
