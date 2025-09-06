const Certificate = require('../models/Certificate');
const EventRegistration = require('../models/EventRegistration');
const QRCode = require('qrcode');

class CertificateController {
    // Get Certificate by ID
    static async getCertificate(req, res) {
        try {
            const certificate = await Certificate.findOne({
                certificateId: req.params.certificateId
            }).populate([
                { path: 'event', select: 'title description startDate endDate' },
                { path: 'user', select: 'name email' }
            ]);

            if (!certificate) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found'
                });
            }

            res.json({
                success: true,
                data: certificate
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Verify Certificate
    static async verifyCertificate(req, res) {
        try {
            const certificate = await Certificate.findOne({
                verificationCode: req.params.verificationCode,
                status: 'issued'
            }).populate([
                { path: 'event', select: 'title description startDate endDate' },
                { path: 'user', select: 'name email' }
            ]);

            if (!certificate) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found or invalid verification code'
                });
            }

            res.json({
                success: true,
                message: 'Certificate is valid',
                data: {
                    certificateId: certificate.certificateId,
                    recipientName: certificate.recipientName,
                    title: certificate.title,
                    issueDate: certificate.issueDate,
                    event: certificate.event,
                    isValid: true
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get User's Certificates
    static async getMyCertificates(req, res) {
        try {
            const certificates = await Certificate.find({
                user: req.user.id,
                status: 'issued'
            }).populate([
                { path: 'event', select: 'title description startDate endDate banner' }
            ]).sort({ issueDate: -1 });

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

    // Get Certificate by Registration ID
    static async getCertificateByRegistration(req, res) {
        try {
            const certificate = await Certificate.findOne({
                registration: req.params.registrationId,
                status: 'issued'
            }).populate([
                { path: 'event', select: 'title description startDate endDate' },
                { path: 'user', select: 'name email' }
            ]);

            if (!certificate) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found for this registration'
                });
            }

            res.json({
                success: true,
                data: certificate
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Get All Certificates for Event
    static async getEventCertificates(req, res) {
        try {
            const certificates = await Certificate.find({
                event: req.params.eventId
            }).populate([
                { path: 'user', select: 'name email' },
                { path: 'event', select: 'title' }
            ]).sort({ issueDate: -1 });

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

    // Admin: Revoke Certificate
    static async revokeCertificate(req, res) {
        try {
            const certificate = await Certificate.findById(req.params.id);

            if (!certificate) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found'
                });
            }

            certificate.status = 'revoked';
            await certificate.save();

            res.json({
                success: true,
                message: 'Certificate revoked successfully',
                data: certificate
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Generate Certificate Template Preview
    static async generateCertificatePreview(req, res) {
        try {
            const { template, sampleData } = req.body;

            let html = template;

            // Replace template variables with sample data
            const defaultSampleData = {
                recipientName: 'John Doe',
                eventTitle: 'Sample Event Title',
                issueDate: new Date().toLocaleDateString(),
                certificateId: 'CERT-SAMPLE-123',
                verificationCode: 'VERIFY123',
                eventDate: new Date().toLocaleDateString(),
                ...sampleData
            };

            Object.keys(defaultSampleData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, defaultSampleData[key]);
            });

            res.json({
                success: true,
                data: {
                    html,
                    sampleData: defaultSampleData
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

module.exports = CertificateController;
