const { sendMailService, getTemplateService, sendPersonalizedBulkService } = require('../services/mailService');

// POST /send-email: send personalized emails to a list using a template and attachments
const sendPersonalizedBulkController = async (req, res) => {
    const { template, recipients, attachments, subject } = req.body;
    if (!subject, !template || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'subject, template and recipients array are required' });
    }
    try {
        const sent = await sendPersonalizedBulkService(subject, template, recipients, attachments);
        res.json({ success: true, sent });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { sendPersonalizedBulkController };
