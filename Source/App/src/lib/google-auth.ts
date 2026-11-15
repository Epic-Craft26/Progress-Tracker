import fs from "fs";

const GOOGLE_AUTH_FILE = "/home/karan/Data/Epic_Craft/Secrets/Google_auth(epic).json";

interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
}

export function getGoogleOAuthConfig(): GoogleAuthConfig {
  let clientId = process.env.GOOGLE_CLIENT_ID || "";
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  let redirectUris: string[] = process.env.GOOGLE_REDIRECT_URI
    ? [process.env.GOOGLE_REDIRECT_URI]
    : [];

  try {
    if (fs.existsSync(GOOGLE_AUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(GOOGLE_AUTH_FILE, "utf8"));
      const web = data.web || data.installed;
      if (web) {
        if (!clientId) clientId = web.client_id;
        if (!clientSecret) clientSecret = web.client_secret;
        if (web.redirect_uris && Array.isArray(web.redirect_uris)) {
          redirectUris = web.redirect_uris;
        }
      }
    }
  } catch (err) {
    console.error("Failed to read Google OAuth secret file:", err);
  }

  return {
    clientId,
    clientSecret,
    redirectUris,
  };
}

export function getGoogleAuthorizationUrl(currentHost?: string): string {
  const config = getGoogleOAuthConfig();
  if (!config.clientId) {
    throw new Error("Google Client ID is not configured");
  }

  // Pick redirect URI matching current port if possible, else use first registered
  let redirectUri = config.redirectUris[0] || "http://localhost:3001/api/auth/callback/google";
  if (currentHost) {
    const matched = config.redirectUris.find((uri) => uri.includes(currentHost));
    if (matched) {
      redirectUri = matched;
    }
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCodeForUser(
  code: string,
  redirectUri: string
): Promise<{ email: string; name: string; picture?: string }> {
  const config = getGoogleOAuthConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error("Google OAuth credentials missing");
  }

  // 1. Exchange auth code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("Google token exchange error:", tokenData);
    throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange Google code");
  }

  const accessToken = tokenData.access_token;

  // 2. Fetch user profile from Google UserInfo endpoint
  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const profile = await userinfoRes.json();
  if (!userinfoRes.ok || !profile.email) {
    throw new Error("Failed to retrieve Google user profile");
  }

  return {
    email: profile.email.toLowerCase().trim(),
    name: profile.name || profile.email.split("@")[0],
    picture: profile.picture,
  };
}
