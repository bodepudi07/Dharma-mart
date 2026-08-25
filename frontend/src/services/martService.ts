// Dharma Mart API Service Layer
const API_BASE = '/api/mart';

const getHeaders = (token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// ─── Pujas ───────────────────────────────────
export const fetchPujas = async (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/pujas${query}`);
    return res.json();
};

export const fetchFeaturedPujas = async () => {
    const res = await fetch(`${API_BASE}/pujas/featured`);
    return res.json();
};

export const fetchPujasByOccasion = async () => {
    const res = await fetch(`${API_BASE}/pujas/by-occasion`);
    return res.json();
};

export const fetchPujaDetail = async (id: number | string) => {
    const res = await fetch(`${API_BASE}/pujas/${id}`);
    return res.json();
};

// ─── Pandits ─────────────────────────────────
export const fetchPandits = async (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/pandits${query}`);
    return res.json();
};

export const fetchAvailablePandits = async (params: Record<string, string>) => {
    const query = '?' + new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/pandits/available${query}`);
    return res.json();
};

export const fetchPanditDetail = async (id: number | string) => {
    const res = await fetch(`${API_BASE}/pandits/${id}`);
    return res.json();
};

// ─── Bookings ────────────────────────────────
export const createBooking = async (token: string, data: any) => {
    const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

export const fetchMyBookings = async (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/bookings${query}`, { headers: getHeaders(token) });
    return res.json();
};

export const fetchBookingDetail = async (token: string, id: number | string) => {
    const res = await fetch(`${API_BASE}/bookings/${id}`, { headers: getHeaders(token) });
    return res.json();
};

// ─── Products ────────────────────────────────
export const fetchProducts = async (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/products${query}`);
    return res.json();
};

export const fetchProductDetail = async (id: number | string) => {
    const res = await fetch(`${API_BASE}/products/${id}`);
    return res.json();
};

// ─── Categories ──────────────────────────────
export const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/categories`);
    return res.json();
};

// ─── Reviews ─────────────────────────────────
export const fetchProductReviews = async (productId: number | string) => {
    const res = await fetch(`${API_BASE}/reviews/product/${productId}`);
    return res.json();
};

export const submitReview = async (token: string, data: any) => {
    const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
};

// ─── Wishlist ────────────────────────────────
export const fetchWishlist = async (token: string) => {
    const res = await fetch(`${API_BASE}/wishlist`, { headers: getHeaders(token) });
    return res.json();
};

export const addToWishlist = async (token: string, productId: number) => {
    const res = await fetch(`${API_BASE}/wishlist/${productId}`, {
        method: 'POST',
        headers: getHeaders(token)
    });
    return res.json();
};

export const removeFromWishlist = async (token: string, productId: number) => {
    const res = await fetch(`${API_BASE}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(token)
    });
    return res.json();
};
