import SmsSender from "../../services/SMS.js";

// --- Configuration ---
const BRAND_NAME = "Learn Bridge"; // Used in all messages for consistent branding

/* ---------- Helpers ---------- */

/**
 * Format phone numbers to the international standard required by Text.lk (e.g., 9477xxxxxxx).
 * Removes spaces, dashes, and ensures '94' prefix.
 */
const sanitizePhone = (phone) => {
  if (!phone) return "";
  
  // Remove all non-numeric characters
  let cleanNumber = phone.replace(/\D/g, "");

  // If number starts with '0' (e.g., 077...), remove the leading zero
  if (cleanNumber.startsWith("0")) {
    cleanNumber = cleanNumber.substring(1);
  }

  // If number doesn't start with '94', add it
  if (!cleanNumber.startsWith("94")) {
    cleanNumber = "94" + cleanNumber;
  }

  return cleanNumber;
};

/* ---------- Templates ---------- */

/**
 * Send Account Creation Message
 * Includes login details and a prompt to reset the password.
 */
export const sendAccountCreationSms = async (phone, name, email, password) => {
  const message = `${BRAND_NAME}: Welcome ${name}! Login: ${email} Pass: ${password}. Please change your password after your first login.`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

// TODO : sendVerificationSms(user.phoneNumber, otp)
export const sendVerificationSms = async (phone, otp) => {
  const message = `${BRAND_NAME}: Your verification code is ${otp}. It expires in 10 minutes.`;
  return SmsSender.send(sanitizePhone(phone), message);
};

// Export as a bundle for easier imports
export default {
  sendAccountCreationSms,
  sendVerificationSms
};