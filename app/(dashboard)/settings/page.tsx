"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { EnvironmentSettings } from "@/components/environment-settings"
import { defaultEnvironments } from "@/lib/environment-config"

export default function SettingsPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState(defaultEnvironments)
  const [open, setOpen] = useState(true)

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <EnvironmentSettings
        isOpen={open}
        onClose={() => setOpen(false)}
        environments={configs}
        onSave={(updated) => {
          setConfigs(updated)
          localStorage.setItem("env-configs", JSON.stringify(updated))
          router.push("/") // ✅ go back to main page
        }}
      />
    </div>
  )
}
