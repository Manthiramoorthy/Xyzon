const getTemplateService  = require('../services/templateService');

const getTemplateController = (req, res) => {
    try {
        const templates = getTemplateService();
        res.json({ templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Templates not found' });
    }
};

module.exports = { getTemplateController };
