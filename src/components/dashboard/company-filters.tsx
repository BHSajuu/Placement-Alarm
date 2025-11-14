"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface CompanyFiltersProps {
  filters: {
    search: string
    status: string
    driveType: string
  }
  onFiltersChange: (filters: any) => void
}

export function CompanyFilters({ filters, onFiltersChange }: CompanyFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      driveType: "all",
    })
  }

  const hasActiveFilters = filters.search || filters.status !== "all" || filters.driveType !== "all"

  return (
    <div className="flex flex-col sm:flex-row gap-4" style={{
      animation: "slideInFromLeft 0.6s ease-out"
    }}>
      <div className="flex-1">
        <Input
          placeholder="Search companies or roles..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="rounded-full bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:bg-gray-700/70 transition-all duration-300 backdrop-blur-sm shadow-lg"
        />
      </div>
      <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
        <SelectTrigger className="w-full rounded-full sm:w-[180px] bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm shadow-lg">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800/90  border-gray-700/50 backdrop-blur-sm">
          <SelectItem value="all" className="text-white hover:bg-gray-700">
            All Status
          </SelectItem>
          <SelectItem value="Applied" className="text-white hover:bg-gray-700">
            Applied
          </SelectItem>
          <SelectItem value="Interview" className="text-white hover:bg-gray-700">
            Interview
          </SelectItem>
          <SelectItem value="Offer" className="text-white hover:bg-gray-700">
            Offer
          </SelectItem>
          <SelectItem value="Rejected" className="text-white hover:bg-gray-700">
            Rejected
          </SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.driveType} onValueChange={(value) => updateFilter("driveType", value)}>
        <SelectTrigger className="w-full rounded-full sm:w-[180px] bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm shadow-lg">
          <SelectValue placeholder="Drive Type" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800/90 border-gray-700/50 backdrop-blur-sm">
          <SelectItem value="all" className="text-white hover:bg-gray-700">
            All Types
          </SelectItem>
          <SelectItem value="On-Campus" className="text-white hover:bg-gray-700">
            On-Campus
          </SelectItem>
          <SelectItem value="Off-Campus" className="text-white hover:bg-gray-700">
            Off-Campus
          </SelectItem>
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full sm:w-auto bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-600/70 transition-all duration-300 backdrop-blur-sm shadow-lg"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  )
}
