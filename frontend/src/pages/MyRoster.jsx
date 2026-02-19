import { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MyRoster = () => {
    const [rosters, setRosters] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => { fetchData(); }, [currentMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const startDate = new Date(year, month, 1).toISOString();
            const endDate = new Date(year, month + 1, 0).toISOString();

            const res = await api.get(`/roster/my?startDate=${startDate}&endDate=${endDate}`);
            setRosters(res.data.rosters || []);
            setAttendance(res.data.attendance || []);
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

    // Build lookup maps
    const rosterMap = {};
    rosters.forEach(r => {
        const d = new Date(r.date).toISOString().split('T')[0];
        rosterMap[d] = r;
    });

    const attendanceMap = {};
    attendance.forEach(a => {
        const d = new Date(a.date).toISOString().split('T')[0];
        attendanceMap[d] = a;
    });

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const fmtTime = (isoStr) => {
        if (!isoStr) return '—';
        return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const statusColor = (status) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-500/20 text-emerald-300';
            case 'LATE': return 'bg-amber-500/20 text-amber-300';
            case 'ABSENT': return 'bg-red-500/20 text-red-300';
            case 'HALF_DAY': return 'bg-orange-500/20 text-orange-300';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return (
        <div className="min-h-screen p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-pink-400" />
                    My Roster
                </h1>
                <p className="text-gray-400 mt-1">View your assigned shifts and attendance</p>
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

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading roster...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    {daysInMonth.map(d => {
                        const roster = rosterMap[d.iso];
                        const att = attendanceMap[d.iso];
                        const isToday = d.iso === new Date().toISOString().split('T')[0];
                        const isWeekend = d.dayName === 'Sun' || d.dayName === 'Sat';
                        const isPast = d.date < new Date(new Date().setHours(0, 0, 0, 0));

                        return (
                            <div key={d.iso} className={`rounded-xl border p-3 transition-all
                                ${isToday ? 'border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20' :
                                    isWeekend ? 'border-white/5 bg-white/3' :
                                        'border-white/10 bg-white/5'}
                             hover:bg-white/10`}>
                                {/* Day Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-bold ${isToday ? 'text-pink-400' : 'text-white'}`}>{d.day}</span>
                                    <span className={`text-xs ${isWeekend ? 'text-red-400' : 'text-gray-500'}`}>{d.dayName}</span>
                                </div>

                                {/* Shift Info */}
                                {roster ? (() => {
                                    const name = roster.shift?.name;
                                    const isSpecial = ['WO', 'GH', 'SL'].includes(name);
                                    const specialStyles = {
                                        WO: 'bg-gray-500/15 border-gray-500/20 text-gray-400',
                                        GH: 'bg-red-500/15 border-red-500/20 text-red-300',
                                        SL: 'bg-orange-500/15 border-orange-500/20 text-orange-300',
                                    };
                                    const specialLabels = { WO: 'Weekly Off', GH: 'Govt Holiday', SL: 'Scheduled Leave' };

                                    return isSpecial ? (
                                        <div className={`border rounded-lg px-2 py-1.5 mb-2 ${specialStyles[name]}`}>
                                            <div className="text-xs font-medium">{name} — {specialLabels[name]}</div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-500/15 border border-blue-500/20 rounded-lg px-2 py-1.5 mb-2">
                                            <div className="text-blue-300 text-xs font-medium">{name}</div>
                                            <div className="text-blue-400/70 text-xs flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {roster.shift?.startTime} – {roster.shift?.endTime}
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="text-gray-600 text-xs mb-2 italic">No shift assigned</div>
                                )}

                                {/* Attendance */}
                                {att ? (
                                    <div className={`rounded-lg px-2 py-1.5 text-xs ${statusColor(att.status)}`}>
                                        <div className="font-medium">{att.status}</div>
                                        <div className="opacity-70 mt-0.5">
                                            In: {fmtTime(att.clockIn)}<br />
                                            Out: {fmtTime(att.clockOut)}
                                        </div>
                                    </div>
                                ) : isPast && !isWeekend ? (
                                    <div className="text-red-500/50 text-xs italic">No attendance</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyRoster;
