"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LogViewer } from "@/components/dashboard/log-viewer"
import type { EnvironmentConfig, Environment } from "@/lib/environment-config"
import { defaultEnvironments } from "@/lib/environment-config"

export default function ClientLogs() {
  const searchParams = useSearchParams()
  const envFromQuery = (searchParams.get("env") || "SST") as Environment
  const [environment, setEnvironment] = useState<Environment>(envFromQuery)

  useEffect(() => {
    setEnvironment(envFromQuery)
  }, [envFromQuery])

  // Find the matching environment config or use a fallback
  const environmentConfig: EnvironmentConfig = defaultEnvironments.find(
    (e) => e.name === environment
  ) ?? {
    name: environment,
    color: "bg-green-500",
    isConfigured: false,
    db: {
      hostname: "",
      port: "1521",
      connectionType: "sid",
      sid: "",
      serviceName: "",
      username: "",
      password: "",
    },
    auth: {
      username: "",
      password: "",
    },
    endpoint: {
      host: "",
    },
    unix: {
      hostName: "localhost",
      port: "22",
      userName: "user",
      password: "",
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
