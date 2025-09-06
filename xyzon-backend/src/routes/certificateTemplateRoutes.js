const express = require('express');
const router = express.Router();
const CertificateTemplateController = require('../controllers/certificateTemplateController');
const { auth } = require('../middleware/auth');

// Temporarily allow GET and POST without authentication for testing
router.get('/', CertificateTemplateController.getTemplates);
router.get('/:id', auth('admin'), CertificateTemplateController.getTemplate);
router.post('/', CertificateTemplateController.createTemplate);
router.put('/:id', auth('admin'), CertificateTemplateController.updateTemplate);
router.delete('/:id', auth('admin'), CertificateTemplateController.deleteTemplate);
router.post('/preview', CertificateTemplateController.previewTemplate);

module.exports = router;
