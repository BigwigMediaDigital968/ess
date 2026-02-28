import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Calendar, List, ChevronLeft, ChevronRight, Building2, Globe } from "lucide-react";

const TYPE_COLORS = {
    government: { bg: 'bg-red-500/40', border: 'border-red-400/50', badge: 'bg-red-500/20 text-red-300', label: 'National Holiday', dot: 'bg-red-400' },
    company: { bg: 'bg-purple-500/40', border: 'border-purple-400/50', badge: 'bg-purple-500/20 text-purple-300', label: 'Company Holiday', dot: 'bg-purple-400' },
    leave: { bg: 'bg-yellow-500/40', border: 'border-yellow-400/50', badge: 'bg-yellow-500/10 text-yellow-300', label: 'Leave', dot: 'bg-yellow-400' },
    wfh: { bg: 'bg-blue-500/40', border: 'border-blue-400/50', badge: 'bg-blue-500/10 text-blue-300', label: 'WFH', dot: 'bg-blue-400' },
};

const Holidays = () => {
    const { api } = useAuth();
    const [companyHolidays, setCompanyHolidays] = useState([]);
    const [govtHolidays, setGovtHolidays] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [wfhRequests, setWfhRequests] = useState([]);
    const [view, setView] = useState("calendar");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loadingGovt, setLoadingGovt] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const [holidaysRes, leavesRes, wfhRes] = await Promise.all([
                    api.get(`/holidays?year=${year}`),
                    api.get(`/leaves/approved?year=${year}`),
                    api.get('/wfh/approved')
                ]);
                setCompanyHolidays(Array.isArray(holidaysRes.data) ? holidaysRes.data : []);
                setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
                setWfhRequests(Array.isArray(wfhRes.data) ? wfhRes.data : []);
            } catch (err) {
                console.error("Failed to fetch team calendar data", err);
            }
        };
        fetchTeamData();
    }, [api, year]);

    useEffect(() => {
        const fetchGovtHolidays = async () => {
            setLoadingGovt(true);
            try {
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
                if (res.ok) {
                    const data = await res.json();
                    setGovtHolidays(data.map(h => ({
                        id: h.date,
                        name: h.name,
                        localName: h.localName,
                        date: h.date, // 'YYYY-MM-DD'
                        type: 'government'
                    })));
                }
            } catch (err) {
                console.warn("Could not fetch Indian public holidays", err);
            } finally {
                setLoadingGovt(false);
            }
        };
        fetchGovtHolidays();
    }, [year]);

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const monthName = currentDate.toLocaleString('default', { month: 'long' });

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-white/5 rounded-lg opacity-30" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = [];

            // Govt holidays
            govtHolidays.filter(h => h.date === dateStr).forEach(h => {
                dayEvents.push({ type: 'government', title: h.name });
            });

            // Company holidays
            companyHolidays.filter(h => h.date.split('T')[0] === dateStr).forEach(h => {
                dayEvents.push({ type: 'company', title: h.name });
            });

            // Leaves
            leaves.forEach(l => {
                const currentCheck = new Date(year, month, day);
                const start = new Date(l.startDate); start.setHours(0, 0, 0, 0);
                const end = new Date(l.endDate); end.setHours(0, 0, 0, 0);
                if (currentCheck >= start && currentCheck <= end) {
                    dayEvents.push({ type: 'leave', title: `${l.user?.name || 'Employee'} (${l.type})` });
                }
            });

            // WFH
            wfhRequests.forEach(w => {
                const wfhDate = new Date(w.createdAt).toISOString().split('T')[0];
                if (wfhDate === dateStr) {
                    dayEvents.push({ type: 'wfh', title: `${w.user?.name || 'Employee'} (WFH)` });
                }
            });

            const isToday = dateStr === new Date().toISOString().split('T')[0];
            days.push(
                <div key={day} className={`min-h-[6rem] p-1.5 rounded-lg border relative flex flex-col overflow-hidden
                    ${isToday ? 'border-purple-400/60 bg-purple-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    <span className={`text-xs font-bold ml-0.5 mb-1 ${isToday ? 'text-purple-400' : 'text-white/70'}`}>{day}</span>
                    <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-hide">
                        {dayEvents.map((event, idx) => {
                            const c = TYPE_COLORS[event.type];
                            return (
                                <div key={idx} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 truncate ${c.bg} border ${c.border}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                                    <span className="truncate text-white/90">{event.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">{monthName} {year}</h2>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                        <ChevronRight size={20} className="text-white" />
                    </button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs mb-2">
                    {Object.entries(TYPE_COLORS).map(([key, c]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                            <span className="text-gray-400">{c.label}</span>
                        </div>
                    ))}
                    {loadingGovt && <span className="text-gray-500 animate-pulse">Loading national holidays…</span>}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-gray-400 font-medium text-xs">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-1">{days}</div>
            </div>
        );
    };

    // All holidays merged for list view
    const allHolidaysForList = [
        ...govtHolidays.map(h => ({ ...h, source: 'government' })),
        ...companyHolidays.map(h => ({ ...h, date: h.date.split('T')[0], source: 'company' }))
    ].sort((a, b) => a.date.localeCompare(b.date));

    const renderList = () => (
        <div className="space-y-3">
            {allHolidaysForList.length === 0 ? (
                <div className="text-white text-center py-10">No holidays found for {year}.</div>
            ) : (
                allHolidaysForList.map((holiday, i) => {
                    const c = TYPE_COLORS[holiday.source] || TYPE_COLORS.company;
                    return (
                        <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${c.bg} ${c.border} border`}>
                            <div className="flex items-center gap-3">
                                {holiday.source === 'government' ? <Globe size={18} className="text-red-400" /> : <Building2 size={18} className="text-purple-400" />}
                                <div>
                                    <h3 className="text-base font-bold text-white">{holiday.name}</h3>
                                    {holiday.localName && holiday.localName !== holiday.name && (
                                        <p className="text-gray-400 text-xs">{holiday.localName}</p>
                                    )}
                                    <p className="text-gray-400 text-sm">
                                        {new Date(holiday.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.badge}`}>
                                {c.label}
                            </span>
                        </div>
                    );
                })
            )}
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Holiday Calendar</h1>
                    <p className="text-gray-400 mt-1">National 🇮🇳 and Company Holidays</p>
                </div>

                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                    <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                        <Calendar size={18} /> Calendar
                    </button>
                    <button onClick={() => setView('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'list' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                        <List size={18} /> List View
                    </button>
                </div>
            </div>

            {view === 'calendar' ? renderCalendar() : renderList()}
        </motion.div>
    );
};

export default Holidays;
