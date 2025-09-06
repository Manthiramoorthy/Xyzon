const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');
const CertificateTemplate = require('../models/CertificateTemplate');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

class EventService {
    // Create Event
    async createEvent(eventData, userId) {
        const event = new Event({
            ...eventData,
            createdBy: userId
        });

        return await event.save();
    }

    // Get Events with pagination and filters
    async getEvents(filters = {}, options = {}) {
        const query = {};

        if (filters.status) query.status = filters.status;
        if (filters.eventType) query.eventType = filters.eventType;
        if (filters.category) query.category = filters.category;
        if (filters.createdBy) query.createdBy = filters.createdBy;
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
                { tags: { $in: [new RegExp(filters.search, 'i')] } }
            ];
        }

        // Date filters
        if (filters.startDate || filters.endDate) {
            query.startDate = {};
            if (filters.startDate) query.startDate.$gte = new Date(filters.startDate);
            if (filters.endDate) query.startDate.$lte = new Date(filters.endDate);
        }

        const defaultOptions = {
            page: 1,
            limit: 10,
            sort: { createdAt: -1 },
            populate: [
                { path: 'createdBy', select: 'name email' },
                { path: 'certificateTemplateId', select: 'name _id' }
            ]
        };

        return await Event.paginate(query, { ...defaultOptions, ...options });
    }

    // Get Event by ID or Slug
    async getEvent(identifier, populateFields = []) {
        const query = identifier.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: identifier }
            : { slug: identifier };

        let event = Event.findOne(query);

        // Always populate certificateTemplateId
        if (!populateFields.some(f => (typeof f === 'string' && f === 'certificateTemplateId') || (f.path && f.path === 'certificateTemplateId'))) {
            populateFields.push({ path: 'certificateTemplateId', select: 'name _id' });
        }
        if (populateFields.length > 0) {
            event = event.populate(populateFields);
        }

        return await event;
    }

    // Update Event
    async updateEvent(eventId, updateData, userId) {
        const event = await Event.findOne({ _id: eventId, createdBy: userId });
        if (!event) {
            throw new Error('Event not found or access denied');
        }

        Object.assign(event, updateData);
        return await event.save();
    }

    // Delete Event
    async deleteEvent(eventId, userId) {
        const event = await Event.findOne({ _id: eventId, createdBy: userId });
        if (!event) {
            throw new Error('Event not found or access denied');
        }

        // Check if there are registrations
        const registrationCount = await EventRegistration.countDocuments({ event: eventId });
        if (registrationCount > 0) {
            throw new Error('Cannot delete event with existing registrations');
        }

        await Event.findByIdAndDelete(eventId);
        return { message: 'Event deleted successfully' };
    }

    // Register for Event
    async registerForEvent(eventId, userId, userData, answers = []) {
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        // Check registration status
        const now = new Date();
        if (now < event.registrationStartDate) {
            throw new Error('Registration has not started yet');
        }
        if (now > event.registrationEndDate) {
            throw new Error('Registration has ended');
        }
        if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
            throw new Error('Event is full');
        }

        // Check if already registered
        const existingRegistration = await EventRegistration.findOne({
            event: eventId,
            user: userId
        });
        if (existingRegistration) {
            throw new Error('Already registered for this event');
        }

        // Process registration answers
        const processedAnswers = answers.map(answer => ({
            questionId: answer.questionId,
            question: answer.question,
            answer: answer.answer
        }));

        // Generate QR code
        const qrData = `${process.env.FRONTEND_URL}/events/${eventId}/registration/${userId}`;
        const qrCode = await QRCode.toDataURL(qrData);

        // Generate unique registration ID
        const registrationId = `REG${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create registration
        const registration = new EventRegistration({
            event: eventId,
            user: userId,
            registrationId: registrationId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            answers: processedAnswers,
            paymentRequired: event.eventType === 'paid',
            amount: event.eventType === 'paid' ? event.price : 0,
            qrCode
        });

        let paymentOrder = null;

        // Create payment order if event is paid
        if (event.eventType === 'paid') {
            paymentOrder = await this.createPaymentOrder(event, registration, userId);
            registration.paymentId = paymentOrder._id;
        } else {
            registration.paymentStatus = 'completed';
        }

        await registration.save();

        // Update event participant count
        await Event.findByIdAndUpdate(eventId, {
            $inc: { currentParticipants: 1 }
        });

        return {
            registration,
            paymentOrder: paymentOrder ? {
                id: paymentOrder.razorpayOrderId,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency
            } : null
        };
    }

    // Create Payment Order
    async createPaymentOrder(event, registration, userId) {
        if (!razorpay) {
            throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
        }

        const options = {
            amount: event.price * 100, // Amount in smallest currency unit
            currency: event.currency,
            receipt: `receipt_${registration.registrationId}`,
            notes: {
                eventId: event._id.toString(),
                userId: userId.toString(),
                registrationId: registration.registrationId
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const payment = new Payment({
            user: userId,
            event: event._id,
            registration: registration._id,
            amount: event.price,
            currency: event.currency,
            razorpayOrderId: razorpayOrder.id,
            receipt: options.receipt,
            notes: options.notes
        });

        return await payment.save();
    }

    // Verify Payment
    async verifyPayment(paymentData) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            throw new Error('Invalid payment signature');
        }

        // Update payment status
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            throw new Error('Payment not found');
        }

        payment.status = 'paid';
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.paidAt = new Date();
        await payment.save();

        // Update registration status
        await EventRegistration.findByIdAndUpdate(payment.registration, {
            paymentStatus: 'completed'
        });

        return payment;
    }

    // Get Event Registrations
    async getEventRegistrations(eventId, options = {}) {
        const defaultOptions = {
            page: 1,
            limit: 10,
            sort: { createdAt: -1 },
            populate: [
                { path: 'user', select: 'name email' },
                { path: 'paymentId', select: 'status amount paidAt' }
            ]
        };

        return await EventRegistration.paginate(
            { event: eventId },
            { ...defaultOptions, ...options }
        );
    }

    // Mark Attendance
    async markAttendance(registrationId, status = 'attended', method = 'manual', userId) {
        const registration = await EventRegistration.findById(registrationId);
        if (!registration) {
            throw new Error('Registration not found');
        }

        // Validate status
        const allowedStatuses = ['registered', 'attended', 'absent', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            throw new Error(`Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`);
        }

        registration.status = status;

        // Set attendance-specific fields only when marking as attended
        if (status === 'attended') {
            registration.checkedIn = true;
            registration.checkInTime = new Date();
            registration.checkInMethod = method;
        } else if (status === 'absent') {
            registration.checkedIn = false;
            registration.checkInTime = null;
            registration.checkInMethod = null;
        }

        await registration.save();
        return registration;
    }

    // Issue Certificate
    async issueCertificate(registrationId, userId, options = {}) {
        const registration = await EventRegistration.findById(registrationId)
            .populate('event')
            .populate('user');

        if (!registration) {
            throw new Error('Registration not found');
        }

        if (registration.status !== 'attended') {
            throw new Error('User must attend the event to receive certificate');
        }

        if (registration.certificateIssued) {
            throw new Error('Certificate already issued');
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
            event: registration.event._id,
            user: registration.user._id,
            registration: registration._id
        });

        if (existingCertificate) {
            throw new Error('Certificate already exists for this registration');
        }

        // Generate QR code for certificate verification
        const verificationCode = Math.random().toString(36).substring(2, 15).toUpperCase();
        const qrData = `${process.env.FRONTEND_URL}/certificates/verify/${verificationCode}`;
        const qrCode = await QRCode.toDataURL(qrData);

        // Generate certificate ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const certificateId = `CERT-${timestamp}-${random}`;

        // Load certificate template from database
        let templateContent = '';
        let templateName = 'Unknown Template';

        try {
            // Use templateId from options if provided
            const templateId = options.templateId;

            if (!templateId) {
                throw new Error('Certificate template is required');
            }

            const template = await CertificateTemplate.findById(templateId);
            if (!template || !template.isActive) {
                throw new Error('Certificate template not found or inactive');
            }

            templateContent = template.htmlContent;
            templateName = template.name;
        } catch (error) {
            if (error.message.includes('template')) {
                throw error; // Re-throw template-specific errors
            }
            throw new Error('Failed to load certificate template: ' + error.message);
        }

        // Create certificate first to get the ID
        const certificate = new Certificate({
            event: registration.event._id,
            user: registration.user._id,
            registration: registration._id,
            certificateId: certificateId, // Use the generated certificate ID
            recipientName: registration.name,
            recipientEmail: registration.email,
            title: `Certificate of Participation - ${registration.event.title}`,
            description: `This certifies that ${registration.name} has successfully participated in ${registration.event.title}`,
            template: templateName, // Store the template name from database
            verificationCode: verificationCode, // Use the verification code generated above
            qrCode,
            issuedBy: userId
        });

        // Save certificate first to ensure certificateId is generated
        await certificate.save();

        // Now replace placeholders in template with the actual certificate data
        const certificateHtml = templateContent
            .replace(/\{\{recipientName\}\}/g, registration.name)
            .replace(/\{\{eventName\}\}/g, registration.event.title)
            .replace(/\{\{eventTitle\}\}/g, registration.event.title) // Keep backward compatibility
            .replace(/\{\{eventDescription\}\}/g, registration.event.description || '')
            .replace(/\{\{eventDate\}\}/g, new Date(registration.event.startDate).toLocaleDateString())
            .replace(/\{\{organizerName\}\}/g, registration.event.organizer || 'Event Organizer')
            .replace(/\{\{issueDate\}\}/g, new Date().toLocaleDateString())
            .replace(/\{\{verificationCode\}\}/g, verificationCode)
            .replace(/\{\{certificateId\}\}/g, certificateId)
            .replace(/\{\{qrCode\}\}/g, qrCode);

        // Update certificate with generated HTML
        certificate.generatedHtml = certificateHtml;
        await certificate.save();

        // Update registration
        registration.certificateIssued = true;
        registration.certificateId = certificate._id;
        registration.certificateIssuedAt = new Date();
        await registration.save();

        return certificate;
    }

    // Get Event Statistics
    async getEventStatistics(eventId) {
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        const registrations = await EventRegistration.countDocuments({ event: eventId });
        const attended = await EventRegistration.countDocuments({
            event: eventId,
            status: 'attended'
        });
        const certificatesIssued = await Certificate.countDocuments({ event: eventId });
        const totalRevenue = await Payment.aggregate([
            { $match: { event: event._id, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
            event: {
                id: event._id,
                title: event.title,
                status: event.status,
                startDate: event.startDate,
                endDate: event.endDate,
                maxParticipants: event.maxParticipants
            },
            stats: {
                totalRegistrations: registrations,
                attendedParticipants: attended,
                certificatesIssued,
                revenue: totalRevenue[0]?.total || 0,
                attendanceRate: registrations > 0 ? (attended / registrations * 100).toFixed(2) : 0
            }
        };
    }
}

module.exports = new EventService();