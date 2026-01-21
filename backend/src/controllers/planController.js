const { Op } = require("sequelize");
const sequelize = require("../config/db");

const LearningPlan = require("../models/LearningPlan");
const LearningPlanTask = require("../models/LearningPlanTask");
const CourseEnrollment = require("../models/CourseEnrollment");
const Course = require("../models/Course");
const CourseUnit = require("../models/CourseUnit");

const { todayLocalISO, addDaysLocalISO } = require("../services/learningPlanAgentService");
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
function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function startTimeFor(preferredTime) {
  switch (preferredTime) {
    case "morning": return "07:00";
    case "afternoon": return "13:00";
    case "evening": return "19:00";
    default: return "19:00";
  }
}

async function markOverdueAsMissed(planId, transaction) {
  const today = todayLocalISO();
  const opts = {
    where: { planId, status: "pending", date: { [Op.lt]: today } },
  };
  if (transaction) opts.transaction = transaction;

  await LearningPlanTask.update({ status: "missed" }, opts);
}

function tasksPerDayForMinutes(dailyMinutes) {
  const n = Number(dailyMinutes || 0);
  return n <= 35 ? 1 : 2;
}

function computeStats(tasks, today) {
  const counts = { pending: 0, completed: 0, skipped: 0, missed: 0 };
  for (const t of tasks || []) {
    if (counts[t.status] !== undefined) counts[t.status] += 1;
  }

  const total = (tasks || []).length;
  return {
    total,
    ...counts,
    completedPct: total ? Math.round((counts.completed / total) * 100) : 0,
    missedPct: total ? Math.round((counts.missed / total) * 100) : 0,
    todayPending: (tasks || []).filter((t) => t.date === today && t.status === "pending").length,
  };
}

function pickNextTask(tasks, today) {
  return (tasks || []).find((t) => t.status === "pending" && String(t.date) >= String(today)) || null;
}
// Creates a deterministic “unit-by-unit” schedule so we can track parts reliably.
function buildCourseScheduleTasks({ planId, courseId, units, startUnitOrder, days, dailyMinutes, preferredTime }) {
  const tasksPerDay = dailyMinutes <= 35 ? 1 : 2;
  const startTime = startTimeFor(preferredTime);

  const remainingUnits = units.filter((u) => u.order >= startUnitOrder);
  const tasks = [];

  let unitIndex = 0;

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const date = addDaysLocalISO(todayLocalISO(), dayIndex);

    if (unitIndex >= remainingUnits.length) {
      // after finishing all units, do review days
      tasks.push({
        planId,
        courseId,
        date,
        startTime,
        durationMin: Math.min(dailyMinutes, 45),
        title: "REVIEW: Revise key concepts + flashcards",
        type: "review",
        status: "pending",
      });
      continue;
    }

    const unit = remainingUnits[unitIndex];

    if (tasksPerDay === 1) {
      // Alternate: study day then quiz day for the SAME unit
      const isStudyDay = dayIndex % 2 === 0;

      tasks.push({
        planId,
        courseId,
        unitId: unit.id,
        unitOrder: unit.order,
        date,
        startTime,
        durationMin: dailyMinutes,
        title: isStudyDay ? `STUDY: Unit ${unit.order} — ${unit.title}` : `QUIZ: Unit ${unit.order} — ${unit.title}`,
        type: isStudyDay ? "study" : "quiz",
        status: "pending",
      });

      if (!isStudyDay) unitIndex += 1;
    } else {
      // Same day: study + quiz for a unit (best tracking)
      const studyMin = Math.max(20, Math.floor(dailyMinutes * 0.65));
      const quizMin = Math.max(15, dailyMinutes - studyMin);

      tasks.push({
        planId,
        courseId,
        unitId: unit.id,
        unitOrder: unit.order,
        date,
        startTime,
        durationMin: studyMin,
        title: `STUDY: Unit ${unit.order} — ${unit.title}`,
        type: "study",
        status: "pending",
      });

      tasks.push({
        planId,
        courseId,
        unitId: unit.id,
        unitOrder: unit.order,
        date,
        startTime,
        durationMin: quizMin,
        title: `QUIZ: Unit ${unit.order} — ${unit.title}`,
        type: "quiz",
        status: "pending",
      });

      unitIndex += 1;
    }
  }

  return tasks;
}

