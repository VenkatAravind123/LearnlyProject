const Course = require("../models/Course");
const CourseUnit = require("../models/CourseUnit");
const CourseEnrollment = require("../models/CourseEnrollment");
const CourseUnitQuizQuestion = require("../models/CourseUnitQuizQuestion");
const CourseUnitQuizAttempt = require("../models/CourseUnitQuizAttempt");
const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const CoursePlacementQuestion = require("../models/CoursePlacementQuestion");
const CoursePlacementAttempt = require("../models/CoursePlacementAttempt");
const CoursePlacementAnswer = require("../models/CoursePlacementAnswer");

const { generateAIQuestions } = require("../services/aiQuestionService");
const { generateUnitExplanation, generateFlashcards, chooseDifficulty, generateRemainingUnits } =
  require("../services/courseAgentService");

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function desiredUnitCount(course) {
  const dur = Number(course?.durationMinutes || 0);
  if (!dur) return 6;
  return Math.max(4, Math.min(12, Math.round(dur / 30)));
}

async function ensureCourseHasEnoughUnits({ course, competenceScore }) {
  const existing = await CourseUnit.findAll({
    where: { courseId: course.courseId },
    order: [["order", "ASC"]],
  });

  const targetTotal = desiredUnitCount(course);
  if (existing.length >= targetTotal) return { created: 0, total: existing.length };

  const missing = targetTotal - existing.length;

  const newUnits = await generateRemainingUnits({
    subject: course.subject,
    courseName: course.courseName,
    courseDescription: course.description,
    existingUnitTitles: existing.map((u) => u.title),
    competenceScore,
    count: missing,
  });

  if (!newUnits.length) return { created: 0, total: existing.length };

  const startOrder = existing.length + 1;

  await CourseUnit.bulkCreate(
    newUnits.map((u, idx) => ({
      courseId: course.courseId,
      order: startOrder + idx,
      title: u.title,
      baseContent: u.baseContent,
    }))
  );

  return { created: newUnits.length, total: existing.length + newUnits.length };
}

