import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, Send, Paperclip, Smile, MoreVertical, Search, File, X, Minus, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import clsx from "clsx";

const ChatWidget = () => {
    const { user, api } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusForm, setStatusForm] = useState({
        statusMessage: user?.statusMessage || "",
        workLocation: user?.workLocation || "OFFICE",
        shiftStart: user?.shiftStart || "",
        shiftEnd: user?.shiftEnd || ""
    });
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [fileUpload, setFileUpload] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [availableUsers, setAvailableUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize Socket
    useEffect(() => {
        if (!user) return;
        const newSocket = io("http://localhost:3434");
        setSocket(newSocket);

        return () => newSocket.close();
    }, [user]);

    // Fetch Conversations
    const fetchConversations = async () => {
        try {
            const res = await api.get("/chat/conversations");
            setConversations(res.data);
        } catch (err) {
            console.error("Failed to load conversations", err);
        }
    };

    useEffect(() => {
        if (isOpen && api) {
            fetchConversations();
            // Fetch users for search
            if (availableUsers.length === 0) {
                api.get("/employees").then(res => {
                    setAvailableUsers(res.data.filter(u => u.id !== user.id));
                }).catch(err => console.error("Failed to load users", err));
            }
        }
    }, [isOpen, api]);

    // Join Conversation & Fetch Messages
    useEffect(() => {
        if (!socket || !selectedConversation) return;

        socket.emit("join_conversation", selectedConversation.id);

        const fetchMessages = async () => {
            try {
                const res = await api.get(`/chat/conversations/${selectedConversation.id}/messages`);
                setMessages(res.data);
                scrollToBottom();
            } catch (err) {
                console.error("Failed to load messages", err);
            }
        };
        fetchMessages();

        const handleReceiveMessage = (message) => {
            if (message.conversationId === selectedConversation.id) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
            fetchConversations();
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [socket, selectedConversation, api]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !fileUpload) || !selectedConversation) return;

        let fileUrl = null;
        let msgType = 'TEXT';

        if (fileUpload) {
            const formData = new FormData();
            formData.append("file", fileUpload);
            try {
                const uploadRes = await api.post("/chat/upload", formData);
                fileUrl = uploadRes.data.fileUrl;
                msgType = uploadRes.data.type;
            } catch (err) {
                console.error("File upload failed", err);
                return;
            }
        }

        const messageData = {
            conversationId: selectedConversation.id,
            senderId: user.id,
            content: newMessage,
            type: msgType,
            fileUrl: fileUrl
        };

        socket.emit("send_message", messageData);
        setNewMessage("");
        setFileUpload(null);
        setShowEmojiPicker(false);
    };

    const handleEmojiClick = (emojiObject) => {
        setNewMessage((prev) => prev + emojiObject.emoji);
    };

    const startNewChat = async (targetUserId) => {
        // Check if conversation exists locally
        const existing = conversations.find(c => getOtherParticipant(c).id === targetUserId);
        if (existing) {
            setSelectedConversation(existing);
            setSearchQuery("");
            return;
        }

        try {
            const res = await api.post("/chat/conversations", {
                participantIds: [targetUserId],
                type: 'DIRECT'
            });
            const newConv = res.data;
            if (!conversations.find(c => c.id === newConv.id)) {
                setConversations([newConv, ...conversations]);
            }
            setSelectedConversation(newConv);
            setSearchQuery("");
        } catch (err) {
            console.error("Failed to start chat", err);
        }
    };

    const getOtherParticipant = (conversation) => {
        return conversation.participants?.find(p => p.user.id !== user.id)?.user || { name: "Unknown", profilePictureUrl: null };
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-[#1a1a1a] border border-white/20 rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col overflow-hidden mb-4 relative"
                    >
                        {/* Status Modal */}
                        {showStatusModal && (
                            <div className="absolute inset-0 bg-black/90 z-50 p-4 flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-bold">Update Status</h3>
                                    <button onClick={() => setShowStatusModal(false)}><X className="text-white" size={20} /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">Status Message</label>
                                        <input
                                            className="w-full bg-white/10 border border-white/10 rounded p-2 text-white text-sm"
                                            value={statusForm.statusMessage}
                                            onChange={e => setStatusForm({ ...statusForm, statusMessage: e.target.value })}
                                            placeholder="What's happening?"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">Work Location</label>
                                        <div className="flex gap-2">
                                            {['OFFICE', 'REMOTE', 'CLIENT'].map(loc => (
                                                <button
                                                    key={loc}
                                                    onClick={() => setStatusForm({ ...statusForm, workLocation: loc })}
                                                    className={clsx("flex-1 p-2 rounded text-xs font-medium border",
                                                        statusForm.workLocation === loc ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                    )}
                                                >
                                                    {loc}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-gray-400 text-xs block mb-1">Shift Start</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white/10 border border-white/10 rounded p-2 text-white text-sm"
                                                value={statusForm.shiftStart}
                                                onChange={e => setStatusForm({ ...statusForm, shiftStart: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs block mb-1">Shift End</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white/10 border border-white/10 rounded p-2 text-white text-sm"
                                                value={statusForm.shiftEnd}
                                                onChange={e => setStatusForm({ ...statusForm, shiftEnd: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.put("/auth/status", statusForm);
                                                window.location.reload(); // Simple reload to reflect changes in context
                                            } catch (e) { console.error(e); }
                                        }}
                                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded font-bold text-white mt-4"
                                    >
                                        Save Status
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-900/50 to-black border-b border-white/10 shrink-0">
                            <div className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    {selectedConversation ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setSelectedConversation(null)} className="text-gray-400 hover:text-white mr-1">
                                                ←
                                            </button>
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={getOtherParticipant(selectedConversation).profilePictureUrl ? `http://localhost:3434${getOtherParticipant(selectedConversation).profilePictureUrl}` : `https://ui-avatars.com/api/?name=${getOtherParticipant(selectedConversation).name}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-sm">{getOtherParticipant(selectedConversation).name}</h3>
                                                {getOtherParticipant(selectedConversation).statusMessage && (
                                                    <p className="text-[10px] text-gray-400 max-w-[150px] truncate">{getOtherParticipant(selectedConversation).statusMessage}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-white flex items-center gap-2">
                                                <MessageCircle size={18} /> Chat
                                            </h3>
                                            <div onClick={() => setShowStatusModal(true)} className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 mt-1">
                                                <span className={clsx("w-2 h-2 rounded-full",
                                                    user.workLocation === 'REMOTE' ? 'bg-green-500' :
                                                        user.workLocation === 'CLIENT' ? 'bg-yellow-500' : 'bg-blue-500'
                                                )}></span>
                                                {user.statusMessage || "Set Status"}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                        <Minus size={16} />
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto bg-black/20 p-2 relative">
                            {!selectedConversation ? (
                                <div className="space-y-1">
                                    <div className="mb-2 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search people..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                                        />
                                    </div>

                                    {/* Existing Conversations */}
                                    {conversations
                                        .filter(c => getOtherParticipant(c).name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(conv => (
                                            <div
                                                key={conv.id}
                                                onClick={() => setSelectedConversation(conv)}
                                                className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex items-center gap-3 transition"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                                    <img
                                                        src={getOtherParticipant(conv).profilePictureUrl ? `http://localhost:3434${getOtherParticipant(conv).profilePictureUrl}` : `https://ui-avatars.com/api/?name=${getOtherParticipant(conv).name}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-white font-medium text-sm truncate">{getOtherParticipant(conv).name}</h4>
                                                    <p className="text-xs text-gray-400 truncate">{conv.messages?.[0]?.content || "No messages"}</p>
                                                </div>
                                            </div>
                                        ))}

                                    {/* New Users Search Results */}
                                    {searchQuery && availableUsers
                                        .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !conversations.some(c => getOtherParticipant(c).id === u.id))
                                        .map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => startNewChat(u.id)}
                                                className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex items-center gap-3 transition opacity-80 hover:opacity-100"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shrink-0">
                                                    <img
                                                        src={u.profilePictureUrl ? `http://localhost:3434${u.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${u.name}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-white font-medium text-sm truncate">{u.name}</h4>
                                                    <p className="text-xs text-gray-400 truncate">Start new chat</p>
                                                </div>
                                            </div>
                                        ))
                                    }

                                    {conversations.length === 0 && !searchQuery && (
                                        <p className="text-center text-gray-500 mt-10 text-sm">No conversations yet.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 p-2">
                                    {messages.map((msg, i) => (
                                        <div key={msg.id || i} className={clsx("flex", msg.senderId === user.id ? "justify-end" : "justify-start")}>
                                            <div className={clsx(
                                                "max-w-[80%] rounded-2xl p-2 px-3 text-sm",
                                                msg.senderId === user.id ? "bg-purple-600 text-white rounded-br-none" : "bg-white/10 text-gray-200 rounded-bl-none"
                                            )}>
                                                {msg.type === 'IMAGE' && <img src={`http://localhost:3434${msg.fileUrl}`} className="rounded-lg mb-1 max-w-full" />}
                                                {msg.content}
                                                <span className="text-[9px] opacity-60 block text-right mt-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Footer (Input) */}
                        {selectedConversation && (
                            <div className="p-3 bg-black/40 border-t border-white/10">
                                {fileUpload && (
                                    <div className="mb-2 flex items-center gap-2 bg-white/10 p-2 rounded-lg w-fit">
                                        <span className="text-xs text-gray-300 truncate max-w-[200px]">{fileUpload.name}</span>
                                        <button onClick={() => setFileUpload(null)} className="text-gray-400 hover:text-white">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="text-gray-400 hover:text-yellow-400"
                                    >
                                        <Smile size={20} />
                                    </button>
                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-16 left-2 z-50">
                                                <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} width={300} height={350} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-gray-400 hover:text-blue-400"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => setFileUpload(e.target.files[0])}
                                        className="hidden"
                                    />

                                    <input
                                        className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 px-4 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                    />
                                    <button type="submit" disabled={!newMessage.trim() && !fileUpload} className="p-2 bg-purple-600 rounded-full text-white hover:bg-purple-700 disabled:opacity-50">
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Button */}
            <motion.button
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setIsOpen(true);
                    setIsMinimized(false);
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white z-50"
            >
                <MessageSquare size={26} />
            </motion.button>
        </div>
    );
};

export default ChatWidget;
