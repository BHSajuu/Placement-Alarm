import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

export function CompaniesTableSkeleton({ rows = 5 }: { rows?: number }) {
  const headers = [
    { label: "Company", width: "w-48" },
    { label: "Role", width: "w-26" },
    { label: "Type", width: "w-24" },
    { label: "Package", width: "w-20" },
    { label: "Deadline", width: "w-28" },
    { label: "Status", width: "w-30" },
    { label: "Drive Type", width: "w-26" },
    { label: "Link", width: "w-16" },
    { label: "Actions", width: "w-28" },
  ];

  return (
    <div className="rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl backdrop-blur-sm animate-pulse">
      <Table>
        {/* Header (static, but pulsing) */}
        <TableHeader className="bg-gradient-to-r from-gray-900/80 to-gray-800/80">
          <TableRow className="border-gray-700/50">
            {/* Applied fixed widths to match the real table component */}
            {headers.map((header) => (
              <TableHead key={header.label} className={`${header.width} text-gray-200 font-semibold`}>
                <div className="h-4 w-20 bg-gray-700 rounded-md" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        {/* Body: multiple skeleton rows */}
        <TableBody>
          {Array.from({ length: rows }).map((_, idx) => (
            <TableRow
              key={idx}
              className="border-gray-700/50"
            >
              {headers.map((_, cell) => (
                <TableCell key={cell}>
                  <div className="h-4 bg-gray-700 rounded-md w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}