"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Bell, X, CheckCheck, Loader2, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Id } from "../../../convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { formatDate } from "@/lib/utils" 

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const notifications = useQuery(api.notifications.getUnreadNotifications)
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const router = useRouter()

  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications?.length ?? 0
  
  const acceptProposal = useMutation(api.companies.addCompanyFromProposal);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownRef])

  const handleNotificationClick = async (notification: {
    _id: Id<"notifications">
    link: string
  }) => {
    try {
      await markAsRead({ notificationId: notification._id })
      router.push(notification.link)
      setIsOpen(false)
    } catch (error) {
      toast.error("Failed to mark notification as read.")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return
    try {
      await markAllAsRead()
      toast.success("All notifications marked as read!")
    } catch (error) {
      toast.error("Failed to mark all as read.")
    }
  }

  const handleInsert = async (e: React.MouseEvent, notification: any) => {
    e.stopPropagation(); 
    const toastId = toast.loading("Adding company...");
    
    try {
      const data = JSON.parse(notification.companyData);
      
      // Call a specific mutation that adds company AND deletes/marks notification
      await acceptProposal({
        notificationId: notification._id,
        companyData: data
      });
      
      toast.success("Company added successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add company", { id: toastId });
    }
};
   
  return (
    <div className="relative" ref={dropdownRef}>
     <Button
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group bg-gray-900 rounded-full p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-110 border border-purple-500/30"
      >
        <Bell className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-gray-950 animate-pulse">
            {unreadCount}
          </div>
        )}
      </Button>
      {isOpen && (
        <div 
          className="absolute top-20 -left-51  md:-left-96 w-96 md:w-[500px] max-w-xl bg-gray-900/90 border border-gray-700/50 rounded-2xl shadow-2xl shadow-blue-500/20 backdrop-blur-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <h4 className="text-lg font-semibold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
              Notifications
            </h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-blue-400 p-0 h-auto"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all as read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications === undefined ? (
              <div className="p-8 flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : unreadCount === 0 ? (
              <div className="p-8 text-center h-48 flex flex-col justify-center items-center">
                <h5 className="font-semibold text-white mb-1">All Caught Up!</h5>
                <p className="text-sm text-gray-400">You have no new notifications.</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-start gap-3 mx-2 p-4 hover:bg-blue-100/20 rounded-3xl cursor-pointer transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500/20 to-yellow-500/20 flex items-center justify-center border border-gray-700/50">
                      <Bell className="w-4 h-4 text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200 leading-snug">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {formatDate(notification._creationTime)}
                      </p>
                    </div>

                    {/* Insert Button for Proposals */}
                    {notification.type === "company_proposal" && (
                      <Button
                        size="sm"
                        onClick={(e) => handleInsert(e, notification)}
                        className="ml-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 h-8"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Insert into table
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}