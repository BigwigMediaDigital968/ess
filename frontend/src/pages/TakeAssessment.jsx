import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const TakeAssessment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
    const [warnings, setWarnings] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Proctoring State
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const res = await api.get(`/talent/assessments/${id}`);
                setAssessment(res.data);
                // Initialize responses
                const initialResponses = {};
                if (res.data.questions) {
                    res.data.questions.forEach((q, idx) => initialResponses[idx] = "");
                }
                setResponses(initialResponses);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert("Failed to load test");
                navigate('/talent');
            }
        };
        fetchAssessment();
    }, [id]);

    // Timer
    useEffect(() => {
        if (!assessment || submitted) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [assessment, submitted]);

    // Visibility Change (Tab Switching)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(prev => {
                    const newWarnings = prev + 1;
                    if (newWarnings >= 3) {
                        alert("Assessment Terminated due to multiple violations!");
                        handleSubmit();
                    }
                    return newWarnings;
                });
                alert("Warning: Tab switching is monitored! Stay on this page.");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const enterFullscreen = () => {
        if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        }
    };

    const handleAnswerChange = (idx, value) => {
        setResponses({ ...responses, [idx]: value });
    };

    const handleSubmit = async () => {
        if (submitted) return;
        setSubmitted(true);
        if (document.fullscreenElement) document.exitFullscreen().catch(e => { });

        // Format responses
        const formattedResponses = assessment.questions.map((q, idx) => ({
            q: q,
            a: responses[idx]
        }));

        try {
            await api.post(`/talent/assessments/${id}/submit`, { responses: formattedResponses });
            alert("Assessment Submitted Successfully!");
            navigate('/talent');
        } catch (err) {
            console.error(err);
            alert("Submission failed, please contact HR.");
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div className="text-white p-8">Loading Assessment...</div>;

    if (!isFullscreen && !submitted) {
        return (
            <div ref={containerRef} className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white p-8 z-50">
                <h1 className="text-3xl font-bold mb-4">Proctored Assessment</h1>
                <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-8 max-w-md text-center border border-red-500/50">
                    <AlertTriangle className="mx-auto mb-2" />
                    <p>This is a timed, proctored exam.</p>
                    <ul className="text-sm mt-2 list-disc list-inside">
                        <li>Fullscreen mode is required.</li>
                        <li>Tab switching is monitored.</li>
                        <li>3 Warnings will terminate the test.</li>
                    </ul>
                </div>
                <button onClick={enterFullscreen} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold">
                    Start Assessment
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-gray-900 text-white p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-900/95 p-4 border-b border-white/10 z-10 backdrop-blur">
                <div>
                    <h1 className="text-xl font-bold">Assessment: {assessment.type}</h1>
                    <p className="text-sm text-white/60">Questions: {assessment.questions.length}</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-yellow-400">
                        <AlertTriangle size={18} />
                        <span>Warnings: {warnings}/3</span>
                    </div>
                    <div className="flex items-center gap-2 text-2xl font-mono font-bold text-blue-400">
                        <Clock size={24} />
                        {formatTime(timeLeft)}
                    </div>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold">
                        Submit
                    </button>
                </div>
            </div>

            {/* Questions */}
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                {assessment.questions.map((q, idx) => (
                    <div key={idx} className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-semibold">Question {idx + 1}</h3>
                            <span className="text-xs px-2 py-1 bg-white/10 rounded uppercase">{q.difficulty}</span>
                        </div>
                        <p className="mb-4 text-white/90 text-lg">{q.q}</p>
                        <textarea
                            value={responses[idx] || ""}
                            onChange={(e) => handleAnswerChange(idx, e.target.value)}
                            className="w-full h-32 bg-black/30 border border-white/20 rounded p-4 text-white focus:border-blue-500 focus:outline-none resize-none"
                            placeholder="Type your answer here..."
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TakeAssessment;
