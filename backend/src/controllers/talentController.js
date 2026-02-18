const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('../services/aiService');

// --- JOB MANAGEMENT ---

exports.createJob = async (req, res) => {
    try {
        const { title, description, departmentId, type, salaryRange, requirements, location } = req.body;
        const job = await prisma.jobPosting.create({
            data: {
                title, description, departmentId, type, salaryRange, requirements, location,
                postedBy: req.user.id
            }
        });
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getJobs = async (req, res) => {
    try {
        const jobs = await prisma.jobPosting.findMany({
            include: { department: true, applications: { select: { id: true, status: true } } }
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const job = await prisma.jobPosting.findUnique({
            where: { id: req.params.id },
            include: {
                department: true,
                applications: {
                    include: {
                        candidate: true,
                        assessments: true,
                        offers: true
                    }
                }
            }
        });
        if (!job) return res.status(404).json({ message: "Job not found" });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CANDIDATE & APPLICATION ---

exports.getCandidates = async (req, res) => {
    try {
        const candidates = await prisma.candidate.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.applyToJob = async (req, res) => {
    try {
        const { jobId, firstName, lastName, email, phone, experienceYears, skills } = req.body;
        // Handle File
        const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;

        // Parse skills: Prisma expects String[] not a plain string
        const parseSkills = (raw) => {
            if (!raw) return [];
            if (Array.isArray(raw)) return raw.map(s => s.trim()).filter(Boolean);
            return raw.split(',').map(s => s.trim()).filter(Boolean);
        };
        const skillsArray = parseSkills(skills);

        // Find or Create Candidate
        let candidate = await prisma.candidate.findUnique({ where: { email } });
        if (!candidate) {
            candidate = await prisma.candidate.create({
                data: {
                    firstName, lastName, email, phone,
                    experienceYears: parseInt(experienceYears) || 0,
                    skills: skillsArray,
                    resumeUrl
                }
            });
        } else {
            candidate = await prisma.candidate.update({
                where: { id: candidate.id },
                data: {
                    resumeUrl: resumeUrl || candidate.resumeUrl,
                    experienceYears: parseInt(experienceYears) || candidate.experienceYears,
                    skills: skillsArray.length > 0 ? skillsArray : candidate.skills
                }
            });
        }

        const existingApp = await prisma.application.findFirst({
            where: { jobId, candidateId: candidate.id }
        });
        if (existingApp) return res.status(400).json({ message: "Already applied" });

        // AI Scoring
        const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });

        let finalSkills = candidate.skills;
        const aiScore = await aiService.scoreApplication(
            job.description + " " + (job.requirements || ""),
            finalSkills,
            candidate.experienceYears
        );

        const application = await prisma.application.create({
            data: {
                jobId,
                candidateId: candidate.id,
                status: 'APPLIED',
                aiScore: aiScore
            }
        });

        res.status(201).json(application);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await prisma.application.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(application);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ASSESSMENT ---

exports.generateAssessment = async (req, res) => {
    try {
        const { applicationId } = req.body;
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: true }
        });

        if (!application) return res.status(404).json({ message: "Application not found" });

        const questions = await aiService.generateAssessment(application.job.title);

        const assessment = await prisma.assessment.create({
            data: {
                applicationId,
                type: 'TECHNICAL',
                questions: questions,
                status: 'PENDING'
            }
        });

        await prisma.application.update({
            where: { id: applicationId },
            data: { status: 'ASSESSMENT' }
        });

        res.status(201).json(assessment);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAssessment = async (req, res) => {
    try {
        const assessment = await prisma.assessment.findUnique({
            where: { id: req.params.id }
        });
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.submitAssessment = async (req, res) => {
    try {
        const { responses } = req.body;
        const assessment = await prisma.assessment.findUnique({
            where: { id: req.params.id }
        });

        const { report, score } = await aiService.generateAnalysis(responses);

        const updated = await prisma.assessment.update({
            where: { id: req.params.id },
            data: {
                responses,
                score,
                analysisReport: report,
                status: 'COMPLETED'
            }
        });

        // Auto-move application to INTERVIEW stage after assessment completion
        await prisma.application.update({
            where: { id: assessment.applicationId },
            data: { status: 'INTERVIEW' }
        });

        res.json(updated);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- INTERVIEWS ---
exports.scheduleInterview = async (req, res) => {
    try {
        const { applicationId, interviewerId, scheduledAt, round } = req.body;
        const interview = await prisma.interview.create({
            data: {
                applicationId,
                interviewerId,
                scheduledAt: new Date(scheduledAt),
                round: round || "Technical"
            }
        });

        await prisma.application.update({
            where: { id: applicationId },
            data: { status: 'INTERVIEW' }
        });

        res.status(201).json(interview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- OFFERS ---

exports.generateOffer = async (req, res) => {
    try {
        const { applicationId, basicSalary, allowances, joiningDate } = req.body;

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { candidate: true, job: true }
        });
        if (!application) return res.status(404).json({ message: "Application not found" });

        const existingOffer = await prisma.offer.findFirst({ where: { applicationId } });
        if (existingOffer) return res.status(400).json({ message: "Offer already generated for this application" });

        const offer = await prisma.offer.create({
            data: {
                applicationId,
                basicSalary: parseFloat(basicSalary),
                allowances: parseFloat(allowances) || 0,
                joiningDate: new Date(joiningDate),
                status: 'GENERATED'
            }
        });

        await prisma.application.update({
            where: { id: applicationId },
            data: { status: 'OFFER' }
        });

        res.status(201).json(offer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getOfferByApplication = async (req, res) => {
    try {
        const offer = await prisma.offer.findFirst({
            where: { applicationId: req.params.applicationId },
            include: {
                application: {
                    include: { candidate: true, job: true }
                }
            }
        });
        if (!offer) return res.status(404).json({ message: "No offer found" });
        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOfferStatus = async (req, res) => {
    try {
        const { status } = req.body; // SENT | ACCEPTED | REJECTED
        const offer = await prisma.offer.update({
            where: { id: req.params.id },
            data: { status }
        });

        // If accepted, mark application as HIRED
        if (status === 'ACCEPTED') {
            await prisma.application.update({
                where: { id: offer.applicationId },
                data: { status: 'HIRED' }
            });
        }
        // If rejected, mark application as REJECTED
        if (status === 'REJECTED') {
            await prisma.application.update({
                where: { id: offer.applicationId },
                data: { status: 'REJECTED' }
            });
        }

        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
