"use client"

import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2, FileText, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Building2 } from "lucide-react"
import toast from "react-hot-toast"
import { StatusUpdateModal } from "./status-update-modal"
import {  useMutation, usePaginatedQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import {  useAuth, useUser } from "@clerk/nextjs"
import { Id } from "../../../convex/_generated/dataModel"
import { CompaniesTableSkeleton } from "./loadingSkeleton"


interface CompanyTableProps {
  filters: {
    search: string
    status: string
    driveType: string
  }
}

export function CompanyTable({ filters }: CompanyTableProps) {
  const [selectedCompany, setSelectedCompany] = useState<Id<"companies"> | null>(null)
  const [showFullNote, setShowFullNote] = useState<string | null>(null)
  const [noteCoords, setNoteCoords] = useState({ x: 0, y: 0 })
  const noteRef = useRef<HTMLDivElement>(null)

  const { user , isLoaded} = useUser()
  const { isSignedIn } = useAuth()


 const {
    results: companies, 
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.companies.getPaginatedCompanies, 
    isSignedIn && user?.id 
      ? { userId: user.id, filters: filters } 
      : "skip",
    { initialNumItems: 8 } 
  ); 

  const deleteCompany = useMutation(api.companies.deleteCompany);
  

  const handleDelete = async (companyId: Id<"companies">) => {
    try {
      await deleteCompany({ companyId });
      toast.success("Company deleted successfully")
    } catch (error) {
      toast.error("Failed to delete company")
    }
  }

  const handleNoteClick = (note: string, event: React.MouseEvent) => {
    if (!note || note.trim() === "") return
    
    const rect = event.currentTarget.getBoundingClientRect()
    setNoteCoords({
      x: rect.left,
      y: rect.top
    })
    setShowFullNote(note)
  }

  const handleClickOutside = (event: React.MouseEvent) => {
    if (noteRef.current && !noteRef.current.contains(event.target as Node)) {
      setShowFullNote(null)
    }
  }

  const truncateNote = (note: string | undefined, maxLength: number = 10) => {
    if (!note || note.trim() === "") return "No notes"
    if (note.length <= maxLength) return note
    return note.substring(0, maxLength) + "..."
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Applied":
        return "bg-gray-700/20 text-gray-300 border-gray-700/30"
      case "Applied":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Shortlisted":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "Not Shortlisted":
        return "bg-red-300/20 text-orange-400 border-orange-500/30"
      case "Pre Placement Talk":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
      case "OA":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "OA not clear":
        return "bg-yellow-600/20 text-cyan-400 border-cyan-500/30"
      case "Aptitude round":
        return "bg-teal-500/20 text-teal-400 border-teal-500/30"
      case "GD":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30"
      case "Technical round":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "Interview":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Offer":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  //  Signed in, but either Clerk is still loading or Convex hasn't returned data
  if (!isLoaded || (user && paginationStatus === "LoadingFirstPage")) {
    return <CompaniesTableSkeleton rows={8} />
  }


  //  Not signed in?
  if (!user) {
    return (
      <div className="text-center py-16" style={{
        animation: "fadeIn 0.8s ease-out"
      }}>
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
          <Building2 className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-gray-300 text-lg font-medium">
          Please sign in to view your company applications
        </p>
      </div>
    )
  } 
  

  //  Finally: we have a non‐empty array, render the table
  if(companies.length > 0){return (
    <>
      <div className="  rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table >
          <TableHeader className=" bg-gray-950  backdrop-blur-lg shadow-lg">
            <TableRow className="border-gray-700/50 hover:bg-gray-800/30">
              <TableHead className="text-gray-200 font-semibold">Company</TableHead>
              <TableHead className="text-gray-200 font-semibold">Role</TableHead>
              <TableHead className="text-gray-200 font-semibold">Type</TableHead>
              <TableHead className="text-gray-200 font-semibold">Package</TableHead>
              <TableHead className="text-gray-200 font-semibold">Deadline</TableHead>
              <TableHead className="text-gray-200 font-semibold">Status</TableHead>
              <TableHead className="text-gray-200 font-semibold">Drive Type</TableHead>
              <TableHead className="text-gray-200 font-semibold">Notes</TableHead>
              <TableHead className="text-gray-200 font-semibold">
                Registration Link
              </TableHead>
              <TableHead className="text-gray-200 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies?.map((company, index) => (
              <TableRow
                key={company._id}
                className="border-gray-700/50 hover:bg-gray-800/30 transition-all duration-300 hover:shadow-lg"
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`
                }}
              >
                <TableCell className="font-semibold text-white">
                  {company.name}
                </TableCell>
                <TableCell className="text-gray-200 font-medium">
                  {company.role}
                </TableCell>
                <TableCell className="text-gray-200 font-medium">
                  {company.type}
                </TableCell>

                <TableCell className="text-gray-200 font-bold">
                  {company.package}
                </TableCell>
                <TableCell className="text-gray-300 font-medium">
                  {formatDate(company.deadline || new Date())}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge
                      className={`${getStatusColor(company.status ?? "")} border font-medium shadow-sm`}
                    >
                      {company.status}
                    </Badge>
                    {company.statusDateTime && (
                      <div className="text-xs text-gray-400 font-medium">
                        {new Date(company.statusDateTime).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-200 font-medium">
                  {company.driveType}
                </TableCell>
                <TableCell>
                  <div
                    className={`text-gray-300 font-medium cursor-pointer hover:text-blue-400 transition-colors duration-200 flex items-center gap-1 ${
                      company.notes && company.notes.trim() !== "" ? "hover:underline" : ""
                    }`}
                    onClick={(e) => handleNoteClick(company.notes || "", e)}
                  >
                    {company.notes && company.notes.trim() !== "" && (
                      <FileText className="h-3 w-3" />
                    )}
                    <span className="text-sm">
                      {truncateNote(company.notes)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={company.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors duration-200"
                  >
                    Register
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedCompany(company._id)
                      }
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all duration-300 hover:scale-110"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(company._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
       <div className="mt-4 flex justify-center">
        {paginationStatus === "CanLoadMore" && (
          <Button
            variant="outline"
            onClick={() => loadMore(8)} 
            className="text-white bg-gray-700/50 border-gray-600 hover:bg-gray-700"
          >
            Load More
          </Button>
        )}
        {paginationStatus === "LoadingMore" && (
           <>
            <Loader2 className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-spin" />
            <div className="text-gray-400">Loading...</div>
           </>
        )}
      </div>

      {/* Full note popup with portal */}
      {showFullNote &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleClickOutside}
          >
            <div
              ref={noteRef}
              className="bg-gray-900 text-white p-4 rounded-xl border border-gray-700/50 max-w-md shadow-2xl backdrop-blur-sm"
              style={{
                position: "fixed",
                top: noteCoords.y + 30,
                left: Math.min(noteCoords.x, window.innerWidth - 400),
                animation: "fadeIn 0.3s ease-out"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">Note</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-200">
                {showFullNote}
              </p>
              <div className="mt-3 text-xs text-gray-400">
                Click outside to close
              </div>
            </div>
          </div>,
          document.body
        )}
      <StatusUpdateModal
        companyId={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        companies={(companies ?? []).map((c: any) => ({
          _id: c._id,
          name: c.name,
          status: c.status ?? "",
          statusDateTime: c.statusDateTime,
          note: c.notes ?? ""
        }))}
      />
    </>
  )}
  else{
    return (
    <div className="text-center py-16 animate-fadeIn">
      <div className="mx-auto h-16 w-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
        <Building2 className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-gray-300 text-lg font-medium">
        No companies added yet. Click "Add Company" to get started!
      </p>
    </div>
  )
  }
}