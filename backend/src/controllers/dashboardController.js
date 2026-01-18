const CourseEnrollment = require("../models/CourseEnrollment");
const Course = require("../models/Course");
const CourseUnit = require("../models/CourseUnit");
const StudentProfile = require("../models/StudentProfile");
const LearningPlan = require("../models/LearningPlan");
const LearningPlanTask = require("../models/LearningPlanTask");
const { generateDashboardSummary } = require("../services/dashboardAgentService");

function ymd(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function addDays(date, deltaDays) {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await StudentProfile.findOne({ where: { userId } });

    const enrollments = await CourseEnrollment.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      include: [{ model: Course }],
    });

    // ----- Build AI context (existing behavior) -----
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

    // ----- Metrics for dashboard tiles -----
    const courseIds = [...new Set(enrollments.map((e) => e.courseId).filter(Boolean))];

    // Total units per course (for overall progress + “modules completed”)
    const units = courseIds.length
      ? await CourseUnit.findAll({
          where: { courseId: courseIds },
          attributes: ["courseId", "id", "order"],
        })
      : [];

    const totalUnitsByCourse = new Map();
    for (const u of units) {
      totalUnitsByCourse.set(u.courseId, (totalUnitsByCourse.get(u.courseId) || 0) + 1);
    }

    let totalUnits = 0;
    let completedUnits = 0;

    for (const e of enrollments) {
      const courseTotalUnits = totalUnitsByCourse.get(e.courseId) || 0;
      totalUnits += courseTotalUnits;

      if (courseTotalUnits === 0) continue;

      if (e.status === "completed") {
        completedUnits += courseTotalUnits;
        continue;
      }

      const done = Math.max(0, Number(e.currentUnitOrder || 1) - 1);
      completedUnits += Math.min(done, courseTotalUnits);
    }

    const coursesTotal = enrollments.length;
    const coursesCompleted = enrollments.filter((e) => e.status === "completed").length;

    const overallProgressPct =
      totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : coursesTotal > 0 ? Math.round((coursesCompleted / coursesTotal) * 100) : 0;

    // Use plan tasks as the source of “time spent” + “quizzes”
    const activePlans = await LearningPlan.findAll({ where: { userId, status: "active" } });
    const planIds = activePlans.map((p) => p.id);

    const tasks = planIds.length
      ? await LearningPlanTask.findAll({
          where: { planId: planIds },
          attributes: ["date", "durationMin", "status", "type"],
        })
      : [];

    const today = new Date();
    const todayYmd = ymd(today);

    const completedTasks = tasks.filter((t) => t.status === "completed");
    const completedDatesSet = new Set(completedTasks.map((t) => String(t.date)));

    // streak: consecutive days up to today with any completed task
    let currentStreakDays = 0;
    for (let i = 0; i < 365; i++) {
      const d = ymd(addDays(today, -i));
      if (completedDatesSet.has(d)) currentStreakDays += 1;
      else break;
    }

    const totalMinutes = completedTasks.reduce((sum, t) => sum + Number(t.durationMin || 0), 0);

    // “This week” = last 7 days including today
    const weekStartYmd = ymd(addDays(today, -6));
    const weekMinutes = completedTasks
      .filter((t) => String(t.date) >= weekStartYmd && String(t.date) <= todayYmd)
      .reduce((sum, t) => sum + Number(t.durationMin || 0), 0);

    const quizzesTotal = tasks.filter((t) => t.type === "quiz").length;
    const quizzesPassed = tasks.filter((t) => t.type === "quiz" && t.status === "completed").length;

    const weeklyGoalMinutes = activePlans.reduce((sum, p) => sum + Number(p.dailyMinutes || 0), 0) * 7;

    const metrics = {
      overallProgressPct,

      courses: { completed: coursesCompleted, total: coursesTotal },
      quizzes: { passed: quizzesPassed, total: quizzesTotal },

      time: {
        totalHours: round1(totalMinutes / 60),
        thisWeekHours: round1(weekMinutes / 60),
        weeklyGoalHours: round1(weeklyGoalMinutes / 60),
      },

      modules: { completed: completedUnits, total: totalUnits },
      streakDays: currentStreakDays,
    };

    const ai = await generateDashboardSummary(context);

    return res.json({ ai, context, metrics, today: todayYmd });
  } catch (e) {
    console.error("getDashboardSummary error:", e);
    return res.status(500).json({ error: e.message });
  }
};