const API_BASE = '/api/mart';

const getHeaders = (token?: string | null) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// Vendor Auth
export const vendorLogin = async (credentials: any) => {
    const res = await fetch(`${API_BASE}/vendors/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(credentials)
    });
    return res.json();
};

export const verifyVendorToken = async (token: string) => {
    const res = await fetch(`${API_BASE}/vendors/verify`, {
        headers: getHeaders(token)
    });
    return res.json();
};

export const fetchVendorProfile = async (token: string) => {
    const res = await fetch(`${API_BASE}/vendors/profile`, {
        headers: getHeaders(token)
    });
    return res.json();
};

export const updateVendorProfile = async (token: string, data: any) => {
    const res = await fetch(`${API_BASE}/vendors/profile`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

export const fetchDashboardData = async (token: string) => {
    const res = await fetch(`${API_BASE}/vendors/dashboard`, {
        headers: getHeaders(token)
    });
    return res.json();
};

// Admin Puja Management
export const fetchAdminPujas = async (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/pujas${query}`);
    return res.json();
};

export const updatePujaStatus = async (token: string, id: number | string, data: any) => {
    // In our backend, pujas update is supported
    const res = await fetch(`${API_BASE}/pujas/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

// Admin Pandit Management
export const fetchAdminPandits = async (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/pandits${query}`);
    return res.json();
};

export const createAdminPandit = async (token: string, data: any) => {
    const res = await fetch(`${API_BASE}/pandits`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

export const updateAdminPandit = async (token: string, id: number | string, data: any) => {
    const res = await fetch(`${API_BASE}/pandits/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

// Admin Booking Management
export const fetchAdminBookings = async (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/bookings/vendor${query}`, {
        headers: getHeaders(token)
    });
    return res.json();
};

export const updateBookingStatus = async (token: string, id: number | string, data: { status: string; note?: string; panditId?: number }) => {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

// Admin Product Management
export const fetchVendorProducts = async (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/products/vendor-all${query}`, {
        headers: getHeaders(token)
    });
    return res.json();
};

export const createVendorProduct = async (token: string, data: any) => {
    const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

export const updateVendorProduct = async (token: string, id: number | string, data: any) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

export const deleteVendorProduct = async (token: string, id: number | string) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(token)
    });
    return res.json();
};
