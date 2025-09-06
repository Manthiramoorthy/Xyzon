const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get authorization headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all certificate templates
export const getTemplates = async () => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        };

        console.log('Making request to certificate templates with headers:', headers);

        const response = await fetch(`${API_BASE_URL}/certificate-templates`, {
            method: 'GET',
            headers
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            throw new Error(errorData.message || 'Failed to fetch templates');
        }

        const data = await response.json();
        console.log('Templates response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
};

// Get a single certificate template by ID
export const getTemplate = async (templateId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/certificate-templates/${templateId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch template');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching template:', error);
        throw error;
    }
};

// Create a new certificate template
export const createTemplate = async (templateData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/certificate-templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(templateData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create template');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
};

// Update an existing certificate template
export const updateTemplate = async (templateId, templateData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/certificate-templates/${templateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(templateData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update template');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
};

// Delete a certificate template
export const deleteTemplate = async (templateId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/certificate-templates/${templateId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete template');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
};

// Preview a certificate template with sample data
export const previewTemplate = async (htmlContent, sampleData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/certificate-templates/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                htmlContent,
                sampleData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to preview template');
        }

        return await response.json();
    } catch (error) {
        console.error('Error previewing template:', error);
        throw error;
    }
};
