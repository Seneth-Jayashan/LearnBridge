import Groq from "groq-sdk";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PDFParser = require("pdf2json");


// Controller function -> called when user uploads a PDF
export const generateQuestionsFromPDF = async (req, res) => {
  try {

    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { amount, difficulty } = req.body;
    const file = req.file;


    // ───────── DEBUG LOGS (for checking if everything arrives correctly) ─────────
    console.log("✅ PDF route hit");
    console.log("📦 Amount:", amount);
    console.log("🎯 Difficulty:", difficulty);
    console.log("📄 File received:", !!file);
    console.log("🔑 Groq Key present:", !!process.env.GROQ_API_KEY);


    // If no file uploaded -> stop request
    if (!file) {
      return res.status(400).json({ message: "No PDF uploaded." });
    }


    // ───────── STEP 1: EXTRACT TEXT FROM PDF ─────────
    
    const extractedText = await new Promise((resolve, reject) => {

      
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on("pdfParser_dataError", (errData) => {
        reject(new Error(errData.parserError));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      });

      const pdfBuffer = file.buffer;
      pdfParser.parseBuffer(pdfBuffer);
    });


    // If text is too short -> probably scanned PDF (images not text)
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        message:
          "Could not extract text from PDF. The PDF may be scanned (image-based).",
      });
    }

    console.log("📝 Extracted text length:", extractedText.length);


    // ───────── STEP 2: PREPARE AI DIFFICULTY INSTRUCTION ─────────
    // Convert selected difficulty into human-readable instruction for AI
    const difficultyInstruction =
      difficulty === "easy"
        ? "simple and straightforward"
        : difficulty === "medium"
          ? "moderately challenging"
          : "challenging and detailed";


    // ───────── STEP 3: SEND TEXT TO GROQ AI ─────────
    // Ask AI to generate MCQ questions from the document
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
${extractedText.trim().slice(0, 8000)}`, // send only first 8000 chars to avoid token overflow
        },
      ],

      temperature: 0.7,  // creativity level
      max_tokens: 4000,  // response size limit
    });


    // ───────── STEP 4: CLEAN AI RESPONSE ─────────
    // Sometimes AI wraps JSON inside ```json ```
    const rawText = completion.choices[0].message.content;

    // Remove markdown code blocks
    const clean = rawText.replace(/```json|```/g, "").trim();

    // Convert string JSON → JavaScript object
    const questions = JSON.parse(clean);


    // ───────── STEP 5: RETURN QUESTIONS TO FRONTEND ─────────
    return res.status(200).json({ questions });

  } catch (error) {

    // If anything fails (AI error, parsing error, API key missing, etc.)
    console.error("❌ ERROR:", error.message);

    return res.status(500).json({
      message: "Failed to generate questions.",
      error: error.message,
    });
  }
};