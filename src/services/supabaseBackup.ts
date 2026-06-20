export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseSession = {
  accessToken: string;
  userId: string;
  email: string;
};

export type BackupRecord = {
  payload: unknown;
  updated_at: string;
};

type AuthResponse = {
  access_token?: string;
  user?: {
    id?: string;
    email?: string;
  };
};

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '');

const getErrorMessage = (bodyText: string, fallback: string) => {
  if (!bodyText) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(bodyText) as {
      error_description?: string;
      message?: string;
      msg?: string;
      error?: string;
    };
    return (
      parsed.error_description ||
      parsed.message ||
      parsed.msg ||
      parsed.error ||
      fallback
    );
  } catch {
    return bodyText;
  }
};

const requestJson = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const response = await fetch(url, options);
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(getErrorMessage(bodyText, 'Backend request failed'));
  }

  if (!bodyText) {
    return undefined as T;
  }

  return JSON.parse(bodyText) as T;
};

const authHeaders = (config: SupabaseConfig) => ({
  apikey: config.anonKey.trim(),
  'Content-Type': 'application/json',
});

const dataHeaders = (config: SupabaseConfig, session: SupabaseSession) => ({
  ...authHeaders(config),
  Authorization: `Bearer ${session.accessToken}`,
});

const toSession = (response: AuthResponse): SupabaseSession => {
  if (!response.access_token || !response.user?.id || !response.user?.email) {
    throw new Error('Check your email if confirmation is enabled, then sign in.');
  }

  return {
    accessToken: response.access_token,
    userId: response.user.id,
    email: response.user.email,
  };
};

export const signUpWithSupabase = async (
  config: SupabaseConfig,
  email: string,
  password: string,
): Promise<SupabaseSession> => {
  const response = await requestJson<AuthResponse>(
    `${normalizeUrl(config.url)}/auth/v1/signup`,
    {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify({email: email.trim(), password}),
    },
  );

  return toSession(response);
};

export const signInWithSupabase = async (
  config: SupabaseConfig,
  email: string,
  password: string,
): Promise<SupabaseSession> => {
  const response = await requestJson<AuthResponse>(
    `${normalizeUrl(config.url)}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify({email: email.trim(), password}),
    },
  );

  return toSession(response);
};

export const uploadSupabaseBackup = async (
  config: SupabaseConfig,
  session: SupabaseSession,
  payload: unknown,
) => {
  await requestJson<unknown>(
    `${normalizeUrl(config.url)}/rest/v1/app_backups?on_conflict=user_id`,
    {
      method: 'POST',
      headers: {
        ...dataHeaders(config, session),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: session.userId,
        payload,
        updated_at: new Date().toISOString(),
      }),
    },
  );
};

export const downloadSupabaseBackup = async (
  config: SupabaseConfig,
  session: SupabaseSession,
): Promise<BackupRecord | null> => {
  const records = await requestJson<BackupRecord[]>(
    `${normalizeUrl(config.url)}/rest/v1/app_backups?user_id=eq.${encodeURIComponent(
      session.userId,
    )}&select=payload,updated_at&limit=1`,
    {
      method: 'GET',
      headers: dataHeaders(config, session),
    },
  );

  return records[0] ?? null;
};
