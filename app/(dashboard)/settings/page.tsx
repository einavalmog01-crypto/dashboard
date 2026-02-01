"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { EnvironmentSettings } from "@/components/environment-settings"
import { useEnvironment } from "@/lib/environment-context"

export default function SettingsPage() {
  const router = useRouter()
  const { environments, setEnvironments } = useEnvironment()
  const [open, setOpen] = useState(true)

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <EnvironmentSettings
        isOpen={open}
        onClose={() => setOpen(false)}
        environments={environments}
        onSave={(updated) => {
          setEnvironments(updated)
          router.push("/") // go back to main page
        }}
      />
    </div>
  )
}
