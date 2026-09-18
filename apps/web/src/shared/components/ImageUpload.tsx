import React, { useState, useRef } from "react";
import { uploadMediaFile } from "../lib/storage";
import { Button } from "@freelance/ui";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  mode?: "avatar" | "cover";
  label?: string;
  helperText?: string;
  folder?: "avatars" | "services" | "attachments";
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  mode = "avatar",
  label,
  helperText,
  folder = "avatars",
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP o GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no debe superar los 10MB de tamaño.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const res = await uploadMediaFile(file, folder);
      if (res.error) {
        setError(res.error);
      } else if (res.url) {
        onChange(res.url);
      }
    } catch (err) {
      setError("No se pudo procesar la imagen seleccionada.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset para permitir volver a seleccionar el mismo archivo si se desea
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  // 1. MODO AVATAR (Perfil)
  if (mode === "avatar") {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <label className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Círculo de Avatar interactivo */}
          <div
            onClick={triggerPicker}
            className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 cursor-pointer transition-all shadow-sm flex items-center justify-center bg-slate-100 ${
              isDragging
                ? "border-[#40798C] ring-4 ring-[#40798C]/20 scale-105"
                : "border-slate-200 hover:border-[#40798C]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            title="Haz clic para seleccionar foto de tu equipo"
          >
            {value ? (
              <img
                src={value}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl sm:text-4xl text-slate-400">👤</span>
            )}

            {/* Overlay Hover */}
            <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-lg">📷</span>
              <span className="text-[10px] font-bold">Cambiar</span>
            </div>

            {/* Spinner si está subiendo */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Controles de botón */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerPicker}
                disabled={uploading}
                className="text-xs font-semibold"
              >
                {uploading ? "Cargando..." : value ? "Cambiar foto" : "Subir foto desde equipo"}
              </Button>

              {value && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Quitar foto
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              {helperText || "Formatos admitidos: PNG, JPG o WebP. Máximo 10MB."}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>
        )}
      </div>
    );
  }

  // 2. MODO COVER (Portada de Servicios)
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-800">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {value ? (
        /* Vista previa con imagen ya seleccionada */
        <div className="relative group w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm max-h-64 aspect-[16/8] sm:aspect-[21/9]">
          <img
            src={value}
            alt="Portada del servicio"
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-4">
            <span className="text-xs font-medium text-white/90 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
              ✓ Imagen cargada
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerPicker}
                className="bg-white/90 hover:bg-white text-slate-800 text-xs font-bold border-none shadow-md"
              >
                Cambiar imagen
              </Button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-xs text-white bg-rose-600/90 hover:bg-rose-700 rounded-lg shadow-md font-semibold transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone para seleccionar archivo */
        <div
          onClick={triggerPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-full rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
            isDragging
              ? "border-[#40798C] bg-[#40798C]/5 scale-[1.01]"
              : "border-slate-300 hover:border-[#40798C] bg-slate-50/60 hover:bg-slate-50"
          }`}
        >
          {uploading ? (
            <div className="py-4 space-y-2">
              <div className="w-8 h-8 border-3 border-[#40798C] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Procesando imagen...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center text-2xl shadow-2xs border border-slate-200">
                🖼️
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">
                  Haz clic para seleccionar una foto de tu computadora
                </p>
                <p className="text-xs text-slate-500">
                  o arrastra y suelta el archivo aquí
                </p>
              </div>
              <div className="pt-1">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-200/80 text-[11px] font-semibold text-slate-700">
                  PNG, JPG o WebP (hasta 10MB)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}

      {error && (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      )}
    </div>
  );
}
