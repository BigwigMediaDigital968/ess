// Mock AI Service for Resume Parsing, Scoring and Test Generation

// Pre-defined question bank for various roles
const questionBank = {
    "Developer": [
        { q: "What is the difference between var, let, and const in JavaScript?", type: "TECHNICAL", difficulty: "EASY" },
        { q: "Explain the concept of closures.", type: "TECHNICAL", difficulty: "MEDIUM" },
        { q: "How does the virtual DOM work in React?", type: "TECHNICAL", difficulty: "HARD" },
        { q: "Describe a challenging bug you fixed.", type: "BEHAVIORAL", difficulty: "MEDIUM" }
    ],
    "DevOps": [
        { q: "What is the difference between Docker and Virtual Machines?", type: "TECHNICAL", difficulty: "EASY" },
        { q: "Explain the CI/CD pipeline stages.", type: "TECHNICAL", difficulty: "MEDIUM" },
        { q: "How do you handle secrets in Kubernetes?", type: "TECHNICAL", difficulty: "HARD" }
    ],
    "SEO": [
        { q: "What are the key factors for on-page SEO?", type: "TECHNICAL", difficulty: "EASY" },
        { q: "How do you handle a sudden drop in traffic?", type: "TECHNICAL", difficulty: "MEDIUM" },
        { q: "Explain the importance of backlinks.", type: "TECHNICAL", difficulty: "MEDIUM" }
    ],
    "UI/UX": [
        { q: "Difference between UI and UX?", type: "TECHNICAL", difficulty: "EASY" },
        { q: "Explain the Design Thinking process.", type: "TECHNICAL", difficulty: "MEDIUM" },
        { q: "How do you conduct user testing?", type: "TECHNICAL", difficulty: "HARD" }
    ],
    "DBA": [
        { q: "Difference between SQL and NoSQL?", type: "TECHNICAL", difficulty: "EASY" },
        { q: "How do you optimize a slow query?", type: "TECHNICAL", difficulty: "MEDIUM" },
        { q: "Explain ACID properties.", type: "TECHNICAL", difficulty: "MEDIUM" }
    ],
    "Project Manager": [
        { q: "Explain Agile methodology.", type: "TECHNICAL", difficulty: "EASY" },
        { q: "How do you handle scope creep?", type: "BEHAVIORAL", difficulty: "MEDIUM" },
        { q: "Describe a conflict resolution scenario.", type: "BEHAVIORAL", difficulty: "HARD" }
    ],
    "General": [
        { q: "Tell me about yourself.", type: "BEHAVIORAL", difficulty: "EASY" },
        { q: "Why do you want to join us?", type: "BEHAVIORAL", difficulty: "EASY" }
    ]
};

exports.parseResume = async (filePath) => {
    // Simulator: meaningful skills extraction based on file name or random
    // In real world: Use Textract / PDFParse / OpenAI

    // For demo: return random skills or common ones
    const commonSkills = ["JavaScript", "React", "Node.js", "Python", "AWS", "Communication"];
    const parsedSkills = commonSkills.filter(() => Math.random() > 0.5);

    // Ensure at least one skill
    if (parsedSkills.length === 0) parsedSkills.push("JavaScript");

    return {
        text: "Simulated resume text...",
        skills: parsedSkills,
        experienceYears: Math.floor(Math.random() * 10) + 1
    };
};

exports.scoreApplication = async (jobDescription, candidateSkills, candidateExp) => {
    // Logic: Match candidate skills against keywords in Job Desc
    // Normalized score 0-100

    if (!candidateSkills || candidateSkills.length === 0) return 10;

    const jobKeywords = jobDescription.toLowerCase().split(/\W+/);
    let matchCount = 0;

    // Handle string or array skills
    const skillsArray = Array.isArray(candidateSkills) ? candidateSkills : candidateSkills.split(',').map(s => s.trim());

    skillsArray.forEach(skill => {
        if (jobKeywords.includes(skill.toLowerCase())) {
            matchCount++;
        }
    });

    // Experience Factor
    let score = (matchCount / (skillsArray.length || 1)) * 60; // Base score from skills (max 60)

    // Experience Bonus (max 40)
    if (candidateExp > 5) score += 40;
    else if (candidateExp > 2) score += 20;
    else score += 10;

    return Math.min(Math.round(score), 100);
};

exports.generateAnalysis = async (responses) => {
    // Mock Analysis Generation based on responses
    // responses: [{ q: "...", a: "..." }]

    // Simple logic: Length of answer = better? (Mock)
    let feedback = "Candidate Analysis Report:\n\n";
    let scoreAccumulator = 0;

    responses.forEach((item, index) => {
        const answer = item.a || "";
        feedback += `Q${index + 1}: ${item.q.q}\n`;
        feedback += `Answer quality: ${answer.length > 20 ? "Detailed and structured." : "Brief, could be more elaborate."}\n`;

        if (answer.toLowerCase().includes("react") || answer.toLowerCase().includes("node") || answer.length > 50) {
            scoreAccumulator += 20;
            feedback += "Key concepts identified correctly.\n";
        } else {
            scoreAccumulator += 10;
        }
        feedback += "\n";
    });

    const finalScore = Math.min(scoreAccumulator, 100);
    feedback += `\nOverall Assessment:\nThe candidate demonstrates a ${finalScore > 70 ? "strong" : "moderate"} understanding of the core concepts. Recommended for ${finalScore > 70 ? "next round" : "further review"}.`;

    return { report: feedback, score: finalScore };
};

exports.generateAssessment = async (role) => {
    // AI Question Generation
    // Returns a set of questions based on Role

    // Normalize role to keys
    let key = "General";
    if (role.toLowerCase().includes("dev") || role.toLowerCase().includes("engineer")) key = "Developer";
    else if (role.toLowerCase().includes("ops")) key = "DevOps";
    else if (role.toLowerCase().includes("seo")) key = "SEO";
    else if (role.toLowerCase().includes("ui") || role.toLowerCase().includes("design")) key = "UI/UX";
    else if (role.toLowerCase().includes("data") || role.toLowerCase().includes("dba")) key = "DBA";
    else if (role.toLowerCase().includes("manager") || role.toLowerCase().includes("pm")) key = "Project Manager";

    const specializedQuestions = questionBank[key] || questionBank["General"];
    const generalQuestions = questionBank["General"];

    return [...specializedQuestions, ...generalQuestions];
};
