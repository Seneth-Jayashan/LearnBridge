import SmsSender from "../../services/SMS.js";

// --- Configuration ---
const BRAND_NAME = "Learn Bridge";



const sanitizePhone = (phone) => {
  if (!phone) return "";
  
  let cleanNumber = phone.replace(/\D/g, "");

  if (cleanNumber.startsWith("0")) {
    cleanNumber = cleanNumber.substring(1);
  }

  if (!cleanNumber.startsWith("94")) {
    cleanNumber = "94" + cleanNumber;
  }

  return cleanNumber;
};



export const sendAccountCreationSms = async (phone, name, email, password) => {
  const message = `${BRAND_NAME}: Welcome ${name}! Login: ${email} Pass: ${password}. Please change your password after your first login.`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

export const sendVerificationSms = async (phone, otp) => {
  const message = `${BRAND_NAME}: Your verification code is ${otp}. It expires in 10 minutes.`;
  return SmsSender.send(sanitizePhone(phone), message);
};

export default {
  sendAccountCreationSms,
  sendVerificationSms
};