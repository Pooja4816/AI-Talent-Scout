import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Score a candidate against a job description using AI
 * @param {object} candidate - Candidate profile object
 * @param {string} jd - Job description text
 * @returns {Promise<object>} - Scoring result with match percentage and reasoning
 */
export async function aiScoreCandidate(candidate, jd) {
  try {
    const candidateProfile = `
Name: ${candidate.name || 'N/A'}
Role: ${candidate.role || 'N/A'}
Company: ${candidate.company || 'N/A'}
Skills: ${Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills || 'N/A'}
Experience: ${candidate.experience || 'N/A'}
Bio: ${candidate.bio || 'N/A'}
`;

    const prompt = `You are an expert recruiter. Score the following candidate against this job description.
    
CANDIDATE PROFILE:
${candidateProfile}

JOB DESCRIPTION:
${jd}

Provide your response in this exact JSON format (no markdown, just pure JSON):
{
  "matchScore": <0-100 number>,
  "roleMatch": <true/false>,
  "skillsMatch": <true/false>,
  "matchedSkills": [<list of matching skills>],
  "reasoning": "<brief explanation of the match>",
  "strengths": [<list of 2-3 key strengths>],
  "gaps": [<list of any skill gaps if any>]
}

Be thorough but fair in your evaluation. Consider role relevance, skill alignment, and experience level.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Remove markdown formatting if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(responseText);
    
    // Normalize the score to be between 0-100
    const matchScore = Math.min(100, Math.max(0, parsed.matchScore || 0));
    
    // Calculate interest score based on match quality
    const interestScore = Math.min(95, Math.max(60, matchScore * 0.85 + 15));

    return {
      ...parsed,
      matchScore: Math.round(matchScore),
      interestScore: Math.round(interestScore),
      finalScore: Math.round(matchScore * 0.6 + interestScore * 0.4),
      aiGenerated: true
    };
  } catch (error) {
    console.error('AI scoring error:', error);
    
    // Fallback to basic scoring
    return {
      matchScore: 50,
      interestScore: 60,
      finalScore: 55,
      roleMatch: false,
      skillsMatch: false,
      matchedSkills: [],
      reasoning: 'AI service unavailable, using fallback scoring',
      strengths: [],
      gaps: [],
      aiGenerated: false
    };
  }
}

/**
 * Score multiple candidates with AI
 * @param {array} candidates - Array of candidate objects
 * @param {string} jd - Job description text
 * @returns {Promise<array>} - Array of scored candidates
 */
export async function aiScoreCandidates(candidates, jd) {
  try {
    // Score candidates in parallel (limit to avoid rate limiting)
    const batchSize = 3;
    const results = [];

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(candidate => aiScoreCandidate(candidate, jd))
      );
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error('Batch scoring error:', error);
    return candidates.map(c => ({
      ...c,
      matchScore: 50,
      interestScore: 60,
      finalScore: 55,
      aiGenerated: false
    }));
  }
}

/**
 * Get AI-powered insights about candidate requirements
 * @param {string} jd - Job description
 * @returns {Promise<object>} - Job insights and requirements
 */
export async function getJobInsights(jd) {
  try {
    const prompt = `Analyze this job description and provide key insights.

JOB DESCRIPTION:
${jd}

Provide response in this exact JSON format (no markdown, just pure JSON):
{
  "requiredSkills": [<list of essential skills>],
  "preferredSkills": [<list of nice-to-have skills>],
  "experienceLevel": "<junior|mid|senior>",
  "keyResponsibilities": [<top 3 responsibilities>],
  "requirementSummary": "<brief 1-2 sentence summary>"
}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```/g, '').trim();
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Job insights error:', error);
    return {
      requiredSkills: [],
      preferredSkills: [],
      experienceLevel: 'mid',
      keyResponsibilities: [],
      requirementSummary: 'Unable to analyze job description'
    };
  }
}
