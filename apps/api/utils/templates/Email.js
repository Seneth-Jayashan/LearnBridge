import sendEmail from "../../services/Email.js";

const BRAND_NAME = "Learn Bridge"; // Used in all messages for consistent branding

// Create Email Template for Account Creation
export const accountCreationEmail = async (name, email, password) => {
    // 1. Store the HTML in a variable
    const htmlContent = `
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333333;">Welcome to Learn Bridge, ${name}!</h2>
            <p style="color: #555555; font-size: 16px;">
                Your account has been created successfully. Below are your login details:
            </p>
            <ul style="color: #555555; font-size: 16px;">
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p style="color: #555555; font-size: 16px;">
                Please log in to your account and change your password immediately for security reasons.
            </p>
            <a href="https://learnbridge.com/login" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: #ffffff; text-decoration: none; border-radius: 4px; margin-top: 20px;">
                Log In to Learn Bridge
            </a>
            <p style="color: #999999; font-size: 12px; margin-top: 30px;">
                If you did not request this account, please contact our support team immediately.
            </p>
        </div>
    </body>
    </html>
    `;

    // 2. Pass the variable to the sendEmail service
    await sendEmail({
        to: email,
        subject: `${BRAND_NAME} Account Created`,
        html: htmlContent
    });
};

// Create Email Template for OTP Verification
export const sendVerificationEmail = async (email, otp) => {
    // 1. Store the HTML in a variable
    const htmlContent = `
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333333;">${BRAND_NAME} Verification Code</h2>
            <p style="color: #555555; font-size: 16px;">
                Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.
            </p>
            <p style="color: #555555; font-size: 16px;">
                If you did not request this code, please ignore this email or contact support if you have concerns.
            </p>
        </div>
    </body>
    </html>
    `;

    // 2. Pass the variable to the sendEmail service
    await sendEmail({
        to: email,
        subject: `${BRAND_NAME} Verification Code`,
        html: htmlContent
    });
};

export default {
    accountCreationEmail,
    sendVerificationEmail
};