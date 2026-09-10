import { z } from "zod";

// ---------------------------------------------------------------------------
// §2.2 Cryptographic Selfie Hashing
// Client-side SHA-256 hashing for selfie images captured via camera.
// ---------------------------------------------------------------------------

/**
 * 32 random bytes generated with rejection sampling to bias
 * toward uniformity — identical to the pattern in security.ts.
 */
function secureRandomBytes(length: number): Uint8Array {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return bytes;
}

function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Schema — consumer can validate an incoming File before hashing.
// ---------------------------------------------------------------------------
export const SelfieFileSchema = z
  .instanceof(File)
  .refine((f) => f.type.startsWith("image/"), "Must be an image file")
  .refine((f) => f.size <= 10 * 1024 * 1024, "Max file size is 10 MB");

export type SelfieFile = z.infer<typeof SelfieFileSchema>;

/**
 * Hashed selfie result returned by `hashSelfie`.
 * The `salt` must be persisted alongside the `hash` so the same
 * derivation can be re-computed for verification.
 */
export interface SelfieHash {
  /** Hex-encoded SHA-256 digest (64 chars). */
  hash: string;
  /** 32-byte hex salt used for this derivation (64 chars). */
  salt: string;
  /** File MIME type at time of hashing. */
  mimeType: string;
  /** File size in bytes at time of hashing. */
  fileSize: number;
  /** ISO-8601 timestamp of when the hash was computed. */
  hashedAt: string;
}

/**
 * Derive a deterministic but salted hash from a selfie file.
 *
 * Pipeline:
 *   1. Read the file into an `ArrayBuffer` via the FileReader API.
 *   2. Generate a cryptographically-secure 32-byte random salt.
 *   3. Combine `salt || fileBytes` and SHA-256 hash the concatenation.
 *   4. Return the hex-encoded digest plus metadata for storage.
 *
 * This function is **client-safe** — it uses the browser-native
 * `crypto.subtle` API (no server round-trip required).
 *
 * @param file  A `File` object from `<input type="file">` or a camera
 *              capture (MediaRecorder / getUserMedia).
 * @param existingSalt  Optional hex salt to re-derive a known hash
 *                      (used for verification, not creation).
 * @returns `SelfieHash` containing the derived hash, salt, and metadata.
 */
export async function hashSelfie(
  file: File,
  existingSalt?: string,
): Promise<SelfieHash> {
  // Validate the file before processing.
  SelfieFileSchema.parse(file);

  // 1. Read file bytes.
  const buffer = await file.arrayBuffer();

  // 2. Salt — either reuse an existing salt (verification) or generate.
  const saltBytes = existingSalt
    ? hexToBytes(existingSalt)
    : secureRandomBytes(32);

  // 3. Concatenate salt + file bytes.
  const combined = new Uint8Array(saltBytes.length + buffer.byteLength);
  combined.set(saltBytes, 0);
  combined.set(new Uint8Array(buffer), saltBytes.length);

  // 4. SHA-256 hash.
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hashHex = bytesToHex(hashBuffer);

  return {
    hash: hashHex,
    salt: bytesToHex(saltBytes),
    mimeType: file.type,
    fileSize: file.size,
    hashedAt: new Date().toISOString(),
  };
}

/**
 * Verify that a selfie file matches a previously-stored hash.
 * Recomputes `SHA-256(storedSalt || fileBytes)` and compares.
 */
export async function verifySelfieHash(
  file: File,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const result = await hashSelfie(file, storedSalt);
  return result.hash === storedHash;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a hex string back to a `Uint8Array`. */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
