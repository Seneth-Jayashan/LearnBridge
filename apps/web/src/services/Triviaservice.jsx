const BASE_URL = "https://opentdb.com";

const triviaService = {

  async fetchCategories() {
    const res = await fetch(`${BASE_URL}/api_category.php`);
    const data = await res.json();
    return data.trivia_categories; // [{ id, name }]
  },

  async fetchQuestions({ amount = 10, category = "", difficulty = "", type = "multiple" }) {
    const params = new URLSearchParams({ amount, type, encode: "url3986" });
    if (category)   params.append("category", category);
    if (difficulty) params.append("difficulty", difficulty);

    const res = await fetch(`${BASE_URL}/api.php?${params}`);
    const data = await res.json();

    if (data.response_code === 1) throw new Error("Not enough questions for this filter combination.");
    if (data.response_code === 2) throw new Error("Invalid parameters sent to Trivia API.");
    if (data.response_code === 5) throw new Error("Too many requests. Please wait 5 seconds and try again.");
    if (data.response_code !== 0) throw new Error(`Trivia API error: code ${data.response_code}`);

    return data.results.map((q) => transformQuestion(q));
  },
};

// Transforms Trivia API shape → your questionSchema shape
function transformQuestion(q) {
  const decode = (str) => decodeURIComponent(str);

  // Shuffle incorrect + correct answers together into 4 options
  const allOptions = [...q.incorrect_answers, q.correct_answer].map(decode);
  const shuffled = allOptions.sort(() => Math.random() - 0.5);

  // Ensure exactly 4 options (true/false questions only have 2)
  while (shuffled.length < 4) shuffled.push("");

  const correctAnswer = shuffled.indexOf(decode(q.correct_answer));

  return {
    questionText: decode(q.question),
    options: shuffled.slice(0, 4),
    correctAnswer,
  };
}

export default triviaService;