const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CoursePlacementAttempt = require("./CoursePlacementAttempt");
const CoursePlacementQuestion = require("./CoursePlacementQuestion");

const CoursePlacementAnswer = sequelize.define(
  "CoursePlacementAnswer",
  {
    selectedOption: { type: DataTypes.ENUM("A", "B", "C", "D"), allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
  },
  { timestamps: true }
);

CoursePlacementAttempt.hasMany(CoursePlacementAnswer, { foreignKey: "attemptId", onDelete: "CASCADE" });
CoursePlacementAnswer.belongsTo(CoursePlacementAttempt, { foreignKey: "attemptId" });

CoursePlacementQuestion.hasMany(CoursePlacementAnswer, { foreignKey: "questionId", onDelete: "CASCADE" });
CoursePlacementAnswer.belongsTo(CoursePlacementQuestion, { foreignKey: "questionId" });

module.exports = CoursePlacementAnswer;