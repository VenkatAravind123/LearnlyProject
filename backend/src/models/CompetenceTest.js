const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CompetenceTest = sequelize.define(
  "CompetenceTest",
  {
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    difficultyLevel: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      allowNull: false
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = CompetenceTest;


