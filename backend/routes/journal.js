const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { analyzeEmotion } = require('../services/llmService');

// POST /api/journal - Create a new journal entry
router.post('/', async (req, res) => {
  try {
    const { userId, ambience, text } = req.body;

    if (!userId || !ambience || !text) {
      return res.status(400).json({ error: 'userId, ambience, and text are required' });
    }

    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO journal_entries (user_id, ambience, text) VALUES (?, ?, ?)'
    );
    const result = stmt.run(userId, ambience, text);

    const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      id: entry.id,
      userId: entry.user_id,
      ambience: entry.ambience,
      text: entry.text,
      createdAt: entry.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

// POST /api/journal/analyze - Analyze emotion from text (BEFORE /:userId wildcard)
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await analyzeEmotion(text);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// GET /api/journal/insights/:userId - Get insights (BEFORE /:userId wildcard)
router.get('/insights/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();

    const entries = db.prepare(
      'SELECT * FROM journal_entries WHERE user_id = ?'
    ).all(userId);

    if (entries.length === 0) {
      return res.json({
        totalEntries: 0,
        topEmotion: null,
        mostUsedAmbience: null,
        recentKeywords: []
      });
    }

    // Top emotion
    const emotionCounts = {};
    entries.forEach(e => {
      if (e.emotion) emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });
    const topEmotion = Object.keys(emotionCounts).sort((a, b) => emotionCounts[b] - emotionCounts[a])[0] || null;

    // Most used ambience
    const ambienceCounts = {};
    entries.forEach(e => {
      ambienceCounts[e.ambience] = (ambienceCounts[e.ambience] || 0) + 1;
    });
    const mostUsedAmbience = Object.keys(ambienceCounts).sort((a, b) => ambienceCounts[b] - ambienceCounts[a])[0];

    // Recent keywords (last 5 entries)
    const recentEntries = entries
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    const recentKeywords = [...new Set(
      recentEntries.flatMap(e => e.keywords ? JSON.parse(e.keywords) : [])
    )].slice(0, 10);

    res.json({
      totalEntries: entries.length,
      topEmotion,
      mostUsedAmbience,
      recentKeywords
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// GET /api/journal/:userId - Get all entries for a user (AFTER specific routes)
router.get('/:userId', (req, res) => {
  try {
    const db = getDb();

    const rows = db.prepare(
      'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.params.userId);

    const parsedRows = rows.map(row => ({
      ...row,
      keywords: row.keywords ? JSON.parse(row.keywords) : []
    }));

    res.json(parsedRows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST /api/journal/:entryId/analyze - Analyze a specific entry and save results
router.post('/:entryId/analyze', async (req, res) => {
  try {
    const { entryId } = req.params;
    const db = getDb();

    const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(entryId);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const result = await analyzeEmotion(entry.text);

    db.prepare(
      'UPDATE journal_entries SET emotion = ?, keywords = ?, summary = ? WHERE id = ?'
    ).run(result.emotion, JSON.stringify(result.keywords), result.summary, entryId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze entry' });
  }
});

module.exports = router;
