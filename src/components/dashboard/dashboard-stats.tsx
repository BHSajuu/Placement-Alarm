"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Building2, Clock, CheckCircle, XCircle } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useUser, useAuth } from "@clerk/nextjs"
import { DashboardStatsSkeleton } from "./dashboard-stats-skeleton"

export function DashboardStats() {
  const { user, isLoaded } = useUser()
  const { isSignedIn } = useAuth()
  const companies = useQuery(
    api.companies.getAllCompanies, 
    isSignedIn && user?.id ? { userId: user.id } : "skip"
  ) || []

  // Calculate stats from real data or show 0 if not authenticated
  const totalApplications = isSignedIn ? companies.length : 0
  const activeInterviews = isSignedIn ? companies.filter((c) => 
    c.status === "Interview" || c.status === "Technical round"
  ).length : 0
  const offersReceived = isSignedIn ? companies.filter((c) => c.status === "Offer").length : 0
  const rejections = isSignedIn ? companies.filter((c) => c.status === "Rejected").length : 0

  const stats = [
    {
      name: "Total Applications",
      value: totalApplications.toString(),
      icon: Building2,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      name: "Active Interviews",
      value: activeInterviews.toString(),
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
    },
    {
      name: "Offers Received",
      value: offersReceived.toString(),
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-500/10 to-green-500/10",
    },
    {
      name: "Rejections",
      value: rejections.toString(),
      icon: XCircle,
      gradient: "from-red-500 to-pink-500",
      bgGradient: "from-red-500/10 to-pink-500/10",
    },
  ]


 if(!isLoaded){
  return <DashboardStatsSkeleton/>
 }
 

  return (
    <div className="grid grid-cols-2 gap-2 lg:gap-0   lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.name}
          className="  mx-auto w-44 h-44 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105 hover:border-gray-600/50 backdrop-blur-sm"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-center">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg transform transition-transform duration-300 hover:scale-110`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent >
            <div className="space-y-1 text-center">
              <h3 className="text-sm font-medium text-slate-300 leading-tight">{stat.name}</h3>
              <div className="text-4xl font-bold text-white tracking-tight">{stat.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}