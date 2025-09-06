import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchTemplates = async () => {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    if (response.data && Array.isArray(response.data.templates)) {
        return response.data.templates;
    }
    throw new Error("Invalid templates response");
};
