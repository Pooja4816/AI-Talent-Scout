const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Extracts technical skills from a given Job Description text.
 * @param {string} jd - The job description text.
 * @returns {Promise<string[]>} - Array of skills in lowercase.
 */
async function extractSkills(jd) {
  try {
    const prompt = `Extract key technical skills from this job description and return ONLY a JSON array of strings representing the skills. Do not include markdown blocks or any other formatting, just the raw JSON array.
Job Description:
${jd}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Safely parse the response in case Gemini includes markdown formatting
    if (text.startsWith('```json')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/```/g, '').trim();
    }

    const skills = JSON.parse(text);
    return skills.map(skill => skill.toLowerCase());
  } catch (error) {
    console.warn("Gemini API Error extracting skills, using local fallback regex.", error.message);
    
    // Local fallback matching common industry targets
    const keywords = [
      "react", "vue", "angular", "node.js", "django", "spring boot", "python", "javascript", 
      "typescript", "java", "c#", ".net", "go", "ruby", "aws", "azure", "gcp", "docker", 
      "kubernetes", "linux", "sql", "mysql", "postgresql", "mongodb", "redis", "html", 
      "css", "tailwind", "sass", "graphql", "machine learning", "tensorflow", "pytorch", 
      "pandas", "numpy", "seo", "ui", "ux", "figma", "excel", "tableau", "swift", "kotlin", "flutter"
    ];
    
    const jdLower = jd.toLowerCase();
    const extracted = keywords.filter(kb => {
      const regex = new RegExp(`\\b${kb.replace('.', '\\.')}\\b`, 'i');
      return regex.test(jdLower);
    });
    
    return extracted.length > 0 ? extracted : ["javascript", "react", "node.js"]; // desperate fallback
  }
}

/**
 * Simulates a recruiter-candidate chat response.
 * @param {string} jd - The job description context.
 * @param {object} candidate - The candidate object.
 * @param {Array} history - Previous chat messages context (optional for demo simplicity).
 * @param {string} message - User (recruiter) message.
 * @returns {Promise<string>} - The simulated candidate's response.
 */
async function simulateChat(jd, candidate, message) {
  try {
    const prompt = `You are a talented software engineer named ${candidate.name} with ${candidate.experience} of experience. 
    You have the following skills: ${candidate.skills.join(', ')}.
    A recruiter is messaging you regarding a job description:
    "${jd}"
    
    The recruiter says: "${message}"
    
    Reply naturally and professionally as the candidate. Keep it concise (1-3 sentences) and relevant to your skills and the role.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error simulating chat:", error);
    return "I am currently experiencing connection issues, but I am very interested in this role!";
  }
}

module.exports = {
  extractSkills,
  simulateChat
};
