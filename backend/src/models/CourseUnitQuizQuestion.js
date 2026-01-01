const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CourseUnit = require("./CourseUnit");

const CourseUnitQuizQuestion = sequelize.define(
  "CourseUnitQuizQuestion",
  {
    questionText: { type: DataTypes.TEXT, allowNull: false },
    optionA: { type: DataTypes.STRING, allowNull: false },
    optionB: { type: DataTypes.STRING, allowNull: false },
    optionC: { type: DataTypes.STRING, allowNull: false },
    optionD: { type: DataTypes.STRING, allowNull: false },
    correctOption: { type: DataTypes.ENUM("A", "B", "C", "D"), allowNull: false },
    explanation: { type: DataTypes.TEXT, allowNull: true },
    difficulty: { type: DataTypes.ENUM("easy", "medium", "hard"), allowNull: false },
  },
  { timestamps: true }
);

CourseUnit.hasMany(CourseUnitQuizQuestion, { foreignKey: "unitId", onDelete: "CASCADE" });
CourseUnitQuizQuestion.belongsTo(CourseUnit, { foreignKey: "unitId" });

module.exports = CourseUnitQuizQuestion;