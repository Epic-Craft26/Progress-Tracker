import fs from "fs";
import crypto from "crypto";

const CREDENTIALS_PATH =
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH ||
  "/home/karan/Data/Epic_Craft/Secrets/Google_Share_Drive.json";

const DEFAULT_MASTER_FOLDER_ID =
  process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID ||
  "1BisxzQ0xkseowtbaTe5FNhtTCRE8JFJf";

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function loadCredentials(): ServiceAccountCredentials | null {
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const data = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (data.client_email && data.private_key) {
        return {
          client_email: data.client_email,
          private_key: data.private_key,
        };
      }
    }
    if (fs.existsSync(CREDENTIALS_PATH)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
      if (data.client_email && data.private_key) {
        return {
          client_email: data.client_email,
          private_key: data.private_key,
        };
      }
    }
  } catch (err) {
    console.error("Failed to load Google Service Account credentials:", err);
  }
  return null;
}

export async function getDriveAccessToken(): Promise<string | null> {
  const creds = loadCredentials();
  if (!creds) {
    console.warn("No Google Service Account credentials found at", CREDENTIALS_PATH);
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsignedToken = `${base64Url(header)}.${base64Url(payload)}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  sign.end();
  const signature = sign
    .sign(creds.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signature}`;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Google OAuth token request failed:", data);
      return null;
    }

    cachedToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in || 3600),
    };
    return data.access_token;
  } catch (err) {
    console.error("Failed to fetch Google Drive access token:", err);
    return null;
  }
}

export async function createProjectDriveFolder({
  projectCode,
  projectTitle,
  assigneeEmails = [],
  masterFolderId = DEFAULT_MASTER_FOLDER_ID,
}: {
  projectCode: string;
  projectTitle: string;
  assigneeEmails?: string[];
  masterFolderId?: string;
}): Promise<{ folderId: string; folderUrl: string } | null> {
  const token = await getDriveAccessToken();
  if (!token) {
    return null;
  }

  const folderName = `${projectCode} - ${projectTitle.trim()}`;

  try {
    // 1. Create the project folder inside the master folder
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [masterFolderId],
      }),
    });

    const folderData = await createRes.json();
    if (!createRes.ok) {
      console.error("Google Drive folder creation failed:", folderData);
      return null;
    }

    const folderId = folderData.id;
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

    // 2. Grant 'writer' permissions to each employee assignee
    for (const email of assigneeEmails) {
      if (!email || !email.includes("@")) continue;
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "writer",
            type: "user",
            emailAddress: email.trim(),
          }),
        });
      } catch (permErr) {
        console.warn(`Failed to grant Drive permissions to ${email}:`, permErr);
      }
    }

    return { folderId, folderUrl };
  } catch (err) {
    console.error("Error creating Google Drive project folder:", err);
    return null;
  }
}

export async function grantDriveFolderAccess(
  folderId: string,
  email: string,
  role: "writer" | "reader" = "writer"
): Promise<boolean> {
  if (!email || !email.includes("@")) return false;
  const token = await getDriveAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role,
        type: "user",
        emailAddress: email.trim(),
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.warn(`Failed to grant Drive access to ${email}:`, errData);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error granting Drive access to ${email}:`, err);
    return false;
  }
}

export async function revokeDriveFolderAccess(
  folderId: string,
  email: string
): Promise<boolean> {
  if (!email || !email.includes("@")) return false;
  const token = await getDriveAccessToken();
  if (!token) return false;

  try {
    // 1. List existing permissions to find permissionId matching email (supporting Shared Drives)
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions?supportsAllDrives=true&fields=permissions(id,emailAddress,role)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!listRes.ok) return false;
    const data = await listRes.json();
    const permissions = data.permissions || [];
    const targetPerm = permissions.find(
      (p: any) => p.emailAddress?.toLowerCase() === email.trim().toLowerCase()
    );

    if (!targetPerm) return true; // Already not present

    // 2. Delete the permission (supporting Shared Drives)
    const delRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions/${targetPerm.id}?supportsAllDrives=true`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return delRes.ok;
  } catch (err) {
    console.error(`Error revoking Drive access for ${email}:`, err);
    return false;
  }
}

export async function trashProjectDriveFolder(
  folderId?: string | null
): Promise<boolean> {
  if (!folderId) return false;

  // Crucial safety check: NEVER trash or modify the master root folder!
  const masterId =
    process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID || DEFAULT_MASTER_FOLDER_ID;
  if (folderId === masterId) {
    console.warn("Safety trigger: Refusing to trash master Google Drive folder.");
    return false;
  }

  const token = await getDriveAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trashed: true,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Failed to trash Google Drive folder:", err);
      return false;
    }

    console.log(`Successfully moved Google Drive folder ${folderId} to trash.`);
    return true;
  } catch (error) {
    console.error("Error moving Google Drive folder to trash:", error);
    return false;
  }
}

