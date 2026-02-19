"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2, AlertCircle } from "lucide-react";
import { validateImageFile, UploadError } from "@/lib/upload";
import { toast } from "sonner";

interface Props {
  imageUrl: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  uploading?: boolean;
  disabled?: boolean;
}

export function ItemImageUpload({
  imageUrl,
  onFileSelected,
  onRemove,
  uploading = false,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Show either the staged preview or the existing saved URL
  const displayUrl = previewUrl ?? imageUrl;

  const handleFile = useCallback(
    (file: File) => {
      try {
        validateImageFile(file);
      } catch (err) {
        if (err instanceof UploadError) {
          toast.error(err.message);
        }
        return;
      }

      // Create a local preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreviewUrl(null);
    onRemove();
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {displayUrl ? (
        /* ── Image preview ── */
        <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/50">
          <Image
            src={displayUrl}
            alt="Item image"
            fill
            className="object-cover"
            sizes="64px"
            unoptimized={displayUrl.startsWith("blob:")}
          />

          {/* Overlay with actions */}
          {!uploading && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full bg-white/20 p-1 text-white backdrop-blur-sm hover:bg-white/30"
                title="Replace image"
              >
                <ImagePlus size={12} />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-full bg-white/20 p-1 text-white backdrop-blur-sm hover:bg-red-500/70"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Upload spinner overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        /* ── Drop zone / upload button ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={disabled || uploading}
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            dragOver
              ? "border-gold bg-gold/5"
              : "border-border/50 hover:border-border hover:bg-muted/30"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus size={16} className="text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}
