'use client';

export default function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 animate-pulse">
      <div className="space-y-6">
        {/* Name field skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>

        {/* Email field skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>

        {/* Phone field skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>

        {/* Status field skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>

        {/* Notes field skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>

        {/* Buttons skeleton */}
        <div className="flex gap-4 pt-4">
          <div className="h-12 bg-gray-200 rounded flex-1"></div>
          <div className="h-12 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );
}
