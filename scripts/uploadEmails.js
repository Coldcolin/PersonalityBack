// Script to upload emails from data/emails.json to the API
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const emailsPath = path.join(__dirname, '../data/emails.json');
const API_URL = 'http://localhost:4000/api/quiz/register-emails';

// Helper to split array into batches
function chunkArray(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

function dedupeEmails(emails) {
  // Remove duplicates, trim, and lowercase
  const set = new Set();
  return emails
    .map(e => e.trim().toLowerCase())
    .filter(e => {
      if (set.has(e)) return false;
      set.add(e);
      return true;
    });
}

async function uploadEmails() {
  try {
    const data = fs.readFileSync(emailsPath, 'utf8');
    let emails = JSON.parse(data);
    if (!Array.isArray(emails)) throw new Error('emails.json must be an array');
    emails = dedupeEmails(emails);
    const batches = chunkArray(emails, 100);
    console.log(`Uploading ${emails.length} emails in ${batches.length} batches...`);
    for (let i = 0; i < batches.length; i++) {
      console.log(`Uploading batch ${i + 1} of ${batches.length}...`);
      const res = await axios.post(API_URL, { emails: batches[i] });
      console.log('Batch result:', res.data);
    }
    console.log('All batches uploaded!');
  } catch (err) {
    console.error('Failed to upload emails:', err.message);
    if (err.response && err.response.data) {
      console.error('Server response:', err.response.data);
    }
  }
}

uploadEmails();
