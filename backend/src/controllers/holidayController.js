const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getHolidays = async (req, res) => {
    try {
        const { year } = req.query;
        let where = { organizationId: req.user.organizationId };

        if (year) {
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${year}-12-31`);
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }

        const holidays = await prisma.holiday.findMany({
            where,
            orderBy: { date: 'asc' }
        });

        res.json(holidays);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.syncHolidays = async (req, res) => {
    try {
        const year = req.body.year || new Date().getFullYear();
        const countryCode = 'IN'; // India

        // Fetch from Nager.Date API
        let data = [];
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);

        if (response.status === 204 || !response.ok) {
            console.log("API returned no content or failed, using fallback.");
            // Fallback for India 2026 (Major Gazetted Holidays)
            if (countryCode === 'IN') {
                data = [
                    { date: `${year}-01-01`, name: "New Year's Day" },
                    { date: `${year}-01-26`, name: "Republic Day" },
                    { date: `${year}-03-04`, name: "Holi" },
                    { date: `${year}-03-21`, name: "Id-ul-Fitr" },
                    { date: `${year}-03-26`, name: "Ram Navami" },
                    { date: `${year}-04-03`, name: "Good Friday" },
                    { date: `${year}-04-14`, name: "Dr. Ambedkar Jayanti" },
                    { date: `${year}-05-01`, name: "Buddha Purnima / Labour Day" },
                    { date: `${year}-08-15`, name: "Independence Day" },
                    { date: `${year}-08-26`, name: "Id-e-Milad" },
                    { date: `${year}-09-04`, name: "Janmashtami" },
                    { date: `${year}-10-02`, name: "Gandhi Jayanti" },
                    { date: `${year}-10-20`, name: "Dussehra" },
                    { date: `${year}-11-08`, name: "Diwali" },
                    { date: `${year}-11-24`, name: "Guru Nanak's Birthday" },
                    { date: `${year}-12-25`, name: "Christmas Day" }
                ];
            }
        } else {
            data = await response.json();
        }

        const organizationId = req.user.organizationId;

        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        // Clear existing PUBLIC holidays for this year to prevent duplicates and fix errors
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        await prisma.holiday.deleteMany({
            where: {
                organizationId,
                type: 'PUBLIC',
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        let count = 0;
        for (const holiday of data) {
            await prisma.holiday.create({
                data: {
                    name: holiday.name,
                    date: new Date(holiday.date),
                    type: 'PUBLIC',
                    organizationId
                }
            });
            count++;
        }

        res.json({ message: `Successfully synced ${count} holidays for ${year}` });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ message: 'Server error during sync' });
    }
};

exports.createHoliday = async (req, res) => {
    try {
        const { name, date, type } = req.body;
        const holiday = await prisma.holiday.create({
            data: {
                name,
                date: new Date(date),
                type,
                organizationId: req.user.organizationId
            }
        });
        res.status(201).json(holiday);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteHoliday = async (req, res) => {
    try {
        await prisma.holiday.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Holiday removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
