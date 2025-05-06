const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const scoring = require('../utils/scoring');
const User = require('../models/user');
const questions = require('../data/questions.json');

// Get questions for a specific course
router.get('/questions/:course', (req, res) => {
  const { course } = req.params;
  const courseQuestions = questions[course];
  
  if (!courseQuestions) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  res.json(courseQuestions);
});

// Submit answers and get results
router.post('/submit', async (req, res) => {
  const { name, email, course, answers } = req.body;
  
  if (!answers || !course || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid submission' });
  }
  
  const courseQuestions = questions[course];
  if (!courseQuestions) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  try {
    const result = scoring.calculateResults(answers, courseQuestions);
    
    // If email is provided, update or create user record
    if (email) {
      await User.findOneAndUpdate(
        { email },
        { name, course, answers, result },
        { new: true, upsert: true }
      );
    }
    
    res.json({ result });
  } catch (error) {
    console.error('Error calculating results:', error);
    res.status(500).json({ error: 'Failed to calculate results' });
  }
});

// Get all users (for admin/testing)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all users with results
router.get('/results', async (req, res) => {
  try {
    const users = await User.find(
      { result: { $exists: true, $ne: null } },
      { name: 1, email: 1, course: 1, result: 1, _id: 0 }
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Validate email
router.get('/validate-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate email' });
  }
});

// Register single email
router.post('/register-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      email: cleanEmail,
      name: '',
      course: '',
      answers: [],
      result: {}
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Failed to register email:', err);
    res.status(500).json({ error: 'Failed to register email', details: err.message });
  }
});

// Bulk register emails
router.post('/register-emails', async (req, res) => {
  const emailsPath = path.join(__dirname, '../data/emails.json');
  try {
    const data = fs.readFileSync(emailsPath, 'utf8');
    let emails = JSON.parse(data);
    
    if (!Array.isArray(emails)) {
      return res.status(400).json({ error: 'emails.json must be an array' });
    }

    // Remove duplicates and clean emails
    emails = [...new Set(emails.map(e => e.trim().toLowerCase()))];

    // Only create users for emails that don't already exist
    const existingUsers = await User.find({ email: { $in: emails } });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
    
    const newEmails = emails.filter(e => !existingEmails.has(e));
    const results = await Promise.allSettled(
      newEmails.map(email => 
        User.create({
          email,
          name: '',
          course: '',
          answers: [],
          result: {}
        })
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      created: succeeded,
      skipped: existingEmails.size,
      failed
    });
  } catch (err) {
    console.error('Failed to register emails:', err);
    res.status(500).json({ error: 'Failed to register emails', details: err.message });
  }
});

module.exports = router;
