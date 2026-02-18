import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { DollarSign, Download } from "lucide-react";

const Payroll = () => {
    const { api } = useAuth();
    const [payrolls, setPayrolls] = useState([]);

    useEffect(() => {
        const fetchPayroll = async () => {
            try {
                const { data } = await api.get("/payroll/my");
                setPayrolls(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPayroll();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">My Payroll</h2>
            <div className="grid gap-4">
                {payrolls.map((p) => (
                    <Card key={p.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                                <DollarSign />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">{new Date(new Date().setMonth(p.month - 1)).toLocaleString('default', { month: 'long' })} {p.year}</h4>
                                <p className="text-gray-400">Net Pay: <span className="text-white font-bold">${p.netPay.toLocaleString()}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Basic: ${p.basicSalary} | Allowance: ${p.allowances} | Ded: ${p.deductions}</div>
                            <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-2 ml-auto">
                                <Download className="w-4 h-4" /> Download Slip
                            </button>
                        </div>
                    </Card>
                ))}
                {payrolls.length === 0 && <p className="text-gray-500">No payroll records found.</p>}
            </div>
        </div>
    );
};

export default Payroll;
