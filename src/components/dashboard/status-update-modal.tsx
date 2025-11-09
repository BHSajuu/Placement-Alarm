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
      let hour24 = parseInt(timeHour);
      if (timeAmPm === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (timeAmPm === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      
      const time24 = `${hour24.toString().padStart(2, '0')}:${timeMinute.padStart(2, '0')}`;
      const combinedDateTime = `${statusDate}T${time24}`;
      setStatusDateTime(combinedDateTime);
    }
  };

  useEffect(() => {
    if (company) {
      setStatus(company.status);
      setStatusDateTime("");
      setNote(company.note ?? "");
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
      const patchData: { 
        status?: string;
        statusDateTime?: string;
        notes?: string;
      } = {};

      patchData.status = status;
      patchData.notes = note;
      patchData.statusDateTime = statusDateTime;

      // Only call the mutation if there are changes to be made
      if (patchData.status || patchData.statusDateTime || patchData.notes) {
        await updateCompanyDetails({
          companyId,
          ...patchData,
        });
        toast.success("Status updated successfully");
        onClose();
      } else {
        toast.error("No changes detected");
        onClose();
      }

    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Update Application Details for {company?.name}.
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-300">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {[
                "Not Applied",
                "Applied",
                "Not Shortlisted",
                "Shortlisted",
                "Pre Placement Talk",
                "OA",
                "OA not clear",
                "Aptitude round",
                "GD",
                "Technical round",
                "Interview",
                "Offer",
                "Rejected",
              ].map((s) => (
                <SelectItem key={s} value={s} className="text-white hover:bg-gray-700">
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
            <div className="space-y-2 flex gap-4">
              <Input
                type="date"
                id="status-date"
                value={statusDate}
                onChange={(e) => setStatusDate(e.target.value)}
                className={`bg-gray-700 border-gray-600 ${statusDate ? 'text-white' : 'text-gray-400'} placeholder:text-gray-400`}
              />
              <div className="flex gap-2">
                <Select value={timeHour} onValueChange={setTimeHour}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-20">
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
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-20">
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
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-20">
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
          
          <div className="flex flex-col">
            <Label htmlFor="company-note" className="mb-1 text-gray-300">
              Add a Note (optional)
            </Label>
            <textarea
              id="company-note"
              rows={4}
              className="bg-gray-700 border border-gray-600 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Interview scheduled for next week…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
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
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2" /> Updating...
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