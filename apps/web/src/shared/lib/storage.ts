import { supabase } from "./supabaseClient";

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  error?: string | null;
}

/**
 * Convierte un archivo local a Data URL (base64) para previsualización inmediata o fallback.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Sube un archivo a Supabase Storage (bucket 'media') con fallback automático a Data URL si el storage local está en mantenimiento.
 */
export async function uploadMediaFile(
  file: File,
  folder: "avatars" | "services" | "attachments" = "avatars"
): Promise<UploadResult> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${folder}/${Date.now()}_${sanitizedName}`;

  try {
    // 1. Intentar subir al bucket 'media' en Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (!uploadError && uploadData) {
      const { data: publicData } = supabase.storage.from("media").getPublicUrl(fileName);
      return {
        url: publicData.publicUrl,
        name: file.name,
        size: file.size,
        error: null,
      };
    }

    console.warn("Supabase storage upload returned error, applying data-url fallback:", uploadError?.message);
  } catch (err) {
    console.warn("Storage network error, applying data-url fallback:", err);
  }

  // Fallback seguro a base64 Data URL para que nunca falle la experiencia del usuario
  try {
    const dataUrl = await fileToDataUrl(file);
    return {
      url: dataUrl,
      name: file.name,
      size: file.size,
      error: null,
    };
  } catch (readErr) {
    return {
      url: "",
      name: file.name,
      size: file.size,
      error: readErr instanceof Error ? readErr.message : "Error al leer archivo local",
    };
  }
}
