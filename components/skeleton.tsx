"use client";

import { Card } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </Card>
  );
}

export function SessionSkeleton() {
  return (
    <Card className="p-4 bg-white/90 border-gray-200 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </Card>
  );
}

export function QuizSkeleton() {
  return (
    <Card className="p-8 bg-white/90 backdrop-blur-sm border-gray-200 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-full mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </Card>
  );
}

export function FlashcardSkeleton() {
  return (
    <Card className="p-8 bg-white/90 backdrop-blur-sm border-gray-200 animate-pulse">
      <div className="h-40 bg-gray-200 rounded-lg mb-6" />
      <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto" />
    </Card>
  );
}

export function UploadSkeleton() {
  return (
    <Card className="p-8 bg-white/90 backdrop-blur-sm border-gray-200 animate-pulse">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
        <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/4 mx-auto" />
      </div>
    </Card>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse"
        >
          <div className="w-8 h-8 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-2 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
