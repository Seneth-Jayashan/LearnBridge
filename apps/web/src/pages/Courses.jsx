import { useEffect, useState } from "react";
import courseService from "../services/CourseService";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
  name: "",
  shortDescription: "",
  fullDescription: "",
  language: "",
  subject: "",
  grade: "",
  stream: "",
  thumbnailUrl: "",
  introVideoUrl: "",
  durationHours: "",
  numberOfLessons: "",
  instructor: "",
};

const isAdvancedLevelGrade = (grade) => grade === "Grade 12" || grade === "Grade 13";

const toPublicMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const origin = apiBase.replace(/\/api\/v1\/?$/i, "");
  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};

const Courses = ({ mode = "both" }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [mediaFiles, setMediaFiles] = useState({ thumbnail: null, introVideo: null });
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loggedInstructorName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  const loadCourses = async () => {
    try {
      setError("");
      const data = await courseService.getAllCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      if (name === "grade") {
        const nextFormData = { ...prev, grade: value };
        if (!isAdvancedLevelGrade(value)) {
          nextFormData.stream = "";
        }
        return nextFormData;
      }

      return { ...prev, [name]: value };
    });
  };

  const getSubjectOptions = (grade, stream) => {
    // Primary (1-5)
    const primary = [
      "First Language - Sinhala",
      "First Language - Tamil",
      "English",
      "Mathematics",
      "Environmental Studies",
      "Religion - Buddhism",
      "Religion - Hinduism",
      "Religion - Islam",
      "Religion - Christianity",
      "Aesthetic - Art",
      "Aesthetic - Music",
      "Aesthetic - Dancing",
      "Physical Education",
    ];

    // Junior Secondary (6-9)
    const junior = [
      "First Language - Sinhala",
      "First Language - Tamil",
      "Second National Language - Tamil",
      "Second National Language - Sinhala",
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
      "Aesthetic - Art",
      "Aesthetic - Music",
      "Aesthetic - Dancing",
      "Aesthetic - Drama",
    ];

    // O/L (10-11)
    const ol = [
      // compulsory
      "First Language - Sinhala",
      "First Language - Tamil",
      "English",
      "Mathematics",
      "Science",
      "History",
      "Religion",
      // optional
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
    ];

    // A/L stream options
    const alStreams = {
      "Mathematics Stream": [
        "Combined Mathematics",
        "Physics",
        "Chemistry",
      ],
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
      "Technology Stream": [
        "Engineering Technology",
        "Bio Systems Technology",
        "Science for Technology",
        "ICT",
      ],
    };

    if (!grade) return [];

    if (["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"].includes(grade)) {
      return primary;
    }

    if (["Grade 6", "Grade 7", "Grade 8", "Grade 9"].includes(grade)) {
      return junior;
    }

    if (["Grade 10", "Grade 11"].includes(grade)) {
      return ol;
    }

    if (["Grade 12", "Grade 13"].includes(grade)) {
      // if stream selected, return that stream's list, otherwise return flattened list of all streams
      if (stream && alStreams[stream]) return alStreams[stream];
      // flatten all unique subjects
      const all = Object.values(alStreams).flat();
      return Array.from(new Set(all));
    }

    return [];
  };

  // Update subject options when grade or stream changes
  useEffect(() => {
    const opts = getSubjectOptions(formData.grade, formData.stream);
    setSubjectOptions(opts);
    // clear subject if not in new options
    if (formData.subject && !opts.includes(formData.subject)) {
      setFormData((prev) => ({ ...prev, subject: "" }));
    }
  }, [formData.grade, formData.stream]);

  const resetForm = () => {
    setFormData(initialForm);
    setMediaFiles({ thumbnail: null, introVideo: null });
    setEditingCourseId(null);
  };

  // When route mode changes, ensure the UI shows the correct view
  useEffect(() => {
    if (mode === "add") {
      resetForm();
    }
    if (mode === "manage") {
      setEditingCourseId(null);
    }
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setError("Course title is required");
      return;
    }
    if (!formData.shortDescription.trim()) {
      setError("Short description is required");
      return;
    }
    if (!formData.fullDescription.trim()) {
      setError("Full description is required");
      return;
    }
    if (!formData.language.trim()) {
      setError("Language is required");
      return;
    }
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!formData.grade.trim()) {
      setError("Grade is required");
      return;
    }
    if (isAdvancedLevelGrade(formData.grade) && !formData.stream.trim()) {
      setError("Stream is required for Grade 12 and Grade 13");
      return;
    }
    if (!formData.durationHours || Number(formData.durationHours) <= 0) {
      setError("Course duration must be greater than 0");
      return;
    }
    if (!formData.numberOfLessons || Number(formData.numberOfLessons) <= 0) {
      setError("Number of lessons must be greater than 0");
      return;
    }
    if (!loggedInstructorName && !formData.instructor.trim()) {
      setError("Unable to detect logged-in teacher name");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("shortDescription", formData.shortDescription.trim());
      payload.append("fullDescription", formData.fullDescription.trim());
      payload.append("language", formData.language.trim());
      payload.append("subject", formData.subject.trim());
      payload.append("grade", formData.grade.trim());
      if (formData.stream.trim()) {
        payload.append("stream", formData.stream.trim());
      }
      payload.append("durationHours", String(Number(formData.durationHours)));
      payload.append("numberOfLessons", String(Number(formData.numberOfLessons)));
      payload.append("instructor", loggedInstructorName || formData.instructor.trim());
      payload.append("description", formData.fullDescription.trim());

      if (mediaFiles.thumbnail) {
        payload.append("thumbnail", mediaFiles.thumbnail);
      }

      if (mediaFiles.introVideo) {
        payload.append("introVideo", mediaFiles.introVideo);
      }

      if (editingCourseId) {
        await courseService.updateCourse(editingCourseId, payload);
      } else {
        await courseService.createCourse(payload);
      }
      resetForm();
      await loadCourses();
    } catch (err) {
      const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
      const backendError = err.response?.data?.error;
      setError(firstValidationMessage || err.response?.data?.message || backendError || "Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);

    if (name === "thumbnailUrl") {
      setMediaFiles((prev) => ({ ...prev, thumbnail: file }));
      setFormData((prev) => ({ ...prev, thumbnailUrl: objectUrl }));
      return;
    }

    if (name === "introVideoUrl") {
      setMediaFiles((prev) => ({ ...prev, introVideo: file }));
      setFormData((prev) => ({ ...prev, introVideoUrl: objectUrl }));
    }
  };

  const handleEdit = (course) => {
    setError("");
    setEditingCourseId(course._id);
    setFormData({
      name: course.name || "",
      shortDescription: course.shortDescription || "",
      fullDescription: course.fullDescription || course.description || "",
      language: course.language || "",
      subject: course.subject || "",
      grade: course.grade || "",
      stream: course.stream || "",
      thumbnailUrl: toPublicMediaUrl(course.thumbnailUrl || ""),
      introVideoUrl: toPublicMediaUrl(course.introVideoUrl || ""),
      durationHours: course.durationHours?.toString() || "",
      numberOfLessons: course.numberOfLessons?.toString() || "",
      instructor: course.instructor || "",
    });
    setMediaFiles({ thumbnail: null, introVideo: null });
  };

  const handleDelete = async (courseId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this course?");
    if (!shouldDelete) return;

    setError("");
    try {
      await courseService.deleteCourse(courseId);
      if (editingCourseId === courseId) {
        resetForm();
      }
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course");
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Course Management</h2>
        <p className="text-slate-600 mt-1">Create, update, and delete your courses.</p>
      </div>

      {mode !== "manage" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">
              Course Title
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Grade 10 Mathematics"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-semibold text-slate-700 mb-1">
              Short Description (1–2 lines preview)
            </label>
            <input
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleInputChange}
              placeholder="Short course preview"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-semibold text-slate-700 mb-1">
              Language
            </label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            >
              <option value="">Select language</option>
              <option value="Sinhala">Sinhala</option>
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-semibold text-slate-700 mb-1">
              Which Grade
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            >
              <option value="">Select grade</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
              <option value="Grade 13">Grade 13</option>
            </select>
          </div>

          {/* Subject moved below stream for Grade 12/13 */}

          {isAdvancedLevelGrade(formData.grade) && (
            <>
              <div>
                <label htmlFor="stream" className="block text-sm font-semibold text-slate-700 mb-1">
                  Stream
                </label>
                <select
                  id="stream"
                  name="stream"
                  value={formData.stream}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                >
                  <option value="">Select stream</option>
                  <option value="Mathematics Stream">Mathematics Stream</option>
                  <option value="Biology Stream">Biology Stream</option>
                  <option value="Commerce Stream">Commerce Stream</option>
                  <option value="Arts Stream">Arts Stream</option>
                  <option value="Technology Stream">Technology Stream</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                >
                  <option value="">Select subject</option>
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!isAdvancedLevelGrade(formData.grade) && (
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              >
                <option value="">Select subject</option>
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="thumbnailUrl" className="block text-sm font-semibold text-slate-700 mb-1">
              Course Thumbnail Image
            </label>
            <input
              id="thumbnailUrl"
              name="thumbnailUrl"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {formData.thumbnailUrl && (
              <div className="mt-2">
                <img src={formData.thumbnailUrl} alt="thumbnail preview" className="max-h-40 rounded-md" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="introVideoUrl" className="block text-sm font-semibold text-slate-700 mb-1">
              Intro/Teaser Video
            </label>
            <input
              id="introVideoUrl"
              name="introVideoUrl"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {formData.introVideoUrl && (
              <div className="mt-2">
                <video src={formData.introVideoUrl} controls className="max-h-48 rounded-md" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="durationHours" className="block text-sm font-semibold text-slate-700 mb-1">
              Course Duration (total hours)
            </label>
            <input
              id="durationHours"
              name="durationHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.durationHours}
              onChange={handleInputChange}
              placeholder="24"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>

          <div>
            <label htmlFor="numberOfLessons" className="block text-sm font-semibold text-slate-700 mb-1">
              Number of Lessons
            </label>
            <input
              id="numberOfLessons"
              name="numberOfLessons"
              type="number"
              min="0"
              step="1"
              value={formData.numberOfLessons}
              onChange={handleInputChange}
              placeholder="18"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>

          <div>
            <label htmlFor="instructor" className="block text-sm font-semibold text-slate-700 mb-1">
              Instructor / Creator
            </label>
            <input
              id="instructor"
              name="instructor"
              value={loggedInstructorName || formData.instructor}
              readOnly
              placeholder="Auto-filled from logged-in user"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="fullDescription" className="block text-sm font-semibold text-slate-700 mb-1">
            Full Description
          </label>
          <textarea
            id="fullDescription"
            name="fullDescription"
            value={formData.fullDescription}
            onChange={handleInputChange}
            rows={4}
            placeholder="Detailed course description"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : editingCourseId ? "Update Course" : "Create Course"}
          </button>

          {editingCourseId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
            >
              Cancel Edit
            </button>
          )}
        </div>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {mode !== "add" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Your Courses</h3>
        </div>

        {isLoading ? (
          <p className="px-5 py-6 text-slate-600">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="px-5 py-6 text-slate-600">No courses created yet.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {courses.map((course) => (
              <div key={course._id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{course.name}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {course.shortDescription || "No short description"}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {course.subject || "-"} • {course.grade || "-"} • {course.language || "-"}
                  </p>
                  {course.stream && (
                    <p className="text-xs text-slate-500 mt-1">{course.stream}</p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(course)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(course._id)}
                    className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}
    </section>
  );
};

export default Courses;