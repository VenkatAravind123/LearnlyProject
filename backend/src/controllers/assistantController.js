const multer = require("multer");
const StudentProfile = require("../models/StudentProfile");
const { runLearningAssistant } = require("../services/learningAssistantService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5,
  },
});

function normalizeText(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

exports.chatWithFiles = [
  upload.array("files", 5),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const message = normalizeText(req.body?.message);

      const profile = await StudentProfile.findOne({ where: { userId } });

      const result = await runLearningAssistant({
        message,
        files: req.files || [],
        profile: {
          currentLevel: profile?.currentLevel || "Beginner",
          preferredLanguage: profile?.preferredLanguage || "English",
          learningStyle: profile?.learningStyle || "Text",
          lastCompetencyScore: Number(profile?.lastCompetencyScore || 0),
        },
      });

      return res.json(result);
    } catch (e) {
      console.error("chatWithFiles error:", e);
      return res.status(500).json({ error: e.message });
    }
  },
];