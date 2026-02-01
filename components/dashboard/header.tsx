"use client"

import { useState } from "react"
import { Bell, Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogViewer } from "./log-viewer" // optional: keep only if modal needed
import type { EnvironmentConfig } from "@/lib/environment-config"
import { useEnvironment } from "@/lib/environment-context"

interface HeaderProps {
  title: string
  description?: string
  environmentConfig?: EnvironmentConfig // optional config for LogViewer
}

const ENVS = ["SST", "CRs", "DEV3ST", "SEV4ST", "DEV5ST", "DEV360"]

export function Header({ title, description, environmentConfig }: HeaderProps) {
  const { selectedEnv, setSelectedEnv } = useEnvironment()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false) // optional

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        {/* Title & Description */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Right side: Search, Notification, Avatar, Env */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              className="w-64 bg-secondary pl-9"
            />
          </div>

          {/* Notification */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </Button>

          {/* Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              AT
            </AvatarFallback>
          </Avatar>

          {/* Environment Dropdown */}
          <div className="relative ml-auto">
            <button
              className={`flex items-center justify-between w-28 px-3 py-1 rounded
                ${dropdownOpen ? "bg-white text-black" : "bg-black text-white"}
                border border-border`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedEnv}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>

            {dropdownOpen && (
              <ul className="absolute right-0 mt-1 w-28 border border-border bg-white text-black rounded shadow-lg z-50">
                {ENVS.map((env) => (
                  <li
                    key={env}
                    className="px-3 py-1 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setSelectedEnv(env)
                      setDropdownOpen(false)
                    }}
                  >
                    {env}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Optional LogViewer modal */}
      {isLogViewerOpen && (
        <LogViewer
          isOpen={isLogViewerOpen}
          onClose={() => setIsLogViewerOpen(false)}
          environment={selectedEnv}
          environmentConfig={environmentConfig}
        />
      )}
    </>
  )
}
