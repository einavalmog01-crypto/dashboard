"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SanityReport } from "@/lib/sanity-reports"

interface RecentTest {
  id: string
  name: string
  status: "passed" | "failed"
  environment: string
  time: string
  type: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

function getRecentTestsFromReports(reports: SanityReport[]): RecentTest[] {
  const tests: RecentTest[] = []

  for (const report of reports) {
    for (const test of report.tests) {
      tests.push({
        id: `${report.id}-${test.testName}`,
        name: test.testName,
        status: test.status === "PASS" ? "passed" : "failed",
        environment: report.environment || "Unknown",
        time: formatTimeAgo(report.createdAt),
        type: report.type,
      })
    }
  }

  // Return most recent 10 tests
  return tests.slice(0, 10)
}

export function RecentTests() {
  const [recentTests, setRecentTests] = useState<RecentTest[]>([])

  useEffect(() => {
    const raw = localStorage.getItem("sanityReports")
    const reports: SanityReport[] = raw ? JSON.parse(raw) : []
    setRecentTests(getRecentTestsFromReports(reports))
  }, [])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Recent Tests</CardTitle>
      </CardHeader>

      <CardContent>
        {recentTests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tests have been run yet. Go to Test Runner to execute tests.</p>
        ) : (
          <div className="space-y-4">
            {recentTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      test.status === "passed" && "bg-green-500",
                      test.status === "failed" && "bg-red-500"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">{test.environment} - {test.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{test.type}</span>
                  <Badge
                    variant={test.status === "passed" ? "default" : "destructive"}
                    className={cn(
                      "capitalize",
                      test.status === "passed" && "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                    )}
                  >
                    {test.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
