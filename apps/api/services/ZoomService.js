const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_MEETING_URL = "https://api.zoom.us/v2/users/me/meetings";

let cachedToken = null;
let tokenExpiresAt = 0;

const getRequiredZoomConfig = () => {
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();

  if (!clientId || !clientSecret || !accountId) {
    throw new Error("Zoom is not configured. Please set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_ACCOUNT_ID.");
  }

  return { clientId, clientSecret, accountId };
};

const getZoomAccessToken = async () => {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 30_000) {
    return cachedToken;
  }

  const { clientId, clientSecret, accountId } = getRequiredZoomConfig();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenUrl = `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.reason || data?.message || "Failed to get Zoom access token");
  }

  cachedToken = data.access_token;
  tokenExpiresAt = now + (Number(data.expires_in) || 3600) * 1000;

  return cachedToken;
};

export const createZoomMeeting = async ({ topic, agenda, startTime }) => {
  if (!startTime) {
    throw new Error("Zoom start time is required");
  }

  const accessToken = await getZoomAccessToken();

  const response = await fetch(ZOOM_MEETING_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      agenda,
      type: 2,
      start_time: startTime,
      duration: 60,
      timezone: "UTC",
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to create Zoom meeting");
  }

  if (!data?.join_url || !data?.id) {
    throw new Error("Zoom meeting was created without required join details");
  }

  return data;
};
