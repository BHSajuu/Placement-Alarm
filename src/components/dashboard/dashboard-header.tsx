"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles, LogIn, User, BrainCircuit } from "lucide-react"
import { AddCompanyModal } from "./add-company-modal"
import { SignedIn, SignInButton, useUser } from "@clerk/nextjs"
import { Unauthenticated } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import toast from "react-hot-toast"
import Link from "next/link"
import { DashboardHeaderSkeleton } from "./dashboard-header-skeleton"

export function DashboardHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { isLoaded } = useUser();
  
  const handleAddCompany = () => {
    if (!isSignedIn) {
      toast.custom((t) => (
        <div className={`bg-gradient-to-r from-blue-500/90 to-purple-600/90 backdrop-blur-sm border border-blue-400/30 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 transform transition-all duration-300 ${t.visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}>
          <LogIn className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Please sign in to add a company.</span>
        </div>
      ))
      return

    }
    setIsModalOpen(true)
  }
  
  if(!isLoaded){
    return <DashboardHeaderSkeleton/>
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mr-32" style={{
        animation: "fadeInUp 0.8s ease-out"
      }}>
        <div className="space-y-2 ">
          <div className="flex items-center space-x-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent tracking-tight">
              Dashboard
            </h1>
            <Sparkles className="h-7 w-7 text-yellow-400" style={{
              animation: "pulse 2s ease-in-out infinite"
            }} />
          </div>
          <p className="text-slate-300 text-lg font-medium">Track your applications and land your dream job</p>
        </div>

        <div className="flex items-start gap-16">
           <Link href="/analyzer">
            <Button
              variant="outline"
              className="bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-600/70"
            >
              <BrainCircuit className="h-4 w-4 mr-2" />
              AI Resume Analyzer
            </Button>
          </Link>

          <Button
            onClick={handleAddCompany}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 px-6 py-3 text-base font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
          
          <Unauthenticated>
            <SignInButton mode="modal">
              <div
                className="cursor-pointer bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <LogIn className="h-5 w-5 mr-2" />
                <span>Sign In</span>

              </div>
            </SignInButton>

          </Unauthenticated>
           {/* Profile Access Button - Creative floating design */}
          <SignedIn>
            <Link href="/profile">
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 group-hover:duration-200 animate-pulse"></div>
                <div className="relative bg-gray-900 rounded-full p-3 hover:bg-gray-800 transition-all duration-300 transform hover:scale-110 border border-purple-500/30">
                  <User className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
                </div>
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 whitespace-nowrap">
                    Profile Settings
                  </div>
                </div>
              </div>
            </Link>
          </SignedIn>

        </div>
      </div>
      <AddCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
