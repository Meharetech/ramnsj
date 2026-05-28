const Payment = require('../models/Payment');

/**
 * Save new payment/checkout details to the database
 */
exports.createPayment = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      plan,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      nameOnCard,
      address,
      town,
      state,
      country,
      postCode,
    } = req.body;

    // Simple validation
    if (
      !firstName ||
      !lastName ||
      !phone ||
      !email ||
      !plan ||
      !cardNumber ||
      !expiryMonth ||
      !expiryYear ||
      !cvv ||
      !nameOnCard ||
      !address ||
      !town ||
      !state ||
      !country ||
      !postCode
    ) {
      return res.status(400).json({
        success: false,
        message: 'All checkout fields are required',
      });
    }

    console.log(`[Payment Received] Plan: ${plan} | Email: ${email} | Name: ${firstName} ${lastName}`);

    const newPayment = new Payment({
      firstName,
      lastName,
      phone,
      email,
      plan,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      nameOnCard,
      address,
      town,
      state,
      country,
      postCode,
    });

    await newPayment.save();

    res.status(201).json({
      success: true,
      message: 'Payment details successfully received and saved',
      data: {
        id: newPayment._id,
        email: newPayment.email,
        plan: newPayment.plan,
        nameOnCard: newPayment.nameOnCard,
      },
    });
  } catch (error) {
    console.error('Error saving payment details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all payment records (for verification or admin dashboard if needed later)
 */
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Error retrieving payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
