const eventService = require('../services/eventService');
const { sendEventRegistrationConfirmation, sendEventReminder, sendCertificateEmail } = require('../services/mailService');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Certificate = require('../models/Certificate');
const Payment = require('../models/Payment');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/events/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

class EventController {
    // Admin: Create Event
    static async createEvent(req, res) {
        try {
            const eventData = req.body;

            // Process registration questions
            if (eventData.registrationQuestions) {
                // Only parse if it's a string, otherwise keep as is
                if (typeof eventData.registrationQuestions === 'string') {
                    eventData.registrationQuestions = JSON.parse(eventData.registrationQuestions);
                }

                // Remove temporary _id fields from registration questions
                eventData.registrationQuestions = eventData.registrationQuestions.map(question => {
                    const { _id, ...questionWithoutId } = question;
                    return questionWithoutId;
                });
            }

            const event = await eventService.createEvent(eventData, req.user.id);

            res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: event
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get All Events (Public)
    static async getEvents(req, res) {
        try {
            const filters = {
                status: req.query.status,
                eventType: req.query.eventType,
                category: req.query.category,
                search: req.query.search,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };

            // Remove undefined filters
            Object.keys(filters).forEach(key => {
                if (!filters[key]) delete filters[key];
            });

            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: req.query.sort || { createdAt: -1 }
            };

            const events = await eventService.getEvents(filters, options);

            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get Events Created by Admin
    static async getMyEvents(req, res) {
        try {
            const filters = {
                createdBy: req.user.id,
                status: req.query.status,
                eventType: req.query.eventType,
                category: req.query.category,
                search: req.query.search
            };

            Object.keys(filters).forEach(key => {
                if (!filters[key]) delete filters[key];
            });

            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: { createdAt: -1 }
            };

            const events = await eventService.getEvents(filters, options);

            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get Single Event
    static async getEvent(req, res) {
        try {
            const event = await eventService.getEvent(req.params.id, [
                { path: 'createdBy', select: 'name email' }
            ]);

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            res.json({
                success: true,
                data: event
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Update Event
    static async updateEvent(req, res) {
        try {
            const updateData = req.body;

            // Process registration questions if provided
            if (updateData.registrationQuestions) {
                // Only parse if it's a string, otherwise keep as is
                if (typeof updateData.registrationQuestions === 'string') {
                    updateData.registrationQuestions = JSON.parse(updateData.registrationQuestions);
                }
            }

            const event = await eventService.updateEvent(req.params.id, updateData, req.user.id);

            res.json({
                success: true,
                message: 'Event updated successfully',
                data: event
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Delete Event
    static async deleteEvent(req, res) {
        try {
            await eventService.deleteEvent(req.params.id, req.user.id);

            res.json({
                success: true,
                message: 'Event deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Upload Event Banner/Images
    static async uploadEventImages(req, res) {
        try {
            const uploadMultiple = upload.fields([
                { name: 'banner', maxCount: 1 },
                { name: 'images', maxCount: 5 }
            ]);

            uploadMultiple(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                const urls = { banner: null, images: [] };

                // Process banner
                if (req.files.banner) {
                    const bannerFile = req.files.banner[0];
                    const optimizedPath = `uploads/events/banner-${Date.now()}.webp`;

                    await sharp(bannerFile.path)
                        .resize(1200, 600)
                        .webp({ quality: 80 })
                        .toFile(optimizedPath);

                    // Delete original file
                    fs.unlinkSync(bannerFile.path);
                    urls.banner = `/${optimizedPath}`;
                }

                // Process additional images
                if (req.files.images) {
                    for (const imageFile of req.files.images) {
                        const optimizedPath = `uploads/events/image-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;

                        await sharp(imageFile.path)
                            .resize(800, 600)
                            .webp({ quality: 80 })
                            .toFile(optimizedPath);

                        // Delete original file
                        fs.unlinkSync(imageFile.path);
                        urls.images.push(`/${optimizedPath}`);
                    }
                }

                res.json({
                    success: true,
                    message: 'Images uploaded successfully',
                    data: urls
                });
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Register for Event
    static async registerForEvent(req, res) {
        try {
            const { answers } = req.body;
            const userData = {
                name: req.body.name || req.user.name,
                email: req.body.email || req.user.email,
                phone: req.body.phone
            };

            const result = await eventService.registerForEvent(
                req.params.id,
                req.user.id,
                userData,
                answers
            );

            // Send confirmation email for free events
            if (!result.paymentOrder) {
                const event = await Event.findById(req.params.id);
                await sendEventRegistrationConfirmation(result.registration, event);
            }

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Verify Payment
    static async verifyPayment(req, res) {
        console.log('Verifying payment with data:', req.body);
        try {

            const payment = await eventService.verifyPayment(req.body);

            // Only send confirmation email if registration exists (legacy flow)
            if (payment.registration) {
                const registration = await EventRegistration.findById(payment.registration).populate('event');
                if (registration) {
                    await sendEventRegistrationConfirmation(registration, registration.event, payment);
                }
            } else if (payment.event && payment.user) {
                // New flow: fetch registration by user and event
                const registration = await EventRegistration.findOne({
                    event: payment.event,
                    user: payment.user
                }).populate('event');
                if (registration) {
                    await sendEventRegistrationConfirmation(registration, registration.event, payment);
                }
            } else {
                console.log('No registration found for payment:', payment._id);
            }


            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: payment
            });
        } catch (error) {
            console.error('Payment verification failed:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Create Registration after Payment
    static async createRegistrationAfterPayment(req, res) {
        try {
            const { razorpay_order_id } = req.body;
            const { answers } = req.body;
            const userData = {
                name: req.body.name || req.user.name,
                email: req.body.email || req.user.email,
                phone: req.body.phone
            };

            // Find the paid payment record
            const payment = await Payment.findOne({
                razorpayOrderId: razorpay_order_id,
                status: 'paid',
                user: req.user.id
            }).populate('event');

            if (!payment) {
                return res.status(400).json({
                    success: false,
                    message: 'No verified payment found for this order'
                });
            }

            // Check if registration already exists
            const existingRegistration = await EventRegistration.findOne({
                event: payment.event._id,
                user: req.user.id
            });

            if (existingRegistration) {
                return res.status(400).json({
                    success: false,
                    message: 'Registration already exists for this event'
                });
            }

            // Create registration with payment information
            const result = await eventService.createRegistrationWithPayment(
                payment.event._id,
                req.user.id,
                userData,
                answers,
                payment._id
            );

            // Send confirmation email
            await sendEventRegistrationConfirmation(result.registration, payment.event, payment);

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: result
            });
        } catch (error) {
            console.error('Registration after payment failed:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Get Event Registrations
    static async getEventRegistrations(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: { createdAt: -1 }
            };

            const registrations = await eventService.getEventRegistrations(req.params.id, options);

            res.json({
                success: true,
                data: registrations
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Mark Attendance
    static async markAttendance(req, res) {
        try {
            const { status = 'attended', method = 'manual' } = req.body;
            const registration = await eventService.markAttendance(
                req.params.registrationId,
                status,
                method,
                req.user.id
            );

            res.json({
                success: true,
                message: `Registration status updated to ${status}`,
                data: registration
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Issue Certificate
    static async issueCertificate(req, res) {
        try {
            const { templateId } = req.body;

            // Validate templateId
            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    message: 'templateId is required'
                });
            }

            const certificate = await eventService.issueCertificate(
                req.params.registrationId,
                req.user.id,
                { templateId }
            );

            // Send certificate email (but don't fail if email fails)
            try {
                const registration = await EventRegistration.findById(req.params.registrationId).populate('event');
                await sendCertificateEmail(certificate, registration, registration.event);
            } catch (emailError) {
                // Don't fail the certificate issuance if email fails
            }

            res.json({
                success: true,
                message: 'Certificate issued successfully',
                data: certificate
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Issue Bulk Certificates
    static async issueBulkCertificates(req, res) {
        try {
            const { eventId } = req.params;
            const { registrationIds, templateId } = req.body;

            // Validate registrationIds
            if (!registrationIds) {
                return res.status(400).json({
                    success: false,
                    message: 'registrationIds is required'
                });
            }

            if (!Array.isArray(registrationIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'registrationIds must be an array'
                });
            }

            if (registrationIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'registrationIds array cannot be empty'
                });
            }

            // Validate templateId
            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    message: 'templateId is required'
                });
            }

            const results = [];
            const errors = [];

            for (const registrationId of registrationIds) {
                try {
                    const certificate = await eventService.issueCertificate(
                        registrationId,
                        req.user.id,
                        { templateId }
                    );

                    // Send certificate email (but don't fail if email fails)
                    try {
                        const registration = await EventRegistration.findById(registrationId).populate('event');
                        await sendCertificateEmail(certificate, registration, registration.event);
                    } catch (emailError) {
                        // Don't fail the certificate issuance if email fails
                    }

                    results.push({ registrationId, certificateId: certificate.certificateId });
                } catch (error) {
                    errors.push({ registrationId, error: error.message });
                }
            }

            res.json({
                success: true,
                message: 'Bulk certificate issuance completed',
                data: {
                    successful: results,
                    failed: errors,
                    totalProcessed: registrationIds.length,
                    successCount: results.length,
                    errorCount: errors.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get User's Registrations
    static async getMyRegistrations(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: { createdAt: -1 },
                populate: [
                    { path: 'event', select: 'title description shortDescription startDate endDate eventMode eventLink venue status banner eventType price currency category maxParticipants registrationStartDate registrationEndDate tags bannerUrl' },
                    { path: 'paymentId', select: 'status amount paidAt' }
                ]
            };

            const registrations = await EventRegistration.paginate(
                { user: req.user.id },
                options
            );

            res.json({
                success: true,
                data: registrations
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get Event Statistics
    static async getEventStatistics(req, res) {
        try {
            const stats = await eventService.getEventStatistics(req.params.id);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Send Event Reminders
    static async sendEventReminders(req, res) {
        try {
            const eventId = req.params.id;
            const event = await Event.findById(eventId);

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            const registrations = await EventRegistration.find({
                event: eventId,
                status: 'registered',
                reminderEmailSent: false
            });

            let sentCount = 0;
            const errors = [];

            for (const registration of registrations) {
                try {
                    await sendEventReminder(registration, event);
                    await EventRegistration.findByIdAndUpdate(registration._id, {
                        reminderEmailSent: true
                    });
                    sentCount++;
                } catch (error) {
                    errors.push({
                        registrationId: registration._id,
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: 'Event reminders sent',
                data: {
                    totalRegistrations: registrations.length,
                    sentCount,
                    errors
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Get Available Certificate Templates
    static async getCertificateTemplates(req, res) {
        try {
            const templatesPath = path.join(__dirname, '../../assets/certificate-templates');
            const templateFiles = fs.readdirSync(templatesPath);

            const templates = templateFiles
                .filter(file => file.endsWith('.html'))
                .map(file => {
                    const name = path.basename(file, '.html');
                    const content = fs.readFileSync(path.join(templatesPath, file), 'utf8');

                    return {
                        id: name,
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        filename: file,
                        preview: content.substring(0, 200) + '...' // First 200 chars for preview
                    };
                });

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Get Event Certificates
    static async getEventCertificates(req, res) {
        try {
            const { eventId } = req.params;
            const certificates = await Certificate.find({ event: eventId })
                .populate('user', 'name email')
                .populate('registration', 'registrationId status name email')
                .sort({ issueDate: -1 });

            res.json({
                success: true,
                data: certificates
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // User: Get My Certificates
    static async getUserCertificates(req, res) {
        try {
            const certificates = await Certificate.find({ user: req.user.id })
                .populate('event', 'title description startDate endDate')
                .populate('registration', 'registrationId status')
                .sort({ issuedAt: -1 });

            res.json({
                success: true,
                data: certificates
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // User: View Certificate HTML
    static async viewCertificate(req, res) {
        try {
            const certificate = await Certificate.findOne({
                certificateId: req.params.certificateId,
                user: req.user.id,
                status: 'issued'
            });

            if (!certificate) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found'
                });
            }

            // Return HTML content for display
            res.setHeader('Content-Type', 'text/html');
            res.send(certificate.generatedHtml);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // User: Download Certificate as JSON (for PDF generation on frontend)
    static async downloadCertificate(req, res) {
        try {
            const certificate = await Certificate.findOne({
                certificateId: req.params.certificateId,
                user: req.user.id,
                status: 'issued'
            }).populate('event', 'title description startDate endDate');

            if (!certificate) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found'
                });
            }

            res.json({
                success: true,
                data: {
                    certificateId: certificate.certificateId,
                    title: certificate.title,
                    recipientName: certificate.recipientName,
                    eventTitle: certificate.event.title,
                    issueDate: certificate.issueDate,
                    verificationCode: certificate.verificationCode,
                    qrCode: certificate.qrCode,
                    generatedHtml: certificate.generatedHtml
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = EventController;