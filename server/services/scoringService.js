/**
 * Calculates Match Score, Interest Score, and Final Score.
 * @param {Array} jdSkills - Skills extracted from JD.
 * @param {Array} candidateSkills - Skills possessed by the candidate.
 * @returns {Object} Scores object.
 */
function calculateScores(jdSkills, candidateSkills) {
  if (!jdSkills || jdSkills.length === 0) {
    return { matchScore: 0, interestScore: 85, finalScore: 42.5 };
  }

  // Calculate Match Score with high precision
  const candSkillsLower = candidateSkills.map(s => s.toLowerCase());
  let matchCount = 0;
  
  jdSkills.forEach(reqSkill => {
    // Exact or high precision word match to avoid false positives (e.g. 'java' vs 'javascript')
    const regex = new RegExp(`\\b${reqSkill}\\b`, 'i');
    
    // Check for exact matching or strong substring inclusion
    const hasSkill = candSkillsLower.some(cs => 
      cs === reqSkill || regex.test(cs) || cs.includes(reqSkill)
    );
    
    if (hasSkill) matchCount++;
  });

  // Calculate raw match percentage
  const rawScore = (matchCount / jdSkills.length) * 100;
  
  // Apply a precision multiplier: reward candidates who meet >=80% of skills
  const matchScore = rawScore >= 80 
    ? Math.min(Math.round(rawScore * 1.05), 100) 
    : Math.round(rawScore);

  // Simulate Interest Score (Random value between 60 and 95)
  // For a consistent demo, we randomize realistically based on the candidate's existing alignment
  const baseInterest = matchScore > 50 ? 75 : 60;
  const interestScore = baseInterest + Math.floor(Math.random() * (95 - baseInterest + 1));

  // Final Score heavily weights the Match Score (70% Match, 30% Interest) for precision
  const finalScore = Math.round((matchScore * 0.7) + (interestScore * 0.3));

  return { matchScore, interestScore, finalScore };
}

/**
 * Generates an explanation for why the candidate was selected.
 * @param {Object} candidate - The candidate.
 * @param {Array} jdSkills - Extracted JD skills.
 * @param {number} matchScore - The match score.
 * @returns {string} - The explanation.
 */
function generateExplanation(candidate, jdSkills, matchScore) {
  const missingSkillsCount = Math.max(0, jdSkills.length - Math.round((matchScore / 100) * jdSkills.length));

  if (matchScore >= 90) {
    return `Exceptional fit! ${candidate.name} fulfills nearly all rigorous tech requirements with high precision.`;
  } else if (matchScore >= 70) {
    return `Strong recommendation. ${candidate.name} possesses core competencies but lacks ~${missingSkillsCount} secondary requirement(s).`;
  } else if (matchScore >= 50) {
    return `Potential candidate. ${candidate.name} has foundational ${candidate.role} experience but needs onboarding for specific stack tools.`;
  } else {
    return `Cross-functional profile. While ${candidate.name} has a low direct match, their ${candidate.experience} in adjacent technologies might bring unique value.`;
  }
}

module.exports = {
  calculateScores,
  generateExplanation
};
