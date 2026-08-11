/**
 * Client-side image helpers for the sell wizard photo step (task P1-02).
 *
 * - downscaleImage: canvas downscale to max 2000px on the long edge before
 *   upload (bandwidth + presign maxBytes). Images already small enough are
 *   passed through untouched so quality is never degraded needlessly.
 * - uploadWithProgress: XHR PUT (fetch has no upload progress events) to the
 *   presigned URL with the Content-Type header the presign was issued for.
 */
import type { UploadContentType } from "@/lib/marketplace-api";

export const ALLOWED_IMAGE_TYPES: UploadContentType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_DIMENSION = 2000;

function isAllowedType(type: string): type is UploadContentType {
  return (ALLOWED_IMAGE_TYPES as string[]).includes(type);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> decode path below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Downscale to MAX_IMAGE_DIMENSION on the long edge. Returns the original
 * file unchanged when it already fits (keep quality); otherwise re-encodes
 * the scaled canvas as JPEG (0.92 — visually lossless for photos).
 */
export async function downscaleImage(
  file: File,
  maxDim: number = MAX_IMAGE_DIMENSION,
): Promise<{ blob: Blob; contentType: UploadContentType }> {
  if (!isAllowedType(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }

  const bitmap = await loadBitmap(file);
  const width = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
  const height = "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;

  if (width <= maxDim && height <= maxDim) {
    if ("close" in bitmap) bitmap.close();
    return { blob: file, contentType: file.type };
  }

  const scale = maxDim / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas encode failed"))),
      "image/jpeg",
      0.92,
    );
  });
  return { blob, contentType: "image/jpeg" };
}

/** HTTP PUT the blob to the presigned URL, reporting upload progress 0–100. */
export function uploadWithProgress(
  url: string,
  blob: Blob,
  contentType: UploadContentType,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed (network error)"));
    xhr.send(blob);
  });
}
