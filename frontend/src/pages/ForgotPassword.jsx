import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setMessage('Please enter your email address');
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
            setMessage(res.data.message);
            setStatus('success');
        } catch (error) {
            console.error('Forgot password error:', error);
            setMessage(error.response?.data?.message || 'Failed to send reset link. Please try again.');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="BSL Logo" className="h-12 mx-auto mb-4" onError={(e) => { e.target.style.display = 'none'; }} />
                    <h2 className="text-3xl font-bold text-white mb-2">Password Recovery</h2>
                    <p className="text-gray-300">Enter your email to receive a reset link</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <CheckCircle className="w-16 h-16 text-green-400" />
                        </div>
                        <div className="text-green-300 bg-green-900/30 p-4 rounded-xl border border-green-500/30">
                            {message}
                        </div>
                        <Link to="/login" className="inline-flex items-center text-purple-300 hover:text-white transition-colors duration-200">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
                                {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="your.email@bigwig.local"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center"><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Sending Link...</span>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>

                        <div className="text-center mt-4">
                            <Link to="/login" className="text-sm text-purple-300 hover:text-white transition-colors duration-200 inline-flex items-center">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Log in
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
