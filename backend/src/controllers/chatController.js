const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, profilePictureUrl: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: { id: true, name: true, profilePictureUrl: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createConversation = async (req, res) => {
    const { participantIds, type, name } = req.body; // participantIds is array of userIds (excluding creator usually, or explicitly provided)
    const creatorId = req.user.id;

    try {
        let conversation;
        const allParticipants = [...new Set([...participantIds, creatorId])];

        if (type === 'DIRECT' && participantIds.length === 1) {
            // Check if direct conversation already exists
            const existing = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    participants: {
                        every: { userId: { in: allParticipants } }
                    }
                },
                include: { participants: true } // Need to check count strictly
            });

            // Strict check: counts must match because 'every' logic can be tricky
            if (existing && existing.participants.length === 2) {
                return res.json(existing);
            }
        }

        conversation = await prisma.conversation.create({
            data: {
                type: type || 'DIRECT',
                name: name,
                participants: {
                    create: allParticipants.map(id => ({ userId: id }))
                }
            },
            include: {
                participants: {
                    include: { user: true }
                }
            }
        });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, type: req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE' });
};
