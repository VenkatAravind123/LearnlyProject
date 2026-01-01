const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Course = require("./Course");

const CourseUnit = sequelize.define(
  "CourseUnit",
  {
    title: { type: DataTypes.STRING, allowNull: false },
    order: { type: DataTypes.INTEGER, allowNull: false },
    baseContent: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: true }
);

Course.hasMany(CourseUnit, { foreignKey: "courseId", onDelete: "CASCADE" });
CourseUnit.belongsTo(Course, { foreignKey: "courseId" });

module.exports = CourseUnit;