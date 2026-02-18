/**
 * TAS Mock Data Seeder
 * Run: docker exec ess_backend node /app/seed_tas_data.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding TAS mock data...');

    // Find the first open job posting
    const job = await prisma.jobPosting.findFirst({ where: { status: 'OPEN' } });
    if (!job) {
        console.error('❌ No open job posting found. Please create one first via the UI.');
        process.exit(1);
    }
    console.log(`✅ Using job: "${job.title}" (${job.id})`);

    const mockCandidates = [
        {
            firstName: 'Priya', lastName: 'Sharma',
            email: 'priya.sharma.tas@example.com', phone: '9876543210',
            experienceYears: 6, skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL'],
            targetStatus: 'APPLIED', aiScore: 88
        },
        {
            firstName: 'Arjun', lastName: 'Mehta',
            email: 'arjun.mehta.tas@example.com', phone: '9123456780',
            experienceYears: 4, skills: ['Vue.js', 'JavaScript', 'Python', 'Docker'],
            targetStatus: 'INTERVIEW', aiScore: 74
        },
        {
            firstName: 'Sneha', lastName: 'Kapoor',
            email: 'sneha.kapoor.tas@example.com', phone: '9988776655',
            experienceYears: 8, skills: ['React', 'Redux', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
            targetStatus: 'OFFER', aiScore: 95
        }
    ];

    for (const mock of mockCandidates) {
        // Upsert candidate
        let candidate = await prisma.candidate.findUnique({ where: { email: mock.email } });
        if (!candidate) {
            candidate = await prisma.candidate.create({
                data: {
                    firstName: mock.firstName, lastName: mock.lastName,
                    email: mock.email, phone: mock.phone,
                    experienceYears: mock.experienceYears,
                    skills: mock.skills
                }
            });
            console.log(`  👤 Created candidate: ${candidate.firstName} ${candidate.lastName}`);
        } else {
            console.log(`  👤 Candidate already exists: ${candidate.firstName} ${candidate.lastName}`);
        }

        // Check if already applied
        const existingApp = await prisma.application.findFirst({
            where: { jobId: job.id, candidateId: candidate.id }
        });
        if (existingApp) {
            console.log(`  ⏭️  Application already exists for ${candidate.firstName}, skipping.`);
            continue;
        }

        // Create application
        const application = await prisma.application.create({
            data: {
                jobId: job.id,
                candidateId: candidate.id,
                status: mock.targetStatus === 'APPLIED' ? 'APPLIED' : mock.targetStatus,
                aiScore: mock.aiScore
            }
        });
        console.log(`  📋 Created application (${mock.targetStatus}) for ${candidate.firstName}`);

        // For INTERVIEW and OFFER stages, create a completed assessment
        if (['INTERVIEW', 'OFFER'].includes(mock.targetStatus)) {
            const assessment = await prisma.assessment.create({
                data: {
                    applicationId: application.id,
                    type: 'TECHNICAL',
                    questions: [
                        { question: 'Explain React hooks', type: 'text' },
                        { question: 'What is the virtual DOM?', type: 'text' }
                    ],
                    responses: ['React hooks allow functional components to use state and lifecycle features...', 'The virtual DOM is a lightweight in-memory representation of the real DOM...'],
                    score: mock.aiScore,
                    status: 'COMPLETED',
                    analysisReport: `## Assessment Analysis Report\n\n**Candidate:** ${mock.firstName} ${mock.lastName}\n**Score:** ${mock.aiScore}/100\n\n### Strengths\n- Strong understanding of React ecosystem\n- ${mock.experienceYears} years of relevant experience\n- Demonstrated knowledge of modern JavaScript patterns\n\n### Areas for Improvement\n- Could elaborate more on system design\n- Testing strategies could be stronger\n\n### Recommendation\n${mock.aiScore >= 80 ? '✅ **SHORTLIST** - Strong candidate, recommend proceeding to offer stage.' : '⚠️ **CONSIDER** - Decent candidate, may need further evaluation.'}`
                }
            });
            console.log(`  📝 Created completed assessment for ${candidate.firstName}`);
        }

        // For OFFER stage, create an offer
        if (mock.targetStatus === 'OFFER') {
            const joiningDate = new Date();
            joiningDate.setDate(joiningDate.getDate() + 30); // Joining in 30 days

            await prisma.offer.create({
                data: {
                    applicationId: application.id,
                    basicSalary: 120000,
                    allowances: 30000,
                    joiningDate: joiningDate,
                    status: 'GENERATED'
                }
            });
            console.log(`  🎉 Created offer for ${candidate.firstName}`);
        }
    }

    console.log('\n✅ TAS mock data seeded successfully!');
    console.log(`   Open http://localhost:5173/talent/job/${job.id} to see the pipeline.`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
