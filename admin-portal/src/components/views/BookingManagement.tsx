import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminBookings, updateBookingStatus, fetchAdminPandits } from '../../services/api';

export const BookingManagementView: React.FC = () => {
    const { token } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [pandits, setPandits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [statusNote, setStatusNote] = useState('');
    const [selectedPanditId, setSelectedPanditId] = useState<number | undefined>(undefined);
    const [updating, setUpdating] = useState(false);

    const loadBookings = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [bRes, pRes] = await Promise.all([
                fetchAdminBookings(token),
                fetchAdminPandits()
            ]);
            if (bRes.success) setBookings(bRes.data.bookings);
            if (pRes.success) setPandits(pRes.data.pandits);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadBookings();
    }, [token]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!token || !selectedBooking) return;
        setUpdating(true);
        try {
            const res = await updateBookingStatus(token, selectedBooking.id, {
                status: newStatus,
                note: statusNote || `Status updated to ${newStatus}`,
                panditId: selectedPanditId
            });
            if (res.success) {
                setSelectedBooking(res.data.booking);
                loadBookings();
            }
        } catch (e) {
            console.error(e);
        }
        setUpdating(false);
    };

    if (loading) return <div className="p-8 text-center text-xs text-[var(--color-text-dim)]">Loading Bookings...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">Puja Bookings Management</h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Manage composite Puja bookings, assign verified Pandits, and track status timeline</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="card p-4 overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ref ID</th>
                                    <th>Puja</th>
                                    <th>Devotee</th>
                                    <th>Date</th>
                                    <th>Assigned Pandit</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-[var(--color-surface-3)] cursor-pointer" onClick={() => setSelectedBooking(b)}>
                                        <td className="font-mono text-xs font-semibold text-[var(--color-primary)]">{b.bookingNumber}</td>
                                        <td>
                                            <p className="font-bold text-xs text-[var(--color-text)]">{b.pujaName}</p>
                                            <span className="badge badge-warning text-[9px] uppercase">{b.tier}</span>
                                        </td>
                                        <td>
                                            <p className="text-xs text-[var(--color-text)]">{b.customerName}</p>
                                            <p className="text-[10px] text-[var(--color-text-dim)]">{b.customerPhone}</p>
                                        </td>
                                        <td className="text-xs text-[var(--color-text)]">{b.date}</td>
                                        <td>
                                            {b.pandit ? (
                                                <span className="text-xs text-emerald-400 font-semibold">🧑‍🦳 {b.pandit.name}</span>
                                            ) : (
                                                <span className="text-xs text-amber-400">Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="badge badge-info">{b.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Booking Detail Sidebar */}
                <div className="card p-6 space-y-4 sticky top-24 h-fit">
                    {selectedBooking ? (
                        <>
                            <div className="border-b border-[var(--color-border)] pb-3">
                                <span className="font-mono text-xs text-[var(--color-primary)] font-bold">{selectedBooking.bookingNumber}</span>
                                <h3 className="font-serif font-bold text-base text-[var(--color-text)] mt-1">{selectedBooking.pujaName}</h3>
                                <p className="text-xs text-[var(--color-text-muted)]">Devotee: {selectedBooking.customerName} ({selectedBooking.customerPhone})</p>
                            </div>

                            <div className="space-y-2 text-xs">
                                <p><strong className="text-[var(--color-text-muted)]">Tier:</strong> <span className="capitalize text-[var(--color-primary)] font-semibold">{selectedBooking.tier}</span></p>
                                <p><strong className="text-[var(--color-text-muted)]">Tradition:</strong> <span className="capitalize">{selectedBooking.tradition}</span></p>
                                <p><strong className="text-[var(--color-text-muted)]">Date & Slot:</strong> {selectedBooking.date} ({selectedBooking.timeSlot})</p>
                                <p><strong className="text-[var(--color-text-muted)]">Location:</strong> {selectedBooking.location || selectedBooking.customerAddress?.address || 'At Home'}</p>
                                <p><strong className="text-[var(--color-text-muted)]">Total Composite Price:</strong> <span className="font-bold text-[var(--color-text)]">₹{selectedBooking.total?.toLocaleString('en-IN')}</span></p>
                            </div>

                            {/* Assign Pandit */}
                            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                                <label className="block text-xs font-bold text-[var(--color-text)]">Assign Verified Pandit</label>
                                <select
                                    value={selectedPanditId || selectedBooking.panditId || ''}
                                    onChange={(e) => setSelectedPanditId(Number(e.target.value))}
                                    className="w-full text-xs"
                                >
                                    <option value="">Select Pandit...</option>
                                    {pandits.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.tradition} - {p.location})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Updater Buttons */}
                            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                                <label className="block text-xs font-bold text-[var(--color-text)]">Update Booking Status</label>
                                <input
                                    type="text"
                                    placeholder="Add status note..."
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    className="w-full text-xs mb-2"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    {['confirmed', 'kit-prepared', 'dispatched', 'completed'].map((st) => (
                                        <button
                                            key={st}
                                            disabled={updating}
                                            onClick={() => handleStatusUpdate(st)}
                                            className="btn btn-secondary btn-sm capitalize text-[10px]"
                                        >
                                            Set {st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-xs text-[var(--color-text-dim)]">
                            Select a booking from the list to view details and assign a Pandit.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
