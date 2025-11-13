import React from 'react'

function LoadingSkeleton() {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          {/* Back button skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="inline-flex items-center space-x-2">
              <div className="p-2 rounded-full bg-gray-700/50 w-8 h-8"></div>
              <div className="h-4 bg-gray-700 rounded w-32"></div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
            {/* Header Section Skeleton */}
            <div className="relative bg-gradient-to-r from-blue-300/20 via-blue-600/20 to-blue-600/20 p-8 border-b border-gray-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
              <div className="relative animate-pulse">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                  {/* Profile Image Skeleton */}
                  <div className="relative">
                    <div className="h-32 w-32 bg-gray-700 rounded-full"></div>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-gray-700 rounded-full w-8 h-8"></div>
                  </div>

                  {/* Profile Info Skeleton */}
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="h-10 bg-gray-700 rounded w-64 mx-auto md:mx-0"></div>
                    <div className="h-6 bg-gray-700 rounded w-48 mx-auto md:mx-0"></div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <div className="h-8 bg-gray-700/50 rounded-full w-32"></div>
                      <div className="h-8 bg-gray-700/50 rounded-full w-36"></div>
                    </div>
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex flex-col items-center gap-6 mt-6 md:mt-0">
                    <div className="h-12 bg-gray-700 rounded-full w-32"></div>
                    <div className="h-12 bg-gray-700 rounded-full w-24"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section Skeleton */}
            <div className="p-8 animate-pulse space-y-8">
              {/* Name and Email Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-700/50 rounded-lg w-8 h-8"></div>
                    <div className="h-5 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-14 bg-gray-700/30 rounded-xl"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-700/50 rounded-lg w-8 h-8"></div>
                    <div className="h-5 bg-gray-700 rounded w-24"></div>
                  </div>
                  <div className="h-14 bg-gray-700/30 rounded-xl"></div>
                </div>
              </div>


              {/* Info Card Skeleton */}
              <div className="mt-8 p-6 bg-gray-700/20 rounded-xl border border-gray-700/50">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-700 rounded w-48"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700/70 rounded w-full"></div>
                    <div className="h-4 bg-gray-700/70 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700/70 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
}

export default LoadingSkeleton