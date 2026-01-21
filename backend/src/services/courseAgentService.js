const axios = require("axios");
const validateFlashcards = require("../utils/validateFlashcards");

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

  const startArr = cleaned.indexOf("[");
  const endArr = cleaned.lastIndexOf("]");
  if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
    return JSON.parse(cleaned.slice(startArr, endArr + 1));
  }

  const startObj = cleaned.indexOf("{");
  const endObj = cleaned.lastIndexOf("}");
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    return JSON.parse(cleaned.slice(startObj, endObj + 1));
  }

  throw new Error("LLM did not return valid JSON.");
}

function scoreToLevel(score) {
  if (score >= 70) return "Advanced";
  if (score >= 40) return "Intermediate";
  return "Beginner";
}

function chooseDifficulty(score) {
  if (score >= 70) return "hard";
  if (score >= 40) return "medium";
  return "easy";
}

function chooseStyle({ profileStyle, lastQuizScore }) {
  if (lastQuizScore < 50) return "Practice";
  if (lastQuizScore < 75) return "Text";
  return profileStyle || "Text";
}

async function ollamaChatJSON(prompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

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
      options: { temperature: 0.6 },
    },
    { headers: { "Content-Type": "application/json" }, timeout: 60000 }
  );

  return res?.data?.message?.content || "";
}

async function generateUnitExplanation({
  subject,
  unitTitle,
  baseContent,
  competenceScore,
  lastQuizScore,
  learningStyle,
}) {
  const level = scoreToLevel(competenceScore);
  const style = chooseStyle({ profileStyle: learningStyle, lastQuizScore });

  const prompt = `
Create a teaching explanation for a student.

Context:
- Subject: ${subject}
- Unit: ${unitTitle}
- Student level: ${level}
- Preferred style: ${style}
- Last quiz score: ${lastQuizScore}/100
- Reference content (may be empty): ${baseContent || "(none)"}

Return JSON object exactly:
{
  "explanationText": "string",
  "recommendedStyle": "Visual" | "Text" | "Practice"
}

Return ONLY JSON.
`.trim();

  const raw = await ollamaChatJSON(prompt);
  const obj = extractJson(raw);

  return {
    explanationText: String(obj?.explanationText || "").trim(),
    recommendedStyle: obj?.recommendedStyle || style,
    difficulty: chooseDifficulty(competenceScore),
  };
}

async function generateFlashcards({ subject, unitTitle, competenceScore }) {
  const level = scoreToLevel(competenceScore);

  const prompt = `
Generate 6 flashcards.

Context:
- Subject: ${subject}
- Unit: ${unitTitle}
- Level: ${level}

Return ONLY a JSON array of 6 items:
[
  { "front": "string", "back": "string" }
]
`.trim();

  const raw = await ollamaChatJSON(prompt);
  const arr = extractJson(raw);

  if (!validateFlashcards(arr)) throw new Error("Invalid flashcards JSON.");
  return arr;
}

async function generateRemainingUnits({
  subject,
  courseName,
  courseDescription,
  existingUnitTitles,
  competenceScore,
  count,
}) {
  if (!count || count <= 0) return [];

  const level = scoreToLevel(Number(competenceScore || 0));

  const prompt = `
You are designing a course outline.

Course:
- Name: ${courseName}
- Subject: ${subject}
- Description: ${courseDescription || "(none)"}

Student level (from competence test): ${level}

Existing unit titles (do not repeat):
${(existingUnitTitles || []).map((t) => `- ${t}`).join("\n")}

Task:
Generate exactly ${count} NEW units continuing the course.

Return ONLY a JSON array like:
[
  { "title": "string", "baseContent": "string" }
]

Rules:
- No markdown.
- Do not include "Unit 2:" prefixes in the title.
- baseContent should be concise (bullets or short paragraphs) and good enough for AI lesson generation later.
`.trim();

  const raw = await ollamaChatJSON(prompt);
  const arr = extractJson(raw);

  if (!Array.isArray(arr)) throw new Error("Unit generation did not return an array.");

  const cleaned = arr
    .map((u) => ({
      title: String(u?.title || "").trim(),
      baseContent: String(u?.baseContent || "").trim(),
    }))
    .filter((u) => u.title.length >= 3);

  return cleaned.slice(0, count);
}

module.exports = { generateUnitExplanation, generateFlashcards, chooseDifficulty, chooseStyle, generateRemainingUnits };