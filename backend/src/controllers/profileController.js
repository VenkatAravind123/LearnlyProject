const StudentProfile = require("../models/StudentProfile");

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const { currentLevel, preferredLanguage, learningStyle } = req.body;
    const userId = req.user.userId;

    let profile = await StudentProfile.findOne({ where: { userId } });
    if (profile) {
      // Update (do not allow lastCompetencyScore update here)
      await profile.update({ currentLevel, preferredLanguage, learningStyle });
    } else {
      // Create
      profile = await StudentProfile.create({
        userId,
        currentLevel,
        preferredLanguage,
        learningStyle
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await StudentProfile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};