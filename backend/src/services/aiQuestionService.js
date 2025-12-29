const axios = require("axios");
const validateQuestions = require("../utils/validateAIQuestions");

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2:3b";

function buildPrompt({ subject, topic, difficultyLevel, count }) {
  return `
You are an educational assessment expert.

Generate EXACTLY ${count} multiple-choice questions for:
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${difficultyLevel}

Rules:
- Output MUST be valid JSON (no markdown, no backticks, no commentary).
- Output MUST be a JSON array of length ${count}.
- Each item MUST match this shape:

{
  "questionText": "string",
  "optionA": "string",
  "optionB": "string",
  "optionC": "string",
  "optionD": "string",
  "correctOption": "A" | "B" | "C" | "D",
  "explanation": "string"
}

Return ONLY the JSON array.
`.trim();
}

function stripCodeFences(text) {
  if (!text) return "";
  return String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extractJsonArray(text) {
  const cleaned = stripCodeFences(text);

  // First try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (_) {
    // Try to salvage the first JSON array in the text
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("LLM did not return a JSON array.");
    }
    const slice = cleaned.slice(start, end + 1);
    return JSON.parse(slice);
  }
}

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function normalizeCorrectOption(rawCorrectOption, options) {
  const letters = ["A", "B", "C", "D"];

  // number index 0-3
  if (typeof rawCorrectOption === "number" && rawCorrectOption >= 0 && rawCorrectOption <= 3) {
    return letters[rawCorrectOption];
  }

  const s = toStr(rawCorrectOption).toUpperCase();

  // "A"/"B"/"C"/"D"
  if (["A", "B", "C", "D"].includes(s)) return s;

  // "0"-"3"
  if (/^[0-3]$/.test(s)) return letters[Number(s)];

  // If model returned the full answer text, map it to a letter
  const idx = options.findIndex((o) => toStr(o).toLowerCase() === s.toLowerCase());
  if (idx >= 0 && idx <= 3) return letters[idx];

  return "";
}

function normalizeQuestion(q) {
  const options = Array.isArray(q?.options)
    ? q.options
    : [q?.optionA, q?.optionB, q?.optionC, q?.optionD];

  const optionA = toStr(options[0] ?? q?.optionA);
  const optionB = toStr(options[1] ?? q?.optionB);
  const optionC = toStr(options[2] ?? q?.optionC);
  const optionD = toStr(options[3] ?? q?.optionD);

  const correctOption = normalizeCorrectOption(q?.correctOption, [optionA, optionB, optionC, optionD]);

  return {
    questionText: toStr(q?.questionText ?? q?.question),
    optionA,
    optionB,
    optionC,
    optionD,
    correctOption,
    explanation: toStr(q?.explanation),
  };
}

async function callOllamaChat({ baseUrl, model, prompt }) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;
  const res = await axios.post(
    url,
    {
      model,
      stream: false,
      messages: [
        { role: "system", content: "You output only valid JSON." },
        { role: "user", content: prompt },
      ],
      options: { temperature: 0.7 },
    },
    { headers: { "Content-Type": "application/json" } }
  );

  return res?.data?.message?.content || "";
}

async function callOllamaGenerate({ baseUrl, model, prompt }) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/generate`;
  const res = await axios.post(
    url,
    { model, prompt, stream: false, options: { temperature: 0.7 } },
    { headers: { "Content-Type": "application/json" } }
  );

  return res?.data?.response || "";
}

async function generateAIQuestions({ subject, topic, difficultyLevel, count }) {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

  if (!subject || !topic || !difficultyLevel) {
    throw new Error("generateAIQuestions: subject/topic/difficultyLevel are required");
  }
  if (!count || Number(count) < 1) {
    throw new Error("generateAIQuestions: count must be >= 1");
  }

  const prompt = buildPrompt({ subject, topic, difficultyLevel, count: Number(count) });

  let rawText = "";
  try {
    rawText = await callOllamaChat({ baseUrl, model, prompt });
  } catch (e) {
    // fallback for older ollama builds/configs
    rawText = await callOllamaGenerate({ baseUrl, model, prompt });
  }

  const arr = extractJsonArray(rawText);
  if (!Array.isArray(arr)) throw new Error("LLM output is not an array.");

  const normalized = arr.map(normalizeQuestion);

  // Enforce exact count + schema
  if (normalized.length !== Number(count)) {
    throw new Error(`LLM returned ${normalized.length} questions, expected ${count}.`);
  }
  if (!validateQuestions(normalized)) {
    throw new Error("LLM returned invalid question objects (missing fields or bad correctOption).");
  }

  return normalized;
}

module.exports = { generateAIQuestions };