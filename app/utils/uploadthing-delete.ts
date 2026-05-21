import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * Extracts the UploadThing file key from a ufsUrl.
 * URL format: https://ufs.uploadthing.com/f/<fileKey>
 */
export function extractFileKey(ufsUrl: string | null | undefined): string | null {
  if (!ufsUrl) return null;
  try {
    const url  = new URL(ufsUrl);
    const key  = url.pathname.split("/").at(-1);
    return key ?? null;
  } catch {
    return null;
  }
}

/**
 * Deletes one or more files from UploadThing by their ufsUrl.
 * Safe to call with null/undefined — silently skips.
 */
export async function deleteUploadThingFiles(
  ...ufsUrls: (string | null | undefined)[]
): Promise<void> {
  const keys = ufsUrls
    .map(extractFileKey)
    .filter((k): k is string => !!k);

  if (keys.length === 0) return;

  try {
    await utapi.deleteFiles(keys);
  } catch (err) {
    // Log but don't throw — deletion failure shouldn't break the user flow
    console.error("[UploadThing] deleteFiles failed:", err);
  }
}