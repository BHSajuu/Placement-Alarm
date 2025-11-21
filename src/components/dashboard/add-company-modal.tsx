"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { DRIVE_TYPE_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "@/lib/constants"

interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddCompanyModal({ isOpen, onClose }: AddCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    package: "",
    driveType: "",
    deadline: "",
    link: "",
    type: "",
    status: "Not Applied",
  })
  const [deadlineDate, setDeadlineDate] = useState("")
  const [timeHour, setTimeHour] = useState("")
  const [timeMinute, setTimeMinute] = useState("")
  const [timeAmPm, setTimeAmPm] = useState("AM")
  const [isLoading, setIsLoading] = useState(false)

  const addCompany = useMutation(api.companies.addCompany);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let finalDeadline = formData.deadline;

    // Check if a date is picked, but time fields are empty
    if (deadlineDate && (!timeHour || !timeMinute)) {
      // Create a date object from the provided date
      const dateParts = deadlineDate.split("-").map(part => parseInt(part, 10));
      // Set time to 23:59:59 (End of Day) in local timezone
      const eodDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59);
      finalDeadline = eodDate.toISOString();
    }

    // Use the new 'finalDeadline' variable for validation
    if (!formData.name || !formData.role || !formData.package || !formData.driveType || !finalDeadline || !formData.type) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      
      await addCompany({
        ...formData,
        deadline: finalDeadline 
      });

      toast.success("Company added successfully")
      setFormData({ name: "", role: "", package: "", driveType: "", deadline: "", link: "", type: "", status: "" })
      setDeadlineDate("")
      setTimeHour("")
      setTimeMinute("")
      setTimeAmPm("AM")
      onClose()
    } catch (error) {
      toast.error("Failed to add company")
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

// Helper function to combine date and time
  const updateDeadline = () => {
    if (deadlineDate && timeHour && timeMinute) {
      // Convert 12-hour to 24-hour format
      let hour24 = parseInt(timeHour)
      if (timeAmPm === "PM" && hour24 !== 12) {
        hour24 += 12
      } else if (timeAmPm === "AM" && hour24 === 12) {
        hour24 = 0
      }
      
      // Construct the string manually: YYYY-MM-DDTHH:mm
      const time24 = `${hour24.toString().padStart(2, '0')}:${timeMinute.padStart(2, '0')}`;
      const combinedDateTime = `${deadlineDate}T${time24}`;
      
      setFormData((prev) => ({ ...prev, deadline: combinedDateTime }));
    } else {
      // If incomplete, clear the deadline in formData so validation fails if submitted
      setFormData((prev) => ({ ...prev, deadline: "" }));
    }
  }

  // Update deadline when date or time changes
  useEffect(() => {
    updateDeadline()
  }, [deadlineDate, timeHour, timeMinute, timeAmPm])

  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-950 border-gray-700 text-white shadow-2xl shadow-blue-300/30">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Company</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Company Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Google"
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">
                Role
              </Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => updateField("role", e.target.value)}
                placeholder="Software Engineer"
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="package" className="text-gray-300">
                Package
              </Label>
              <Input
                id="package"
                value={formData.package}
                onChange={(e) => updateField("package", e.target.value)}
                placeholder="₹50 LPA"
                className=" bg-gray-900 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driveType" className="text-gray-300">
                Drive Type
              </Label>
              <Select value={formData.driveType} onValueChange={(value) => updateField("driveType", value)}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {DRIVE_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-gray-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-gray-300">
                Deadline
              </Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  id="deadline-date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className={`w-38 bg-gray-800 border-gray-600 ${deadlineDate ? 'text-white' : 'text-gray-400'} placeholder:text-gray-400`}
                  required
                />
                <div className="flex gap-2">
                  <Select value={timeHour} onValueChange={setTimeHour}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white w-20">
                      <SelectValue placeholder="Hr" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                        <SelectItem key={hour} value={hour.toString()} className="text-white hover:bg-gray-700">
                          {hour.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={timeMinute} onValueChange={setTimeMinute}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white w-20">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                        <SelectItem key={minute} value={minute.toString().padStart(2, '0')} className="text-white hover:bg-gray-700">
                          {minute.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={timeAmPm} onValueChange={setTimeAmPm}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="AM" className="text-white hover:bg-gray-700">AM</SelectItem>
                      <SelectItem value="PM" className="text-white hover:bg-gray-700">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2 ml-2">
              <Label htmlFor="link" className="text-gray-300">
                Apply Link
              </Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => updateField("link", e.target.value)}
                placeholder="https://company.com"
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driveType" className="text-gray-300">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Intern + FTE" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-gray-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 ">
              <Label htmlFor="status" className="text-gray-300">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#7886C7] border-gray-700">
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status} className="text-black hover:bg-gray-700">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-300 hover:bg-blue-400  rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-gray-500 transition-all duration-300 text-gray-700 hover:text-black border-0"
            >
              {isLoading ? (
                <>
                  <div className="spinner mr-2"></div>
                  Adding...
                </>
              ) : (
                "Add Company"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
