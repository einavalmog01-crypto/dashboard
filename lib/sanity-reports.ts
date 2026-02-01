export type SanityType = "FULL" | "BASIC" | "SELECTED" | "SCHEDULED"

export type SanityTestResult = {
  testName: string
  status: "PASS" | "FAILED"
  error?: string
  comment?: string
}

export type SanityReport = {
  id: string
  type: SanityType
  environment: string  // The environment the sanity was run against
  createdAt: string
  tests: SanityTestResult[]
}

const STORAGE_KEY = "sanityReports"

export function getReports(): SanityReport[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveReport(report: SanityReport) {
  const reports = getReports()
  reports.unshift(report) // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
}

export function getReportById(id: string): SanityReport | undefined {
  return getReports().find(r => r.id === id)
}
