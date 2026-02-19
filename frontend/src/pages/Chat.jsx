import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../utils/config";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, Send, Paperclip, Smile, MoreVertical, Search, File, Image as ImageIcon, X, Plus, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import clsx from "clsx";
import SalarySlipWidget from "../components/SalarySlipWidget";

const Chat = () => {
    const { user, api } = useAuth();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [fileUpload, setFileUpload] = useState(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize Socket
    useEffect(() => {
        const newSocket = io("${API_BASE_URL}");
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

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
        if (api) fetchConversations();
    }, [api]);

    // Fetch Available Users for New Chat
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/employees");
                setAvailableUsers(res.data.filter(u => u.id !== user.id));
            } catch (err) {
                console.error("Failed to load users", err);
            }
        };
        if (showNewChatModal) fetchUsers();
    }, [showNewChatModal, api, user.id]);

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
                setMessages((prev) => {
                    // Check if exists (Update case)
                    const exists = prev.find(m => m.id === message.id);
                    if (exists) {
                        return prev.map(m => m.id === message.id ? message : m);
                    }
                    return [...prev, message];
                });
                scrollToBottom();
            }
            fetchConversations(); // Refresh list to show latest message preview
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [socket, selectedConversation, api]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        try {
            const res = await api.post("/chat/conversations", {
                participantIds: [targetUserId],
                type: 'DIRECT'
            });
            const newConv = res.data;
            // Check if already in list
            if (!conversations.find(c => c.id === newConv.id)) {
                setConversations([newConv, ...conversations]);
            }
            setSelectedConversation(newConv);
            setShowNewChatModal(false);
        } catch (err) {
            console.error("Failed to start chat", err);
        }
    };

    const handleApprovalAction = async (leaveId, status) => {
        console.log("Attempting Approval Action:", { leaveId, status });
        if (!leaveId) {
            alert("Error: Missing Leave ID reference in message.");
            return;
        }
        try {
            // Assume we know it is a Leave. 
            // Ideally check 'type' but we only have generic referenceId.
            // Since we built it for Leaves, we call leaves API.
            const res = await api.put(`/leaves/${leaveId}`, { status });
            console.log("Approval Success:", res.data);
            // The socket update will handle the UI refresh.
        } catch (err) {
            console.error("Approval Action Failed:", err);
            alert(`Approval Action Failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const getOtherParticipant = (conversation) => {
        return conversation.participants?.find(p => p.user.id !== user.id)?.user || { name: "Unknown", profilePictureUrl: null };
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-4 relative">
            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNewChatModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 m-auto w-full max-w-md h-fit max-h-[80vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">New Message</h3>
                                <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {availableUsers.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => startNewChat(u.id)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                            {u.profilePictureUrl ? (
                                                <img src={`${API_BASE_URL}${u.profilePictureUrl}`} alt={u.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-white">{u.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{u.name}</h4>
                                            <p className="text-xs text-gray-400">{u.designation || "Employee"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar List */}
            <div className="w-80 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">Messages</h2>
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.map((conv) => {
                        const otherUser = getOtherParticipant(conv);
                        return (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={clsx(
                                    "p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3",
                                    selectedConversation?.id === conv.id
                                        ? "bg-white/10 border border-white/10 shadow-lg"
                                        : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center overflow-hidden">
                                        {otherUser.profilePictureUrl ? (
                                            <img src={`${API_BASE_URL}${otherUser.profilePictureUrl}`} alt={otherUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-white">{otherUser.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{otherUser.name}</h3>
                                    <p className="text-xs text-gray-400 truncate">
                                        {conv.messages?.[0]?.content || (conv.messages?.[0]?.fileUrl ? "Sent a file" : "No messages yet")}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col overflow-hidden relative">
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center overflow-hidden">
                                    {getOtherParticipant(selectedConversation).profilePictureUrl ? (
                                        <img src={`${API_BASE_URL}${getOtherParticipant(selectedConversation).profilePictureUrl}`} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-white">{getOtherParticipant(selectedConversation).name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold">{getOtherParticipant(selectedConversation).name}</h3>
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online
                                    </span>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === user.id;
                                return (
                                    <div key={msg.id} className={clsx("flex", isMe ? "justify-end" : "justify-start")}>
                                        <div className={clsx(
                                            "max-w-[70%] rounded-2xl p-3 relative group",
                                            isMe ? "bg-violet-600 text-white rounded-br-none" : "bg-white/10 text-gray-200 rounded-bl-none"
                                        )}>
                                            {msg.type === 'IMAGE' && (
                                                <img src={`${API_BASE_URL}${msg.fileUrl}`} alt="Shared" className="rounded-lg mb-2 max-w-full" />
                                            )}
                                            {msg.type === 'FILE' && (
                                                <a href={`${API_BASE_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/20 p-2 rounded-lg hover:bg-black/30 transition-colors">
                                                    <File className="w-4 h-4" />
                                                    <span className="text-sm underline">Download File</span>
                                                </a>
                                            )}
                                            {msg.type === 'APPROVAL_REQUEST' && (
                                                <div className="bg-black/20 p-3 rounded-lg mb-2 border border-white/10">
                                                    <p className="font-bold text-yellow-400 mb-1">APPROVAL REQUEST</p>
                                                    <p className="mb-3 text-sm">{msg.content}</p>
                                                    <div className="flex gap-2">
                                                        {msg.approvalStatus === 'PENDING' && !isMe ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprovalAction(msg.referenceId, 'APPROVED')}
                                                                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 text-xs font-bold"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprovalAction(msg.referenceId, 'REJECTED')}
                                                                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs font-bold"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className={clsx(
                                                                "text-xs font-bold px-2 py-1 rounded",
                                                                msg.approvalStatus === 'APPROVED' ? "bg-green-500/20 text-green-400" :
                                                                    msg.approvalStatus === 'REJECTED' ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                                                            )}>
                                                                {msg.approvalStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Salary Slip Widget — detect slip link in message */}
                                            {(() => {
                                                const slipMatch = msg.content?.match(/\/api\/salary\/slip-pdf\?month=(\d+)&year=(\d+)&userId=([\w-]+)/);
                                                if (slipMatch) {
                                                    return (
                                                        <div className="mt-2">
                                                            <SalarySlipWidget
                                                                api={api}
                                                                month={parseInt(slipMatch[1])}
                                                                year={parseInt(slipMatch[2])}
                                                                userId={slipMatch[3]}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            {msg.type !== 'APPROVAL_REQUEST' && msg.content && !msg.content.match(/\/api\/salary\/slip-pdf/) && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                            <span className="text-[10px] opacity-70 mt-1 block text-right">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            {fileUpload && (
                                <div className="mb-2 flex items-center gap-2 bg-white/10 p-2 rounded-lg w-fit">
                                    <span className="text-xs text-gray-300 truncate max-w-[200px]">{fileUpload.name}</span>
                                    <button onClick={() => setFileUpload(null)} className="text-gray-400 hover:text-white">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-yellow-400 transition-colors"
                                    >
                                        <Smile className="w-6 h-6" />
                                    </button>
                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute bottom-12 left-0 z-50"
                                            >
                                                <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <Paperclip className="w-6 h-6" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => setFileUpload(e.target.files[0])}
                                    className="hidden"
                                />

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                />

                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() && !fileUpload}
                                    className="p-2 bg-violet-600 hover:bg-violet-700 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 opacity-50" />
                        </div>
                        <p className="text-lg font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
