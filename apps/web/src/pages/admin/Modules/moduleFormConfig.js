export const SUBJECT_STREAMS = [
  "Mathematics Stream",
  "Biology Stream",
  "Commerce Stream",
  "Arts Stream",
  "Technology Stream",
];

const RECOMMENDATIONS = {
  primary: [
    "First Language (Sinhala / Tamil)",
    "English",
    "Mathematics",
    "Environmental Studies",
    "Religion (Buddhism / Hinduism / Islam / Christianity)",
    "Aesthetic Subjects (Art / Music / Dancing)",
    "Physical Education",
  ],
  junior: [
    "First Language (Sinhala / Tamil)",
    "Second National Language (Tamil / Sinhala)",
    "English",
    "Mathematics",
    "Science",
    "History",
    "Geography",
    "Religion",
    "Health & Physical Education",
    "Civic Education",
    "ICT",
    "Technology",
    "Aesthetic Subjects (Art / Music / Dancing / Drama)",
  ],
  senior: [
    "First Language (Sinhala / Tamil)",
    "English",
    "Mathematics",
    "Science",
    "History",
    "Religion",
    "Geography",
    "Civic Education",
    "Business & Accounting Studies",
    "ICT",
    "Agriculture",
    "Home Science",
    "Art",
    "Music",
    "Dancing",
    "Drama",
    "Entrepreneurship Studies",
    "Second National Language",
  ],
  advanced: {
    "Mathematics Stream": ["Combined Mathematics", "Physics", "Chemistry"],
    "Biology Stream": ["Biology", "Chemistry", "Physics"],
    "Commerce Stream": ["Accounting", "Business Studies", "Economics"],
    "Arts Stream": [
      "Political Science",
      "History",
      "Geography",
      "Sinhala / Tamil",
      "Logic",
      "Media Studies",
      "English Literature",
      "Religion-related subjects",
    ],
    "Technology Stream": ["Engineering Technology", "Bio Systems Technology", "Science for Technology", "ICT"],
  },
};

export const parseGradeNumber = (gradeName) => {
  const parsed = Number.parseInt(String(gradeName || "").trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getRecommendationTitle = (gradeNumber) => {
  if (gradeNumber === null) return "Recommended modules";
  if (gradeNumber >= 1 && gradeNumber <= 5) return "Recommended modules for Primary Education (Grade 1 – 5)";
  if (gradeNumber >= 6 && gradeNumber <= 9) return "Recommended modules for Junior Secondary (Grade 6 – 9)";
  if (gradeNumber >= 10 && gradeNumber <= 11) return "Recommended modules for Senior Secondary – G.C.E. O/L (Grade 10 – 11)";
  return "Recommended modules for Advanced Level – G.C.E. A/L (Grade 12 – 13)";
};

export const getRecommendations = (gradeNumber, subjectStream) => {
  if (gradeNumber === null) return [];
  if (gradeNumber >= 1 && gradeNumber <= 5) return RECOMMENDATIONS.primary;
  if (gradeNumber >= 6 && gradeNumber <= 9) return RECOMMENDATIONS.junior;
  if (gradeNumber >= 10 && gradeNumber <= 11) return RECOMMENDATIONS.senior;
  return RECOMMENDATIONS.advanced[subjectStream] || [];
};

const getLevelCategory = (levelName) => {
  const normalized = String(levelName || "").toLowerCase();
  if (normalized.includes("primary")) return "primary";
  if (normalized.includes("junior")) return "junior";
  if (normalized.includes("senior")) return "senior";
  if (normalized.includes("advanced") || normalized.includes("a/l")) return "advanced";
  return null;
};

const getAllowedRangeForCategory = (category) => {
  if (category === "primary") return [1, 5];
  if (category === "junior") return [6, 9];
  if (category === "senior") return [10, 11];
  if (category === "advanced") return [12, 13];
  return null;
};

export const filterGradesBySelectedLevel = (levels, grades, selectedLevelId) => {
  if (!selectedLevelId) return [];

  const selectedLevel = (Array.isArray(levels) ? levels : []).find((level) => level?._id === selectedLevelId);
  const category = getLevelCategory(selectedLevel?.name);
  const range = getAllowedRangeForCategory(category);

  if (!range) return [];

  const [min, max] = range;
  return (Array.isArray(grades) ? grades : [])
    .filter((grade) => {
      const gradeNumber = parseGradeNumber(grade?.name);
      return gradeNumber !== null && gradeNumber >= min && gradeNumber <= max;
    })
    .sort((a, b) => parseGradeNumber(a?.name) - parseGradeNumber(b?.name));
};

export const orderLevelsForModules = (levels) => {
  const orderMap = {
    primary: 1,
    junior: 2,
    senior: 3,
    advanced: 4,
  };

  const getOrder = (name) => {
    const category = getLevelCategory(name);
    return orderMap[category] || 99;
  };

  return [...(Array.isArray(levels) ? levels : [])].sort((a, b) => {
    const orderDiff = getOrder(a?.name) - getOrder(b?.name);
    if (orderDiff !== 0) return orderDiff;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
};
