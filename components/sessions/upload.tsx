"use client";

import { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  open: boolean;
  onCloseAction: () => void;
  onUploadAction: (files: File[]) => Promise<void>;
  loading: boolean;
}

export function UploadModal({
  open,
  onCloseAction,
  onUploadAction,
  loading,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    await onUploadAction(files);
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Documents
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseAction}
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">
            Drag & drop files or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">PDF, TXT, DOC, DOCX</p>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
            disabled={loading}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("file-input")?.click()}
            disabled={loading}
          >
            Browse Files
          </Button>
        </div>

        {files.length > 0 && (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(i)}
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCloseAction}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || loading}
            className="flex-1 bg-gray-900 hover:bg-gray-800"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} file${files.length > 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
