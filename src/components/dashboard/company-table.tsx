"use client"

import { useMemo, useState} from "react"
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
import { Edit, Trash2, Dock, ListOrdered, Link, Link2, CircleOff } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Building2 } from "lucide-react"
import toast from "react-hot-toast"
import { StatusUpdateModal } from "./status-update-modal"
import {  useMutation, usePaginatedQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import {  useAuth, useUser } from "@clerk/nextjs"
import { Doc, Id } from "../../../convex/_generated/dataModel"
import { CompaniesTableSkeleton } from "./loadingSkeleton"
import { CompanyDocumentModal } from "../documents/company-document-modal"
import { TimelineModal } from "./timeline-modal"


interface CompanyTableProps {
  filters: {
    search: string
    status: string
    driveType: string
  }
}

type SelectedCompanyDocs = {
  id: Id<"companies">;
  name: string;
} | null;

type SelectedCompanyTimeline = {
  id: Id<"companies">;
  name: string;
} | null;

export function CompanyTable({ filters }: CompanyTableProps) {
  const [selectedCompany, setSelectedCompany] = useState<Id<"companies"> | null>(null)
  const [docModalCompany, setDocModalCompany] = useState<SelectedCompanyDocs>(null);
  const [timelineModalCompany, setTimelineModalCompany] = useState<SelectedCompanyTimeline>(null);
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
  
  const modalCompanies = useMemo(() => {
  return (companies ?? []).map((c: Doc<"companies">) => ({
    _id: c._id,
    name: c.name,
    status: c.status ?? "",
  }));
}, [companies]);

  const deleteCompany = useMutation(api.companies.deleteCompany);
  

  const handleDelete = async (companyId: Id<"companies">) => {
    try {
      await deleteCompany({ companyId });
      toast.success("Company deleted successfully")
    } catch (error) {
      toast.error("Failed to delete company")
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Applied":
        return "bg-yellow-700/20 text-gray-300 border-gray-700/30"
      case "Applied":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Shortlisted":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "Not Shortlisted":
        return "bg-red-300/20 text-orange-400 border-orange-500/30"
      case "PPT":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
      case "OA":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "OA not clear":
        return "bg-red-200/20 text-red-400 border-red-500/30"
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
  

  if(companies.length > 0){return (
    <>
      <div className="  rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table className="table-fixed w-full">
          <TableHeader className=" bg-gray-950  backdrop-blur-lg shadow-lg">
             <TableRow className="border-gray-700/50 hover:bg-gray-800/30">
              <TableHead className="w-46 pl-10 text-gray-200 font-semibold ">Company</TableHead>
              <TableHead className="w-28 text-gray-200 font-semibold ">Role</TableHead>
              <TableHead className="w-21 text-gray-200 font-semibold ">Type</TableHead>
              <TableHead className="w-23 text-gray-200 font-semibold ">Package</TableHead>
              <TableHead className="w-31 pl-10 text-gray-200 font-semibold ">Deadline</TableHead>
              <TableHead className="w-24 text-gray-200 font-semibold ">Status</TableHead>
              <TableHead className="w-20 text-gray-200 font-semibold ">Drive Type</TableHead>
              <TableHead className="w-8 text-gray-200 font-semibold ">Link</TableHead>
              <TableHead className="w-27 pl-10 text-gray-200 font-semibold ">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies?.map((company, index) => (
              <TableRow
                key={company._id}
                className="border-gray-700/50 hover:bg-slate-950/70  transition-all duration-300 hover:shadow-lg"
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`
                }}
              >
                <TableCell className="pl-4 font-semibold text-white whitespace-normal break-words max-w-[12rem]">
                  {company.name}
                </TableCell>
                <TableCell className="text-gray-200 font-medium whitespace-normal break-words max-w-[8rem]">
                  {company.role}
                </TableCell>
                <TableCell className="text-gray-200 font-medium whitespace-normal break-words max-w-[7rem]">
                  {company.type}
                </TableCell>

                <TableCell className="text-gray-200 font-bold whitespace-normal break-words max-w-[7rem]">
                  {company.package}
                </TableCell>
                <TableCell className="text-gray-300 font-medium whitespace-normal break-words max-w-[7rem]">
                  {formatDate(company.deadline || new Date())}
                </TableCell>
                <TableCell >
                  <div className="space-y-1">
                    <Badge
                      className={`${getStatusColor(company.status ?? "")}  border font-medium shadow-sm`}
                    >
                      {company.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-gray-200 font-medium whitespace-normal break-words max-w-[8rem]">
                  {company.driveType}
                </TableCell>
                <TableCell>
                  {company.link ? (
                    <a
                      href={company.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors duration-200"
                    >
                      <Link2/>
                    </a>
                  ) : (
                    <span className="text-gray-500 font-medium">
                      <CircleOff />
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setTimelineModalCompany({ id: company._id, name: company.name })
                      }
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all duration-300 hover:scale-110"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDocModalCompany({ id: company._id, name: company.name })
                      }
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/20 transition-all duration-300 hover:scale-110"
                    >
                      <Dock className="h-4 w-4" />
                    </Button>
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

          <div className="flex items-center justify-center py-10">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>

              <div className="absolute inset-0 animate-spin [animation-duration:1.4s]">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 via-indigo-200 to-slate-800 absolute -top-2 left-1/2 -translate-x-1/2 shadow-[0_0_15px_rgba(236,72,153,0.7)]"></div>
              </div>
            </div>
          </div>
      )}
      </div>

      <StatusUpdateModal
        companyId={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        companies={modalCompanies}
      />
      
      {docModalCompany && (
        <CompanyDocumentModal
          isOpen={!!docModalCompany}
          onClose={() => setDocModalCompany(null)}
          companyId={docModalCompany.id}
          companyName={docModalCompany.name}
        />
      )}
      {timelineModalCompany && (
        <TimelineModal
          isOpen={!!timelineModalCompany}
          onClose={() => setTimelineModalCompany(null)}
          companyId={timelineModalCompany.id}
          companyName={timelineModalCompany.name}
        />
      )}
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