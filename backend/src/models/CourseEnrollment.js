const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Course = require("./Course");

const CourseEnrollment = sequelize.define(
  "CourseEnrollment",
  {
    status: { type: DataTypes.ENUM("active", "completed"), defaultValue: "active" },
    currentUnitOrder: { type: DataTypes.INTEGER, defaultValue: 1 },
    lastQuizScore: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-100
    recommendedStyle: { type: DataTypes.ENUM("Visual", "Text", "Practice"), defaultValue: "Text" },
  },
  { timestamps: true }
);

User.hasMany(CourseEnrollment, { foreignKey: "userId", onDelete: "CASCADE" });
CourseEnrollment.belongsTo(User, { foreignKey: "userId" });

Course.hasMany(CourseEnrollment, { foreignKey: "courseId", onDelete: "CASCADE" });
CourseEnrollment.belongsTo(Course, { foreignKey: "courseId" });

module.exports = CourseEnrollment;