const CourseEnrollment = require("../models/CourseEnrollment");
const Course = require("../models/Course");
const StudentProfile = require("../models/StudentProfile");
const { generateDashboardSummary } = require("../services/dashboardAgentService");

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await StudentProfile.findOne({ where: { userId } });

    const enrollments = await CourseEnrollment.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      include: [{ model: Course }],
    });

    const context = {
      user: { id: userId },
      profile: profile
        ? {
            currentLevel: profile.currentLevel,
            preferredLanguage: profile.preferredLanguage,
            learningStyle: profile.learningStyle,
            lastCompetencyScore: profile.lastCompetencyScore,
          }
        : null,
      enrollments: enrollments.map((e) => ({
        status: e.status,
        currentUnitOrder: e.currentUnitOrder,
        lastQuizScore: e.lastQuizScore,
        updatedAt: e.updatedAt,
        course: e.Course
          ? {
              courseId: e.Course.courseId,
              courseName: e.Course.courseName,
              subject: e.Course.subject,
              minPassPercentage: e.Course.minPassPercentage,
            }
          : null,
      })),
    };

    const ai = await generateDashboardSummary(context);

    return res.json({ ai, context });
  } catch (e) {
    console.error("getDashboardSummary error:", e);
    return res.status(500).json({ error: e.message });
  }
};