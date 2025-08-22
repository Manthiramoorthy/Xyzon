const express = require('express');
const { sendPersonalizedBulkController } = require('../controllers/mailController');
const router = express.Router();



router.post('/send-mail', sendPersonalizedBulkController);


module.exports = router;
