"use client"

import React from "react"

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="mx-auto w-44 h-44 rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 animate-pulse"
          style={{
            animationDelay: `${i * 0.06}s`,
            animation: `fadeInUp 0.6s ease-out ${i * 0.06}s both`,
          }}
        >
          <div className="p-4 h-full flex flex-col justify-center items-center">
            <div className="h-10 w-10 rounded-xl bg-gray-700/50 mb-4"></div>
            <div className="h-4 w-28 rounded bg-gray-700/40 mb-2"></div>
            <div className="h-8 w-16 rounded bg-gray-700/40"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
