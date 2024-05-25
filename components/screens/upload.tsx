"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Plus, X } from "lucide-react";
import { DocumentCard } from "@/components/shared/document";
import { cn } from "@/lib/utils";

type InputType = "prompt" | "docs" | "links";

interface Doc {
  id: string;
  name: string;
  size: string;
}

interface Props {
  sessionId: string | null;
  onContinueAction: (type: InputType, data: any) => void;
  loading?: boolean;
  error?: string | null;
}

export function UploadScreen({
  sessionId,
  onContinueAction,
  loading,
  error,
}: Props) {
  const [inputType, setInputType] = useState<InputType>("docs");
  const [promptText, setPromptText] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
    }));

    setDocs((prev) => [...prev, ...newDocs]);
  };

  const addLink = () => {
    if (currentLink.trim()) {
      setLinks((prev) => [...prev, currentLink.trim()]);
      setCurrentLink("");
    }
  };

  const handleSubmit = () => {
    if (inputType === "prompt") {
      onContinueAction("prompt", promptText);
    } else if (inputType === "docs") {
      onContinueAction("docs", docs);
    } else {
      onContinueAction("links", links);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Learning Source</h2>
        <p className="text-gray-600">
          Upload documents, paste text, or add links
        </p>
      </div>

      <div className="flex gap-4">
        {(["docs", "prompt", "links"] as InputType[]).map((type) => (
          <Button
            key={type}
            variant={inputType === type ? "default" : "outline"}
            onClick={() => setInputType(type)}
          >
            {type === "docs"
              ? "Documents"
              : type === "prompt"
                ? "Text"
                : "Links"}
          </Button>
        ))}
      </div>

      <Card className="p-6">
        {inputType === "docs" && (
          <div className="space-y-4">
            <label className="flex items-start justify-start w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 p-4">
              <div>
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag files
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {docs.length > 0 && (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    name={doc.name}
                    size={doc.size}
                    onRemove={() =>
                      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {inputType === "prompt" && (
          <textarea
            className="w-full h-48 p-4 border rounded-lg"
            placeholder="Paste your text here..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
        )}

        {inputType === "links" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={currentLink}
                onChange={(e) => setCurrentLink(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addLink()}
              />
              <Button onClick={addLink}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((link, idx) => (
                  <Card
                    key={idx}
                    className="p-3 flex items-center justify-between"
                  >
                    <span className="text-sm truncate flex-1">{link}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setLinks((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Processing..." : "Continue"}
      </Button>
    </div>
  );
}
