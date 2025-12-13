const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const StudentProfile = sequelize.define(
  "StudentProfile",
  {
    currentLevel: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Advanced"),
      defaultValue: "Beginner"
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: "English"
    },
    learningStyle: {
      type: DataTypes.ENUM("Visual", "Text", "Practice"),
      defaultValue: "Text"
    },
    lastCompetencyScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  { timestamps: true }
);

User.hasOne(StudentProfile, { foreignKey: "userId", onDelete: "CASCADE" });
StudentProfile.belongsTo(User, { foreignKey: "userId" });

module.exports = StudentProfile;
