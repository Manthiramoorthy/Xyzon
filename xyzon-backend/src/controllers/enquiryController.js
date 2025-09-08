const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const { sendEnquiryResponse, sendEnquiryNotification } = require('../services/mailService');

class EnquiryController {
    // Public: Submit new enquiry
    static async submitEnquiry(req, res) {
        try {
            const { name, email, phone, subject, message, category } = req.body;

            // Validation
            if (!name || !email || !subject || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, subject, and message are required'
                });
            }

            // Get client info
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            const enquiry = new Enquiry({
                name,
                email,
                phone,
                subject,
                message,
                category: category || 'general',
                ipAddress,
                userAgent
            });

            await enquiry.save();

            // Send notification to admin (optional)
            try {
                await sendEnquiryNotification(enquiry);
            } catch (error) {
                console.warn('Failed to send enquiry notification:', error);
            }

            res.status(201).json({
                success: true,
                message: 'Your enquiry has been submitted successfully. We will get back to you soon!',
                data: {
                    id: enquiry._id,
                    status: enquiry.status
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to submit enquiry. Please try again.',
                error: error.message
            });
        }
    }

    // Admin: Get all enquiries with filters and pagination
    static async getAllEnquiries(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                category,
                priority,
                assignedTo,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter query
            const filter = {};
            if (status) filter.status = status;
            if (category) filter.category = category;
            if (priority) filter.priority = priority;
            if (assignedTo) filter.assignedTo = assignedTo;

            // Search in name, email, subject, or message
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { subject: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } }
                ];
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
                populate: [
                    { path: 'assignedTo', select: 'name email' },
                    { path: 'responses.sentBy', select: 'name email' },
                    { path: 'adminNotes.addedBy', select: 'name' }
                ]
            };

            const enquiries = await Enquiry.paginate(filter, options);

            res.json({
                success: true,
                data: enquiries
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch enquiries',
                error: error.message
            });
        }
    }

    // Admin: Get single enquiry by ID
    static async getEnquiryById(req, res) {
        try {
            const enquiry = await Enquiry.findById(req.params.id)
                .populate('assignedTo', 'name email')
                .populate('responses.sentBy', 'name email')
                .populate('adminNotes.addedBy', 'name');

            if (!enquiry) {
                return res.status(404).json({
                    success: false,
                    message: 'Enquiry not found'
                });
            }

            res.json({
                success: true,
                data: enquiry
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch enquiry',
                error: error.message
            });
        }
    }

    // Admin: Update enquiry status, priority, assignment
    static async updateEnquiry(req, res) {
        try {
            const { status, priority, assignedTo, adminNote } = req.body;
            const enquiry = await Enquiry.findById(req.params.id);

            if (!enquiry) {
                return res.status(404).json({
                    success: false,
                    message: 'Enquiry not found'
                });
            }

            // Update fields if provided
            if (status) enquiry.status = status;
            if (priority) enquiry.priority = priority;
            if (assignedTo !== undefined) enquiry.assignedTo = assignedTo || null;

            // Add admin note if provided
            if (adminNote) {
                enquiry.adminNotes.push({
                    note: adminNote,
                    addedBy: req.user.id
                });
            }

            await enquiry.save();
            await enquiry.populate('assignedTo', 'name email');

            res.json({
                success: true,
                message: 'Enquiry updated successfully',
                data: enquiry
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update enquiry',
                error: error.message
            });
        }
    }

    // Admin: Send response to enquiry
    static async sendResponse(req, res) {
        try {
            const { subject, message } = req.body;

            if (!subject || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject and message are required'
                });
            }

            const enquiry = await Enquiry.findById(req.params.id);
            if (!enquiry) {
                return res.status(404).json({
                    success: false,
                    message: 'Enquiry not found'
                });
            }

            // Add response to enquiry
            const response = {
                subject,
                message,
                sentBy: req.user.id,
                sentAt: new Date()
            };

            enquiry.responses.push(response);

            // Update status if it's new
            if (enquiry.status === 'new') {
                enquiry.status = 'in_progress';
            }

            await enquiry.save();

            // Send email to customer
            try {
                await sendEnquiryResponse({
                    customerEmail: enquiry.email,
                    customerName: enquiry.name,
                    subject,
                    message,
                    originalEnquiry: enquiry
                });

                // Mark email as sent
                enquiry.responses[enquiry.responses.length - 1].emailSent = true;
                await enquiry.save();
            } catch (emailError) {
                console.warn('Failed to send response email:', emailError);
            }

            await enquiry.populate('responses.sentBy', 'name email');

            res.json({
                success: true,
                message: 'Response sent successfully',
                data: enquiry
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to send response',
                error: error.message
            });
        }
    }

    // Admin: Delete enquiry
    static async deleteEnquiry(req, res) {
        try {
            const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

            if (!enquiry) {
                return res.status(404).json({
                    success: false,
                    message: 'Enquiry not found'
                });
            }

            res.json({
                success: true,
                message: 'Enquiry deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete enquiry',
                error: error.message
            });
        }
    }

    // Admin: Get enquiry statistics
    static async getEnquiryStats(req, res) {
        try {
            const stats = await Enquiry.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
                        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
                    }
                }
            ]);

            const categoryStats = await Enquiry.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const priorityStats = await Enquiry.aggregate([
                {
                    $group: {
                        _id: '$priority',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Recent enquiries (last 7 days)
            const recentCount = await Enquiry.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });

            res.json({
                success: true,
                data: {
                    overview: stats[0] || {
                        total: 0, new: 0, inProgress: 0, resolved: 0, closed: 0
                    },
                    byCategory: categoryStats,
                    byPriority: priorityStats,
                    recentCount
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics',
                error: error.message
            });
        }
    }

    // Admin: Bulk actions
    static async bulkAction(req, res) {
        try {
            const { action, enquiryIds, updateData } = req.body;

            if (!action || !enquiryIds || !Array.isArray(enquiryIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'Action and enquiry IDs are required'
                });
            }

            let result;

            switch (action) {
                case 'updateStatus':
                    result = await Enquiry.updateMany(
                        { _id: { $in: enquiryIds } },
                        { status: updateData.status }
                    );
                    break;

                case 'updatePriority':
                    result = await Enquiry.updateMany(
                        { _id: { $in: enquiryIds } },
                        { priority: updateData.priority }
                    );
                    break;

                case 'assign':
                    result = await Enquiry.updateMany(
                        { _id: { $in: enquiryIds } },
                        { assignedTo: updateData.assignedTo }
                    );
                    break;

                case 'delete':
                    result = await Enquiry.deleteMany(
                        { _id: { $in: enquiryIds } }
                    );
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid action'
                    });
            }

            res.json({
                success: true,
                message: `Bulk action completed. ${result.modifiedCount || result.deletedCount} enquiries affected.`,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Bulk action failed',
                error: error.message
            });
        }
    }
}

module.exports = EnquiryController;
