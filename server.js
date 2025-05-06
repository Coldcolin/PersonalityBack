const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const quizRoutes = require('./routes/quiz');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI);

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/quiz', quizRoutes);

app.get('/', (req, res) => {
  res.send('Personality Quiz API is running.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
