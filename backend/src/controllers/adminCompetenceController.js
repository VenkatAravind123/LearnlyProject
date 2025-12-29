  const CompetenceQuestion = require("../models/CompetenceQuestion");
  const CompetenceTest = require("../models/CompetenceTest");
  const { generateAIQuestions } = require("../services/aiQuestionService");
  const sequelize = require("../config/db");

  exports.generateAndSaveQuestions = async (req, res) => {
  try {
    const { subject, topic, difficulty, count } = req.body;

    if (!subject || !topic || !difficulty) {
      return res.status(400).json({
        error: "subject, topic, and difficulty are required",
      });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({
        error: "difficulty must be: easy, medium, or hard",
      });
    }

    const questionCount = Number(count) || 5;
    if (questionCount < 1 || questionCount > 50) {
      return res.status(400).json({
        error: "count must be between 1 and 50",
      });
    }

    // Generate first; if LLM fails, don't create a test row.
    const generatedQuestions = await generateAIQuestions({
      subject,
      topic,
      difficultyLevel: difficulty,
      count: questionCount,
    });

    const result = await sequelize.transaction(async (t) => {
      const test = await CompetenceTest.create(
        {
          subject,
          topic,
          difficultyLevel: difficulty,
          totalQuestions: questionCount,
          generatedBy: "AI",
          status: "active",
        },
        { transaction: t }
      );

      const questionsWithTestId = generatedQuestions.map((q) => ({
        subject,
        topic,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        difficulty,
        explanation: q.explanation || "",
        source: "AI",
        generatedBy: "AI",
        isActive: true,
        usageCount: 0,
        testId: test.id,
      }));

      const savedQuestions = await CompetenceQuestion.bulkCreate(questionsWithTestId, {
        transaction: t,
      });

      return { test, savedQuestions };
    });

    return res.status(201).json({
      message: "Questions generated and saved successfully",
      test: {
        id: result.test.id,
        subject: result.test.subject,
        topic: result.test.topic,
        difficultyLevel: result.test.difficultyLevel,
        totalQuestions: result.test.totalQuestions,
      },
      questionsGenerated: result.savedQuestions.length,
    });
  } catch (error) {
    console.error("Generate Questions Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

 exports.getGeneratedTests = async (req, res) => {
  try {
    const tests = await CompetenceTest.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.json({ tests });
  } catch (error) {
    console.error("Get Tests Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

  exports.deleteTest = async (req, res) => {
  try {
    const { testId } = req.params;

    await CompetenceQuestion.destroy({ where: { testId } });
    const deleted = await CompetenceTest.destroy({ where: { id: testId } });

    if (!deleted) {
      return res.status(404).json({ message: "Test not found" });
    }

    return res.json({ message: "Test deleted successfully" });
  } catch (error) {
    console.error("Delete Test Error:", error);
    return res.status(500).json({ error: error.message });
  }
};