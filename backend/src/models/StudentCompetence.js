const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const StudentCompetence = sequelize.define(
  "StudentCompetence",
  {
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    competenceScore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    competenceLevel: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Advanced"),
      allowNull: false
    },
    confidenceScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  },
  {
    timestamps: true
  }
);

// Relationships
User.hasMany(StudentCompetence, { foreignKey: "userId" });
StudentCompetence.belongsTo(User, { foreignKey: "userId" });

module.exports = StudentCompetence;
