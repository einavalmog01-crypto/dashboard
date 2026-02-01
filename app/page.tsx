"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentTests } from "@/components/dashboard/recent-tests"
import { Play, CheckCircle, XCircle, Clock } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your testing automation"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tests"
            value={1284}
            change="+12% from last week"
            changeType="positive"
            icon={Play}
          />
          <StatsCard
            title="Passed"
            value={1156}
            change="90.0% pass rate"
            changeType="positive"
            icon={CheckCircle}
          />
          <StatsCard
            title="Failed"
            value={98}
            change="-3% from last week"
            changeType="positive"
            icon={XCircle}
          />
          <StatsCard
            title="Avg Duration"
            value="2.4s"
            change="-0.3s faster"
            changeType="positive"
            icon={Clock}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTests />
          <TestSuiteStatus />
        </div>
      </div>
    </DashboardLayout>
  )
}

function TestSuiteStatus() {
  const suites = [
    { name: "Full Sanity", passed: 456, total: 478, percentage: 95 },
    { name: "Basic Sanity", passed: 234, total: 256, percentage: 91 },
    { name: "E2E Tests", passed: 89, total: 102, percentage: 87 },
    { name: "UT Tests", passed: 89, total: 102, percentage: 87 },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Test Suite Status</h3>
      <div className="space-y-4">
        {suites.map((suite) => (
          <div key={suite.name}>
            <div className="flex justify-between text-sm">
              <span>{suite.name}</span>
              <span>{suite.passed}/{suite.total}</span>
            </div>
            <div className="h-2 bg-secondary rounded">
              <div
                className="h-full bg-primary rounded"
                style={{ width: `${suite.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
