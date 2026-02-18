import { useRef, useState } from 'react';
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { Download, Repeat, MapPin, Globe, Droplet, User as UserIcon, Building2 } from "lucide-react";
import html2canvas from "html2canvas";

const VirtualIDCard = ({ user, organization }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const frontRef = useRef(null);
    const backRef = useRef(null);

    if (!user) return null;

    const handleDownload = async () => {
        const downloadSide = async (element, suffix) => {
            if (!element) return;
            const canvas = await html2canvas(element, {
                scale: 3, // HD Quality
                useCORS: true,
                backgroundColor: null
            });
            const link = document.createElement("a");
            link.download = `${user.name.replace(/\s+/g, '_')}_ID_${suffix}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };

        // Temporarily ensure both sides are visible for capture if needed, 
        // but with 3D transform, we might need to handle visibility.
        // For simplicity, we capture the current ref, but ideally we capture both.
        // We will flip to front, capture, flip to back, capture? 
        // Or render invisible clones.
        // Let's rely on the user flipping or just capture the visible one? 
        // User asked "Download button should download ID card in HD +PNG format both front and back."
        // We can force render both off-screen or just handle one by one.
        // Let's try to capture both by momentarily rendering them flat?
        // Actually, let's just capture the refs. If 'back' is hidden via CSS (backface-visibility), html2canvas might miss it.

        // Strategy: We will assume the user wants the downloaded files. 
        // We can clone the nodes, append to body, capture, then remove.

        const capture = async (node, suffix) => {
            const clone = node.cloneNode(true);
            document.body.appendChild(clone);
            // Reset transforms on clone to ensure it's flat and visible
            clone.style.transform = "none";
            clone.style.position = "absolute";
            clone.style.top = "-9999px";
            clone.style.left = "-9999px";
            clone.style.opacity = "1";
            // Ensure backface visibility doesn't hide it
            clone.querySelectorAll('*').forEach(el => el.style.backfaceVisibility = 'visible');

            const canvas = await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: null });
            const link = document.createElement("a");
            link.download = `${user.name}_ID_${suffix}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            document.body.removeChild(clone);
        };

        await capture(frontRef.current, "Front");
        await capture(backRef.current, "Back");
    };

    return (
        <div className="flex flex-col items-center gap-6 perspective-1000">
            <div className="relative w-80 h-[480px] group perspective-1000">
                <motion.div
                    className="w-full h-full relative preserve-3d transition-all duration-700"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* FRONT SIDE */}
                    <div
                        ref={frontRef}
                        className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-gray-900 to-black backface-hidden"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>

                        {/* Header / Logo */}
                        <div className="absolute top-0 w-full h-36 bg-gradient-to-b from-purple-900/90 to-transparent flex flex-col items-center justify-start pt-6 z-10 px-4">
                            {organization?.logoUrl ? (
                                <img src={`http://localhost:3434${organization.logoUrl}`} alt="Logo" className="h-12 object-contain mb-2" />
                            ) : (
                                <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-1 text-center">BIGWIG</h2>
                            )}
                            <span className="text-[10px] text-purple-200 tracking-widest uppercase opacity-80 text-center leading-tight">{organization?.name || "Digital Marketing"}</span>
                        </div>

                        {/* Profile Picture */}
                        <div className="absolute top-28 left-0 right-0 flex justify-center z-20">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-purple-500/30 p-1 bg-black/60 backdrop-blur-md shadow-lg shadow-purple-500/20">
                                    <img
                                        src={user.profilePictureUrl ? `http://localhost:3434${user.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                        alt={user.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-black shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="absolute top-64 w-full text-center px-4 z-10 mt-2">
                            <h1 className="text-2xl font-bold text-white mb-1 truncate drop-shadow-md">{user.name}</h1>
                            <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4">
                                <p className="text-purple-300 font-semibold text-xs uppercase tracking-wider">{user.designation || "Employee"}</p>
                            </div>

                            <div className="flex justify-center gap-2 mb-6 opacity-80">
                                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300">
                                    ID: {user.id.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="absolute bottom-8 w-full flex flex-col items-center z-10">
                            <div className="p-2 bg-white rounded-xl shadow-lg shadow-purple-900/20">
                                <QRCode
                                    value={JSON.stringify({ id: user.id, name: user.name, email: user.email })}
                                    size={70}
                                    fgColor="#3b0764" // dark purple
                                />
                            </div>
                        </div>
                    </div>

                    {/* BACK SIDE */}
                    <div
                        ref={backRef}
                        className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-gray-900 to-black backface-hidden"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay pointer-events-none"></div>

                        <div className="p-6 h-full flex flex-col justify-between relative z-10 text-white">
                            <div className="text-center border-b border-white/10 pb-4">
                                <h3 className="text-lg font-bold tracking-widest text-purple-400 uppercase">Details</h3>
                            </div>

                            <div className="space-y-6 flex-1 py-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-red-500/20 text-red-400"><Droplet size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Blood Group</p>
                                        <p className="font-semibold text-lg">{user.bloodGroup || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><MapPin size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Employee Address</p>
                                        <p className="text-sm text-gray-300 leading-snug">{user.address || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400"><Building2 size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Office Address</p>
                                        <p className="text-sm text-gray-300 leading-snug">{organization?.address || "Bigwig Media, Delhi"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 text-center">
                                <div className="flex items-center justify-center gap-2 text-purple-300 mb-1">
                                    <Globe size={14} />
                                    <span className="text-xs font-medium tracking-wide">{organization?.website || "www.bigwigmedia.in"}</span>
                                </div>
                                <p className="text-[10px] text-gray-500">If found, please return to the office address above.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
                >
                    <Repeat size={16} /> {isFlipped ? "Show Front" : "Show Back"}
                </button>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-900/50"
                >
                    <Download size={16} /> Download Front & Back
                </button>
            </div>
        </div>
    );
};

export default VirtualIDCard;
