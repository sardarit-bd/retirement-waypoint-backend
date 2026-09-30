import dotenv from 'dotenv';

dotenv.config();

export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
export const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
export const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';

export const PAYPAL_API_BASE =
  PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

let cachedAccessToken = null;
let tokenExpiresAt = null;

/**
 * Check if PayPal credentials are configured
 * @returns {boolean}
 */
export const isPayPalConfigured = () => {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
};

/**
 * Retrieve or refresh PayPal OAuth2 access token
 * @returns {Promise<string>}
 */
export const getPayPalAccessToken = async () => {
  if (!isPayPalConfigured()) {
    throw new Error(
      'PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in the environment variables.'
    );
  }

  // Return cached token if valid (with 60-second safety window)
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const credentials = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PayPal OAuth Token Request Failed:', response.status, errorText);
    throw new Error(`Failed to authenticate with PayPal: ${response.statusText}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  return cachedAccessToken;
};

export default {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE,
  PAYPAL_WEBHOOK_ID,
  PAYPAL_API_BASE,
  isPayPalConfigured,
  getPayPalAccessToken,
};
