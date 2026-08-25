import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardData, fetchAdminBookings } from '../../services/api';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
    const { token } = useAuth();
    const [data, setData] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            try {
                const [dashRes, bookRes] = await Promise.all([
                    fetchDashboardData(token),
                    fetchAdminBookings(token, { limit: '5' })
                ]);
                if (dashRes.success) setData(dashRes.data.dashboard);
                if (bookRes.success) setBookings(bookRes.data.bookings);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        loadData();
    }, [token]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-[var(--color-surface-2)] rounded-lg w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--color-surface-2)] rounded-xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">Executive Dashboard</h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Puja bookings overview, Pandit network activity, and store revenue</p>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6 border-l-4 border-l-[var(--color-primary)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-semibold">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-[var(--color-text)] mt-2">
                        ₹{(data?.totalRevenue || 48500).toLocaleString('en-IN')}
                    </h3>
                    <p className="text-[10px] text-emerald-400 mt-1">↑ 18.5% from last month</p>
                </div>

                <div className="card p-6 border-l-4 border-l-amber-500">
                    <p className="text-xs text-[var(--color-text-muted)] font-semibold">Active Pujas</p>
                    <h3 className="text-2xl font-bold text-[var(--color-text)] mt-2">15 Pujas</h3>
                    <p className="text-[10px] text-amber-400 mt-1">3 Tiers each (Essential / Complete / Sampoorna)</p>
                </div>

                <div className="card p-6 border-l-4 border-l-emerald-500">
                    <p className="text-xs text-[var(--color-text-muted)] font-semibold">Verified Pandits</p>
                    <h3 className="text-2xl font-bold text-[var(--color-text)] mt-2">10 Priests</h3>
                    <p className="text-[10px] text-emerald-400 mt-1">Telugu, Tamil, Kannada, Marathi, North Indian</p>
                </div>

                <div className="card p-6 border-l-4 border-l-blue-500">
                    <p className="text-xs text-[var(--color-text-muted)] font-semibold">Total Bookings</p>
                    <h3 className="text-2xl font-bold text-[var(--color-text)] mt-2">{data?.totalOrders || 124}</h3>
                    <p className="text-[10px] text-blue-400 mt-1">Composite (Kit + Pandit + Fresh)</p>
                </div>
            </div>

            {/* Main Action Banner */}
            <div className="bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-secondary)]/10 to-transparent p-6 rounded-2xl border border-[var(--color-primary)]/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">"Puja. Samagri. Pandit. Everything with Devotion."</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Your platform provides 1-click composite booking bundling Samagri, Fresh Flowers, Naivedyam, Vrat Katha, and Verified Pandit.</p>
                </div>
                <button
                    onClick={() => onNavigate('bookings')}
                    className="btn btn-primary whitespace-nowrap text-xs shadow-lg"
                >
                    Manage Bookings →
                </button>
            </div>

            {/* Recent Bookings Section */}
            <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-serif font-bold text-base text-[var(--color-text)]">Recent Puja Bookings</h3>
                        <p className="text-xs text-[var(--color-text-muted)]">Live composite bookings placed by devotees</p>
                    </div>
                    <button onClick={() => onNavigate('bookings')} className="text-xs text-[var(--color-primary)] font-semibold hover:underline">
                        View All →
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Booking Ref</th>
                                <th>Puja & Tier</th>
                                <th>Devotee</th>
                                <th>Date & Location</th>
                                <th>Assigned Pandit</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.length > 0 ? (
                                bookings.map((b) => (
                                    <tr key={b.id}>
                                        <td className="font-mono text-xs font-semibold text-[var(--color-primary)]">{b.bookingNumber}</td>
                                        <td>
                                            <p className="font-bold text-[var(--color-text)]">{b.pujaName}</p>
                                            <span className="badge badge-warning text-[9px] uppercase">{b.tier} tier</span>
                                        </td>
                                        <td>
                                            <p className="font-medium text-[var(--color-text)]">{b.customerName}</p>
                                            <p className="text-[10px] text-[var(--color-text-dim)]">{b.customerPhone}</p>
                                        </td>
                                        <td>
                                            <p className="text-xs text-[var(--color-text)]">{b.date}</p>
                                            <p className="text-[10px] text-[var(--color-text-dim)]">{b.location || 'Home'}</p>
                                        </td>
                                        <td>
                                            {b.pandit ? (
                                                <span className="text-xs font-semibold text-emerald-400">🧑‍🦳 {b.pandit.name}</span>
                                            ) : (
                                                <span className="text-xs text-amber-400 font-medium">Pending Assignment</span>
                                            )}
                                        </td>
                                        <td className="font-bold text-xs text-[var(--color-text)]">₹{b.total?.toLocaleString('en-IN')}</td>
                                        <td>
                                            <span className={`badge ${
                                                b.status === 'completed' ? 'badge-success' :
                                                b.status === 'booked' ? 'badge-warning' : 'badge-info'
                                            }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-6 text-[var(--color-text-dim)]">
                                        No recent bookings found. Devotees can book Pujas from the main site.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