exports.getCourseOutline = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user.userId;

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrollment = await CourseEnrollment.findOne({ where: { userId, courseId } });

    const units = await CourseUnit.findAll({
      where: { courseId },
      order: [["order", "ASC"]],
      attributes: ["id", "title", "order"],
    });

    const currentUnitOrder = Number(enrollment?.currentUnitOrder || 1);
    const isCourseCompleted = enrollment?.status === "completed";

    const perUnitEstimate = units.length
      ? Math.max(10, Math.min(90, Math.round(Number(course.durationMinutes || 0) / units.length) || 30))
      : 30;

    const outlineUnits = units.map((u) => {
      let status = "locked";
      if (isCourseCompleted) status = "completed";
      else if (u.order < currentUnitOrder) status = "completed";
      else if (u.order === currentUnitOrder) status = "current";

      return {
        id: u.id,
        title: u.title,
        order: u.order,
        status,
        durationMinEstimate: perUnitEstimate,
      };
    });

    return res.json({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        subject: course.subject,
        description: course.description || "",
        durationMinutes: course.durationMinutes,
        minPassPercentage: course.minPassPercentage,
      },
      enrollment: enrollment
        ? {
            status: enrollment.status,
            currentUnitOrder: enrollment.currentUnitOrder,
            lastQuizScore: enrollment.lastQuizScore,
            recommendedStyle: enrollment.recommendedStyle,
          }
        : null,
      units: outlineUnits,
    });
  } catch (e) {
    console.error("getCourseOutline error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { courseName, subject, description, durationMinutes, minPassPercentage, units } = req.body;

    if (!courseName || !subject) {
      return res.status(400).json({ error: "courseName and subject are required" });
    }

    const duration = toInt(durationMinutes, 0);
    const minPass = toInt(minPassPercentage, 60);
    if (minPass < 0 || minPass > 100) return res.status(400).json({ error: "minPassPercentage must be 0-100" });

    const course = await Course.create({
      courseName: String(courseName),
      subject: String(subject),
      description: description || "",
      durationMinutes: duration,
      minPassPercentage: minPass,
      isActive: true,
    });

    if (Array.isArray(units) && units.length) {
      const normalized = units.map((u, idx) => ({
        courseId: course.courseId,
        title: String(u.title || `Unit ${idx + 1}`),
        order: toInt(u.order, idx + 1),
        baseContent: u.baseContent || "",
      }));
      await CourseUnit.bulkCreate(normalized);
    }

    return res.status(201).json({ message: "Course created", courseId: course.courseId });
  } catch (e) {
    console.error("createCourse error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({ order: [["createdAt", "DESC"]] });
    return res.json({ courses });
  } catch (e) {
    console.error("listCourses error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.enroll = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user.userId;

    const { beginner } = req.body || {}; // <--- ADD

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const profile = await StudentProfile.findOne({ where: { userId } });

    const existing = await CourseEnrollment.findOne({ where: { userId, courseId } });
    if (existing) {
      // Optional: if user now says they are beginner, allow skipping placement
      if (beginner && !existing.placementCompletedAt) {
        existing.placementScore = 0;
        existing.placementCompletedAt = new Date();
        await existing.save();
      }
      return res.json({ message: "Already enrolled", enrollment: existing });
    }

    const enrollment = await CourseEnrollment.create({
      userId,
      courseId,
      currentUnitOrder: 1,
      lastQuizScore: 0,
      recommendedStyle: profile?.learningStyle || "Text",
      placementScore: beginner ? 0 : null,                    // <--- ADD
      placementCompletedAt: beginner ? new Date() : null,     // <--- ADD
    });

    return res.status(201).json({ message: "Enrolled", enrollment });
  } catch (e) {
    console.error("enroll error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.getNextUnit = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user.userId;

    const enrollment = await CourseEnrollment.findOne({ where: { userId, courseId } });
if (!enrollment) return res.status(400).json({ error: "Not enrolled" });

const course = await Course.findByPk(courseId);
if (!course) return res.status(404).json({ error: "Course not found" });

if (!enrollment.placementCompletedAt) {
  const qs = await ensurePlacementQuestions(course);
  return res.json({
    placementRequired: true,
    course: {
      courseId: course.courseId,
      courseName: course.courseName,
      subject: course.subject,
      durationMinutes: course.durationMinutes,
      minPassPercentage: course.minPassPercentage,
    },
    placementQuestions: qs.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    })),
  });
}

// IMPORTANT: delete the later duplicate:
// const course = await Course.findByPk(courseId);

    

    let unit = await CourseUnit.findOne({ where: { courseId, order: enrollment.currentUnitOrder } });

if (!unit) {
  // Safety net: try generating remaining units (e.g., if course initially had only Unit 1)
  const competenceScore = Number(enrollment.placementScore ?? 0);
  try {
    await ensureCourseHasEnoughUnits({ course, competenceScore });
    unit = await CourseUnit.findOne({ where: { courseId, order: enrollment.currentUnitOrder } });
  } catch (genErr) {
    console.error("Unit generation during /next failed:", genErr);
  }
}

// if (!unit) {
//   enrollment.status = "completed";
//   await enrollment.save();
//   return res.json({ message: "Course completed", completed: true });
// }
if (!unit) {
  const competenceScore = Number(enrollment.placementScore ?? 0);

  try {
    await ensureCourseHasEnoughUnits({ course, competenceScore });
    unit = await CourseUnit.findOne({ where: { courseId, order: enrollment.currentUnitOrder } });
  } catch (genErr) {
    console.error("Unit generation during /next failed:", genErr);
    return res.status(503).json({
      error: "AI is generating your next unit. Please try again in a few seconds.",
    });
  }
}

if (!unit) {
  const maxOrder = await CourseUnit.max("order", { where: { courseId } });
  if (maxOrder && enrollment.currentUnitOrder > maxOrder) {
    enrollment.status = "completed";
    await enrollment.save();
    return res.json({ message: "Course completed", completed: true });
  }

  return res.status(400).json({
    error: "No unit found for your progress. Course units may be missing.",
  });
}

    const profile = await StudentProfile.findOne({ where: { userId } });
    // const competenceScore = Number(profile?.lastCompetencyScore || 0);
    const competenceScore = Number(enrollment.placementScore ?? profile?.lastCompetencyScore ?? 0);

    const explanation = await generateUnitExplanation({
      subject: course.subject,
      unitTitle: unit.title,
      baseContent: unit.baseContent,
      competenceScore,
      lastQuizScore: enrollment.lastQuizScore,
      learningStyle: enrollment.recommendedStyle || profile?.learningStyle || "Text",
    });

    if (["Visual", "Text", "Practice"].includes(explanation.recommendedStyle)) {
      enrollment.recommendedStyle = explanation.recommendedStyle;
      await enrollment.save();
    }

    const difficulty = chooseDifficulty(competenceScore);

    let quizQs = await CourseUnitQuizQuestion.findAll({ where: { unitId: unit.id, difficulty } });
    if (quizQs.length === 0) {
      const generated = await generateAIQuestions({
        subject: course.subject,
        topic: unit.title,
        difficultyLevel: difficulty,
        count: 3,
      });

      await CourseUnitQuizQuestion.bulkCreate(
        generated.map((q) => ({
          unitId: unit.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          explanation: q.explanation || "",
          difficulty,
        }))
      );

      quizQs = await CourseUnitQuizQuestion.findAll({ where: { unitId: unit.id, difficulty } });
    }

    const flashcards = await generateFlashcards({
      subject: course.subject,
      unitTitle: unit.title,
      competenceScore,
    });

    const quizQuestions = quizQs.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    }));

    return res.json({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        subject: course.subject,
        durationMinutes: course.durationMinutes,
        minPassPercentage: course.minPassPercentage,
      },
      unit: { id: unit.id, title: unit.title, order: unit.order },
      explanationText: explanation.explanationText,
      recommendedStyle: enrollment.recommendedStyle,
      quizQuestions,
      flashcards,
    });
  } catch (e) {
    console.error("getNextUnit error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.submitUnitQuiz = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const unitId = Number(req.params.unitId);
    const userId = req.user.userId;

    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) return res.status(400).json({ error: "answers required" });

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrollment = await CourseEnrollment.findOne({ where: { userId, courseId } });
    if (!enrollment) return res.status(400).json({ error: "Not enrolled" });

    const unit = await CourseUnit.findByPk(unitId);
    if (!unit || unit.courseId !== courseId) return res.status(404).json({ error: "Unit not found for this course" });

    const questionIds = answers.map((a) => Number(a.questionId)).filter(Boolean);
    const questions = await CourseUnitQuizQuestion.findAll({ where: { id: questionIds, unitId } });

    const byId = new Map(questions.map((q) => [q.id, q]));
    let correct = 0;

    const attempts = answers
      .map((a) => {
        const q = byId.get(Number(a.questionId));
        if (!q) return null;

        const selected = String(a.selectedOption || "").toUpperCase();
        if (!["A", "B", "C", "D"].includes(selected)) return null;

        const isCorrect = selected === q.correctOption;
        if (isCorrect) correct += 1;

        return { enrollmentId: enrollment.id, questionId: q.id, selectedOption: selected, isCorrect };
      })
      .filter(Boolean);

    if (attempts.length === 0) return res.status(400).json({ error: "No valid answers found" });

    await CourseUnitQuizAttempt.bulkCreate(attempts);

    const score = Math.round((correct / attempts.length) * 100);
    enrollment.lastQuizScore = score;

    const passed = score >= course.minPassPercentage;

    if (passed) {
      if (unit.order === enrollment.currentUnitOrder) enrollment.currentUnitOrder += 1;
    } else {
      enrollment.recommendedStyle = "Practice";
    }

    await enrollment.save();
    // Auto-complete the matching plan quiz task when the student passes
if (passed) {
  const LearningPlan = require("../models/LearningPlan");
  const LearningPlanTask = require("../models/LearningPlanTask");

  const activePlan = await LearningPlan.findOne({
    where: { userId, status: "active", courseId },
  });

  if (activePlan) {
    await LearningPlanTask.update(
      { status: "completed", completedAt: new Date() },
      {
        where: {
          planId: activePlan.id,
          courseId,
          unitId,
          type: "quiz",
          status: "pending",
        },
      }
    );
  }
}

    return res.json({
      score,
      passed,
      minPassPercentage: course.minPassPercentage,
      currentUnitOrder: enrollment.currentUnitOrder,
      recommendedStyle: enrollment.recommendedStyle,
    });
  } catch (e) {
    console.error("submitUnitQuiz error:", e);
    return res.status(500).json({ error: e.message });
  }
};

