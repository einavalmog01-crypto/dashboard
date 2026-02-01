"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LogViewer } from "@/components/dashboard/log-viewer"
import type { Environment } from "@/lib/environment-config"
import { useEnvironment } from "@/lib/environment-context"

export default function ClientLogs() {
  const searchParams = useSearchParams()
  const { environments, setSelectedEnv } = useEnvironment()
  const envFromQuery = (searchParams.get("env") || "SST") as Environment
  const [environment, setEnvironment] = useState<Environment>(envFromQuery)

  useEffect(() => {
    setEnvironment(envFromQuery)
    // Also update the global context so it stays in sync
    setSelectedEnv(envFromQuery)
  }, [envFromQuery, setSelectedEnv])

  // Find the matching environment config from stored configs (with credentials)
  const environmentConfig = environments.find((e) => e.name === environment)

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="border-b px-6 py-3">
        <h1 className="text-xl font-semibold">Backend Logs</h1>
        <p className="text-sm text-muted-foreground">
          Environment: {environment}
          {environmentConfig?.isConfigured && (
            <span className="ml-2 text-green-500">(Configured)</span>
          )}
          {!environmentConfig?.isConfigured && (
            <span className="ml-2 text-amber-500">(Not configured - go to Settings)</span>
          )}
        </p>
      </div>

      <div className="h-[calc(100vh-64px)]">
        <LogViewer
          fullscreen
          environment={environment}
          environmentConfig={environmentConfig}
        />
      </div>
    </div>
  )
}
