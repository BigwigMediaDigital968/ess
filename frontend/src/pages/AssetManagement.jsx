import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Search, Plus, Cpu, Server, Monitor, Keyboard, Mouse, Camera, Printer, Trash2, Edit3, CheckCircle, Package, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const CATEGORIES = [
    'LAPTOP', 'DESKTOP', 'SERVER', 'WIRED_KEYBOARD', 'WIRED_MOUSE',
    'WIRELESS_KEYBOARD', 'WIRELESS_MOUSE', 'WEBCAM', 'DOCKING_STATION',
    'MONITOR', 'NETWORK_SWITCH', 'FIREWALL', 'ROUTER', 'OTHER'
];

const STATUSES = ['IN_STOCK', 'POPS', 'ASSIGNED', 'RETIRED'];

const getCategoryIcon = (category) => {
    switch (category) {
        case 'LAPTOP':
        case 'DESKTOP': return <Cpu className="w-5 h-5 text-blue-400" />;
        case 'SERVER': return <Server className="w-5 h-5 text-purple-400" />;
        case 'MONITOR': return <Monitor className="w-5 h-5 text-green-400" />;
        case 'WIRED_KEYBOARD':
        case 'WIRELESS_KEYBOARD': return <Keyboard className="w-5 h-5 text-yellow-400" />;
        case 'WIRED_MOUSE':
        case 'WIRELESS_MOUSE': return <Mouse className="w-5 h-5 text-orange-400" />;
        case 'WEBCAM': return <Camera className="w-5 h-5 text-pink-400" />;
        default: return <Package className="w-5 h-5 text-gray-400" />;
    }
};

const getOemLogo = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('apple') || n.includes('mac') || n.includes('iphone') || n.includes('ipad')) {
        return (
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] shrink-0 overflow-hidden relative">
                <svg viewBox="0 0 384 512" className="w-[18px] h-[18px] fill-black relative -top-[1px]">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
            </div>
        );
    }
    if (n.includes('dell')) {
        return <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[10px] tracking-tighter shadow-lg shadow-blue-500/30 shrink-0 select-none">DELL</div>;
    }
    if (n.includes('hp')) {
        return <div className="w-8 h-8 rounded-full bg-[#0096D6] flex items-center justify-center font-bold text-white text-[14px] leading-none italic shadow-lg shadow-blue-500/30 shrink-0 select-none font-serif pt-1">hp</div>;
    }
    if (n.includes('lenovo')) {
        return <div className="px-2 w-auto h-6 rounded bg-[#e2231a] flex flex-col justify-center items-center font-bold text-white text-[10px] tracking-widest shadow-lg shadow-red-500/30 shrink-0 select-none">Lenovo</div>;
    }
    if (n.includes('microsoft') || n.includes('surface')) {
        return (
            <div className="grid grid-cols-2 gap-[2px] w-6 h-6 shadow-[0_0_15px_rgba(255,255,255,0.1)] shrink-0">
                <div className="bg-[#f25022]"></div><div className="bg-[#7fba00]"></div>
                <div className="bg-[#00a4ef]"></div><div className="bg-[#ffb900]"></div>
            </div>
        );
    }
    return <div className="p-1.5 rounded-lg bg-gray-800 border border-white/10 shadow-lg shrink-0"><Package className="w-4 h-4 text-gray-400" /></div>;
};

