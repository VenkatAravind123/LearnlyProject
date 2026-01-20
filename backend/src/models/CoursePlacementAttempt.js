const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CourseEnrollment = require("./CourseEnrollment");
const Course = require("./Course");

const CoursePlacementAttempt = sequelize.define(
  "CoursePlacementAttempt",
  {
    score: { type: DataTypes.INTEGER, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { timestamps: true }
);

CourseEnrollment.hasMany(CoursePlacementAttempt, { foreignKey: "enrollmentId", onDelete: "CASCADE" });
CoursePlacementAttempt.belongsTo(CourseEnrollment, { foreignKey: "enrollmentId" });

Course.hasMany(CoursePlacementAttempt, { foreignKey: "courseId", onDelete: "CASCADE" });
CoursePlacementAttempt.belongsTo(Course, { foreignKey: "courseId" });

module.exports = CoursePlacementAttempt;