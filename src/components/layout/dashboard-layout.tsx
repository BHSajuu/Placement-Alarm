import type React from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gray-950 text-gray-100 overflow-hidden">

      <div
        className="absolute inset-0 z-0 pointer-events-none"
      >
        {/* Soft radial spotlight at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(120,119,198,0.15),transparent)]" />

        {/* Faint grid pattern */}       
       <div className="absolute inset-0  bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" /></div>

      <main
        className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-10 lg:py-12"
        style={{ animation: "fadeInUp 0.8s ease-out" }}
      >
        {children}
      </main>
    </div>
  )
}