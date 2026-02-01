"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useEnvironment } from "@/lib/environment-context"
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"

interface TestCase {
  id: string
  name: string
  suite: string
  description?: string
  status: "idle" | "running" | "passed" | "failed"
  selected: boolean
  comment?: string
}

const initialTests: TestCase[] = [
  { 
    id: "cable-retail-submit-order", 
    name: "Cable Retail Submit Order", 
    suite: "Cable", 
    description: "SubmitOrder (GenerateContract + Fulfillment) + SetOrderStatus flow",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "cable-telesales-submit-order", 
    name: "Cable Telesales Submit Order", 
    suite: "Cable", 
    description: "SubmitOrder (GenerateContract + Fulfillment) + SetOrderStatus flow",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { id: "1", name: "User Login", suite: "Auth", status: "idle", selected: true, comment: "" },
  { id: "2", name: "Checkout Flow", suite: "E-Commerce", status: "idle", selected: true, comment: "" },
]

function saveSanityReport(
  type: "FULL" | "BASIC" | "SELECTED" | "SCHEDULED",
  environment: string,
  tests: { name: string; status: "PASS" | "FAILED"; error: string; comment?: string }[]
) {
  const report = {
    id: crypto.randomUUID(),
    type,
    environment,
    createdAt: new Date().toISOString(),
    tests,
  }

  const existing = JSON.parse(localStorage.getItem("sanityReports") || "[]")
  localStorage.setItem("sanityReports", JSON.stringify([report, ...existing]))

  return report.id
}

export default function TestRunnerPage() {
  const { selectedEnv, currentEnvironmentConfig } = useEnvironment()
  const [tests, setTests] = useState(initialTests)
  const [isRunning, setIsRunning] = useState(false)

  const [scheduledSanities, setScheduledSanities] = useState<string[]>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduleType, setScheduleType] = useState<"full" | "basic">("full")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly">("daily")

  const selectedTests = tests.filter(t => t.selected)
  const passed = tests.filter(t => t.status === "passed").length
  const failed = tests.filter(t => t.status === "failed").length

async function runSelected() {
  if (!currentEnvironmentConfig?.isConfigured) {
    alert(`Environment ${selectedEnv} is not configured. Please go to Settings and configure the credentials.`)
    return
  }

  setIsRunning(true)
  const results: { name: string; status: "PASS" | "FAILED"; error: string; comment?: string }[] = []

  for (const test of selectedTests) {
    setTests(t => t.map(x => x.id === test.id ? { ...x, status: "running" } : x))

    try {
      // Call the API with environment config
      const response = await fetch("/api/run/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: test.id,
          testName: test.name,
          environment: selectedEnv,
          config: {
            auth: currentEnvironmentConfig.auth,
            db: currentEnvironmentConfig.db,
            endpoint: currentEnvironmentConfig.endpoint,
            unix: currentEnvironmentConfig.unix,
          },
        }),
      })

      const data = await response.json()
      const passed = data.success

      setTests(t =>
        t.map(x =>
          x.id === test.id
            ? { ...x, status: passed ? "passed" : "failed" }
            : x
        )
      )

      results.push({
        name: test.name,
        status: passed ? "PASS" : "FAILED",
        error: data.error || "",
        comment: test.comment,
      })
    } catch (error) {
      setTests(t =>
        t.map(x =>
          x.id === test.id ? { ...x, status: "failed" } : x
        )
      )
      results.push({
        name: test.name,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        comment: test.comment,
      })
    }
  }

  // Save report
  saveSanityReport("SELECTED", selectedEnv, results)
  setIsRunning(false)
}


  function scheduleSanity() {
    const entry = `${scheduleType.toUpperCase()} Sanity on ${selectedEnv} — ${scheduleDate} ${scheduleTime} (${recurrence})`
    setScheduledSanities(prev => [entry, ...prev])
    setIsScheduleModalOpen(false)
  }

  function viewScheduledSanities() {
    if (scheduledSanities.length === 0) {
      alert("No scheduled sanities yet.")
      return
    }

    const testsForReport = scheduledSanities.map(s => ({
      name: s,
      status: "PASS" as const,
      error: "",
      comment: "",
    }))

    saveSanityReport("SCHEDULED", selectedEnv, testsForReport)
  }

  function handleCommentChange(testId: string, value: string) {
    setTests(tests =>
      tests.map(t => t.id === testId ? { ...t, comment: value } : t)
    )
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Test Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Test Queue</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Environment:</span>
                <Badge variant={currentEnvironmentConfig?.isConfigured ? "default" : "destructive"}>
                  {selectedEnv}
                  {!currentEnvironmentConfig?.isConfigured && " (Not configured)"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tests.map(t => (
                <div key={t.id} className="flex flex-col border p-3 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-start">
                      <Checkbox
                        checked={t.selected}
                        className="mt-1"
                        onCheckedChange={() =>
                          setTests(s =>
                            s.map(x => x.id === t.id ? { ...x, selected: !x.selected } : x)
                          )
                        }
                      />
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.suite}</div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                        )}
                      </div>
                    </div>
                    <StatusIcon status={t.status} />
                  </div>
                  <input
                    type="text"
                    value={t.comment || ""}
                    onChange={(e) => handleCommentChange(t.id, e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full border px-2 py-1 rounded text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-green-600 text-black"
                disabled={isRunning || selectedTests.length === 0}
                onClick={runSelected}
              >
                Run selected tests
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Summary label="Selected" value={selectedTests.length} />
              <Summary label="Passed" value={passed} />
              <Summary label="Failed" value={failed} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={() => window.open(`/run/full-sanity?env=${selectedEnv}`, "_blank")}>
                Run Full Sanity ({selectedEnv})
              </Button>
              <Button onClick={() => window.open(`/run/basic-sanity?env=${selectedEnv}`, "_blank")}>
                Run Basic Sanity ({selectedEnv})
              </Button>
              <Button onClick={() => window.open(`/logs?env=${selectedEnv}`, "_blank")}>
                View Logs ({selectedEnv})
              </Button>
              <Button onClick={() => setIsScheduleModalOpen(true)}>
                Schedule Sanity
              </Button>
              <Button
                onClick={viewScheduledSanities}
                className="bg-gray-200 text-black hover:bg-gray-300"
              >
                View Scheduled Sanities
              </Button>
              <Button
                className="bg-purple-600 text-white"
                onClick={() => window.open("/sanity-reports", "_blank")}
              >
                Sanity Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 text-black">
            <h4 className="text-lg font-semibold mb-4">Schedule Sanity</h4>
            <p className="text-sm text-gray-600 mb-4">
              Environment: <span className="font-semibold">{selectedEnv}</span>
            </p>

            <div className="space-y-2">
              <label className="flex flex-col">
                Sanity Type:
                <select
                  value={scheduleType}
                  onChange={e => setScheduleType(e.target.value as "full" | "basic")}
                  className="border px-2 py-1 rounded"
                >
                  <option value="full">Full Sanity</option>
                  <option value="basic">Basic Sanity</option>
                </select>
              </label>

              <label className="flex flex-col">
                Date:
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="border px-2 py-1 rounded"
                />
              </label>

              <label className="flex flex-col">
                Time:
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="border px-2 py-1 rounded"
                />
              </label>

              <label className="flex flex-col">
                Recurrence:
                <select
                  value={recurrence}
                  onChange={e => setRecurrence(e.target.value as "daily" | "weekly" | "monthly")}
                  className="border px-2 py-1 rounded"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={scheduleSanity}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Schedule
              </button>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <Badge>{value}</Badge>
    </div>
  )
}

function StatusIcon({ status }: { status: TestCase["status"] }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin" />
  if (status === "passed") return <CheckCircle className="h-4 w-4 text-green-500" />
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />
  return <Clock className="h-4 w-4 text-muted-foreground" />
}
