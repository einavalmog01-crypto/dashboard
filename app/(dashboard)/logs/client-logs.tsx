"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LogViewer } from "@/components/dashboard/log-viewer"
import type { EnvironmentConfig } from "@/lib/environment-config"

export default function ClientLogs() {
  const searchParams = useSearchParams()
  const envFromQuery = searchParams.get("env") || "SST"
  const [environment, setEnvironment] = useState(envFromQuery)

  useEffect(() => {
    setEnvironment(envFromQuery)
  }, [envFromQuery])

  const environmentConfig: EnvironmentConfig = {
    unix: {
      hostName: "localhost",
      userName: "user",
      port: 22,
    },
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="border-b px-6 py-3">
        <h1 className="text-xl font-semibold">Backend Logs</h1>
        <p className="text-sm text-muted-foreground">
          Environment: {environment}
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
