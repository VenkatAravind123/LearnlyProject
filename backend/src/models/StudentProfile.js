const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const StudentProfile = sequelize.define(
  "StudentProfile",
  {
    currentLevel: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Advanced"),
      defaultValue: "Beginner",
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: "English",
    },
    learningStyle: {
      type: DataTypes.ENUM("Visual", "Text", "Practice"),
      defaultValue: "Text",
    },
    lastCompetencyScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // --- Added fields for the redesigned Profile page ---
    phoneNumber: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },

    college: { type: DataTypes.STRING, allowNull: true },
    graduationYear: { type: DataTypes.INTEGER, allowNull: true },

    currentRole: { type: DataTypes.STRING, allowNull: true },
    experienceLevel: {
      type: DataTypes.ENUM("0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"),
      allowNull: true,
    },

    bio: { type: DataTypes.TEXT, allowNull: true },
    github: { type: DataTypes.STRING, allowNull: true },
    linkedin: { type: DataTypes.STRING, allowNull: true },

    learningGoals: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  },
  { timestamps: true }
);

User.hasOne(StudentProfile, { foreignKey: "userId", onDelete: "CASCADE" });
StudentProfile.belongsTo(User, { foreignKey: "userId" });

module.exports = StudentProfile;