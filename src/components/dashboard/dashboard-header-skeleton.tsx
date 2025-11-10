"use client"

import React from "react"

export function DashboardHeaderSkeleton() {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mr-32 animate-pulse"
      style={{ animation: "fadeInUp 0.6s ease-out" }}
    >
      <div className="space-y-3 w-full max-w-xl">
        <div className="h-12 rounded-md bg-gray-700/50 w-3/5"></div>
        <div className="h-4 rounded-md bg-gray-700/40 w-1/2"></div>
      </div>

      <div className="flex items-center gap-6">
        <div className="h-10 w-40 rounded-lg bg-gray-700/50"></div>
        <div className="h-10 w-40 rounded-lg bg-gray-700/50"></div>
        <div className="h-10 w-10 rounded-full bg-gray-700/50"></div>
      </div>
    </div>
  )
}
