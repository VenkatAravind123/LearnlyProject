const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CompetenceTest = require("./CompetenceTest");

const CompetenceQuestion = sequelize.define(
  "CompetenceQuestion",
  {
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },

    topic: {
      type: DataTypes.STRING,
      allowNull: false
    },

    questionText: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    optionA: {
      type: DataTypes.STRING,
      allowNull: false
    },
    optionB: {
      type: DataTypes.STRING,
      allowNull: false
    },
    optionC: {
      type: DataTypes.STRING,
      allowNull: false
    },
    optionD: {
      type: DataTypes.STRING,
      allowNull: false
    },

    correctOption: {
      type: DataTypes.ENUM("A", "B", "C", "D"),
      allowNull: false
    },

    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      allowNull: false
    },

    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    source: {
      type: DataTypes.ENUM("MANUAL", "AI"),
      defaultValue: "MANUAL"
    },

    generatedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    timestamps: true
  }
);

// Relationships
CompetenceTest.hasMany(CompetenceQuestion, { foreignKey: "testId" });
CompetenceQuestion.belongsTo(CompetenceTest, { foreignKey: "testId" });

module.exports = CompetenceQuestion;
