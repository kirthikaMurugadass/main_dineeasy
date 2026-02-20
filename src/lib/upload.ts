import { createClient } from "@/lib/supabase/client";

const BUCKET = "menu-items";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadResult {
  url: string;
  path: string;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Validate an image file before upload.
 */
export function validateImageFile(file: File): void {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new UploadError(
      `Invalid file type "${file.type}". Accepted: JPG, PNG, WebP.`
    );
  }
}

/**
 * Get the file extension from a File object.
 */
function getExtension(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[file.type] ?? "jpg";
}

/**
 * Build the storage path for a menu item image.
 * Format: restaurants/{restaurantId}/items/{itemId}.{ext}
 */
function buildPath(restaurantId: string, itemId: string, file: File): string {
  const ext = getExtension(file);
  return `restaurants/${restaurantId}/items/${itemId}.${ext}`;
}

/**
 * Upload a menu item image to Supabase Storage.
 * Replaces any existing image at the same path.
 */
export async function uploadItemImage(
  restaurantId: string,
  itemId: string,
  file: File
): Promise<UploadResult> {
  validateImageFile(file);

  const supabase = createClient();
  const path = buildPath(restaurantId, itemId, file);

  // Upload (upsert to replace existing)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new UploadError(`Upload failed: ${error.message}`);
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl, path };
}

/**
 * Delete a menu item image from Supabase Storage.
 * Silently ignores errors (image may not exist).
 */
export async function deleteItemImage(
  restaurantId: string,
  itemId: string
): Promise<void> {
  const supabase = createClient();

  // Try to delete all possible extensions
  const extensions = ["jpg", "png", "webp"];
  const paths = extensions.map(
    (ext) => `restaurants/${restaurantId}/items/${itemId}.${ext}`
  );

  await supabase.storage.from(BUCKET).remove(paths);
}

/**
 * Delete an image by its full storage path.
 */
export async function deleteImageByPath(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
