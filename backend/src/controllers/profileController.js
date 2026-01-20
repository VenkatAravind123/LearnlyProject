const StudentProfile = require("../models/StudentProfile");

function cleanStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function cleanInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function cleanGoals(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      // existing
      currentLevel,
      preferredLanguage,
      learningStyle,

      // new
      phoneNumber,
      location,
      college,
      graduationYear,
      currentRole,
      experienceLevel,
      bio,
      github,
      linkedin,
      learningGoals,
    } = req.body || {};

    const payload = {
      currentLevel,
      preferredLanguage,
      learningStyle,

      phoneNumber: cleanStr(phoneNumber),
      location: cleanStr(location),

      college: cleanStr(college),
      graduationYear: cleanInt(graduationYear),

      currentRole: cleanStr(currentRole),
      experienceLevel: cleanStr(experienceLevel),

      bio: bio === undefined ? undefined : cleanStr(bio),
      github: cleanStr(github),
      linkedin: cleanStr(linkedin),

      learningGoals: cleanGoals(learningGoals),
    };

    // remove undefined keys (so we don't overwrite accidentally)
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    let profile = await StudentProfile.findOne({ where: { userId } });
    if (profile) {
      // Do not allow lastCompetencyScore updates here
      delete payload.lastCompetencyScore;
      await profile.update(payload);
    } else {
      profile = await StudentProfile.create({ userId, ...payload });
    }

    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await StudentProfile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};