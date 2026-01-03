const axios = require("axios");

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2:3b";

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
  throw new Error("LLM did not return valid JSON.");
}

function validateDashboard(ai) {
  if (!ai || typeof ai !== "object") return false;

  const okArray = (x) => Array.isArray(x) && x.every((s) => typeof s === "string" && s.trim());

  if (typeof ai.todaysFocus !== "string") return false;
  if (!okArray(ai.recentActivity)) return false;
  if (!okArray(ai.recommended)) return false;

  // progress should be array of { title, pct }
  if (!Array.isArray(ai.progress)) return false;
  for (const p of ai.progress) {
    if (typeof p?.title !== "string") return false;
    const pct = Number(p?.pct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return false;
  }

  return true;
}

async function generateDashboardSummary(context) {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

  const prompt = `
You generate a student dashboard summary as STRICT JSON.

Use the context below (it is JSON):
${JSON.stringify(context)}

Return ONLY this JSON object shape:
{
  "todaysFocus": "string",
  "recentActivity": ["string", "string", "string"],
  "progress": [
    { "title": "string", "pct": 0 }
  ],
  "recommended": ["string", "string", "string"]
}

Rules:
- Use enrolled courses and lastQuizScore/currentUnitOrder when available.
- If no enrollments exist, recommend starting a course and taking competence test.
- Keep text short and actionable.
- pct must be 0..100 (use lastQuizScore as proxy if needed).
Return ONLY JSON.
`.trim();

  const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;
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
      options: { temperature: 0.5 },
    },
    { headers: { "Content-Type": "application/json" }, timeout: 60000 }
  );

  const raw = res?.data?.message?.content || "";
  const ai = extractJson(raw);

  if (!validateDashboard(ai)) {
    throw new Error("AI dashboard JSON failed validation.");
  }

  return ai;
}

module.exports = { generateDashboardSummary };