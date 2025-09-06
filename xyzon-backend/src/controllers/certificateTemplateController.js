const CertificateTemplate = require('../models/CertificateTemplate');

class CertificateTemplateController {
    // Get all templates
    static async getTemplates(req, res) {
        try {
            const query = { isActive: true };

            // If user is authenticated and is admin, show all templates including inactive
            if (req.user && req.user.role === 'admin') {
                delete query.isActive; // Remove the filter to show all templates
            }

            const templates = await CertificateTemplate.find(query)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });

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

    // Get single template
    static async getTemplate(req, res) {
        try {
            const template = await CertificateTemplate.findById(req.params.id)
                .populate('createdBy', 'name email');

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Create new template
    static async createTemplate(req, res) {
        try {
            const { name, description, htmlContent, previewImage } = req.body;

            // Validate required fields
            if (!name || !htmlContent) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and HTML content are required'
                });
            }

            // Check if template name already exists for this user (if user is available)
            if (req.user) {
                const existingTemplate = await CertificateTemplate.findOne({
                    name: name.trim(),
                    createdBy: req.user.id,
                    isActive: true
                });

                if (existingTemplate) {
                    return res.status(400).json({
                        success: false,
                        message: 'Template with this name already exists'
                    });
                }
            }

            const template = new CertificateTemplate({
                name: name.trim(),
                description: description?.trim(),
                htmlContent,
                previewImage,
                createdBy: req.user ? req.user.id : null
            });

            await template.save();

            // Populate the created template if there's a user
            if (template.createdBy) {
                await template.populate('createdBy', 'name email');
            }

            res.status(201).json({
                success: true,
                message: 'Template created successfully',
                data: template
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update template
    static async updateTemplate(req, res) {
        try {
            const { name, description, htmlContent, previewImage } = req.body;

            const template = await CertificateTemplate.findById(req.params.id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Check if user owns this template (only if both user and createdBy exist)
            if (req.user && template.createdBy && template.createdBy.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Check for duplicate name if name is being changed (only if user exists)
            if (name && name.trim() !== template.name && req.user) {
                const existingTemplate = await CertificateTemplate.findOne({
                    name: name.trim(),
                    createdBy: req.user.id,
                    isActive: true,
                    _id: { $ne: template._id }
                });

                if (existingTemplate) {
                    return res.status(400).json({
                        success: false,
                        message: 'Template with this name already exists'
                    });
                }
            }

            // Update fields
            if (name) template.name = name.trim();
            if (description !== undefined) template.description = description?.trim();
            if (htmlContent) template.htmlContent = htmlContent;
            if (previewImage !== undefined) template.previewImage = previewImage;

            await template.save();

            // Populate createdBy only if it exists
            if (template.createdBy) {
                await template.populate('createdBy', 'name email');
            }

            res.json({
                success: true,
                message: 'Template updated successfully',
                data: template
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete template (soft delete)
    static async deleteTemplate(req, res) {
        try {
            const template = await CertificateTemplate.findById(req.params.id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Check if user owns this template (only if both user and createdBy exist)
            if (req.user && template.createdBy && template.createdBy.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            template.isActive = false;
            await template.save();

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Preview template with sample data
    static async previewTemplate(req, res) {
        try {
            const { htmlContent, sampleData } = req.body;

            if (!htmlContent) {
                return res.status(400).json({
                    success: false,
                    message: 'HTML content is required'
                });
            }

            // Default sample data
            const defaultSampleData = {
                participant_name: 'John Doe',
                event_name: 'Sample Event Title',
                event_date: new Date().toLocaleDateString(),
                issue_date: new Date().toLocaleDateString(),
                certificate_id: 'CERT-SAMPLE-123',
                verification_code: 'VERIFY123',
                company_name: 'Xyzon Innovations Private Limited',
                authority_name: 'Dr. Sarah Wilson',
                authority_role: 'Program Director',
                ...sampleData
            };

            // Replace placeholders in HTML
            let previewHtml = htmlContent;
            Object.keys(defaultSampleData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                previewHtml = previewHtml.replace(regex, defaultSampleData[key]);
            });

            res.json({
                success: true,
                data: {
                    previewHtml,
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

module.exports = CertificateTemplateController;
