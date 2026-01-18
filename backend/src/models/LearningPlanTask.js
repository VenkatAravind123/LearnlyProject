const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const LearningPlan = require("./LearningPlan");

const LearningPlanTask = sequelize.define(
  "LearningPlanTask",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    planId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: true },   // <-- NEW
unitId: { type: DataTypes.INTEGER, allowNull: true },     // <-- NEW
unitOrder: { type: DataTypes.INTEGER, allowNull: true },  // <-- NEW

    date: { type: DataTypes.DATEONLY, allowNull: false }, // YYYY-MM-DD
    startTime: { type: DataTypes.STRING, allowNull: false, defaultValue: "19:00" }, // HH:MM

    durationMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },

    title: { type: DataTypes.STRING, allowNull: false },

    type: {
      type: DataTypes.ENUM("study", "practice", "review", "quiz"),
      allowNull: false,
      defaultValue: "study",
    },

    status: {
      type: DataTypes.ENUM("pending", "completed", "skipped", "missed"),
      allowNull: false,
      defaultValue: "pending",
    },

    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true }
);

LearningPlan.hasMany(LearningPlanTask, { foreignKey: "planId", onDelete: "CASCADE" });
LearningPlanTask.belongsTo(LearningPlan, { foreignKey: "planId" });

module.exports = LearningPlanTask;