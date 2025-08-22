const { sendMailService, getTemplateService, sendPersonalizedBulkService } = require('../services/mailService');

// POST /send-email: send personalized emails to a list using a template and attachments
const sendPersonalizedBulkController = async (req, res) => {
    const { template, recipients, attachments } = req.body;
    if (!template || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'template and recipients array are required' });
    }
    try {
        const sent = await sendPersonalizedBulkService(template, recipients, attachments);
        res.json({ success: true, sent });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { sendPersonalizedBulkController };
