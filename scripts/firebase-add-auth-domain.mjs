/**
 * Adds a Firebase Hosting preview channel URL to Firebase Auth authorized domains.
 *
 * Usage: node scripts/firebase-add-auth-domain.mjs <domain>
 *
 * Requires env vars:
 *   FIREBASE_TOKEN     — Firebase CI token (refresh token from `firebase login:ci`)
 *   NG_APP_FIREBASE_PROJECT_ID — Firebase project ID
 *
 * This script is called from CI after a hosting channel deploy so that preview
 * channel URLs (wavely-f659c--{channel}-{hash}.web.app) can be used for login.
 */

const domain = process.argv[2];
if (!domain) {
  console.error('Usage: node scripts/firebase-add-auth-domain.mjs <domain>');
  process.exit(1);
}

const projectId = process.env['NG_APP_FIREBASE_PROJECT_ID'];
const refreshToken = process.env['FIREBASE_TOKEN'];

if (!projectId || !refreshToken) {
  console.error('❌ Missing required env vars: NG_APP_FIREBASE_PROJECT_ID, FIREBASE_TOKEN');
  process.exit(1);
}

// Firebase CLI's embedded OAuth2 client credentials (public, installed-app flow).
// Source: node_modules/firebase-tools/lib/api.js
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function getAuthorizedDomains(accessToken) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`GET config failed: ${res.status} ${await res.text()}`);
  const config = await res.json();
  return config.authorizedDomains ?? [];
}

async function addAuthorizedDomain(accessToken, domains) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=authorizedDomains`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authorizedDomains: domains }),
    }
  );
  if (!res.ok) throw new Error(`PATCH config failed: ${res.status} ${await res.text()}`);
  return res.json();
}

try {
  console.log(`🔐 Adding "${domain}" to Firebase Auth authorized domains...`);
  const accessToken = await getAccessToken();
  const existing = await getAuthorizedDomains(accessToken);

  if (existing.includes(domain)) {
    console.log(`✅ Domain "${domain}" is already authorized — nothing to do.`);
    process.exit(0);
  }

  await addAuthorizedDomain(accessToken, [...existing, domain]);
  console.log(`✅ Domain "${domain}" added to Firebase Auth authorized domains.`);
} catch (err) {
  console.error(`❌ Failed to add authorized domain: ${err.message}`);
  // Non-fatal — print warning but don't fail the deploy
  process.exit(0);
}
