"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { Loader2, CalendarClock, ListChecks, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "../ui/button"
import { getStatusColor } from "@/lib/constants"

interface TimelineModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: Id<"companies"> | null
  companyName: string
}

export function TimelineModal({
  isOpen,
  onClose,
  companyId,
  companyName,
}: TimelineModalProps) {
  
    const statusEvents = useQuery(
    api.statusEvents.getStatusEventsForCompany,
    companyId ? { companyId } : "skip"
  )
  
  const deleteStatusEvent = useMutation(api.statusEvents.deleteStatusEvent);
  
  const handleDelete = (statusEventId: Id<"statusEvents">) => {
      
    const toastId = toast.loading("Deleting event...");
    deleteStatusEvent({ statusEventId })
      .then(() => {
        toast.success("Event deleted", { id: toastId });
      })
      .catch((err) => {
        console.error("Failed to delete event:", err);
        toast.error("Failed to delete event", { id: toastId });
      });
  };

 return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-gray-950 border-gray-700 text-white shadow-2xl shadow-blue-300/30">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            Timeline for <span className="text-blue-400">{companyName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="pb-2 px-2 space-y-3 max-h-96 overflow-y-auto">
          {statusEvents === undefined && (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            </div>
          )}

          {statusEvents && statusEvents.length === 0 && (
            <div className="text-center py-16 bg-gray-800/40 border border-gray-700/50 rounded-2xl">
              <ListChecks className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-md font-medium text-white">No Status History</h3>
              <p className="text-gray-400 text-sm">
                No status updates with dates have been logged for this company.
              </p>
            </div>
          )}

            {statusEvents && statusEvents.length > 0 && (
            <div className="relative pl-6">
            {/* Vertical timeline bar */}
            <div className="absolute left-[30px] top-2 bottom-2 w-0.5 bg-gray-700/50" />
            
            <div className="space-y-6">
                  {statusEvents.map((event) => (
                  <div key={event._id} className="relative flex items-center justify-between group">
                  
                    {/* Main Content (Dot + Text) */}
                     <div className="relative flex flex-1 items-start">
                        {/* Dot */}
                        <div className="absolute top-1.5 flex h-4 w-4 items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-blue-400 ring-4 ring-gray-900/50" />
                        </div>
                        
                        {/* Content */}
                        <div className="ml-8 w-full">
                          <div className="flex items-center justify-between  gap-4">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${getStatusColor(event.status)}`}>
                                    {event.status}
                              </span>
                              <div className="flex items-center  text-xs text-gray-400">
                                    <CalendarClock className="h-3 w-3 mr-1.5" />
                                    {formatDate(event.eventDate)}
                              </div>
                          </div>
                        
                        {event.notes && (
                        <div className="mt-2 text-gray-300 bg-gray-800/60 px-3 py-1 rounded-xl  ">
                              <p className="leading-relaxed whitespace-pre-wrap">{event.notes}</p>
                        </div>
                        )}
                        </div>
                  </div>

                  <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 hover:scale-110 flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                        <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                  ))}
            </div>
            </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}