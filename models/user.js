// User model for MongoDB persistence using Mongoose.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true },
  course: { type: String },
  answers: { type: [Number] },
  result: {
    traits: {
      type: Map,
      of: Number
    },
    composites: {
      learningPotential: Number,
      technicalAptitude: Number,
      teamworkAbility: Number
    },
    recommendation: {
      learningStyle: String,
      strengthAreas: [String],
      developmentAreas: [String]
    }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('QuizUser', userSchema);

module.exports = User;