exports.generatePlan = async (req, res) => {
  try {
    const userId = req.user.userId;

    const courseId = req.body?.courseId ? Number(req.body.courseId) : null;

    const days = Math.max(7, Math.min(30, toInt(req.body?.days, 14)));
    const dailyMinutes = Math.max(15, Math.min(180, toInt(req.body?.dailyMinutes, 30)));
    const preferredTime = ["morning", "afternoon", "evening", "any"].includes(req.body?.preferredTime)
      ? req.body.preferredTime
      : "evening";

    let goal = String(req.body?.goal || "").trim();

    if (courseId) {
      const course = await Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // Ensure enrollment exists (like your CourseLearn behavior)
      const [enrollment] = await CourseEnrollment.findOrCreate({
        where: { userId, courseId },
        defaults: { userId, courseId, currentUnitOrder: 1, lastQuizScore: 0, recommendedStyle: "Text" },
      });

      const units = await CourseUnit.findAll({
        where: { courseId },
        order: [["order", "ASC"]],
      });

      if (units.length === 0) return res.status(400).json({ error: "This course has no units yet." });

      if (!goal) goal = `Complete course: ${course.courseName}`;

      // Archive only the active plan for THIS course
      await LearningPlan.update(
        { status: "archived" },
        { where: { userId, status: "active", courseId } }
      );

      const plan = await LearningPlan.create({
        userId,
        courseId,
        goal,
        days,
        dailyMinutes,
        preferredTime,
        status: "active",
      });

      const tasksToCreate = buildCourseScheduleTasks({
        planId: plan.id,
        courseId,
        units,
        startUnitOrder: enrollment.currentUnitOrder || 1,
        days,
        dailyMinutes,
        preferredTime,
      });

      await LearningPlanTask.bulkCreate(tasksToCreate);

      const tasks = await LearningPlanTask.findAll({
        where: { planId: plan.id },
        order: [["date", "ASC"], ["startTime", "ASC"], ["id", "ASC"]],
      });

      return res.status(201).json({ plan, tasks });
    }

    // GLOBAL plan (no courseId)
    if (!goal) goal = "Complete my enrolled courses";

    await LearningPlan.update(
      { status: "archived" },
      { where: { userId, status: "active", courseId: null } }
    );

    const plan = await LearningPlan.create({
      userId,
      courseId: null,
      goal,
      days,
      dailyMinutes,
      preferredTime,
      status: "active",
    });

    // Simple global task list (no unit mapping)
    const startTime = startTimeFor(preferredTime);
    const tasksToCreate = [];
    for (let i = 0; i < days; i++) {
      const date = addDaysLocalISO(todayLocalISO(), i);
      tasksToCreate.push({
        planId: plan.id,
        courseId: null,
        date,
        startTime,
        durationMin: dailyMinutes,
        title: "STUDY: Continue your enrolled courses (next unit)",
        type: "study",
        status: "pending",
      });
    }

    await LearningPlanTask.bulkCreate(tasksToCreate);

    const tasks = await LearningPlanTask.findAll({
      where: { planId: plan.id },
      order: [["date", "ASC"], ["startTime", "ASC"]],
    });

    return res.status(201).json({ plan, tasks });
  } catch (e) {
    console.error("generatePlan error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.getActivePlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const courseId = req.query?.courseId ? Number(req.query.courseId) : null;

    const plan = await LearningPlan.findOne({
      where: { userId, status: "active", courseId },
      order: [["createdAt", "DESC"]],
    });

    if (!plan) return res.json({ plan: null, tasks: [], today: todayLocalISO(), stats: null, nextTask: null });

    await markOverdueAsMissed(plan.id);

    const tasks = await LearningPlanTask.findAll({
      where: { planId: plan.id },
      order: [["date", "ASC"], ["startTime", "ASC"], ["id", "ASC"]],
    });

    const today = todayLocalISO();
    const stats = computeStats(tasks, today);
    const nextTask = pickNextTask(tasks, today);

    return res.json({ plan, tasks, today, stats, nextTask });
  } catch (e) {
    console.error("getActivePlan error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.rescheduleMissed = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId;
    const courseId = req.body?.courseId ? Number(req.body.courseId) : null;
    const today = todayLocalISO();

    const plan = await LearningPlan.findOne({
      where: { userId, status: "active", courseId },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (!plan) {
      await t.rollback();
      return res.status(404).json({ error: "No active plan found" });
    }

    await markOverdueAsMissed(plan.id, t);

    const tasks = await LearningPlanTask.findAll({
      where: { planId: plan.id },
      order: [["date", "ASC"], ["startTime", "ASC"], ["id", "ASC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const capacityPerDay = tasksPerDayForMinutes(plan.dailyMinutes);
    const missed = tasks.filter((x) => x.status === "missed");

    if (!missed.length) {
      await t.commit();
      return res.json({ ok: true, moved: 0 });
    }

    const dateCounts = new Map();
    for (const task of tasks) {
      if (task.status !== "pending") continue;
      const key = String(task.date);
      dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
    }

    let cursor = today;
    for (const task of missed) {
      while ((dateCounts.get(cursor) || 0) >= capacityPerDay) {
        cursor = addDaysLocalISO(cursor, 1);
      }

      task.date = cursor;
      task.status = "pending";
      task.completedAt = null;
      await task.save({ transaction: t });

      dateCounts.set(cursor, (dateCounts.get(cursor) || 0) + 1);
    }

    await t.commit();
    return res.json({ ok: true, moved: missed.length });
  } catch (e) {
    await t.rollback();
    console.error("rescheduleMissed error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = Number(req.params.taskId);

    const task = await LearningPlanTask.findByPk(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const plan = await LearningPlan.findByPk(task.planId);
    if (!plan || plan.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    // If it is a course quiz task, advance enrollment (this keeps “course part status” synced)
    if (task.type === "quiz" && task.courseId && task.unitOrder) {
      const enrollment = await CourseEnrollment.findOne({ where: { userId, courseId: task.courseId } });
      if (enrollment) {
        const maxOrder = await CourseUnit.max("order", { where: { courseId: task.courseId } });

        if ((enrollment.currentUnitOrder || 1) <= task.unitOrder) {
          enrollment.currentUnitOrder = task.unitOrder + 1;
          if (maxOrder && enrollment.currentUnitOrder > maxOrder) enrollment.status = "completed";
          await enrollment.save();
        }
      }
    }

    return res.json({ ok: true, task });
  } catch (e) {
    console.error("completeTask error:", e);
    return res.status(500).json({ error: e.message });
  }
};

exports.skipTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = Number(req.params.taskId);

    const task = await LearningPlanTask.findByPk(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const plan = await LearningPlan.findByPk(task.planId);
    if (!plan || plan.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    task.status = "skipped";
    await task.save();

    return res.json({ ok: true, task });
  } catch (e) {
    console.error("skipTask error:", e);
    return res.status(500).json({ error: e.message });
  }
};