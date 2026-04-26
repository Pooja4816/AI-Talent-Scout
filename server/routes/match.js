const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { extractSkills } = require('../services/geminiService');
const { calculateScores, generateExplanation } = require('../services/scoringService');

const validRequirementKeywords = [
  'data scientist',
  'frontend engineer',
  'full stack developer',
  'backend developer',
  'machine learning engineer',
  'data analyst',
  'react',
  'python',
  'sql',
  'node.js',
  'javascript',
  'java',
  'tensorflow',
  'pandas',
  'django',
  'angular',
  'aws',
  'devops'
];

function isValidRequirementName(value) {
  const input = (value || '').trim();
  if (input.length < 3) return false;

  const words = input.match(/[A-Za-z]{2,}/g) || [];
  if (words.length < 2) return false;

  const nonSpaceChars = input.replace(/\s/g, '');
  const alphaChars = (input.match(/[A-Za-z]/g) || []).length;
  if (!nonSpaceChars.length) return false;

  const normalizedInput = input.toLowerCase().replace(/\s+/g, ' ');
  const hasValidKeyword = validRequirementKeywords.some(keyword => normalizedInput.includes(keyword));
  if (!hasValidKeyword) return false;

  return alphaChars / nonSpaceChars.length >= 0.6;
}

router.post('/', async (req, res) => {
  const { jd } = req.body;

  if (!jd || jd.trim() === '') {
    return res.status(400).json({ error: 'Job description is required.' });
  }

  if (!isValidRequirementName(jd)) {
    return res.status(400).json({ error: 'Write a valid requirement' });
  }

  try {
    // 1. Read candidates fresh from disk
    const dataPath = path.join(__dirname, '..', 'data', 'candidates.json');
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const candidatesData = JSON.parse(rawData);

    // 2. Extract skills from JD using Gemini
    const jdSkills = await extractSkills(jd);
    console.log("Extracted JD Skills:", jdSkills);

    // 3. Process each candidate
    const scoredCandidates = candidatesData.map(candidate => {
      const { matchScore, interestScore, finalScore } = calculateScores(jdSkills, candidate.skills);
      const explanation = generateExplanation(candidate, jdSkills, matchScore);

      return {
        ...candidate,
        matchScore,
        interestScore,
        finalScore,
        explanation
      };
    });

    // 3. Rank candidates by Final Score (descending)
    scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

    res.json({
      jdSkills,
      candidates: scoredCandidates
    });
  } catch (error) {
    console.error("Match Route Error:", error);
    res.status(500).json({ error: 'An error occurred while matching candidates.' });
  }
});

module.exports = router;
