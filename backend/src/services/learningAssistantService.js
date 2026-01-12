const axios = require("axios");
const pdfParse = require("pdf-parse"); // works with pdf-parse@1.1.1 (CommonJS)
const Tesseract = require("tesseract.js");

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "gpt-oss:120b-cloud";

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
  throw new Error("Assistant did not return valid JSON.");
}

function truncate(s, max = 12000) {
  const str = String(s || "");
  if (str.length <= max) return str;
  return str.slice(0, max) + "\n...[truncated]";
}

async function fileToText(file) {
  const mime = String(file?.mimetype || "").toLowerCase();

  // PDF -> text
  if (mime.includes("pdf")) {
    const data = await pdfParse(file.buffer);
    return data?.text || "";
  }

  // Images -> OCR text
  if (mime.startsWith("image/")) {
    const ocr = await Tesseract.recognize(file.buffer, "eng");
    return ocr?.data?.text || "";
  }

  // fallback (unknown)
  return "";
}

function validateAssistantResponse(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.simplifiedExplanation !== "string") return false;
  if (!Array.isArray(obj.keyPoints)) return false;
  if (!Array.isArray(obj.studyPlan)) return false;
  if (typeof obj.practice !== "object" || obj.practice === null) return false;
  if (!Array.isArray(obj.practice.flashcards)) return false;
  if (!Array.isArray(obj.practice.questions)) return false;
  return true;
}

async function callOllamaJSON(prompt) {
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
      options: { temperature: 0.5 },
    },
    { headers: { "Content-Type": "application/json" },
  timeout: Number(process.env.OLLAMA_TIMEOUT_MS) || 180000 }
  );

  return res?.data?.message?.content || "";
}

async function runLearningAssistant({ message, files, profile }) {
  const extractedChunks = [];

  for (const f of files || []) {
    const text = await fileToText(f);
    if (text && text.trim()) {
      extractedChunks.push(`FILE: ${f.originalname}\n${text}`);
    }
  }

  const combinedMaterial = truncate(extractedChunks.join("\n\n"));

  const prompt = `
You are a learning tutor. The user wants to understand the content.

Student profile:
- Level: ${profile?.currentLevel}
- Learning style: ${profile?.learningStyle} (Visual/Text/Practice)
- Preferred language: ${profile?.preferredLanguage}
- Competence score (0-100): ${profile?.lastCompetencyScore}

User question/message:
${message || "(no message)"}

Study material extracted from uploaded files (may be empty):
${combinedMaterial || "(no extracted text)"}

Return ONLY this JSON object:
{
  "simplifiedExplanation": "string",
  "keyPoints": ["string","string","string","string","string"],
  "studyPlan": ["string","string","string","string","string"],
  "practice": {
    "flashcards": [
      { "front": "string", "back": "string" },
      { "front": "string", "back": "string" },
      { "front": "string", "back": "string" }
    ],
    "questions": [
      { "q": "string", "a": "string" },
      { "q": "string", "a": "string" },
      { "q": "string", "a": "string" }
    ]
  }
}

Rules:
- Do NOT quote long passages from the material. Summarize and simplify.
- Adapt to learningStyle:
  - Visual: use analogies + structured bullets.
  - Text: clear explanation + definitions.
  - Practice: step-by-step + small exercises.
- Keep it beginner-friendly if competence score is low.
`.trim();

  const raw = await callOllamaJSON(prompt);
  const obj = extractJson(raw);

  if (!validateAssistantResponse(obj)) {
    throw new Error("Assistant JSON failed validation.");
  }

  return obj;
}

module.exports = { runLearningAssistant };