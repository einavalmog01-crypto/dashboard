import type { EnvironmentConfig } from "@/lib/environment-config"

// Base environments — update host/db as needed
export const defaultEnvironments: EnvironmentConfig[] = [
  {
    name: "dev",
    endpoint: { host: "http://localhost:3000" },
    db: {
      hostname: "localhost",
      port: 1521,
      username: "user",
      password: "pass",
      connectionType: "sid",
      sid: "XE",
    },
    auth: { username: "admin", password: "admin" },
    unix: { hostName: "localhost", port: 22, userName: "user", password: "pass" },
  },
  // Add other default environments here
]

const STORAGE_KEY = "environments"

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
