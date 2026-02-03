import React from 'react'
import { cn } from 'lib/utils'

function PreviewWindow({ children, footer, className }) {
  return (
    <div className={cn("bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden", className)}>
      {/* macOS-style title bar */}
      <div className="flex items-center gap-2 h-8 px-3 bg-[#2d2d2d] rounded-t-lg">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
      </div>

      {/* Email header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100 bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 w-14 shrink-0">To:</span>
            <span className="block min-h-[28px] px-2 py-1 text-sm text-gray-500 rounded border border-[#86efac] bg-[#dcfce7] w-fit">
              Your Recipient
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-900 w-14 shrink-0">Subject:</span>
            <span className="text-sm text-gray-700">Check out my new Email Signature</span>
          </div>
        </div>
      </div>

      {/* Fake body lines */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <div className="h-3 bg-gray-200 rounded w-full max-w-[95%] mb-2" />
        <div className="h-3 bg-gray-200 rounded w-full max-w-[70%]" />
      </div>

      {/* Preview content */}
      <div className="border border-gray-200 border-t-0 overflow-hidden bg-gray-50">
        {children}
      </div>

      {footer && (
        <div className="flex flex-wrap items-center justify-center gap-4 py-5 px-4 bg-white border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  )
}

export default PreviewWindow
