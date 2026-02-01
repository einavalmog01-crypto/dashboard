"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useEnvironment } from "@/lib/environment-context"
import { CheckCircle, XCircle, Clock, Loader2, Settings2 } from "lucide-react"

interface TestCase {
  id: string
  name: string
  suite: string
  description?: string
  status: "idle" | "running" | "passed" | "failed"
  selected: boolean
  comment?: string
  customTemplates?: {
    [stepName: string]: string
  }
}

interface StepResult {
  name: string
  status: "PASS" | "FAILED"
  message: string
  request?: string
  response?: string
}

interface TestResult {
  testId: string
  testName: string
  environment: string
  success: boolean
  steps: StepResult[]
  error?: string
  timestamp: string
}

// Tests included in Basic Sanity
const BASIC_SANITY_TESTS = [
  "cable-submit-order",
  "mobile-telesales-submit-order",
  "mobile-retail-submit-order",
  "dsl-submit-order",
  "search-customer",
  "legacy-search",
]

const initialTests: TestCase[] = [
  { 
    id: "cable-submit-order", 
    name: "Cable Submit Order", 
    suite: "Cable", 
    description: "SubmitOrder (GenerateContract + Fulfillment) + SetOrderStatus flow",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "mobile-telesales-submit-order", 
    name: "Mobile Telesales Submit Order", 
    suite: "Mobile", 
    description: "SubmitOrder + FRIDA processing + SetOrderStatus_EAI + OMSendDocumentCallback + HWFulfilmentReady flow",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "mobile-retail-submit-order", 
    name: "Mobile Retail Submit Order", 
    suite: "Mobile", 
    description: "SubmitOrder + SetOrderStatus_EAI + IMPORTED_IN_VORAS + VORAS_FINAL_SUCCESS_HANDOUT flow",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "get-order", 
    name: "GetOrder", 
    suite: "Order", 
    description: "SubmitOrder + SetOrderStatus_EAI + GetOrder flow",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "dsl-submit-order", 
    name: "DSL Submit Order", 
    suite: "DSL", 
    description: "SubmitOrder + SetFNOrderStatus (CUSTOMER_CREATED + ORDER_COMPLETED) flow",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "search-customer", 
    name: "Search Customer", 
    suite: "Customer", 
    description: "Customer search functionality (Coming soon)",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "legacy-search", 
    name: "Legacy Search", 
    suite: "Legacy", 
    description: "Legacy search functionality (Coming soon)",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
]

// Default FRIDA evidence JSON template
const DEFAULT_FRIDA_EVIDENCE = `[
    {
        "orderNumber":"{{OGW_ORDER_ID}}.{{ORDER_LINE_ID}}",
        "naiveScore": 2,
        "fraudLevel": "Kein Betrug",
        "fraudAction": "Freigeben",
        "checkDate": "{{TIMESTAMP}}"
    }
]`

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
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const [scheduledSanities, setScheduledSanities] = useState<string[]>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [configureTestId, setConfigureTestId] = useState<string | null>(null)
  const [editingTemplates, setEditingTemplates] = useState<{ [stepName: string]: string }>({})
  const [scheduleType, setScheduleType] = useState<"full" | "basic">("full")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly">("daily")

  const selectedTests = tests.filter(t => t.selected)
  const passed = tests.filter(t => t.status === "passed").length
  const failed = tests.filter(t => t.status === "failed").length

async function runBasicSanity() {
  if (!currentEnvironmentConfig?.isConfigured) {
    alert(`Environment ${selectedEnv} is not configured. Please go to Settings and configure the credentials.`)
    return
  }

  setIsRunning(true)
  setTestResults([])
  const results: { name: string; status: "PASS" | "FAILED"; error: string; comment?: string }[] = []

  // Get tests that are in the Basic Sanity list
  const basicSanityTests = tests.filter(t => BASIC_SANITY_TESTS.includes(t.id))

  for (const test of basicSanityTests) {
    setTests(t => t.map(x => x.id === test.id ? { ...x, status: "running" } : x))

    try {
      const response = await fetch("/api/run/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          customTemplates: test.customTemplates,
        }),
      })

      const data = await response.json()
      const passed = data.success

      setTests(t => t.map(x => x.id === test.id ? { ...x, status: passed ? "passed" : "failed" } : x))

      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: passed,
        steps: data.steps || [],
        error: data.error,
        timestamp: new Date().toISOString(),
      }])

      results.push({
        name: test.name,
        status: passed ? "PASS" : "FAILED",
        error: data.error || "",
        comment: test.comment,
      })
    } catch (error) {
      setTests(t => t.map(x => x.id === test.id ? { ...x, status: "failed" } : x))

      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }])

      results.push({
        name: test.name,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        comment: test.comment,
      })
    }
  }

  // Save as BASIC sanity report
  saveSanityReport("BASIC", selectedEnv, results)
  setIsRunning(false)
}

