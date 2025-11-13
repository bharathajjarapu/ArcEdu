"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageBackButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export function PageBackButton({
  label,
  onClick,
  className = "",
}: PageBackButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`text-gray-600 hover:text-gray-900 border-gray-200 bg-white ${className}`.trim()}
    >
      <ArrowLeft className="w-4 h-4 mr-1.5" />
      {label}
    </Button>
  );
}
