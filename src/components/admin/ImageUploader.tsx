import { FC, useRef, useState } from "react";
import { env } from "@/config";
import { STORAGE_KEYS } from "@/constants/storage";
import { getErrorMessage } from "@/utils/errorMessage";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

function apiOrigin(): string {
  const configured = env.apiUrl;
  if (/^https?:\/\//.test(configured)) return configured.replace(/\/api\/?$/, "");
  return window.location.origin;
}

function authToken(): string | null {
  const stored = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as string;
  } catch {
    return null;
  }
}

export const ImageUploader: FC<ImageUploaderProps> = ({ images, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: File[]) => {
    setError(null);
    if (!files.length) return;
    if (images.length + files.length > 8) {
      setError("You can upload up to 8 images.");
      return;
    }
    const invalid = files.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (invalid) {
      setError(`${invalid.name}: only JPEG, PNG, and WebP images are allowed.`);
      return;
    }
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setError(`${oversized.name}: each image must be 5 MB or smaller.`);
      return;
    }
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const token = authToken();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiOrigin()}/api/admin/uploads`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onerror = () => reject(new Error("Network error while uploading images."));
      xhr.onload = () => {
        const body = (() => {
          try {
            return JSON.parse(xhr.responseText);
          } catch {
            return {};
          }
        })();
        if (xhr.status >= 200 && xhr.status < 300) {
          onChange([...images, ...(body.data || []).map((file: { url: string }) => file.url)]);
          resolve();
        } else {
          reject(new Error(body.message || "Image upload failed."));
        }
      };
      xhr.send(formData);
    }).catch((uploadError) => {
      setError(getErrorMessage(uploadError));
    }).finally(() => {
      setProgress(0);
    });
  };

  const remove = (index: number) => onChange(images.filter((_, imageIndex) => imageIndex !== index));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const reordered = [...images];
    const [item] = reordered.splice(from, 1);
    if (!item) return;
    reordered.splice(to, 0, item);
    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700"
        }`}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void upload(Array.from(event.dataTransfer.files));
        }}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">Drag images here or</p>
        <button type="button" className="mt-2 text-primary font-semibold hover:underline" onClick={() => inputRef.current?.click()}>
          choose files
        </button>
        <p className="mt-1 text-xs text-gray-500">JPEG, PNG, or WebP up to 5 MB each; up to 8 images</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            void upload(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
      </div>
      {progress > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image, index) => (
          <div key={`${image}-${index}`} className={`relative rounded-lg border-2 p-1 ${index === 0 ? "border-primary" : "border-transparent"}`}>
            <img src={image} alt={`Product image ${index + 1}`} className="h-24 w-full rounded object-cover" />
            {index === 0 && <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">Main</span>}
            <div className="mt-1 flex justify-between text-xs">
              <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Move image left">←</button>
              <button type="button" onClick={() => move(index, index + 1)} disabled={index === images.length - 1} aria-label="Move image right">→</button>
              <button type="button" onClick={() => onChange([image, ...images.filter((_, i) => i !== index)])}>Main</button>
              <button type="button" className="text-red-600" onClick={() => remove(index)} aria-label="Remove image">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
