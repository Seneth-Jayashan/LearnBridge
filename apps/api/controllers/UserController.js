import User from "../models/User.js";

// --- Create Donor Profile (Public Registration) ---
export const createDonorProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, address } = req.body;

    // Check for duplicates (email and phone should be unique for donors)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phoneNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email or phone number already in use" });
    }

    const donor = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phoneNumber,
      password,
      address,
      role: "donor"
    });

    await donor.save();

    res.status(201).json({ 
        message: "Donor profile created successfully",
        userId: donor._id 
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- PUBLIC / TEACHER: Register Teacher ---
export const registerTeacher = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password, schoolId } = req.body;

        // Check for duplicates (email and phone should be unique for teachers)
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { phoneNumber }] 
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email or phone number already in use." });
        }

        const newTeacher = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            password,
            role: "teacher",
            school: schoolId || null, 
            isSchoolVerified: schoolId ? false : true 
        });

        await newTeacher.save();

        res.status(201).json({ 
            message: schoolId 
                ? "Teacher registered. Awaiting School Admin verification." 
                : "Standalone Teacher registered successfully.",
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Existing Functions ---

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, email, phoneNumber, address } = req.body;
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the NEW email/phone is already taken by someone else
    if (email || phoneNumber) {
      const duplicateQuery = [];
      
      if (email && email.toLowerCase() !== user.email) {
          duplicateQuery.push({ email: email.toLowerCase() });
      }
      if (phoneNumber && phoneNumber !== user.phoneNumber) {
          duplicateQuery.push({ phoneNumber });
      }

      if (duplicateQuery.length > 0) {
          const existingUser = await User.findOne({ $or: duplicateQuery });
          if (existingUser) {
              return res.status(400).json({ message: "Email or phone number is already taken by another account." });
          }
      }
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (phoneNumber) user.phoneNumber = phoneNumber;
    
    if (address) {
        user.address = { ...user.address, ...address };
    }

    await user.save();

    res.status(200).json({ 
        message: "Profile updated successfully", 
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            address: user.address
        }
    });

  } catch (error) {
    console.error("Update User Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update User Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = true;
    user.isActive = false; 

    await user.save();

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Delete User Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const restoreUserProfile = async (req, res) => {
  try {
    const { identifier } = req.body; 
    
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phoneNumber: identifier },
        { regNumber: identifier },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isDeleted) {
      return res.status(400).json({ message: "User profile is not deleted" });
    }

    user.isDeleted = false;
    user.isActive = true; 
    await user.save();

    res.status(200).json({ message: "Profile restored successfully" });
  } catch (error) {
    console.error("Restore User Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};