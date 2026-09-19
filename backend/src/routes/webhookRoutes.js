const express = require('express');
const { handleStripeWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Note: raw body parsing for this route is configured in app.js, applied
// BEFORE this router is mounted, so req.body here is a Buffer, not JSON.
router.post('/stripe', handleStripeWebhook);

module.exports = router;

