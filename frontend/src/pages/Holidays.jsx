import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Calendar, List, ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";

const Holidays = () => {
    const { api } = useAuth();
    const [holidays, setHolidays] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [wfhRequests, setWfhRequests] = useState([]);
    const [view, setView] = useState("calendar"); // 'calendar' or 'list'
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const year = currentDate.getFullYear();
                const [holidaysRes, leavesRes, wfhRes] = await Promise.all([
                    api.get(`/holidays?year=${year}`),
                    api.get(`/leaves/approved?year=${year}`),
                    api.get('/wfh/approved')
                ]);

                setHolidays(Array.isArray(holidaysRes.data) ? holidaysRes.data : []);
                setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
                setWfhRequests(Array.isArray(wfhRes.data) ? wfhRes.data : []);
            } catch (err) {
                console.error("Failed to fetch calendar data", err);
            }
        };
        fetchData();
    }, [api, currentDate.getFullYear()]);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const monthName = currentDate.toLocaleString('default', { month: 'long' });

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-white/5 rounded-lg"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const dayEvents = [];

            // Holidays
            const holiday = holidays.find(h => h.date.split('T')[0] === dateStr);
            if (holiday) dayEvents.push({ type: 'holiday', title: holiday.name, color: 'bg-purple-600', borderColor: 'border-purple-500' });

            // Leaves
            leaves.forEach(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                const current = new Date(dateStr);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);

                // Only comparing dates roughly for now. 
                // Need to handle timezones properly but this is a start.
                // dateStr is YYYY-MM-DD. 
                // parsing dateStr as local time:
                const currentCheck = new Date(year, month, day);

                if (currentCheck >= start && currentCheck <= end) {
                    dayEvents.push({ type: 'leave', title: `${l.user.name} (${l.type})`, color: 'bg-yellow-600', borderColor: 'border-yellow-500' });
                }
            });

            // WFH
            wfhRequests.forEach(w => {
                const wfhDate = new Date(w.createdAt).toISOString().split('T')[0];
                if (wfhDate === dateStr) {
                    dayEvents.push({ type: 'wfh', title: `${w.user.name} (WFH)`, color: 'bg-blue-600', borderColor: 'border-blue-500' });
                }
            });

            days.push(
                <div key={day} className={`min-h-[6rem] p-1 rounded-lg border border-white/10 relative bg-white/5 hover:bg-white/10 overflow-hidden flex flex-col`}>
                    <span className="text-white/70 font-bold ml-1">{day}</span>
                    <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-hide">
                        {dayEvents.map((event, idx) => (
                            <div key={idx} className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${event.color}/40 border ${event.borderColor}/50 border`}>
                                {event.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">{monthName} {year}</h2>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                        <ChevronRight size={20} className="text-white" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-4 mb-2 text-center text-gray-400 font-medium">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-4">
                    {days}
                </div>
            </div>
        );
    };

    const renderList = () => {
        return (
            <div className="space-y-4">
                {holidays.length === 0 ? (
                    <div className="text-white text-center py-10">No holidays found for this year.</div>
                ) : (
                    holidays.map((holiday) => (
                        <div key={holiday.id} className="p-4 bg-white/10 rounded-xl border border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white">{holiday.name}</h3>
                                <p className="text-gray-400">{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm">
                                {holiday.type || 'Public Holiday'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Holiday Calendar</h1>
                    <p className="text-gray-400 mt-1">View upcoming holidays and events.</p>
                </div>

                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setView('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Calendar size={18} /> Calendar
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'list' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <List size={18} /> List View
                    </button>
                </div>
            </div>

            {view === 'calendar' ? renderCalendar() : renderList()}

        </motion.div>
    );
};

export default Holidays;
