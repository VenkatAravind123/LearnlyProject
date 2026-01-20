const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Course = require("./Course");

const CoursePlacementQuestion = sequelize.define(
  "CoursePlacementQuestion",
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

Course.hasMany(CoursePlacementQuestion, { foreignKey: "courseId", onDelete: "CASCADE" });
CoursePlacementQuestion.belongsTo(Course, { foreignKey: "courseId" });

module.exports = CoursePlacementQuestion;