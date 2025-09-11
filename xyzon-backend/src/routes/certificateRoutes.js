const express = require('express');
const router = express.Router();
const CertificateController = require('../controllers/certificateController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/verify/:verificationCode', CertificateController.verifyCertificate);
router.get('/:certificateId', CertificateController.getCertificate);

// User routes
router.get('/user/my-certificates', auth(), CertificateController.getMyCertificates);
router.get('/registration/:registrationId', auth(), CertificateController.getCertificateByRegistration);

// Admin routes
router.get('/event/:eventId/certificates', auth('admin'), CertificateController.getEventCertificates);
router.put('/:id/revoke', auth('admin'), CertificateController.revokeCertificate);
router.put('/:id/reissue', auth('admin'), CertificateController.reissueCertificate);
router.post('/preview', auth('admin'), CertificateController.generateCertificatePreview);

module.exports = router;