async function runSelected() {
  if (!currentEnvironmentConfig?.isConfigured) {
    alert(`Environment ${selectedEnv} is not configured. Please go to Settings and configure the credentials.`)
    return
  }

  setIsRunning(true)
  setTestResults([]) // Clear previous results
  const results: { name: string; status: "PASS" | "FAILED"; error: string; comment?: string }[] = []

  for (const test of selectedTests) {
    setTests(t => t.map(x => x.id === test.id ? { ...x, status: "running" } : x))

    try {
      // Call the API with environment config and custom templates
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
          customTemplates: test.customTemplates,
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

      // Add to test results with full step details
      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: passed,
        steps: data.steps || [],
        error: data.error,
        timestamp: new Date().toISOString(),
      }])

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

      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }])

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
    if (!scheduleDate || !scheduleTime) {
      alert("Please select date and time")
      return
    }
    
    const schedule = {
      id: crypto.randomUUID(),
      type: scheduleType,
      environment: selectedEnv,
      date: scheduleDate,
      time: scheduleTime,
      recurrence: recurrence,
      createdAt: new Date().toISOString(),
      isActive: true,
    }
    
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("scheduledSanities") || "[]")
    localStorage.setItem("scheduledSanities", JSON.stringify([schedule, ...existing]))
    
    setScheduledSanities(prev => [
      `${scheduleType.toUpperCase()} Sanity on ${selectedEnv} — ${scheduleDate} ${scheduleTime} (${recurrence})`,
      ...prev
    ])
    setIsScheduleModalOpen(false)
    setScheduleDate("")
    setScheduleTime("")
    
    alert(`Sanity scheduled for ${scheduleDate} at ${scheduleTime} (${recurrence})`)
  }

  function handleCommentChange(testId: string, value: string) {
    setTests(tests =>
      tests.map(t => t.id === testId ? { ...t, comment: value } : t)
    )
  }

  function openConfigureModal(testId: string) {
    const test = tests.find(t => t.id === testId)
    const orderId = "{{ORDER_ID}}"
    const ogwOrderId = "{{OGW_ORDER_ID}}"
    const orderLineId = "{{ORDER_LINE_ID}}"
    
    const defaultSubmitOrderGC = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SubmitOrder>
      <OrderID>${orderId}</OrderID>
      <Mode>GenerateContract</Mode>
      <OGWOrderID></OGWOrderID>
    </vfde:SubmitOrder>
  </soapenv:Body>
</soapenv:Envelope>`

    const defaultSubmitOrderFulfillment = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SubmitOrder>
      <OrderID>${orderId}</OrderID>
      <Mode>Fulfillment</Mode>
      <OGWOrderID>${ogwOrderId}</OGWOrderID>
    </vfde:SubmitOrder>
  </soapenv:Body>
</soapenv:Envelope>`

    const defaultSetOrderStatus = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SetOrderStatus>
      <OGWSubOrderId>${ogwOrderId}</OGWSubOrderId>
      <OGWSubscriberId>${orderLineId}</OGWSubscriberId>
    </vfde:SetOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`

    if (testId === "cable-submit-order") {
      setEditingTemplates({
        "SubmitOrder (GenerateContract)": test?.customTemplates?.["SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "SubmitOrder (Fulfillment)": test?.customTemplates?.["SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "SetOrderStatus": test?.customTemplates?.["SetOrderStatus"] || defaultSetOrderStatus,
      })
    } else if (testId === "mobile-telesales-submit-order") {
      setEditingTemplates({
        "SubmitOrder (GenerateContract)": test?.customTemplates?.["SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "SubmitOrder (Fulfillment)": test?.customTemplates?.["SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "FRIDA Evidence JSON": test?.customTemplates?.["FRIDA Evidence JSON"] || DEFAULT_FRIDA_EVIDENCE,
        "SetOrderStatus_EAI": test?.customTemplates?.["SetOrderStatus_EAI"] || defaultSetOrderStatus,
        "OMSendDocumentCallback": test?.customTemplates?.["OMSendDocumentCallback"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:sendDocumentResponse>
      <auftragId>{{AUFTRAG_ID}}</auftragId>
      <externeId>${ogwOrderId}|${orderLineId}|P</externeId>
    </vfde:sendDocumentResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
        "HWFulfilmentReady": test?.customTemplates?.["HWFulfilmentReady"] || defaultSetOrderStatus,
      })
    } else if (testId === "mobile-retail-submit-order") {
      setEditingTemplates({
        "SubmitOrder (GenerateContract)": test?.customTemplates?.["SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "SubmitOrder (Fulfillment)": test?.customTemplates?.["SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "SetOrderStatus_EAI": test?.customTemplates?.["SetOrderStatus_EAI"] || defaultSetOrderStatus,
        "IMPORTED_IN_VORAS": test?.customTemplates?.["IMPORTED_IN_VORAS"] || defaultSetOrderStatus,
        "VORAS_FINAL_SUCCESS_HANDOUT": test?.customTemplates?.["VORAS_FINAL_SUCCESS_HANDOUT"] || defaultSetOrderStatus,
      })
    } else if (testId === "get-order") {
      setEditingTemplates({
        "SubmitOrder (GenerateContract)": test?.customTemplates?.["SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "SubmitOrder (Fulfillment)": test?.customTemplates?.["SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "SetOrderStatus_EAI": test?.customTemplates?.["SetOrderStatus_EAI"] || defaultSetOrderStatus,
        "GetOrder": test?.customTemplates?.["GetOrder"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:GetOrder>
      <OGWOrderId>${ogwOrderId}</OGWOrderId>
    </vfde:GetOrder>
  </soapenv:Body>
</soapenv:Envelope>`,
      })
    } else if (testId === "dsl-submit-order") {
      setEditingTemplates({
        "SubmitOrder (GenerateContract)": test?.customTemplates?.["SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "SubmitOrder (Fulfillment)": test?.customTemplates?.["SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "SetFNOrderStatus": test?.customTemplates?.["SetFNOrderStatus"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ogw="http://ogw.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <ogw:SetFNOrderStatus>
      <ogw:orderId>{{BAR_CODE}}</ogw:orderId>
      <ogw:barcode>{{BAR_CODE}}</ogw:barcode>
      <ogw:status>{{STATUS}}</ogw:status>
    </ogw:SetFNOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
      })
    }
    setConfigureTestId(testId)
  }

  function saveTestTemplates() {
    if (!configureTestId) return
    setTests(tests =>
      tests.map(t => 
        t.id === configureTestId 
          ? { ...t, customTemplates: editingTemplates }
          : t
      )
    )
    setConfigureTestId(null)
    setEditingTemplates({})
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
                        className="mt-1 border-white data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                        {t.customTemplates && (
                          <div className="text-xs text-green-600 mt-1">Custom templates configured</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(t.id.includes("cable") || t.id.includes("mobile") || t.id === "get-order" || t.id === "dsl-submit-order") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openConfigureModal(t.id)}
                          title="Configure request templates"
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      )}
                      <StatusIcon status={t.status} />
                    </div>
                  </div>
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
              className="w-full bg-amber-700 text-white hover:bg-amber-800"
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
              <Button 
                onClick={runBasicSanity}
                disabled={isRunning || !currentEnvironmentConfig?.isConfigured}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? "Running..." : `Run Basic Sanity (${selectedEnv})`}
              </Button>
              <Button 
                onClick={() => window.open(`/logs?env=${selectedEnv}`, "_blank")}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                View Logs ({selectedEnv})
              </Button>
              <Button 
                onClick={() => setIsScheduleModalOpen(true)} 
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                Schedule Sanity
              </Button>
              <Button
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => window.open("/sanity-reports", "_blank")}
              >
                Sanity Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Results Panel */}
      {testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Execution Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result) => (
              <div key={result.testId + result.timestamp} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedResult(expandedResult === result.testId ? null : result.testId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted text-left"
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.environment} - {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "PASSED" : "FAILED"}
                  </Badge>
                </button>

                {expandedResult === result.testId && (
                  <div className="border-t p-4 bg-muted/50 space-y-3">
                    {result.error && (
                      <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
                        Error: {result.error}
                      </div>
                    )}

                    {result.steps.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Steps:</div>
                        {result.steps.map((step, idx) => (
                          <div key={idx} className="border rounded bg-background">
                            <button
                              onClick={() => setExpandedStep(expandedStep === `${result.testId}-${idx}` ? null : `${result.testId}-${idx}`)}
                              className="w-full flex items-center justify-between p-3 hover:bg-muted text-left"
                            >
                              <div className="flex items-center gap-2">
                                {step.status === "PASS" ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium">{step.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{step.message}</span>
                            </button>

                            {expandedStep === `${result.testId}-${idx}` && (
                              <div className="border-t p-3 space-y-3">
                                {step.request && (
                                  <div>
                                    <div className="text-xs font-medium mb-1 text-muted-foreground">REQUEST:</div>
                                    <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-60">
                                      {step.request}
                                    </pre>
                                  </div>
                                )}
                                {step.response && (
                                  <div>
                                    <div className="text-xs font-medium mb-1 text-muted-foreground">RESPONSE:</div>
                                    <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-60">
                                      {step.response}
                                    </pre>
                                  </div>
                                )}
                                {!step.request && !step.response && (
                                  <div className="text-sm text-muted-foreground">No request/response data available</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {result.steps.length === 0 && !result.error && (
                      <div className="text-sm text-muted-foreground">No step details available</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Configure Test Modal */}
      {configureTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg p-6 w-[90vw] max-w-4xl max-h-[90vh] overflow-auto">
            <h4 className="text-lg font-semibold mb-2">
              Configure Request Templates
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Edit the SOAP XML templates for each step. Use placeholders:
              <code className="mx-1 px-1 bg-muted rounded">{"{{ORDER_ID}}"}</code>
              <code className="mx-1 px-1 bg-muted rounded">{"{{OGW_ORDER_ID}}"}</code>
            </p>

            <div className="space-y-4">
              {Object.entries(editingTemplates).map(([stepName, template]) => (
                <div key={stepName} className="space-y-2">
                  <label className="text-sm font-medium">{stepName}</label>
                  <textarea
                    value={template}
                    onChange={(e) => setEditingTemplates(prev => ({
                      ...prev,
                      [stepName]: e.target.value
                    }))}
                    className="w-full h-48 font-mono text-xs border rounded p-3 bg-black text-green-400"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfigureTestId(null)
                  setEditingTemplates({})
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveTestTemplates}>
                Save Templates
              </Button>
            </div>
          </div>
        </div>
      )}

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
