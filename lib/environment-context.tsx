"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { EnvironmentConfig, Environment } from "@/lib/environment-config"
import { defaultEnvironments } from "@/lib/environment-config"

const STORAGE_KEY = "env-configs"

interface EnvironmentContextType {
  selectedEnv: Environment
  setSelectedEnv: (env: Environment) => void
  environments: EnvironmentConfig[]
  setEnvironments: (configs: EnvironmentConfig[]) => void
  currentEnvironmentConfig: EnvironmentConfig | undefined
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined)

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [selectedEnv, setSelectedEnv] = useState<Environment>("SST")
  const [environments, setEnvironmentsState] = useState<EnvironmentConfig[]>(defaultEnvironments)

  // Load environments from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setEnvironmentsState(parsed)
      }
    } catch {
      // Use defaults if localStorage fails
    }
  }, [])

  // Save environments to localStorage whenever they change
  const setEnvironments = (configs: EnvironmentConfig[]) => {
    setEnvironmentsState(configs)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Get the current environment's full config
  const currentEnvironmentConfig = environments.find(e => e.name === selectedEnv)

  return (
    <EnvironmentContext.Provider 
      value={{ 
        selectedEnv, 
        setSelectedEnv, 
        environments, 
        setEnvironments,
        currentEnvironmentConfig 
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (!context) {
    throw new Error("useEnvironment must be used within EnvironmentProvider")
  }
  return context
}
