"use client";

import { useRef, useState } from "react";
import { API_URL, authHeaders, errorDetail, errorMessage, getToken } from "../../lib/api";
import type { BillUploadResult } from "./types";

type UploadBillProps = {
  /** Called with what the backend read from the file, so the Add Bill form can be prefilled. */
  onUploaded: (result: BillUploadResult) => void;
  onAuthRequired: () => void;
};

export const UploadBill = ({ onUploaded, onAuthRequired }: UploadBillProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Choose a bill file before uploading.");
      return;
    }

    const token = getToken();
    if (!token) {
      onAuthRequired();
      return;
    }

    setIsUploading(true);
    setError("");
    setNotice("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/bills/upload`, {
        method: "POST",
        headers: authHeaders(token),
        body: uploadData,
      });
      const result = await response.json();

      if (response.status === 401) {
        onAuthRequired();
        return;
      }
      if (!response.ok) {
        throw new Error(errorDetail(result, "Unable to upload the bill file."));
      }

      const uploadResult = result as BillUploadResult;
      onUploaded(uploadResult);
      setNotice(uploadResult.message ?? "Bill file received.");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (uploadError) {
      setError(errorMessage(uploadError, "Unable to upload the bill file."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h3 className="mb-4 text-xl font-semibold">Upload Bill</h3>
      {/* The real file input is hidden; the "Choose file" button opens it */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png"
        className="hidden"
        aria-label="Choose a bill file"
        onChange={(event) => {
          setSelectedFile(event.target.files?.[0] ?? null);
          setError("");
          setNotice("");
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded bg-slate-700 px-4 py-2 font-bold text-white hover:bg-slate-600"
      >
        Choose file
      </button>
      {selectedFile && (
        <p className="mt-3 text-sm text-slate-300" role="status">
          Selected: {selectedFile.name}
        </p>
      )}
      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading}
        className="ml-3 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Upload bill"}
      </button>
      {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
      {notice && <p className="mt-3 text-sm text-emerald-400" role="status">{notice}</p>}
    </div>
  );
};
