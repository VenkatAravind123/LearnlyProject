const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const LearningPlan = sequelize.define(
  "LearningPlan",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    userId: { type: DataTypes.INTEGER, allowNull: false },
    // add inside fields
courseId: { type: DataTypes.INTEGER, allowNull: true },

    goal: { type: DataTypes.STRING, allowNull: false, defaultValue: "Follow my learning plan" },

    days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 14 },
    dailyMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },

    preferredTime: {
      type: DataTypes.ENUM("morning", "afternoon", "evening", "any"),
      allowNull: false,
      defaultValue: "evening",
    },

    status: {
      type: DataTypes.ENUM("active", "archived"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  { timestamps: true }
);

User.hasMany(LearningPlan, { foreignKey: "userId", onDelete: "CASCADE" });
LearningPlan.belongsTo(User, { foreignKey: "userId" });

module.exports = LearningPlan;