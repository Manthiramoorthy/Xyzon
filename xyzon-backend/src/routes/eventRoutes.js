const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const PaymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/', EventController.getEvents);
router.get('/:id', EventController.getEvent);

// User routes (require authentication)
router.post('/:id/register', auth(), EventController.registerForEvent);
router.post('/payment/verify', auth(), EventController.verifyPayment);
router.post('/register-after-payment', auth(), EventController.createRegistrationAfterPayment);
router.post('/payments/create-order', auth(), PaymentController.createOrder);
router.get('/user/registrations', auth(), EventController.getMyRegistrations);

// User certificate routes
router.get('/user/certificates', auth(), EventController.getUserCertificates);
router.get('/certificates/:certificateId/view', auth(), EventController.viewCertificate);
router.get('/certificates/:certificateId/download', auth(), EventController.downloadCertificate);

// Admin routes
router.post('/', auth('admin'), EventController.createEvent);
router.put('/:id', auth('admin'), EventController.updateEvent);
router.delete('/:id', auth('admin'), EventController.deleteEvent);
router.post('/upload/images', auth('admin'), EventController.uploadEventImages);

// Admin: Event management
router.get('/admin/my-events', auth('admin'), EventController.getMyEvents);
router.get('/admin/summary', auth('admin'), EventController.getAdminSummary);
router.get('/:id/registrations', auth('admin'), EventController.getEventRegistrations);
router.get('/:id/statistics', auth('admin'), EventController.getEventStatistics);

// Admin: Attendance and certificates
router.get('/certificate-templates', auth('admin'), EventController.getCertificateTemplates);
router.put('/registrations/:registrationId/attendance', auth('admin'), EventController.markAttendance);
router.put('/registrations/:registrationId/status', auth('admin'), EventController.markAttendance);
router.post('/registrations/:registrationId/certificate', auth('admin'), EventController.issueCertificate);
router.post('/:eventId/certificates/bulk', auth('admin'), EventController.issueBulkCertificates);
router.get('/:eventId/certificates', auth('admin'), EventController.getEventCertificates);


// Admin: Email management
router.post('/:id/send-reminders', auth('admin'), EventController.sendEventReminders);

module.exports = router;