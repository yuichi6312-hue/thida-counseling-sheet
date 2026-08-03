// Googleドライブ連携の設定。
// Google Cloud Console で発行したOAuthクライアントID（ウェブアプリケーション種別）に置き換えてください。
// 承認済みのJavaScript生成元にこのアプリの公開URLを追加しておく必要があります。
const CLIENT_ID = "REPLACE_WITH_YOUR_GOOGLE_OAUTH_CLIENT_ID";
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const ROOT_FOLDER_NAME = "THIDA カウンセリングシート";
const FOLDER_CACHE_KEY = "thida.drive.folders.v1";

let accessToken: string | null = null;
let tokenExpiry = 0;

const isConfigured = () => CLIENT_ID !== "REPLACE_WITH_YOUR_GOOGLE_OAUTH_CLIENT_ID";

const loadGsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById("gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Identity Servicesの読み込みに失敗しました。")));
      return;
    }
    const script = document.createElement("script");
    script.id = "gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Servicesの読み込みに失敗しました。"));
    document.head.appendChild(script);
  });
};

export const isDriveConnected = () => Boolean(accessToken) && Date.now() < tokenExpiry;

export const connectGoogleDrive = async (): Promise<void> => {
  if (!isConfigured()) {
    throw new Error("Googleドライブ連携が未設定です。運営者にお問い合わせください。");
  }
  await loadGsiScript();

  await new Promise<void>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || "認証に失敗しました。"));
          return;
        }
        accessToken = response.access_token;
        tokenExpiry = Date.now() + ((response.expires_in ?? 3600) - 60) * 1000;
        resolve();
      }
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
};

export const disconnectGoogleDrive = () => {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => undefined);
  }
  accessToken = null;
  tokenExpiry = 0;
};

const ensureAccessToken = async (): Promise<string> => {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  await connectGoogleDrive();
  if (!accessToken) throw new Error("Googleドライブの認証に失敗しました。");
  return accessToken;
};

const driveFetch = async (url: string, options: RequestInit = {}) => {
  const token = await ensureAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Google Drive APIエラー (${response.status})`);
  }
  return response;
};

const getFolderCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(FOLDER_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const setFolderCache = (cache: Record<string, string>) => {
  localStorage.setItem(FOLDER_CACHE_KEY, JSON.stringify(cache));
};

const escapeForQuery = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const findFolder = async (name: string, parentId: string): Promise<string | null> => {
  const q = [
    `name = '${escapeForQuery(name)}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `'${parentId}' in parents`
  ].join(" and ");
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`);
  const data = await response.json();
  return data.files?.[0]?.id ?? null;
};

const createFolder = async (name: string, parentId?: string): Promise<string> => {
  const response = await driveFetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined
    })
  });
  const data = await response.json();
  return data.id;
};

const getRootFolderId = async (): Promise<string> => {
  const cache = getFolderCache();
  if (cache.root) return cache.root;

  const q = [
    `name = '${escapeForQuery(ROOT_FOLDER_NAME)}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    "'root' in parents"
  ].join(" and ");
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`);
  const data = await response.json();
  const id = data.files?.[0]?.id ?? (await createFolder(ROOT_FOLDER_NAME));

  cache.root = id;
  setFolderCache(cache);
  return id;
};

const getCustomerFolderId = async (customerName: string): Promise<string> => {
  const cache = getFolderCache();
  const key = `customer:${customerName}`;
  if (cache[key]) return cache[key];

  const rootId = await getRootFolderId();
  const existing = await findFolder(customerName, rootId);
  const id = existing ?? (await createFolder(customerName, rootId));

  cache[key] = id;
  setFolderCache(cache);
  return id;
};

export const uploadKarteImage = async (customerName: string, fileName: string, blob: Blob): Promise<void> => {
  const folderId = await getCustomerFolderId(customerName || "未入力");
  const token = await ensureAccessToken();

  const metadata = { name: fileName, parents: [folderId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!response.ok) {
    throw new Error(`Googleドライブへのアップロードに失敗しました (${response.status})`);
  }
};