// --- Dynamic Field Schemas ---
const getFieldsForCategory = (category) => {
    if (['LAPTOP', 'DESKTOP', 'SERVER'].includes(category)) {
        return [
            { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. Dell, Apple' },
            { key: 'cpuCores', label: 'CPU Cores / Model', placeholder: 'e.g. 10-core i7, 16-core Xeon' },
            { key: 'memory', label: 'Memory (RAM)', placeholder: 'e.g. 16GB DDR5' },
            { key: 'storageCount', label: 'No. of Hard Drives', placeholder: 'e.g. 1, 2' },
            { key: 'storageSize', label: 'Total Storage Size', placeholder: 'e.g. 512GB NVMe, 4TB RAID' },
            { key: 'networkAdapters', label: 'Network Adapters', placeholder: 'e.g. Wi-Fi 6E, 1GbE LAN' }
        ];
    } else if (['NETWORK_SWITCH', 'FIREWALL', 'ROUTER'].includes(category)) {
        return [
            { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. Cisco, Ubiquiti' },
            { key: 'portCount', label: 'Number of Ports', placeholder: 'e.g. 24, 48' },
            { key: 'portSpeed', label: 'Speed per Port', placeholder: 'e.g. 1 Gbps, 10 Gbps' }
        ];
    } else if (['MONITOR'].includes(category)) {
        return [
            { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. LG, Dell' },
            { key: 'size', label: 'Screen Size', placeholder: 'e.g. 27 inch, 34 inch Ultrawide' },
            { key: 'resolution', label: 'Resolution', placeholder: 'e.g. 4K, 1440p' },
            { key: 'refreshRate', label: 'Refresh Rate', placeholder: 'e.g. 60Hz, 144Hz' }
        ];
    } else if (['WIRED_KEYBOARD', 'WIRELESS_KEYBOARD', 'WIRED_MOUSE', 'WIRELESS_MOUSE', 'WEBCAM', 'DOCKING_STATION'].includes(category)) {
        return [
            { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. Logitech, Dell' },
            { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Bluetooth, USB-C' }
        ];
    }
    return [
        { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. Generic' },
        { key: 'description', label: 'Additional Details', placeholder: 'Enter details...' }
    ];
};

const formatConfigKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const AssetManagement = () => {
    const { user } = useAuth();
    const role = user?.LegacyRole || user?.role?.name;
    const roleType = user?.role?.type;
    const canManage = ['HR', 'ADMIN', 'OWNER'].includes(role) ||
        roleType === 'ADMINISTRATOR' || user?.isOwner;
    const isManagerView = role === 'MANAGER' || ['LEADERSHIP', 'EXECUTIVE'].includes(roleType);

    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'add'
    const [searchQuery, setSearchQuery] = useState('');

    // Add Asset State
    const [newAsset, setNewAsset] = useState({
        serialNumber: '',
        name: '',
        category: 'LAPTOP', // Default to LAPTOP so user sees the compute form immediately
        warrantyExpiry: '',
        officeId: '',
        configuration: {}
    });
    const [isSaving, setIsSaving] = useState(false);
    const [offices, setOffices] = useState([]);

    // Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [assignStatus, setAssignStatus] = useState('IN_STOCK');
    const [assignedToId, setAssignedToId] = useState('');

    const printableRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [assetRes, empRes, offRes] = await Promise.all([
                axios.get(`${API_URL}/assets`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/offices`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAssets(assetRes.data);
            setEmployees(empRes.data);
            setOffices(offRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
        setLoading(false);
    };

    const handleConfigChange = (key, value) => {
        setNewAsset(prev => ({
            ...prev,
            configuration: { ...prev.configuration, [key]: value }
        }));
    };

    const handleCategoryChange = (e) => {
        setNewAsset({
            ...newAsset,
            category: e.target.value,
            configuration: {} // Reset config when category changes so old fields don't linger
        });
    };

    const handleSaveAsset = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                serialNumber: newAsset.serialNumber,
                name: newAsset.name,
                category: newAsset.category,
                warrantyExpiry: newAsset.warrantyExpiry,
                officeId: newAsset.officeId || null,
                configuration: newAsset.configuration
            };

            const res = await axios.post(`${API_URL}/assets`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setAssets([res.data.asset, ...assets]);
            setView('list');
            setNewAsset({ serialNumber: '', name: '', category: 'LAPTOP', warrantyExpiry: '', officeId: '', configuration: {} });
            alert('Asset added successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add asset');
        }
        setIsSaving(false);
    };

    const handleAssign = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/assets/${selectedAsset.id}/status`, {
                status: assignStatus,
                assignedToId: assignStatus === 'ASSIGNED' ? assignedToId : null
            }, { headers: { Authorization: `Bearer ${token}` } });

            setAssets(assets.map(a => a.id === selectedAsset.id ? res.data.asset : a));
            setShowAssignModal(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to assign target');
        }
    };

    const handleDeleteAsset = async (assetId) => {
        if (!window.confirm('Delete this asset? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/assets/${assetId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssets(prev => prev.filter(a => a.id !== assetId));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete asset');
        }
    };

    const printSticker = (asset) => {
        const qrContent = `SN:${asset.serialNumber} | Name:${asset.name} | Cat:${asset.category}`;

        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Asset Sticker</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fff;}
                        .sticker { border: 2px solid #000; padding: 20px; width: 300px; text-align: center; border-radius: 12px; }
                        h2 { margin: 0 0 10px 0; font-size: 18px; }
                        p { margin: 5px 0; font-size: 14px; color: #333; }
                        .qr { margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="sticker">
                        <h2>${asset.name}</h2>
                        <p><strong>Category:</strong> ${asset.category}</p>
                        <p><strong>S/N:</strong> ${asset.serialNumber}</p>
                        ${asset.warrantyExpiry ? `<p><strong>Warranty:</strong> ${new Date(asset.warrantyExpiry).toLocaleDateString()}</p>` : ''}
                        <div class="qr" id="qr-container"></div>
                    </div>
                </body>
            </html>
        `);

        // Wait for it to map components then print
        setTimeout(() => {
            const svgElement = document.getElementById(`qr-svg-${asset.id}`).outerHTML;
            printWindow.document.getElementById('qr-container').innerHTML = svgElement;
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Asset Management
                    </h1>
                    <p className="text-gray-400 mt-2">Manage, Track, and Assign Company Hardware</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setView('list')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'list' ? 'bg-white/20 shadow-md ring-1 ring-white/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {canManage ? 'All Assets' : isManagerView ? "My Team's Assets" : 'My Assets'}
                    </button>
                    {canManage && (
                        <button
                            onClick={() => setView('add')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${view === 'add' ? 'bg-purple-500 shadow-md ring-1 ring-purple-400 text-white' : 'bg-purple-500/80 hover:bg-purple-500 text-white'}`}
                        >
                            <Plus className="w-4 h-4" /> Add Asset
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : view === 'list' ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search assets by name, SN, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredAssets.map(asset => (
                                <motion.div
                                    key={asset.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[260px]"
                                >
                                    {/* Background decorative glow */}
                                    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all group-hover:opacity-40 pointer-events-none 
                                        ${asset.status === 'ASSIGNED' ? 'bg-blue-500' : asset.status === 'IN_STOCK' ? 'bg-green-500' : 'bg-purple-500'}`} />

                                    {/* Hover Details Overlay */}
                                    <div className="absolute inset-x-0 top-0 bottom-[64px] z-20 bg-gray-900/95 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-2xl p-5 flex flex-col pointer-events-none group-hover:pointer-events-auto">
                                        <div className="flex justify-between items-start mb-3 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                            <h4 className="font-bold text-white text-base">Specifications</h4>
                                            {getOemLogo(asset.configuration?.manufacturer || asset.name)}
                                        </div>

                                        <div className="space-y-2 text-sm flex-1 translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75 overflow-y-auto pr-2 custom-scrollbar pointer-events-auto">
                                            {asset.configuration && Object.entries(asset.configuration).map(([k, v]) => {
                                                if (!v) return null;
                                                return (
                                                    <div key={k} className="flex flex-col mb-1 border-b border-white/5 pb-1">
                                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{formatConfigKey(k)}</span>
                                                        <span className="text-gray-300 leading-tight">{v}</span>
                                                    </div>
                                                );
                                            })}
                                            {(!asset.configuration || Object.keys(asset.configuration).length === 0) && (
                                                <div className="text-gray-500 italic text-center mt-4">No detailed specs mapped.</div>
                                            )}
                                        </div>

                                        {/* Gradient fade at bottom of overlay to blend with regular buttons area */}
                                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
                                    </div>

                                    <div className="flex-1 relative z-10 transition-all duration-300 group-hover:opacity-0 group-hover:scale-95 pointer-events-auto">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                                {getCategoryIcon(asset.category)}
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${asset.status === 'IN_STOCK' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                asset.status === 'ASSIGNED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    asset.status === 'POPS' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {asset.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-lg leading-tight mb-1 truncate">{asset.name}</h3>

                                        {/* Serial Number & Warranty */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="font-mono text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded border border-white/10">
                                                SN: {asset.serialNumber}
                                            </span>
                                            {asset.warrantyExpiry ? (() => {
                                                const expiry = new Date(asset.warrantyExpiry);
                                                const now = new Date();
                                                const daysLeft = Math.ceil((expiry - now) / 86400000);
                                                const color = daysLeft < 0 ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                    daysLeft < 90 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                                        'bg-green-500/20 text-green-300 border-green-500/30';
                                                return (
                                                    <span className={`text-xs px-2 py-0.5 rounded border ${color}`}>
                                                        {daysLeft < 0 ? '⚠ Expired' : '🛡'} {expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                );
                                            })() : (
                                                <span className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded border border-white/10">No warranty</span>
                                            )}
                                        </div>

                                        {asset.assignedTo && (
                                            <div className="flex items-center gap-2 mb-4 p-2 bg-white/5 rounded-lg border border-white/5 filter group-hover:blur-sm transition-all duration-300">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">
                                                    {asset.assignedTo.name.charAt(0)}
                                                </div>
                                                <span className="text-sm text-gray-300 truncate">{asset.assignedTo.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-white/10 relative z-30 mt-auto pointer-events-auto bg-transparent">
                                        <button
                                            onClick={() => printSticker(asset)}
                                            className="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
                                        >
                                            <Printer className="w-4 h-4" /> Print Sticker
                                            <div className="hidden">
                                                <QRCodeSVG id={`qr-svg-${asset.id}`} value={`SN:${asset.serialNumber}`} size={128} />
                                            </div>
                                        </button>

                                        <div className="flex gap-2">
                                            {canManage && (
                                                <>
                                                    <button
                                                        onClick={() => { setSelectedAsset(asset); setAssignStatus(asset.status); setAssignedToId(asset.assignedToId || ''); setShowAssignModal(true); }}
                                                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                                                    >
                                                        Assign
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAsset(asset.id)}
                                                        className="bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg text-sm transition-all cursor-pointer"
                                                        title="Delete asset"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    {filteredAssets.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-300">No Assets Found</h3>
                            <p className="text-gray-500">Try adjusting your search query.</p>
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-purple-400" />
                            Pre-register Asset
                        </h2>

                        <form onSubmit={handleSaveAsset} className="space-y-6">
                            {/* BASIC IDENTIFIERS */}
                            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-6">
                                <h3 className="text-sm tracking-widest text-purple-400 font-bold uppercase mb-4">Core Identifiers</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                                        <select
                                            value={newAsset.category}
                                            onChange={handleCategoryChange}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat} className="bg-gray-800">{cat.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Location / Branch</label>
                                        <select
                                            value={newAsset.officeId}
                                            onChange={(e) => setNewAsset({ ...newAsset, officeId: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        >
                                            <option value="" className="bg-gray-800">Unassigned (HQ)</option>
                                            {offices.map(o => (
                                                <option key={o.id} value={o.id} className="bg-gray-800">{o.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Warranty Expiry</label>
                                        <input
                                            type="date"
                                            value={newAsset.warrantyExpiry}
                                            onChange={(e) => setNewAsset({ ...newAsset, warrantyExpiry: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Serial Number *</label>
                                        <input
                                            required
                                            type="text"
                                            value={newAsset.serialNumber}
                                            onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                                            placeholder="e.g. LAP-99823-X"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Asset Name / Tag *</label>
                                        <input
                                            required
                                            type="text"
                                            value={newAsset.name}
                                            onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                            placeholder="MacBook Pro M3"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* DYNAMIC CONFIGURATION FORM */}
                            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4">
                                <h3 className="text-sm tracking-widest text-blue-400 font-bold uppercase mb-4 flex items-center gap-2">
                                    <Cpu className="w-4 h-4" /> Hardware Property Mapping
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {getFieldsForCategory(newAsset.category).map(field => (
                                        <div key={field.key}>
                                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">{field.label}</label>
                                            <input
                                                type={field.key.includes('Count') ? 'number' : 'text'}
                                                value={newAsset.configuration[field.key] || ''}
                                                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm focus:bg-white/10 transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                            >
                                {isSaving ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span> : <CheckCircle className="w-5 h-5" />}
                                Save Asset to Directory
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Assign Modal */}
            <AnimatePresence>
                {showAssignModal && selectedAsset && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAssignModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gray-900 border border-white/10 p-6 rounded-2xl shadow-xl w-full max-w-md relative z-10"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Update Asset Status</h2>
                            <p className="text-gray-400 mb-6 font-mono text-sm">{selectedAsset.name} ({selectedAsset.serialNumber})</p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Target Status</label>
                                    <select
                                        value={assignStatus}
                                        onChange={(e) => setAssignStatus(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        {STATUSES.map(s => (
                                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                {assignStatus === 'ASSIGNED' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 mt-4">Assign To Employee</label>
                                        <select
                                            value={assignedToId}
                                            onChange={(e) => setAssignedToId(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="">Select Employee...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                                            ))}
                                        </select>
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssign}
                                    disabled={assignStatus === 'ASSIGNED' && !assignedToId}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssetManagement;
