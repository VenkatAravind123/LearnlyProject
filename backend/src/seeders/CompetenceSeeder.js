const sequelize = require("../config/db");
const CompetenceTest = require("../models/CompetenceTest");
const CompetenceQuestion = require("../models/CompetenceQuestion");

const seedCompetenceData = async () => {
  try {
    await sequelize.sync();

    // 1. Create a Competence Test
    const test = await CompetenceTest.create({
      subject: "Data Structures",
      difficultyLevel: "medium",
      totalQuestions: 5
    });

    // 2. Create Questions
    const questions = [
      {
        questionText: "What is the time complexity of binary search?",
        optionA: "O(n)",
        optionB: "O(log n)",
        optionC: "O(n log n)",
        optionD: "O(1)",
        correctOption: "B",
        difficulty: "easy",
        testId: test.id
      },
      {
        questionText: "Which data structure uses FIFO principle?",
        optionA: "Stack",
        optionB: "Tree",
        optionC: "Queue",
        optionD: "Graph",
        correctOption: "C",
        difficulty: "easy",
        testId: test.id
      },
      {
        questionText: "Which traversal is used to get sorted output in BST?",
        optionA: "Preorder",
        optionB: "Postorder",
        optionC: "Level Order",
        optionD: "Inorder",
        correctOption: "D",
        difficulty: "medium",
        testId: test.id
      },
      {
        questionText: "What is the worst-case time complexity of Quick Sort?",
        optionA: "O(n)",
        optionB: "O(n log n)",
        optionC: "O(log n)",
        optionD: "O(n²)",
        correctOption: "D",
        difficulty: "hard",
        testId: test.id
      },
      {
        questionText: "Which data structure is used for BFS traversal?",
        optionA: "Stack",
        optionB: "Queue",
        optionC: "Set",
        optionD: "Heap",
        correctOption: "B",
        difficulty: "medium",
        testId: test.id
      }
    ];

    await CompetenceQuestion.bulkCreate(questions);

    console.log("Competence test and questions seeded successfully");
    process.exit();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedCompetenceData();
