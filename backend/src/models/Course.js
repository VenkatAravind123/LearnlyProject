const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Course = sequelize.define(
  "Course",
  {
    courseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    courseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // store duration in minutes
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    // minimum % required to pass (0-100)
    minPassPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      validate: { min: 0, max: 100 },
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  { timestamps: true }
);

module.exports = Course;