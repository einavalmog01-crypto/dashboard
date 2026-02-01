"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const recentTests = [
  { id: "1", name: "Login Flow Test", status: "passed", duration: "2.3s", time: "2 min ago" },
  { id: "2", name: "Checkout Process", status: "failed", duration: "5.1s", time: "5 min ago" },
  { id: "3", name: "User Registration", status: "passed", duration: "3.8s", time: "12 min ago" },
  { id: "4", name: "API Integration", status: "running", duration: "1.2s", time: "Just now" },
  { id: "5", name: "Dashboard Load", status: "passed", duration: "1.5s", time: "18 min ago" },
]

export function RecentTests() {
  const router = useRouter()

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Recent Tests</CardTitle>

        {/* ✅ Removed Sanity Reports button */}
      </CardHeader>

      <CardContent>
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
                    test.status === "passed" && "bg-success",
                    test.status === "failed" && "bg-destructive",
                    test.status === "running" && "bg-warning animate-pulse"
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{test.name}</p>
                  <p className="text-xs text-muted-foreground">{test.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{test.duration}</span>
                <Badge
                  variant={
                    test.status === "passed"
                      ? "default"
                      : test.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                  className={cn(
                    "capitalize",
                    test.status === "passed" && "bg-success/20 text-success hover:bg-success/30"
                  )}
                >
                  {test.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
