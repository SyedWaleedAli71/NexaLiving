// Central API configuration for the React Native app.
//
// Android emulator reaches the host machine via 10.0.2.2.
// For a physical device, replace with your computer's LAN IP (e.g. 192.168.1.20).
// For iOS simulator, localhost works.
// Current: PC Wi-Fi LAN IP for testing on a physical Android device.
export const API_BASE_URL = 'http://192.168.100.5:5000/api';

const TIMEOUT_MS = 15000;

// Thin JSON fetch wrapper that throws an Error carrying the server message.
async function request(path, {method = 'GET', body, token} = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {'Content-Type': 'application/json'};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error('Cannot reach server. Check the backend URL / connection.');
  } finally {
    clearTimeout(timeout);
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // Non-JSON response body; leave data null.
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  register: payload => request('/auth/register', {method: 'POST', body: payload}),
  verifyOtp: payload => request('/auth/verify-otp', {method: 'POST', body: payload}),
  resendOtp: payload => request('/auth/resend-otp', {method: 'POST', body: payload}),
  login: payload => request('/auth/login', {method: 'POST', body: payload}),
  forgotPassword: payload =>
    request('/auth/forgot-password', {method: 'POST', body: payload}),
  resetPassword: payload =>
    request('/auth/reset-password', {method: 'POST', body: payload}),
  me: token => request('/auth/me', {token}),
};

export default authApi;
