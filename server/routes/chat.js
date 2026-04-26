const express = require('express');
const router = express.Router();
const { simulateChat } = require('../services/geminiService');

router.post('/', async (req, res) => {
  const { jd, candidate, message } = req.body;

  if (!jd || !candidate || !message) {
    return res.status(400).json({ error: 'JD, candidate, and message are required.' });
  }

  try {
    const reply = await simulateChat(jd, candidate, message);
    res.json({ reply });
  } catch (error) {
    console.error("Chat Route Error:", error);
    res.status(500).json({ error: 'An error occurred while generating a chat reply.' });
  }
});

module.exports = router;
