const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

let accessToken = null; // in-memory for security

function setAccessToken(token) { accessToken = token; }
export function getAccessToken() { return accessToken; }

async function jsonFetch(path, { method = 'GET', body, auth } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && accessToken) headers['Authorization'] = 'Bearer ' + accessToken;
    const res = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401 && auth) {
        // try refresh
        const refreshed = await tryRefresh();
        if (refreshed) {
            headers['Authorization'] = 'Bearer ' + accessToken;
            const retry = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
            return handleJson(retry);
        }
    }
    return handleJson(res);
}

async function handleJson(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

function storeRefresh(token) { localStorage.setItem('rt', token); }
function getRefresh() { return localStorage.getItem('rt'); }
function clearRefresh() { localStorage.removeItem('rt'); }

async function tryRefresh() {
    const rt = getRefresh();
    if (!rt) return false;
    try {
        const data = await jsonFetch('/auth/refresh', { method: 'POST', body: { refreshToken: rt } });
        setAccessToken(data.accessToken);
        storeRefresh(data.refreshToken);
        return true;
    } catch { clearRefresh(); accessToken = null; return false; }
}

export async function register(payload) { return jsonFetch('/auth/register', { method: 'POST', body: payload }); }
export async function login(payload) {
    const data = await jsonFetch('/auth/login', { method: 'POST', body: payload });
    setAccessToken(data.accessToken); storeRefresh(data.refreshToken); return data.user;
}
export async function logout() { const rt = getRefresh(); if (rt) { await jsonFetch('/auth/logout', { method: 'POST', body: { refreshToken: rt } }).catch(() => { }); } clearRefresh(); accessToken = null; }
export async function getMe() { return jsonFetch('/auth/me', { auth: true }); }
export async function forgotPassword(email) { return jsonFetch('/auth/forgot-password', { method: 'POST', body: { email } }); }
export async function resetPassword(payload) { return jsonFetch('/auth/reset-password', { method: 'POST', body: payload }); }
export async function bootstrapAuth() { if (getRefresh()) await tryRefresh(); }

export default { login, register, logout, getMe, forgotPassword, resetPassword, bootstrapAuth, getAccessToken };
