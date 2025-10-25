"use client";

export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>

          {/* Spinning gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>

          {/* Inner pulse */}
          <div className="absolute inset-2 rounded-full bg-blue-500/20 animate-pulse"></div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{text}</span>
          <div className="flex gap-1">
            <div
              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
