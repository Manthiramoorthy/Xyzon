import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export async function sendPersonalizedBulkMail(payload) {
    return axios.post(`${API_BASE_URL}/mail/send-mail`, payload);
}
