import { Storage, type Bucket } from "@google-cloud/storage";
import type { JWTInput } from "google-auth-library";
import { env } from "../../config/env/env-validation";

function parseCredentialsJson(json: string, sourceLabel: string): JWTInput {
  try {
    return JSON.parse(json) as JWTInput;
  } catch {
    throw new Error(`${sourceLabel} is set but decoded content is not valid JSON.`);
  }
}

function credentialsFromEnv(): JWTInput | undefined {
  const b64 = env.GCS_CREDENTIALS_JSON_BASE64?.trim();
  if (!b64) return undefined;
  const decoded = Buffer.from(b64, "base64").toString("utf8");
  return parseCredentialsJson(decoded, "GCS_CREDENTIALS_JSON_BASE64");
}

function buildGcsStorageOptions(): ConstructorParameters<typeof Storage>[0] {
  const projectId = env.GCS_PROJECT_ID!;
  const credentials = credentialsFromEnv();
  if (credentials) {
    return { projectId, credentials };
  }
  if (env.GCS_KEY_FILE) {
    return { projectId, keyFilename: env.GCS_KEY_FILE };
  }
  return { projectId };
}

const gcsConfigured = Boolean(env.GCS_PROJECT_ID && env.GCS_BUCKET);

export const storage: Storage | null = gcsConfigured
  ? new Storage(buildGcsStorageOptions())
  : null;

export const bucket: Bucket | null = storage && env.GCS_BUCKET
  ? storage.bucket(env.GCS_BUCKET)
  : null;

export function requireGcs() {
  if (!env.GCS_BUCKET || !env.GCS_PROJECT_ID || !env.GCS_PUBLIC_BASE_URL) {
    throw new Error(
      "GCS is not configured. Set GCS_BUCKET, GCS_PROJECT_ID, and GCS_PUBLIC_BASE_URL in your .env to enable uploads."
    );
  }
  if (!bucket) {
    throw new Error(
      "GCS bucket client not initialized (missing credentials). Set GCS_CREDENTIALS_JSON_BASE64, GCS_KEY_FILE, or GOOGLE_APPLICATION_CREDENTIALS."
    );
  }

  return {
    bucket,
    gcsBucket: env.GCS_BUCKET,
    baseUrl: env.GCS_PUBLIC_BASE_URL,
  };
}
