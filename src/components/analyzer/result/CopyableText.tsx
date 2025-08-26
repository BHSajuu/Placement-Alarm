import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

interface CopyableTextProps {
  text: string;
  label: string;
  className?: string;
}

export default function CopyableText({ text, label, className = "" }: CopyableTextProps) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`group relative bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 ${className}`}>
      <p className="text-gray-200 leading-relaxed pr-8">{text}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(text, label)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white hover:bg-gray-700/50"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}