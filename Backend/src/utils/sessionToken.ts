import crypto from "crypto";

interface SessionTokenPayload {
  userId: string;
  email: string;
  exp?: string;
}

function getSigningKey(): string {
  const secret = process.env.PASETO_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: PASETO_SECRET environment variable is missing!"
      );
    }

    const devFallback =
      "dev_secret_key_must_be_at_least_32_characters_long_for_security";
    return crypto.createHash("sha256").update(devFallback).digest("hex");
  }

  return crypto.createHash("sha256").update(secret).digest("hex");
}

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signSegment(input: string, key: string): string {
  return crypto.createHmac("sha256", key).update(input).digest("base64url");
}

export async function encryptSessionToken(payload: SessionTokenPayload): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = signSegment(`${header}.${body}`, getSigningKey());

  return `${header}.${body}.${signature}`;
}

export async function decryptSessionToken(token: string): Promise<SessionTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid session token format.");
  }

  const [header, body, signature] = parts;
  const expectedSignature = signSegment(`${header}.${body}`, getSigningKey());

  if (signature.length !== expectedSignature.length) {
    throw new Error("Invalid session token signature.");
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    throw new Error("Invalid session token signature.");
  }

  const parsedPayload = JSON.parse(fromBase64Url(body)) as SessionTokenPayload;

  if (!parsedPayload.userId || !parsedPayload.email) {
    throw new Error("Invalid session token payload structure.");
  }

  if (parsedPayload.exp) {
    const expirationDate = new Date(parsedPayload.exp);
    if (!Number.isNaN(expirationDate.getTime()) && expirationDate < new Date()) {
      throw new Error("expired");
    }
  }

  return parsedPayload;
}
