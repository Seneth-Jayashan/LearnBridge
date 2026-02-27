import api from "../api/Axios";

const pdfService = {
  async generateQuestionsFromPDF(file, amount, difficulty) {
    // Create form-data
    const formData = new FormData();

    // IMPORTANT: name must match upload.single("pdf") in backend
    formData.append("pdf", file);

    // other fields
    formData.append("amount", amount);
    formData.append("difficulty", difficulty);

    // send multipart/form-data request
    const response = await api.post("/pdf/generate-from-pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data; // { questions: [...] }
  },
};

export default pdfService;