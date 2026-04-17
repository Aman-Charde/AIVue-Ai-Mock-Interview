import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Used as fallback when Gemini API key is unavailable
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_QUESTIONS = {
  default: [
    "Can you walk me through your professional background and what led you to apply for this role?",
    "Describe a technically challenging problem you encountered in a recent project. How did you analyze and resolve it?",
    "How do you prioritize tasks when working on multiple deadlines simultaneously? Give a real example.",
    "Tell me about a time you had a conflict with a team member and how you handled it.",
    "Where do you see your career progressing in the next five years?",
    "Describe a time when you received constructive criticism. How did you respond?",
    "What motivated you to learn the technologies you currently use?"
  ],
  "Frontend Developer": [
    "Explain the difference between controlled and uncontrolled components in React. When would you use each?",
    "How do you optimize a React application that has slow rendering due to large lists?",
    "What are CSS specificity rules and how do you manage styling conflicts in large-scale projects?",
    "Describe how you ensure web accessibility (a11y) in your frontend development.",
    "How do you manage state in a complex React application?",
    "What is your approach to responsive design and mobile-first development?",
    "Can you explain the virtual DOM and how React uses it for performance?"
  ],
  "Backend Developer": [
    "What is the difference between SQL and NoSQL databases? When would you choose one over the other?",
    "How would you design a RESTful API for a banking system? Walk me through security considerations.",
    "Explain the concept of middleware in Express.js with a real example.",
    "How do you implement rate limiting and prevent DDoS attacks on your API?",
    "Discuss caching strategies you would use to improve database read performance.",
    "Explain how you handle asynchronous background tasks in Node.js.",
    "What authentication strategies do you prefer for microservices architectures?"
  ],
  "Full Stack Developer": [
    "How do you handle authentication in a MERN stack application? Describe your JWT implementation approach.",
    "What strategies do you use to keep the frontend and backend in sync during rapid development?",
    "Describe your approach to debugging an issue where the API returns data but the UI doesn't update.",
    "How do you handle continuous integration and deployment (CI/CD) in your projects?",
    "Explain how you design database schemas across relational and non-relational boundaries.",
    "What measures do you take to secure both the client side and server side of an application?",
    "How do you balance time between frontend styling and backend architecture?"
  ],
  "Data Scientist": [
    "What is overfitting in machine learning and how do you prevent it?",
    "Explain the difference between supervised and unsupervised learning with examples.",
    "How do you handle missing data in a dataset before training a model?",
    "Describe precision and recall. Which metric is more important for a medical diagnosis model?",
    "What techniques do you use for feature engineering and selection?",
    "Explain the concept of cross-validation and why it's useful.",
    "How would you explain a complex machine learning model to a non-technical stakeholder?"
  ],
};

const getMockQuestions = (jobRole, domain, difficulty, interviewType) => {
  const byRole = MOCK_QUESTIONS[jobRole] || MOCK_QUESTIONS["default"];
  return byRole;
};

const getMockEvaluation = (question, answer) => {
  const length = answer?.trim().length || 0;

  if (length < 30) {
    return {
      score: 3,
      clarity: 4,
      confidence: 3,
      communication_skills: 3,
      technical_accuracy: 2,
      feedback:
        "Your answer is too brief. Interviewers expect detailed, well-structured responses that demonstrate your understanding and experience.",
      improvements: [
        "Expand your answer with specific examples from past experience.",
        "Use the STAR method: Situation, Task, Action, Result.",
        "Mention relevant technical tools or frameworks you used.",
      ],
    };
  }

  if (length < 100) {
    return {
      score: 6,
      clarity: 6,
      confidence: 6,
      communication_skills: 5,
      technical_accuracy: 6,
      feedback:
        "Your answer covers the basics but lacks depth. Adding concrete examples and technical specifics would strengthen your response significantly.",
      improvements: [
        "Include specific technologies or methodologies you used.",
        "Quantify your impact where possible (e.g., reduced load time by 40%).",
        "Structure your response with a clear beginning, middle, and conclusion.",
      ],
    };
  }

  return {
    score: 8,
    clarity: 8,
    confidence: 7,
    communication_skills: 8,
    technical_accuracy: 8,
    feedback:
      "Good response! You demonstrated a solid understanding of the topic. Your answer is well-structured and shows relevant experience. Minor improvements in specificity would make it excellent.",
    improvements: [
      "Add measurable outcomes to make your example more impactful.",
      "Consider mentioning how you would approach this differently with hindsight.",
    ],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate Interview Questions
 * Tries Gemini API first — falls back to hardcoded questions if it fails.
 */
export const generateQuestions = async (jobRole, domain, difficulty, interviewType) => {
  try {
    // Attempt live API call
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are an expert HR and Technical Interviewer.
Generate exactly 7 professional interview questions for a ${jobRole} role in the ${domain} domain.
Difficulty: ${difficulty}, Interview Type: ${interviewType}.
Return ONLY a valid JSON array, no explanation, no markdown:
["Question 1", "Question 2", "Question 3", "Question 4", "Question 5", "Question 6", "Question 7"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const rawText = typeof response.text === "function" ? response.text() : response.text;
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    console.log("✅ Gemini questions generated successfully");
    return parsed;
  } catch (error) {
    console.warn("⚠️  Gemini API unavailable — using hardcoded questions:", error.message);
    return getMockQuestions(jobRole, domain, difficulty, interviewType);
  }
};

/**
 * Evaluate User Answer
 * Tries Gemini API first — falls back to rule-based hardcoded evaluation if it fails.
 */
export const evaluateAnswer = async (question, answer, jobRole, domain) => {
  try {
    // Attempt live API call
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are a senior ${jobRole} interviewer evaluating a candidate's response.
Role: ${jobRole} | Domain: ${domain}
Question: ${question}
Answer: ${answer}

Return ONLY valid JSON with no markdown:
{
  "score": <number 0-10>,
  "clarity": <number 0-10 for clarity of thought>,
  "confidence": <number 0-10 based on language confidence>,
  "communication_skills": <number 0-10 for overall communication>,
  "technical_accuracy": <number 0-10 for technical correctness>,
  "feedback": "<2-3 sentences of honest feedback analyzing these areas>",
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const rawText = typeof response.text === "function" ? response.text() : response.text;
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    console.log("✅ Gemini evaluation completed successfully");
    return parsed;
  } catch (error) {
    console.warn("⚠️  Gemini API unavailable — using rule-based evaluation:", error.message);
    return getMockEvaluation(question, answer);
  }
};