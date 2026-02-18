import { useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";

const JobCreate = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        departmentId: "",
        type: "Full-Time",
        location: "Office",
        salaryRange: "",
        description: "",
        requirements: ""
    });

    useEffect(() => {
        // Fetch departments
        const fetchDepts = async () => {
            try {
                const res = await api.get("/organization/departments");
                setDepartments(res.data || []);
            } catch (err) { console.error(err); }
        };
        fetchDepts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/talent/jobs", formData);
            navigate("/talent");
        } catch (err) {
            alert("Failed to create job");
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <button onClick={() => navigate('/talent')} className="flex items-center gap-2 text-white/60 hover:text-white mb-6">
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold text-white mb-6">Post New Job</h1>

            <form onSubmit={handleSubmit} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Job Title" name="title" value={formData.title} onChange={handleChange} className="bg-black/20 text-white p-3 rounded" required />
                    <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="bg-black/20 text-white p-3 rounded">
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <select name="type" value={formData.type} onChange={handleChange} className="bg-black/20 text-white p-3 rounded">
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract</option>
                    </select>
                    <input type="text" placeholder="Location" name="location" value={formData.location} onChange={handleChange} className="bg-black/20 text-white p-3 rounded" />
                </div>

                <input type="text" placeholder="Salary Range (e.g. $50k - $70k)" name="salaryRange" value={formData.salaryRange} onChange={handleChange} className="w-full bg-black/20 text-white p-3 rounded" />

                <textarea placeholder="Job Description" name="description" value={formData.description} onChange={handleChange} className="w-full h-32 bg-black/20 text-white p-3 rounded" required />
                <textarea placeholder="Requirements (Skills, Experience...)" name="requirements" value={formData.requirements} onChange={handleChange} className="w-full h-32 bg-black/20 text-white p-3 rounded" />

                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2">
                    <Save size={18} /> Publish Job
                </button>
            </form>
        </div>
    );
};

export default JobCreate;
