import type { UploadRouter } from "~/routes/api.uploadthing";
// Wrap useUploadThing to auto-compress before upload
import { compressImage } from "./compress";


import { generateReactHelpers } from "@uploadthing/react";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>();



export function useCompressedUpload(
  endpoint: "imageUploader" | "resourceUploader",
  callbacks?: Parameters<typeof useUploadThing>[1]
) {
  const ut = useUploadThing(endpoint, callbacks);

  const startUpload = async (files: File[], opts?: { maxWidth?: number; maxHeight?: number; quality?: number }) => {
    const compressed = await Promise.all(
      files.map(f => compressImage(f, {
        maxWidth:  opts?.maxWidth  ?? 1280,
        maxHeight: opts?.maxHeight ?? 720,
        quality:   opts?.quality   ?? 0.82,
        maxSizeMB: 1,
      }))
    );
    return ut.startUpload(compressed);
  };

  return { ...ut, startUpload };
}