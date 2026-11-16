"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
import { cn, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from "@/lib/utils";

export type UploadedFile = {
  id?: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
};

interface FileDropzoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  maxFiles?: number;
}

export function FileDropzone({ onFilesChange, existingFiles = [], maxFiles }: FileDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const files = existingFiles;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setError(null);

      if (maxFiles && files.length + acceptedFiles.length > maxFiles) {
        setError(`Możesz dodać maksymalnie ${maxFiles} plików.`);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const uploadedFiles: UploadedFile[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            uploadedFiles.push(data.file);
          } else {
            const data = await response.json().catch(() => null);
            setError(data?.error ?? `Nie udało się przesłać pliku ${file.name}.`);
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          setError(`Nie udało się przesłać pliku ${file.name}.`);
        }
        setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100));
      }

      const newFiles = [...files, ...uploadedFiles];
      onFilesChange(newFiles);

      setUploadProgress(100);
      setTimeout(() => setIsUploading(false), 500);
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles ? maxFiles - files.length : undefined,
    disabled: isUploading || Boolean(maxFiles && files.length >= maxFiles),
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      setError(code === "file-too-large"
        ? "Plik przekracza limit 10 MB."
        : "Plik ma niedozwolony typ lub przekroczono limit liczby plików.");
    },
  });

  const removeFile = async (indexToRemove: number) => {
    const removedFile = files[indexToRemove];
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    onFilesChange(newFiles);
    if (removedFile.id) {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: removedFile.id }),
      }).catch(() => undefined);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps({
          "aria-label": "Dodaj załączniki — kliknij lub przeciągnij pliki",
          "aria-describedby": error ? "dropzone-error" : undefined,
          "aria-busy": isUploading,
        })}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center",
          isDragActive ? "border-[#145447] bg-[#145447]/5" : "border-gray-300 hover:border-[#145447] bg-white",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps({ "aria-label": "Wybierz pliki do przesłania" })} />
        <div className="rounded-full bg-[#145447]/10 p-3 mb-4" aria-hidden="true">
          <UploadCloud className="w-6 h-6 text-[#145447]" />
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">
          {isDragActive ? "Upuść pliki tutaj..." : "Kliknij, aby wybrać lub przeciągnij pliki"}
        </p>
        <p className="text-xs text-gray-600">
          Akceptowane: PDF, DOCX, XLSX, ZIP (max. 10MB)
        </p>
        {isUploading && (
          <div className="mt-4 w-full max-w-xs flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-[#145447]" aria-hidden="true" />
            <progress
              className="h-2 flex-1 overflow-hidden rounded-full accent-[#145447]"
              value={uploadProgress}
              max={100}
              aria-label="Postęp przesyłania plików"
            />
            <span className="text-xs font-medium text-gray-700" aria-hidden="true">{uploadProgress}%</span>
          </div>
        )}
      </div>

      {error && <p id="dropzone-error" role="alert" className="text-sm text-red-600">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={file.id || index}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-gray-50 rounded text-gray-600" aria-hidden="true">
                  <FileIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title={`Usuń plik ${file.originalName}`}
                aria-label={`Usuń plik ${file.originalName}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
