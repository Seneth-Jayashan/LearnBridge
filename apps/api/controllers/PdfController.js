import Groq from "groq-sdk";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PDFParser = require("pdf2json");

export const generateQuestionsFromPDF = async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { pdfBase64, amount, difficulty } = req.body;

    console.log("✅ PDF route hit");
    console.log("📦 Amount:", amount);
    console.log("🎯 Difficulty:", difficulty);
    console.log("📄 PDF data length:", pdfBase64?.length ?? "MISSING");
    console.log("🔑 Groq Key present:", !!process.env.GROQ_API_KEY);

    if (!pdfBase64) {
      return res.status(400).json({ message: "No PDF data received." });
    }

    // ── Extract text from PDF ──────────────────────────────────────
    const extractedText = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on("pdfParser_dataError", (errData) => {
        reject(new Error(errData.parserError));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      });

      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      pdfParser.parseBuffer(pdfBuffer);
    });

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ 
        message: "Could not extract text from PDF. Make sure it is not a scanned image." 
      });
    }

    console.log("📝 Extracted text length:", extractedText.length);

    const difficultyInstruction =
      difficulty === "easy"   ? "simple and straightforward" :
      difficulty === "medium" ? "moderately challenging" :
                                "challenging and detailed";

    // ── Send to Groq ───────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are a quiz generator. Read the following document content carefully and generate exactly ${amount} multiple choice questions based on it.

Requirements:
- Each question must be ${difficultyInstruction}
- Each question must have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Questions must be directly based on the document content
- Do NOT include any preamble, explanation, or markdown

Respond ONLY with a valid JSON array in this exact format with no extra text:
[
  {
    "questionText": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Where correctAnswer is the 0-based index of the correct option.

Document content:
${extractedText.trim().slice(0, 8000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawText = completion.choices[0].message.content;
    const clean = rawText.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    res.status(200).json({ questions });

  } catch (error) {
    console.error("❌ Full error:", JSON.stringify(error.response?.data ?? error.message, null, 2));
    res.status(500).json({
      message: "Failed to generate questions.",
      error: error.message,
      detail: error.response?.data,
    });
  }
};

