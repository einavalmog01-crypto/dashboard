import type { EnvironmentConfig } from "@/lib/environment-config"
import { defaultEnvironments } from "@/lib/environment-config"

const STORAGE_KEY = "env-configs"

/**
 * Load environments safely
 * - Server-side: returns defaultEnvironments
 * - Client-side: reads localStorage if available
 */
export const loadEnvironments = (): EnvironmentConfig[] => {
  if (typeof window === "undefined") {
    return defaultEnvironments
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultEnvironments
  } catch {
    return defaultEnvironments
  }
}

/**
 * Save environments to localStorage (browser only)
 */
export const saveEnvironments = (configs: EnvironmentConfig[]) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
  } catch {
    // Ignore errors
  }
}
