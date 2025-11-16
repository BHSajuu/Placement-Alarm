"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompanyTable } from "./company-table"
import { CompanyFilters } from "./company-filters"
import { Command, Filter } from "lucide-react"

export function CompanyDirectory() {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    driveType: "all",
  })


  return (
    <Card className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/50 backdrop-blur-sm shadow-2xl">
      <CardHeader className="lg:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-300 hover:bg-blue-400  rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-gray-500 transition-all duration-300">
              <Command className="h-5 w-5 text-slate-700 hover:animate-spin" />
            </div>
            <div>
              <CardTitle className="text-xl lg:text-2xl text-white font-bold">Company Applications</CardTitle>
              <p className="text-sm text-slate-300 mt-1 font-medium">Manage your job applications</p>
            </div>
          </div>
          <div className="hidden  lg:flex items-center space-x-2 text-slate-300">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter & Search</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <CompanyFilters filters={filters} onFiltersChange={setFilters} />
        <CompanyTable filters={filters}  />
      </CardContent>
    </Card>
  )
}
