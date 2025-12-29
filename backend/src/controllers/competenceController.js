const CompetenceQuestion = require("../models/CompetenceQuestion");
const StudentCompetence = require("../models/StudentCompetence");

const difficultyWeights = {
  easy: 1,
  medium: 1.5,
  hard: 2
};
exports.submitCompetenceTest = async (req, res) => {
  try {
    const { subject, answers } = req.body;
    const userId = req.user.userId;

    let earnedScore = 0;
    let totalScore = 0;

    for (const ans of answers) {
  const question = await CompetenceQuestion.findByPk(ans.questionId);
  if (!question) continue;

  const weight = difficultyWeights[question.difficulty];
  totalScore += weight;

  // Map correctOption letter to index
  const correctIndex = { A: 0, B: 1, C: 2, D: 3 }[question.correctOption];
  const options = [question.optionA, question.optionB, question.optionC, question.optionD];
  const correctValue = options[correctIndex];

  if (ans.selectedOption === correctValue) {
    earnedScore += weight;
  }
}

    if (totalScore === 0) {
      return res.status(400).json({ error: "No answers submitted or invalid questions." });
    }

    const competenceScore = (earnedScore / totalScore) * 100;

    let competenceLevel = "Beginner";
    if (competenceScore >= 70) competenceLevel = "Advanced";
    else if (competenceScore >= 40) competenceLevel = "Intermediate";

    const confidenceScore = earnedScore / totalScore;

    await StudentCompetence.upsert({
      userId,
      subject,
      competenceScore,
      competenceLevel,
      confidenceScore
    });

    // Update StudentProfile with the new score
    const StudentProfile = require("../models/StudentProfile");
    await StudentProfile.update(
      { lastCompetencyScore: competenceScore },
      { where: { userId } }
    );

    res.json({
      message: "Competence evaluated successfully",
      competenceScore,
      competenceLevel,
      confidenceScore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// backend/src/controllers/competenceController.js
// exports.getCompetenceTest = async (req, res) => {
//   try {
//     const questions = await CompetenceQuestion.findAll({
//       attributes: [
//         "id",
//         "questionText",
//         "optionA",
//         "optionB",
//         "optionC",
//         "optionD",
//         "difficulty"
//       ]
//     });

//     // Map DB rows to expected frontend format
//     const formatted = questions.map(q => ({
//       id: q.id,
//       questionText: q.questionText,
//       options: [q.optionA, q.optionB, q.optionC, q.optionD],
//       difficulty: q.difficulty
//     }));

//     res.json({ questions: formatted });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.getCompetenceTest = async (req, res) => {
  try {
    const { count = 5, subject, topic, difficulty } = req.query;

    // fetch active questions (optionally filter by subject/topic/difficulty)
    const where = { isActive: true };
    if (subject) where.subject = subject;
    if (topic) where.topic = topic;
    if (difficulty) where.difficulty = difficulty;

    const questions = await CompetenceQuestion.findAll({
      where,
      attributes: [
        "id",
        "questionText",
        "optionA",
        "optionB",
        "optionC",
        "optionD",
        "difficulty"
      ],
      limit: Number(count),
      order: [["createdAt", "ASC"]]
    });

    const formatted = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      difficulty: q.difficulty
    }));

    res.json({ questions: formatted });
  } catch (error) {
    console.error("Get Competence Test Error:", error);
    res.status(500).json({ error: error.message });
  }
};

