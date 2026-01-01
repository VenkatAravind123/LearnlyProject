const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CourseEnrollment = require("./CourseEnrollment");
const CourseUnitQuizQuestion = require("./CourseUnitQuizQuestion");

const CourseUnitQuizAttempt = sequelize.define(
  "CourseUnitQuizAttempt",
  {
    selectedOption: { type: DataTypes.ENUM("A", "B", "C", "D"), allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
  },
  { timestamps: true }
);

CourseEnrollment.hasMany(CourseUnitQuizAttempt, { foreignKey: "enrollmentId", onDelete: "CASCADE" });
CourseUnitQuizAttempt.belongsTo(CourseEnrollment, { foreignKey: "enrollmentId" });

CourseUnitQuizQuestion.hasMany(CourseUnitQuizAttempt, { foreignKey: "questionId", onDelete: "CASCADE" });
CourseUnitQuizAttempt.belongsTo(CourseUnitQuizQuestion, { foreignKey: "questionId" });

module.exports = CourseUnitQuizAttempt;