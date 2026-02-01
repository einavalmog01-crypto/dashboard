"use client"

import { RunnerBranchesProvider } from "@/lib/runner-branches-context"

export default function RunnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RunnerBranchesProvider>
      {children}
    </RunnerBranchesProvider>
  )
}
