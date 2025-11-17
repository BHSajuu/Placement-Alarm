// src/components/dashboard/status-update-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { Label } from "../ui/label";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import { STATUS_OPTIONS } from "@/lib/constants";

interface StatusUpdateModalProps {
  companyId: Id<"companies"> | null;
  isOpen: boolean;
  onClose: () => void;
  companies: Array<{ _id: Id<"companies">; name: string; status: string; statusDateTime?: string; note?: string }>;
}

export function StatusUpdateModal({
  companyId,
  isOpen,
  onClose,
  companies,
}: StatusUpdateModalProps) {
  const [status, setStatus] = useState("");
  const [statusDateTime, setStatusDateTime] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusDate, setStatusDate] = useState("");
  const [timeHour, setTimeHour] = useState("");
  const [timeMinute, setTimeMinute] = useState("");
  const [timeAmPm, setTimeAmPm] = useState("AM");

  const company = companies.find((c) => c._id === companyId);

  const updateCompanyDetails = useMutation(api.companies.updateCompanyDetails);

  
  const updateStatusDateTime = () => {
    if (statusDate && timeHour && timeMinute) {
      // Case 1: User provided full date and time
      let hour24 = parseInt(timeHour);
      if (timeAmPm === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (timeAmPm === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      
      const time24 = `${hour24.toString().padStart(2, '0')}:${timeMinute.padStart(2, '0')}`;
      const combinedDateTime = `${statusDate}T${time24}`;
      setStatusDateTime(combinedDateTime);
    } else if (statusDate) {
      // Case 2: User provided ONLY date, so default to current time
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      
      const combinedDateTime = `${statusDate}T${currentHour}:${currentMinute}`;
      setStatusDateTime(combinedDateTime);
    } else {
      // Case 3: No date provided, clear the datetime
      setStatusDateTime("");
    }
  };
  useEffect(() => {
    if (company) {
      setStatus(company.status);
      setStatusDateTime("");
      setNote("");
      setStatusDate("");
      setTimeHour("");
      setTimeMinute("");
      setTimeAmPm("AM");
    }
  }, [company]);

  useEffect(() => {
    updateStatusDateTime();
  }, [statusDate, timeHour, timeMinute, timeAmPm]);

  const handleUpdate = async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
  
      await updateCompanyDetails({
        companyId,
        status: status,
        statusDateTime: statusDateTime, 
        notes: note,                    
      });
      
      toast.success("Status updated successfully");
      onClose();

    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="  bg-gray-950 border-gray-700 text-white shadow-2xl shadow-blue-300/30">
        <DialogHeader>
          <DialogTitle className="text-white md:text-xl">
            Update Application Details for <span className="text-blue-300">{company?.name}.</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-300">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-[#7886C7] border-gray-700">
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-black ">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          </div>
          
          <div className="space-y-2">
            <Label htmlFor="statusDateTime" className="text-gray-300">
              Status Date & Time (Optional)
            </Label>
            <div className="space-y-2 flex flex-col md:flex-row gap-4">
              <Input
                type="date"
                id="status-date"
                value={statusDate}
                onChange={(e) => setStatusDate(e.target.value)}
                className={`bg-gray-800 border-gray-600 w-44 ${statusDate ? 'text-white' : 'text-gray-400'} placeholder:text-gray-400`}
              />
              <div className="flex gap-2 ">
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
          
          <div className="flex flex-col md:mr-4">
            <Label htmlFor="company-note" className="mb-1 text-gray-300">
              Add a Note (optional)
            </Label>
            <textarea
              id="company-note"
              rows={4}
              className="bg-gray-900 border border-gray-600 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Interview scheduled for next week…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="md:mr-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isLoading || !companyId}
            className="bg-green-300 hover:bg-green-600  text-gray-900 border-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="spinner  text-gray-950" /> Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}