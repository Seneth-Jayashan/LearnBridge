import User from "../models/User.js";
import School from "../models/School.js";
import ResourceRequest from "../models/ResourceRequest.js";

// --- 1. Create Student (Locked to Admin's School) ---
export const createStudentForSchool = async (req, res) => {
    try {
        // Double check authorization (Middleware handles this, but good for safety)
        if (req.user.role !== "school_admin") {
            return res.status(403).json({ message: "Access denied." });
        }

        const schoolId = req.user.school; 
        if (!schoolId) {
            return res.status(400).json({ message: "Admin is not assigned to any school." });
        }

        const studentData = req.body;

        // Auto-assign role and school
        const newStudent = new User({
            ...studentData,
            role: "student",
            school: schoolId, 
            isSchoolVerified: true // Students created by Admin are verified by default
        });

        await newStudent.save();

        // Push to School's student list
        await School.findByIdAndUpdate(schoolId, { $push: { students: newStudent._id } });

        res.status(201).json({ 
            message: "Student created successfully", 
            studentRegNumber: newStudent.regNumber,
            studentId: newStudent._id
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 2. Get Pending Teachers (So Admin knows who to verify) ---
export const getPendingTeachers = async (req, res) => {
    try {
        const schoolId = req.user.school;
        
        // Find teachers linked to this school who are NOT yet verified
        const pendingTeachers = await User.find({ 
            school: schoolId, 
            role: "teacher", 
            isSchoolVerified: false 
        }).select("firstName lastName email phoneNumber createdAt");

        res.status(200).json(pendingTeachers);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 3. Verify Teacher ---
export const verifySchoolTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const teacher = await User.findById(teacherId);

        if (!teacher || teacher.role !== "teacher") {
            return res.status(404).json({ message: "Teacher not found." });
        }

        // Security Check: Ensure teacher belongs to THIS admin's school
        if (teacher.school.toString() !== req.user.school.toString()) {
            return res.status(403).json({ message: "Teacher does not belong to your school." });
        }

        teacher.isSchoolVerified = true;
        await teacher.save();

        // Add to school's teachers array
        await School.findByIdAndUpdate(req.user.school, { $addToSet: { teachers: teacher._id } });

        res.status(200).json({ message: "Teacher verified successfully." });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 4. Get My School Details ---
export const getMySchoolDetails = async (req, res) => {
    try {
        const school = await School.findById(req.user.school)
            .populate("admins", "firstName lastName email")
            .populate("teachers", "firstName lastName email")
            .populate("students", "firstName lastName regNumber");

        if (!school) return res.status(404).json({ message: "School not found" });

        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── SCHOOL ADMIN: CREATE A NEED ─────────────────────────────────────────────
// POST /api/donations
export const createNeed = async (req, res) => {
  try {
    // ← add amount here
    const { itemName, quantity, amount, description, urgency } = req.body;

    if (!itemName || !quantity) {
      return res.status(400).json({ message: "Item name and quantity are required." });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount." });
    }

    const need = await ResourceRequest.create({
      schoolId: req.user._id,
      itemName,
      quantity,
      amount: Number(amount), // ← add this
      description,
      urgency: urgency || "Medium",
      status: "Open",
    });

    res.status(201).json({ message: "Need posted successfully", need });
  } catch (err) {
    console.error("createNeed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── SCHOOL ADMIN: GET MY POSTED NEEDS ───────────────────────────────────────
// GET /api/donations/school/my-needs
export const getMyPostedNeeds = async (req, res) => {
  try {
    const needs = await ResourceRequest.find({ schoolId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(needs);
  } catch (err) {
    console.error("getMyPostedNeeds error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── SCHOOL ADMIN: UPDATE A NEED ─────────────────────────────────────────────
// PUT /api/donations/school/:id
export const updateNeed = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.id);

    if (!need) {
      return res.status(404).json({ message: "Need not found" });
    }

    if (need.schoolId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this need" });
    }

    if (need.status !== "Open") {
      return res.status(400).json({
        message: "Cannot edit a need that is already pledged or fulfilled",
      });
    }

    const { itemName, quantity, amount, description, urgency } = req.body;

    if (itemName) need.itemName = itemName;
    if (quantity) need.quantity = quantity;
    if (amount && Number(amount) > 0) need.amount = Number(amount); // ← add this
    if (description !== undefined) need.description = description;
    if (urgency) need.urgency = urgency;

    await need.save();

    res.status(200).json({ message: "Need updated successfully", need });
  } catch (err) {
    console.error("updateNeed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ─── SCHOOL ADMIN: DELETE A NEED ─────────────────────────────────────────────
// DELETE /api/donations/school/:id
export const deleteNeed = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.id);

    if (!need) {
      return res.status(404).json({ message: "Need not found" });
    }

    if (need.schoolId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this need" });
    }

    if (need.status !== "Open") {
      return res.status(400).json({ message: "Cannot delete a need that is already pledged or fulfilled" });
    }

    await need.deleteOne();

    res.status(200).json({ message: "Need deleted successfully" });
  } catch (err) {
    console.error("deleteNeed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};