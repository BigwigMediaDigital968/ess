import { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
    Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight, Save, Trash2, AlertCircle, Pencil, Check, X
} from "lucide-react";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RosterManagement = () => {
    const { user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [subordinates, setSubordinates] = useState([]);
    const [rosters, setRosters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [newShift, setNewShift] = useState({ name: '', startTime: '09:00', endTime: '18:00' });
    const [editingShift, setEditingShift] = useState(null); // { id, name, startTime, endTime }
    const [assignments, setAssignments] = useState({}); // { `${userId}-${date}`: shiftId }

    useEffect(() => { fetchData(); }, [currentMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const startDate = new Date(year, month, 1).toISOString();
            const endDate = new Date(year, month + 1, 0).toISOString();

            const [shiftsRes, teamRes] = await Promise.all([
                api.get('/roster/shifts'),
                api.get(`/roster/team?startDate=${startDate}&endDate=${endDate}`)
            ]);
            setShifts(shiftsRes.data);
            setSubordinates(teamRes.data.subordinates);
            setRosters(teamRes.data.rosters);

            // Build assignment map from existing rosters
            const map = {};
            teamRes.data.rosters.forEach(r => {
                const d = new Date(r.date).toISOString().split('T')[0];
                map[`${r.userId}-${d}`] = r.shiftId;
            });

            // Auto-default weekends to WO if no assignment exists
            const woShift = shiftsRes.data.find(s => s.name === 'WO');
            if (woShift) {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const daysCount = new Date(year, month + 1, 0).getDate();
                teamRes.data.subordinates.forEach(emp => {
                    for (let d = 1; d <= daysCount; d++) {
                        const dt = new Date(year, month, d);
                        const dayOfWeek = dt.getDay();
                        const iso = dt.toISOString().split('T')[0];
                        const key = `${emp.id}-${iso}`;
                        if ((dayOfWeek === 0 || dayOfWeek === 6) && !map[key]) {
                            map[key] = woShift.id;
                        }
                    }
                });
            }

            setAssignments(map);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const count = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: count }, (_, i) => {
            const date = new Date(year, month, i + 1);
            return { day: i + 1, date, dayName: DAYS[date.getDay()], iso: date.toISOString().split('T')[0] };
        });
    }, [currentMonth]);

    const handleAssign = (userId, dateIso, shiftId) => {
        setAssignments(prev => ({ ...prev, [`${userId}-${dateIso}`]: shiftId || undefined }));
    };

    const saveRosters = async () => {
        setSaving(true);
        try {
            const bulkData = Object.entries(assignments)
                .filter(([, shiftId]) => shiftId)
                .map(([key, shiftId]) => {
                    const [userId, date] = [key.substring(0, 36), key.substring(37)];
                    return { userId, date, shiftId };
                });
            await api.post('/roster/bulk-assign', { assignments: bulkData });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const createShift = async () => {
        if (!newShift.name) return;
        try {
            await api.post('/roster/shifts', newShift);
            setShowShiftForm(false);
            setNewShift({ name: '', startTime: '09:00', endTime: '18:00' });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const saveEditShift = async () => {
        if (!editingShift) return;
        try {
            await api.put(`/roster/shifts/${editingShift.id}`, {
                name: editingShift.name,
                startTime: editingShift.startTime,
                endTime: editingShift.endTime
            });
            setEditingShift(null);
            fetchData();
        } catch (err) {
            alert('Failed to update shift: ' + (err.response?.data?.message || err.message));
        }
    };

    const deleteShift = async (shiftId, shiftName) => {
        if (!window.confirm(`Delete shift "${shiftName}"? Existing roster assignments using this shift will be cleared.`)) return;
        try {
            await api.delete(`/roster/shifts/${shiftId}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete shift: ' + (err.response?.data?.message || err.message));
        }
    };

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Named color map for shifts
    const specialNames = ['WO', 'GH', 'SL'];
    const namedColors = {
        'Morning': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'General': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'Night': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'WO': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        'GH': 'bg-red-500/20 text-red-300 border-red-500/30',
        'SL': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    };
    const fallbackPalette = [
        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'bg-rose-500/20 text-rose-300 border-rose-500/30',
    ];
    let fbIdx = 0;
    const shiftColors = {};
    shifts.forEach(s => {
        shiftColors[s.id] = namedColors[s.name] || fallbackPalette[fbIdx++ % fallbackPalette.length];
    });

    // Separate work shifts from special types for display ordering
    const workShifts = shifts.filter(s => !specialNames.includes(s.name));
    const specialShifts = shifts.filter(s => specialNames.includes(s.name));
    const orderedShifts = [...workShifts, ...specialShifts];

    const shiftLabel = (s) => {
        if (specialNames.includes(s.name)) {
            const labels = { WO: 'WO (Weekly Off)', GH: 'GH (Govt Holiday)', SL: 'SL (Scheduled Leave)' };
            return labels[s.name] || s.name;
        }
        return s.name;
    };

    return (
        <div className="min-h-screen p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-pink-400" />
                        Roster Management
                    </h1>
                    <p className="text-gray-400 mt-1">Assign shifts to your team members</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowShiftForm(!showShiftForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-600/30 transition-colors">
                        <Plus className="w-4 h-4" /> New Shift
                    </button>
                    <button onClick={saveRosters} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-xl hover:bg-emerald-600/30 transition-colors disabled:opacity-50">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </div>

            {/* New Shift Form */}
            {showShiftForm && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <h3 className="text-white font-semibold mb-3">Create New Shift</h3>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Shift Name</label>
                            <input value={newShift.name} onChange={e => setNewShift({ ...newShift, name: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="e.g. Evening" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Start Time</label>
                            <input type="time" value={newShift.startTime} onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">End Time</label>
                            <input type="time" value={newShift.endTime} onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
                        </div>
                        <button onClick={createShift}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">Create</button>
                    </div>
                </div>
            )}

            {/* Shift Legend with Edit/Delete */}
            <div className="flex flex-wrap gap-3">
                {orderedShifts.map(s => (
                    <div key={s.id} className="flex items-center gap-1">
                        {editingShift?.id === s.id ? (
                            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
                                <input
                                    value={editingShift.name}
                                    onChange={e => setEditingShift({ ...editingShift, name: e.target.value })}
                                    className="w-20 bg-transparent text-white text-xs border-b border-white/30 outline-none"
                                    placeholder="Name"
                                />
                                <input
                                    type="time"
                                    value={editingShift.startTime}
                                    onChange={e => setEditingShift({ ...editingShift, startTime: e.target.value })}
                                    className="bg-transparent text-white text-xs outline-none w-20"
                                />
                                <span className="text-gray-400 text-xs">–</span>
                                <input
                                    type="time"
                                    value={editingShift.endTime}
                                    onChange={e => setEditingShift({ ...editingShift, endTime: e.target.value })}
                                    className="bg-transparent text-white text-xs outline-none w-20"
                                />
                                <button onClick={saveEditShift} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingShift(null)} className="text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${shiftColors[s.id]}`}>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {specialNames.includes(s.name) ? shiftLabel(s) : `${s.name} (${s.startTime}–${s.endTime})`}
                            </span>
                        )}
                        {!specialNames.includes(s.name) && editingShift?.id !== s.id && (
                            <>
                                <button
                                    onClick={() => setEditingShift({ id: s.id, name: s.name, startTime: s.startTime, endTime: s.endTime })}
                                    className="p-1 text-gray-500 hover:text-purple-400 transition-colors"
                                    title="Edit shift"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => deleteShift(s.id, s.name)}
                                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Delete shift"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-center gap-4">
                <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white font-semibold text-lg min-w-[200px] text-center">{monthLabel}</span>
                <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Roster Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading roster...</div>
            ) : subordinates.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                    <Users className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No team members found. Make sure employees are assigned to you as their manager.</p>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-4 py-3 text-left text-gray-400 font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm z-10 min-w-[160px]">Employee</th>
                                    {daysInMonth.map(d => (
                                        <th key={d.iso} className={`px-1 py-2 text-center text-gray-400 font-medium min-w-[70px] ${d.dayName === 'Sun' || d.dayName === 'Sat' ? 'bg-white/5' : ''}`}>
                                            <div className="text-xs">{d.dayName}</div>
                                            <div className="text-white font-semibold">{d.day}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subordinates.map(emp => (
                                    <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="px-4 py-3 sticky left-0 bg-gray-900/80 backdrop-blur-sm z-10">
                                            <div className="font-medium text-white truncate">{emp.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{emp.designation || 'Employee'}</div>
                                        </td>
                                        {daysInMonth.map(d => {
                                            const key = `${emp.id}-${d.iso}`;
                                            const assigned = assignments[key];
                                            const isWeekend = d.dayName === 'Sun' || d.dayName === 'Sat';
                                            return (
                                                <td key={d.iso} className={`px-1 py-1 text-center ${isWeekend ? 'bg-white/5' : ''}`}>
                                                    <select
                                                        value={assigned || ''}
                                                        onChange={e => handleAssign(emp.id, d.iso, e.target.value)}
                                                        className={`w-full text-xs rounded px-1 py-1.5 border cursor-pointer transition-colors
                                                            ${assigned ? shiftColors[assigned] : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                    >
                                                        <option value="">—</option>
                                                        {orderedShifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RosterManagement;
