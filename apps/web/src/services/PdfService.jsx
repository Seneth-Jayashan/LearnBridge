import api from "../api/Axios";

const pdfService = {
  async generateQuestionsFromPDF(pdfBase64, amount, difficulty) {
    const response = await api.post("/pdf/generate-from-pdf", {
      pdfBase64,
      amount,
      difficulty,
    });
    return response.data; // { questions: [...] }
  },
};

export default pdfService;