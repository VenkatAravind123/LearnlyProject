const axios = require("axios");

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2"; // recommend local model for reliability

function stripCodeFences(text) {
  if (!text) return "";
  return String(text).replace(/```json/gi, "").replace(/```/g, "").trim();
}

function extractJson(text) {
  const cleaned = stripCodeFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const startObj = cleaned.indexOf("{");
  const endObj = cleaned.lastIndexOf("}");
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    return JSON.parse(cleaned.slice(startObj, endObj + 1));
  }
  throw new Error("Planner did not return valid JSON.");
}

function isHHMM(s) {
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

function clampInt(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.round(x)));
}

function validateSchedule(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (!Array.isArray(obj.days)) return false;

  for (const day of obj.days) {
    if (!day || typeof day !== "object") return false;
    if (typeof day.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) return false;
    if (!Array.isArray(day.tasks)) return false;

    for (const t of day.tasks) {
      if (!t || typeof t !== "object") return false;
      if (!isHHMM(t.startTime)) return false;
      if (!["study", "practice", "review", "quiz"].includes(t.type)) return false;
      const dur = Number(t.durationMin);
      if (!Number.isFinite(dur) || dur < 10 || dur > 180) return false;
      if (typeof t.title !== "string" || !t.title.trim()) return false;
    }
  }
  return true;
}

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysLocalISO(dateISO, days) {
  const [y, m, d] = dateISO.split("-").map((v) => Number(v));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function startTimeFor(preferredTime) {
  switch (preferredTime) {
    case "morning":
      return "07:00";
    case "afternoon":
      return "13:00";
    case "evening":
      return "19:00";
    default:
      return "19:00";
  }
}

// Deterministic fallback schedule (works even if Ollama is down)
function generateFallbackSchedule({ startDate, days, dailyMinutes, preferredTime, focusItems }) {
  const perDayTasks = dailyMinutes <= 35 ? 1 : 2;
  const chunk = perDayTasks === 1 ? dailyMinutes : Math.max(20, Math.floor(dailyMinutes / 2));
  const startTime = startTimeFor(preferredTime);

  const result = [];
  let cursor = 0;

  for (let i = 0; i < days; i++) {
    const date = addDaysLocalISO(startDate, i);
    const tasks = [];

    for (let j = 0; j < perDayTasks; j++) {
      const item = focusItems[cursor % Math.max(1, focusItems.length)];
      cursor++;

      const typeCycle = ["study", "practice", "review", "quiz"];
      const type = typeCycle[(i + j) % typeCycle.length];

      const title = item
        ? `${type.toUpperCase()}: ${item.courseName} — ${item.nextUnitTitle || `Unit ${item.currentUnitOrder}`}`
        : `${type.toUpperCase()}: Practice fundamentals`;

      tasks.push({
        startTime,
        durationMin: clampInt(chunk, 15, 90, 30),
        title,
        type,
      });
    }

    result.push({ date, tasks });
  }

  return { days: result };
}

async function callOllamaJSON(prompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

  const url = `${String(baseUrl).replace(/\/$/, "")}/api/chat`;

  const res = await axios.post(
    url,
    {
      model,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No markdown." },
        { role: "user", content: prompt },
      ],
      options: { temperature: 0.4 },
    },
    { headers: { "Content-Type": "application/json" }, timeout: Number(process.env.OLLAMA_TIMEOUT_MS) || 180000 }
  );

  return res?.data?.message?.content || "";
}

async function generateScheduleWithAIOrFallback(input) {
  const {
    startDate,
    days,
    dailyMinutes,
    preferredTime,
    goal,
    profile,
    focusItems,
  } = input;

  const fallback = generateFallbackSchedule({ startDate, days, dailyMinutes, preferredTime, focusItems });

  // If Ollama not configured, just use fallback
  if (!process.env.OLLAMA_BASE_URL && !process.env.OLLAMA_MODEL) return fallback;

  const context = {
    startDate,
    days,
    dailyMinutes,
    preferredTime,
    goal,
    profile,
    focusItems: (focusItems || []).map((x) => ({
      courseId: x.courseId,
      courseName: x.courseName,
      subject: x.subject,
      currentUnitOrder: x.currentUnitOrder,
      nextUnitTitle: x.nextUnitTitle || null,
      lastQuizScore: x.lastQuizScore,
    })),
  };

  const prompt = `
Create a realistic study schedule for the next ${days} days starting ${startDate}.
Total study time per day: ${dailyMinutes} minutes.
Preferred time of day: ${preferredTime}.

Student profile:
- Level: ${profile?.currentLevel || "Beginner"}
- Learning style: ${profile?.learningStyle || "Text"}
- Competence score: ${Number(profile?.lastCompetencyScore || 0)}

Goal: ${goal}

Courses to focus (in priority order):
${JSON.stringify(context.focusItems, null, 2)}

Return ONLY this JSON shape:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "tasks": [
        { "startTime": "HH:MM", "durationMin": 30, "title": "string", "type": "study|practice|review|quiz" }
      ]
    }
  ]
}

Rules:
- Keep exactly ${days} day entries (one per date).
- 1-2 tasks per day depending on minutes (<=35 => 1 task, else 2 tasks).
- Task durations must sum to <= dailyMinutes.
- Keep titles short and actionable.
`.trim();

  try {
    const raw = await callOllamaJSON(prompt);
    const obj = extractJson(raw);
    if (!validateSchedule(obj)) return fallback;

    // enforce time budget and sanitize
    const sanitized = {
      days: obj.days.slice(0, days).map((day) => {
        let remaining = dailyMinutes;
        const tasks = (day.tasks || []).slice(0, dailyMinutes <= 35 ? 1 : 2).map((t) => {
          const dur = clampInt(t.durationMin, 10, remaining, Math.min(30, remaining));
          remaining -= dur;
          return {
            startTime: isHHMM(t.startTime) ? t.startTime : startTimeFor(preferredTime),
            durationMin: dur,
            title: String(t.title || "Study session").slice(0, 140),
            type: ["study", "practice", "review", "quiz"].includes(t.type) ? t.type : "study",
          };
        });

        return { date: day.date, tasks: tasks.length ? tasks : fallback.days.find((d) => d.date === day.date)?.tasks || [] };
      }),
    };

    if (!validateSchedule(sanitized)) return fallback;
    return sanitized;
  } catch (_) {
    return fallback;
  }
}

module.exports = { todayLocalISO, addDaysLocalISO, generateScheduleWithAIOrFallback };