// ADMIN: list enrolled students + their profile details
exports.getEnrollments = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrollments = await CourseEnrollment.findAll({
      where: { courseId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role"],
          include: [
            {
              model: StudentProfile,
              attributes: ["currentLevel", "preferredLanguage", "learningStyle", "lastCompetencyScore"],
              required: false,
            },
          ],
        },
      ],
    });

    const students = enrollments.map((e) => ({
      enrollmentId: e.id,
      status: e.status,
      currentUnitOrder: e.currentUnitOrder,
      lastQuizScore: e.lastQuizScore,
      recommendedStyle: e.recommendedStyle,
      enrolledAt: e.createdAt,
      user: {
        id: e.User?.id,
        name: e.User?.name,
        email: e.User?.email,
        role: e.User?.role,
        profile: e.User?.StudentProfile || null,
      },
    }));

    return res.json({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        subject: course.subject,
        durationMinutes: course.durationMinutes,
        minPassPercentage: course.minPassPercentage,
      },
      students,
    });
  } catch (e) {
    console.error("getEnrollments error:", e);
    return res.status(500).json({ error: e.message });
  }
};
exports.getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const enrollments = await CourseEnrollment.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      include: [
        {
          model: Course,
          attributes: ["courseId", "courseName", "subject", "durationMinutes", "minPassPercentage"],
        },
      ],
    });

    const items = enrollments.map((e) => ({
      enrollmentId: e.id,
      status: e.status,
      currentUnitOrder: e.currentUnitOrder,
      lastQuizScore: e.lastQuizScore,
      recommendedStyle: e.recommendedStyle,
      updatedAt: e.updatedAt,
      course: e.Course || null,
    }));

    return res.json({ enrollments: items });
  } catch (e) {
    console.error("getMyEnrollments error:", e);
    return res.status(500).json({ error: e.message });
  }
};


