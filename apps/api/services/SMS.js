import { sendSMS } from 'textlk-node';

const SmsSender = {
  /**
   * Send a single SMS using the configured driver (Text.lk)
   * @param {string} phoneNumber - The recipient's phone number (e.g., '9471XXXXXXX')
   * @param {string} message - The message content
   * @returns {Promise<object>} - The API response result
   */
  send: async (phoneNumber, message) => {
    // 1. Check if the driver is correctly configured
    if (process.env.SMS_DRIVER !== 'textlk') {
      console.warn(`SMS_DRIVER is set to ${process.env.SMS_DRIVER}. Skipping Text.lk send.`);
      return { success: false, message: 'SMS Driver not configured for Text.lk' };
    }

    // 2. Mock SMS in development environment to save credits
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Text.lk Mock] SMS to ${phoneNumber}: ${message}`);
      return { success: true, message: 'Mock SMS sent' };
    }

    // 3. Actual sending logic for production
    try {
      const result = await sendSMS({
        phoneNumber,
        message,
        apiToken: process.env.TEXTLK_API_KEY, 
        senderId: process.env.TEXTLK_SENDER_ID
      });

      console.log(`[SmsSender] SMS sent to ${phoneNumber}:`, result);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(`[SmsSender] Failed to send SMS to ${phoneNumber}:`, error.message);
      return { success: false, error: error.message };
    }
  }
};

export default SmsSender;