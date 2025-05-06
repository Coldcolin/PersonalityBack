// Advanced scoring logic for personality assessment
// Using trait-based scoring with weights and normalization

const TRAIT_WEIGHTS = {
  // Core Learning Traits
  openness: 0.3,
  growthMindset: 0.3,
  learningCommitment: 0.2,
  selfEfficacy: 0.2,

  // Core Technical Traits
  problemSolving: 0.4,
  attentionToDetail: 0.3,
  persistence: 0.3,

  // Core Teamwork Traits
  agreeableness: 0.3,
  teamOrientation: 0.4,
  feedbackOrientation: 0.3,

  // Supporting Traits
  cognitiveFlexibility: 0.25,
  analyticalThinking: 0.25,
  technicalCuriosity: 0.25,
  conflictResolution: 0.25
};

function calculateTraitScore(answers, questions, trait) {
  const traitQuestions = questions.filter(q => q.trait === trait);
  if (!traitQuestions.length) return 0;

  let score = 0;
  let maxPossibleScore = 0;

  traitQuestions.forEach((question, idx) => {
    const answerValue = answers[questions.indexOf(question)];
    if (typeof answerValue === 'number') {
      score += answerValue;
      // Find max possible value for this question
      const maxValue = Math.max(...question.options.map(opt => opt.value));
      maxPossibleScore += maxValue;
    }
  });

  // Normalize to 0-100 scale
  return maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;
}

function calculateCompositeScore(traitScores, traits) {
  let weightedSum = 0;
  let totalWeight = 0;

  traits.forEach(trait => {
    const weight = TRAIT_WEIGHTS[trait];
    weightedSum += (traitScores[trait] || 0) * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}

function determinePreferredLearningStyle(traitScores) {
  const styles = {
    selfDirected: calculateLearningStyleScore(['selfEfficacy', 'analyticalThinking', 'cognitiveFlexibility'], traitScores),
    collaborative: calculateLearningStyleScore(['teamOrientation', 'feedbackOrientation', 'conflictResolution'], traitScores),
    structured: calculateLearningStyleScore(['attentionToDetail', 'persistence', 'learningCommitment'], traitScores),
    mixed: 0 // Will be calculated based on other scores
  };

  // Calculate mixed score as average of other styles
  styles.mixed = Math.round(
    (styles.selfDirected + styles.collaborative + styles.structured) / 3
  );

  // Find the highest scoring style(s)
  const maxScore = Math.max(...Object.values(styles));
  const topStyles = Object.entries(styles)
    .filter(([_, score]) => score === maxScore)
    .map(([style]) => style);

  return topStyles.length > 1 ? 'mixed' : topStyles[0];
}

function calculateLearningStyleScore(traits, traitScores) {
  return Math.round(
    traits.reduce((sum, trait) => sum + (traitScores[trait] || 0), 0) / traits.length
  );
}

function getStrengthAndDevelopmentAreas(traitScores) {
  // Sort traits by score descending
  const sortedTraits = Object.entries(traitScores)
    .sort((a, b) => b[1] - a[1]);
  // Top 3 as strengths, bottom 3 as development areas
  const strengthAreas = sortedTraits.slice(0, 3).map(([trait]) => trait);
  const developmentAreas = sortedTraits.slice(-3).map(([trait]) => trait);
  return { strengthAreas, developmentAreas };
}

function calculateResults(answers, questions) {
  const traitScores = {};
  
  // Calculate individual trait scores
  Object.keys(TRAIT_WEIGHTS).forEach(trait => {
    traitScores[trait] = calculateTraitScore(answers, questions, trait);
  });

  // Calculate composite scores
  const composites = {
    learningPotential: calculateCompositeScore(traitScores, ['openness', 'growthMindset', 'learningCommitment', 'selfEfficacy']),
    technicalAptitude: calculateCompositeScore(traitScores, ['problemSolving', 'attentionToDetail', 'persistence']),
    teamworkAbility: calculateCompositeScore(traitScores, ['agreeableness', 'teamOrientation', 'feedbackOrientation'])
  };

  // Add recommendations (learning style, strengths, development areas)
  const learningStyle = determinePreferredLearningStyle(traitScores);
  const { strengthAreas, developmentAreas } = getStrengthAndDevelopmentAreas(traitScores);

  return {
    traits: traitScores,
    composites,
    learningStyle,
    recommendation: {
      learningStyle,
      strengthAreas,
      developmentAreas
    }
  };
}

module.exports = {
  calculateResults,
  TRAIT_WEIGHTS
};