async function ensurePlacementQuestions(course) {
  const existing = await CoursePlacementQuestion.findAll({
    where: { courseId: course.courseId },
    order: [["createdAt", "ASC"]],
  });

  if (existing.length >= 5) return existing;

  // Generate a mixed-difficulty set to estimate level
  const topic = `${course.courseName} placement test`;
  const generated = [
    ...(await generateAIQuestions({ subject: course.subject, topic, difficultyLevel: "easy", count: 2 })),
    ...(await generateAIQuestions({ subject: course.subject, topic, difficultyLevel: "medium", count: 2 })),
    ...(await generateAIQuestions({ subject: course.subject, topic, difficultyLevel: "hard", count: 1 })),
  ];

  await CoursePlacementQuestion.destroy({ where: { courseId: course.courseId } });

  const saved = await CoursePlacementQuestion.bulkCreate(
    generated.map((q, idx) => ({
      courseId: course.courseId,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation || "",
      difficulty: idx < 2 ? "easy" : idx < 4 ? "medium" : "hard",
    }))
  );

  return saved;
}

function scoreToRecommendedStyle(score, profileStyle) {
  if (score < 40) return "Practice";
  return profileStyle || "Text";
}

exports.getPlacementTest = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user.userId;

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrollment = await CourseEnrollment.findOne({ where: { userId, courseId } });
    if (!enrollment) return res.status(400).json({ error: "Not enrolled" });

    if (enrollment.placementCompletedAt) {
      return res.json({
        completed: true,
        placementScore: enrollment.placementScore ?? 0,
        placementCompletedAt: enrollment.placementCompletedAt,
      });
    }

    const qs = await ensurePlacementQuestions(course);

    return res.json({
      completed: false,
      questions: qs.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      })),
    });
  } catch (e) {
    console.error("getPlacementTest error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.submitPlacementTest = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user.userId;
    const { answers } = req.body || {};

    if (!Array.isArray(answers) || answers.length === 0) return res.status(400).json({ error: "answers required" });

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrollment = await CourseEnrollment.findOne({ where: { userId, courseId } });
    if (!enrollment) return res.status(400).json({ error: "Not enrolled" });

    if (enrollment.placementCompletedAt) {
      return res.json({
        alreadyCompleted: true,
        placementScore: enrollment.placementScore ?? 0,
      });
    }

    const questionIds = answers.map((a) => Number(a.questionId)).filter(Boolean);
    const questions = await CoursePlacementQuestion.findAll({ where: { id: questionIds, courseId } });
    const byId = new Map(questions.map((q) => [q.id, q]));

    let correct = 0;
    const normalized = answers
      .map((a) => {
        const q = byId.get(Number(a.questionId));
        if (!q) return null;

        const selected = String(a.selectedOption || "").toUpperCase();
        if (!["A", "B", "C", "D"].includes(selected)) return null;

        const isCorrect = selected === q.correctOption;
        if (isCorrect) correct += 1;

        return { questionId: q.id, selectedOption: selected, isCorrect };
      })
      .filter(Boolean);

    if (normalized.length === 0) return res.status(400).json({ error: "No valid answers found" });

    const score = Math.round((correct / normalized.length) * 100);

    const attempt = await CoursePlacementAttempt.create({
      enrollmentId: enrollment.id,
      courseId,
      score,
      completedAt: new Date(),
    });

    await CoursePlacementAnswer.bulkCreate(
      normalized.map((a) => ({
        attemptId: attempt.id,
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        isCorrect: a.isCorrect,
      }))
    );

    const profile = await StudentProfile.findOne({ where: { userId } });
    const recommendedStyle = scoreToRecommendedStyle(score, profile?.learningStyle);

    enrollment.placementScore = score;
    enrollment.placementCompletedAt = new Date();
    enrollment.recommendedStyle = recommendedStyle;
    await enrollment.save();
// If the course only has Unit 1, auto-generate the remaining units now
try {
  await ensureCourseHasEnoughUnits({ course, competenceScore: score });
} catch (genErr) {
  console.error("Unit auto-generation failed:", genErr);
  // Don’t fail placement submission; student can still proceed with Unit 1.
}
    return res.json({
      score,
      recommendedStyle,
    });
  } catch (e) {
    console.error("submitPlacementTest error:", e);
    return res.status(500).json({ error: e.message });
  }
};