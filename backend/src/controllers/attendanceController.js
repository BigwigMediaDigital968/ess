const { PrismaClient } = require('@prisma/client');
const { isWithinOfficeRange, getDistance } = require('../utils/geo');

const prisma = new PrismaClient();

exports.markAttendance = async (req, res) => {
    const { latitude, longitude, address, type } = req.body; // type: OFFICE, WFH
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Check if already marked for today
        const existing = await prisma.attendance.findFirst({
            where: {
                userId,
                date: {
                    gte: today,
                },
            },
        });

        if (existing) {
            if (existing.clockOut) {
                return res.status(400).json({ message: 'Attendance already completed for today' });
            }
            return res.status(400).json({ message: 'Already clocked in. Use clock-out endpoint.' });
        }

        if (type === 'OFFICE') {
            if (!isWithinOfficeRange(latitude, longitude)) {
                return res.status(400).json({ message: 'You are not within office range' });
            }
        } else if (type === 'WFH') {
            const approvedLocation = await prisma.wFHLocation.findFirst({
                where: { userId, status: 'APPROVED' }
            });

            if (!approvedLocation) {
                return res.status(400).json({ message: 'No approved WFH location found' });
            }

            const distance = getDistance(latitude, longitude, approvedLocation.latitude, approvedLocation.longitude);
            if (distance > 0.5) {
                return res.status(400).json({ message: 'You are not at your approved WFH location' });
            }
        }

        // ── Roster auto-validation ──────────────────────────────────────
        let rosterStatus = 'PRESENT';
        let rosterNote = null;

        const todayRoster = await prisma.roster.findUnique({
            where: { userId_date: { userId, date: today } },
            include: { shift: true }
        });

        if (todayRoster && todayRoster.shift) {
            const now = new Date();
            const [shiftH, shiftM] = todayRoster.shift.startTime.split(':').map(Number);
            const shiftStart = new Date(now);
            shiftStart.setHours(shiftH, shiftM, 0, 0);

            const graceMinutes = 15; // 15-minute grace period
            const lateThreshold = new Date(shiftStart.getTime() + graceMinutes * 60000);

            if (now > lateThreshold) {
                const lateBy = Math.round((now - shiftStart) / 60000);
                rosterStatus = 'LATE';
                rosterNote = `Late by ${lateBy} minutes (shift: ${todayRoster.shift.startTime})`;

                // Notify manager
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, managerId: true }
                });
                if (user && user.managerId) {
                    console.log(`[NOTIFICATION] ${user.name} is late by ${lateBy}m. Manager: ${user.managerId}`);
                    // TODO: Send real-time notification via Socket.IO
                }
            }
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId,
                clockIn: new Date(),
                latitude,
                longitude,
                address,
                type,
                status: rosterStatus,
                date: new Date()
            },
        });

        res.status(201).json({
            ...attendance,
            rosterNote,
            shift: todayRoster?.shift || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.clockOut = async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        const attendance = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: today },
                clockOut: null
            },
        });

        if (!attendance) {
            return res.status(400).json({ message: 'No active check-in found for today' });
        }

        const updated = await prisma.attendance.update({
            where: { id: attendance.id },
            data: { clockOut: new Date() },
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyAttendance = async (req, res) => {
    try {
        const attendance = await prisma.attendance.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
