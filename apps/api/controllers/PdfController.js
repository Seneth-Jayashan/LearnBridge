import Groq from "groq-sdk";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PDFParser = require("pdf2json");

export const generateQuestionsFromPDF = async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // ⬇️ NOW WE READ FROM MULTER
    const { amount, difficulty } = req.body;
    const file = req.file;

    console.log("✅ PDF route hit");
    console.log("📦 Amount:", amount);
    console.log("🎯 Difficulty:", difficulty);
    console.log("📄 File received:", !!file);
    console.log("🔑 Groq Key present:", !!process.env.GROQ_API_KEY);

    // If no file uploaded
    if (!file) {
      return res.status(400).json({ message: "No PDF uploaded." });
    }

    // ── Extract text from PDF ─────────────────────────────
    const extractedText = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on("pdfParser_dataError", (errData) => {
        reject(new Error(errData.parserError));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      });

      // ⭐ HERE IS THE REAL FIX
      const pdfBuffer = file.buffer;
      pdfParser.parseBuffer(pdfBuffer);
    });

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        message:
          "Could not extract text from PDF. The PDF may be scanned (image-based).",
      });
    }

    console.log("📝 Extracted text length:", extractedText.length);

    // Difficulty text
    const difficultyInstruction =
      difficulty === "easy"
        ? "simple and straightforward"
        : difficulty === "medium"
          ? "moderately challenging"
          : "challenging and detailed";

    // ── Send to Groq AI ──────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are a quiz generator. Read the following document content carefully and generate exactly ${amount} multiple choice questions based on it.

Requirements:
- Each question must be ${difficultyInstruction}
- Each question must have exactly 4 options
- Only one option correct
- No explanations

Return ONLY valid JSON array:

[
  {
    "questionText": "Question here?",
    "options": ["A","B","C","D"],
    "correctAnswer": 0
  }
]

Document:
${extractedText.trim().slice(0, 8000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawText = completion.choices[0].message.content;
    const clean = rawText.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    return res.status(200).json({ questions });
  } catch (error) {
    console.error("❌ ERROR:", error.message);

    return res.status(500).json({
      message: "Failed to generate questions.",
      error: error.message,
    });
  }
};
