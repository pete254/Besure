// src/hooks/useDocumentPreview.ts
"use client";

import { useState } from "react";

interface DocumentPreviewState {
  isOpen: boolean;
  url: string | null;
  fileName: string;
  isLoading: boolean;
  error: string;
}

export function useDocumentPreview() {
  const [preview, setPreview] = useState<DocumentPreviewState>({
    isOpen: false,
    url: null,
    fileName: "",
    isLoading: false,
    error: "",
  });

  const openPreview = async (fileUrl: string, fileName: string) => {
    setPreview({ isOpen: true, url: null, fileName, isLoading: true, error: "" });
    try {
      // Check if it's a Cloudinary URL or already accessible
      if (fileUrl.startsWith("http")) {
        // For external URLs, we'll try to fetch and create blob URL
        // This handles CORS by using blob URLs
        try {
          const response = await fetch(fileUrl, { mode: "cors" });
          if (!response.ok) throw new Error("Failed to fetch file");
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setPreview((prev) => ({ ...prev, url: blobUrl, isLoading: false }));
        } catch {
          // If CORS fails, try direct URL (some PDFs may be accessible)
          setPreview((prev) => ({ ...prev, url: fileUrl, isLoading: false }));
        }
      } else {
        // If it's a local endpoint, use as-is
        setPreview((prev) => ({ ...prev, url: fileUrl, isLoading: false }));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load document";
      setPreview((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
    }
  };

  const closePreview = () => {
    if (preview.url && preview.url.startsWith("blob:")) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview({ isOpen: false, url: null, fileName: "", isLoading: false, error: "" });
  };

  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return {
    preview,
    openPreview,
    closePreview,
    downloadDocument,
  };
}
