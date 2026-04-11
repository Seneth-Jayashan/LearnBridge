import User from "../models/User.js";
import School from "../models/School.js";
import ResourceRequest from "../models/ResourceRequest.js";
import { sendAccountCreationSms } from "../utils/templates/SMS.js";
import { accountCreationEmail } from "../utils/templates/Email.js";
import { uploadFileToCloudinary, deleteCloudinaryAssetFromUrl } from "../services/CloudinaryService.js";

// ==========================================
// --- DASHBOARD & PROFILE ---
// ==========================================

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

export const updateSchoolProfile = async (req, res) => {
    try {
        if (req.user.role !== "school_admin") {
            return res.status(403).json({ message: "Access denied." });
        }

        const school = await School.findById(req.user.school);
        if (!school) return res.status(404).json({ message: "School not found." });

        // 1. Extract standard fields
        const { contactEmail, contactPhone, logoUrl } = req.body;
        if (contactEmail) school.contactEmail = contactEmail;
        if (contactPhone) school.contactPhone = contactPhone;

        // 2. Extract nested address fields from FormData
        const hasFormDataAddress = req.body["address[street]"] !== undefined;
        
        if (hasFormDataAddress) {
            school.address = {
                street: req.body["address[street]"] || school.address.street,
                city: req.body["address[city]"] || school.address.city,
                state: req.body["address[state]"] || school.address.state,
                zipCode: req.body["address[zipCode]"] || school.address.zipCode,
            };
        } else if (req.body.address) {
            // Fallback just in case standard JSON is sent
            school.address = { ...school.address, ...req.body.address };
        }

        // 3. Handle Logo Image Upload to Cloudinary
        if (req.file) {
            // Optional but recommended: Delete the old logo from Cloudinary to save space
            if (school.logoUrl && school.logoUrl.includes('res.cloudinary.com')) {
                await deleteCloudinaryAssetFromUrl(school.logoUrl).catch(err => 
                    console.error("Failed to delete old logo from Cloudinary:", err)
                );
            }

            // Upload the new file buffer
            const uploadResult = await uploadFileToCloudinary(req.file, {
                folder: "learnbridge/school_logos", // Change folder name as needed
                resourceType: "image"
            });

            // Cloudinary returns the HTTPS URL in secure_url
            school.logoUrl = uploadResult.secure_url;
            
        } else if (logoUrl) {
            // Allow manual text URL override if sent
            school.logoUrl = logoUrl;
        }

        await school.save();
        res.status(200).json({ message: "School profile updated successfully", school });
    } catch (error) {
        console.error("updateSchoolProfile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==========================================
// --- STUDENT MANAGEMENT ---
// ==========================================

export const createStudentForSchool = async (req, res) => {
    try {
        if (req.user.role !== "school_admin") return res.status(403).json({ message: "Access denied." });

        const schoolId = req.user.school; 
        if (!schoolId) return res.status(400).json({ message: "Admin is not assigned to any school." });

        const studentData = req.body;

        if (!studentData.grade) {
            return res.status(400).json({ message: "Grade is required when creating a Student." });
        }

        if (!studentData.level) {
            return res.status(400).json({ message: "Level is required when creating a Student." });
        }


        const newStudent = new User({
            ...studentData,
            email: studentData.email ? studentData.email.toLowerCase() : undefined,
            role: "student",
            school: schoolId, 
            isSchoolVerified: true,
            grade: studentData.grade,
            level: studentData.level,
            stream: studentData.stream || null,
            requiresPasswordChange: true
        });

        await newStudent.save();
        await sendAccountCreationSms(studentData.phoneNumber, `${studentData.firstName} ${studentData.lastName}`, newStudent.regNumber, studentData.password, );
        await accountCreationEmail(`${studentData.firstName} ${studentData.lastName}`,newStudent.regNumber, studentData.password, studentData.email);

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

export const getSchoolStudents = async (req, res) => {
    try {
        const students = await User.find({ 
            school: req.user.school, 
            role: "student",
            isDeleted: false
        }).populate("grade", "name").populate("level", "name");

        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateSchoolStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findOne({ _id: studentId, school: req.user.school, role: "student" });

        if (!student) return res.status(404).json({ message: "Student not found in your school." });

        const { firstName, lastName, email, phoneNumber, grade, level, address, stream } = req.body;

        if (grade === null || grade === "") {
            return res.status(400).json({ message: "Student must have a grade. You cannot remove it." });
        }

        if (firstName) student.firstName = firstName;
        if (lastName) student.lastName = lastName;
        if (email) student.email = email.toLowerCase();
        if (phoneNumber) student.phoneNumber = phoneNumber;
        
        if (grade) student.grade = grade;
        if (level) student.level = level;
        if (stream) student.stream = stream;
        
        if (address) student.address = { ...student.address, ...address };

        await student.save();
        res.status(200).json({ message: "Student updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deactivateStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findOne({ _id: studentId, school: req.user.school, role: "student" });

        if (!student) return res.status(404).json({ message: "Student not found in your school." });

        student.isActive = !student.isActive; // Toggle active state
        await student.save();

        res.status(200).json({ message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully.` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==========================================
// --- TEACHER MANAGEMENT ---
// ==========================================

export const createTeacherForSchool = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password, schoolId } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { phoneNumber }] 
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email or phone number already in use." });
        }

        // Determine school ID: Use the one in body OR the logged-in admin's school
        const targetSchoolId = schoolId || req.user.school;

        const newTeacher = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            password,
            role: "teacher",
            school: targetSchoolId, 
            isSchoolVerified: true, 
            requiresPasswordChange: true
        });

        await newTeacher.save();
        await sendAccountCreationSms(phoneNumber, `${firstName} ${lastName}`, email, password);
        await accountCreationEmail(`${firstName} ${lastName}`,email, password , email);

        if (targetSchoolId) {
            await School.findByIdAndUpdate(targetSchoolId, { $push: { teachers: newTeacher._id } });
        }

        res.status(201).json({ 
            message: 'Teacher registered successfully.',
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getVerifiedTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ 
            school: req.user.school, 
            role: "teacher", 
            isSchoolVerified: true,
            isDeleted: false
        }).select("-password");

        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getPendingTeachers = async (req, res) => {
    try {
        const pendingTeachers = await User.find({ 
            school: req.user.school, 
            role: "teacher", 
            isSchoolVerified: false 
        }).select("firstName lastName email phoneNumber createdAt");

        res.status(200).json(pendingTeachers);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const verifySchoolTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const teacher = await User.findById(teacherId);

        if (!teacher || teacher.role !== "teacher") return res.status(404).json({ message: "Teacher not found." });
        if (teacher.school.toString() !== req.user.school.toString()) return res.status(403).json({ message: "Teacher does not belong to your school." });

        teacher.isSchoolVerified = true;
        await teacher.save();

        await School.findByIdAndUpdate(req.user.school, { $addToSet: { teachers: teacher._id } });

        res.status(200).json({ message: "Teacher verified successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const removeTeacherFromSchool = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const teacher = await User.findOne({ _id: teacherId, school: req.user.school, role: "teacher" });

        if (!teacher) return res.status(404).json({ message: "Teacher not found in your school." });

        teacher.school = null;
        teacher.isSchoolVerified = true; 
        await teacher.save();

        await School.findByIdAndUpdate(req.user.school, { $pull: { teachers: teacher._id } });

        res.status(200).json({ message: "Teacher removed from school successfully. They are now a standalone teacher." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── SCHOOL ADMIN: CREATE A NEED ─────────────────────────────────────────────
// ─── CREATE NEED ──────────────────────────────────────────────
export const createNeed = async (req, res) => {
  try {
    const { itemName, quantity, amount, description, urgency, targetGroup, condition } = req.body;

    if (!itemName || !quantity) {
      return res.status(400).json({ message: "Item name and quantity are required." });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount." });
    }

    const need = await ResourceRequest.create({
      schoolId: req.user._id,
      schoolObjectId: req.user.school || null,
      itemName,
      quantity,
      amount: Number(amount),
      description,
      urgency: urgency || "Medium",
      targetGroup: targetGroup || "",
      condition: condition || "Any",
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

// ─── UPDATE NEED ──────────────────────────────────────────────
export const updateNeed = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.id);

    if (!need) return res.status(404).json({ message: "Need not found" });

    if (need.schoolId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this need" });
    }

    if (need.status !== "Open") {
      return res.status(400).json({
        message: "Cannot edit a need that is already pledged or fulfilled",
      });
    }

    const { itemName, quantity, amount, description, urgency, targetGroup, condition } = req.body;

    if (itemName) need.itemName = itemName;
    if (quantity) need.quantity = quantity;
    if (amount && Number(amount) > 0) need.amount = Number(amount);
    if (description !== undefined) need.description = description;
    if (urgency) need.urgency = urgency;
    if (targetGroup !== undefined) need.targetGroup = targetGroup;
    if (condition) need.condition = condition;

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

// ─── GET DONOR DETAILS FOR A NEED ────────────────────────────
// GET /api/v1/donations/school/donor/:needId
export const getDonorDetails = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.needId)
      .populate("donorId", "firstName lastName email phoneNumber address createdAt role");

    if (!need) {
      return res.status(404).json({ message: "Need not found" });
    }

    if (need.schoolId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!need.donorId) {
      return res.status(404).json({ message: "No donor found for this need" });
    }

    res.status(200).json({
      donor: need.donorId,
      need: {
        itemName: need.itemName,
        quantity: need.quantity,
        amount: need.amount,
        status: need.status,
        pledgedDate: need.pledgedDate,
        fulfilledDate: need.fulfilledDate,
        paymentMethod: need.paymentMethod,
        paymentStatus: need.paymentStatus,
      },
    });
  } catch (err) {
    console.error("getDonorDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};