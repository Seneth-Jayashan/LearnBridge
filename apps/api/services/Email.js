// sendEmail.js
import axios from 'axios';
import 'dotenv/config';

let accessToken = process.env.ZOHO_ACCESS_TOKEN;

/**
 * Refresh Zoho Access Token using Refresh Token
 */
async function refreshAccessToken() {
  try {
    const res = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    });
    accessToken = res.data.access_token;
    console.log('Zoho access token refreshed');
  } catch (err) {
    console.error('Error refreshing Zoho access token:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send email using Zoho Mail API
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email plain text content
 * @param {string} [options.html] - Optional HTML content
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    const data = {
      fromAddress: `Learn Bridge <${process.env.ZOHO_EMAIL}>`,
      toAddress: to,
      subject,
      content: html || text,
      askReceipt: 'no'
    };

    const res = await axios.post(
      `https://mail.zoho.com/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages`,
      data,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Email sent successfully:', res.data);
  } catch (err) {
    // Refresh token if access token expired
    if (err.response && err.response.status === 401) {
      console.log('Access token expired, refreshing token...');
      await refreshAccessToken();
      return sendEmail({ to, subject, text, html });
    }
    console.error('Error sending email:', err.response?.data || err.message);
    throw err;
  }
}

export default sendEmail;