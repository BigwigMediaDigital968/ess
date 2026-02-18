import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Star, TrendingUp } from "lucide-react";

const Performance = () => {
    const { api } = useAuth();
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await api.get("/performance/my");
                setReviews(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchReviews();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Performance Reviews</h2>
            <div className="grid gap-6">
                {reviews.map((r) => (
                    <Card key={r.id}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{r.period} Review</h3>
                                <p className="text-gray-400 text-sm">Reviewer: {r.reviewer.name}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-bold">{r.rating}/5</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-purple-300 font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Goals</h4>
                            <div className="bg-black/20 p-3 rounded-lg text-gray-300 text-sm">
                                {/* Assuming goals is JSON, displaying as string for now */}
                                <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(r.goals, null, 2)}</pre>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-purple-300 font-bold mb-2">Feedback</h4>
                            <p className="text-gray-400 italic">"{r.feedback}"</p>
                        </div>
                    </Card>
                ))}
                {reviews.length === 0 && <p className="text-gray-500">No performance reviews found.</p>}
            </div>
        </div>
    );
};

export default Performance;
