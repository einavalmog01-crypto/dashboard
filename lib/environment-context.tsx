"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface EnvironmentContextType {
  selectedEnv: string
  setSelectedEnv: (env: string) => void
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined)

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [selectedEnv, setSelectedEnv] = useState("SST")
  return (
    <EnvironmentContext.Provider value={{ selectedEnv, setSelectedEnv }}>
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
