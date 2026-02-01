import { loadEnvironments } from "@/lib/environment-store"
import type { EnvironmentConfig } from "@/lib/environment-config"

/**
 * Returns the active environment config for a given name.
 * Throws an error if the environment does not exist or is not configured.
 */
export function getActiveEnvironment(
  selectedEnv: string
): EnvironmentConfig {
  const envs = loadEnvironments()

  // Look for the requested environment
  const env = envs.find(e => e.name === selectedEnv)

  if (!env) {
    // Provide a helpful error listing all available environments
    const available = envs.map(e => e.name).join(", ")
    throw new Error(
      `Environment "${selectedEnv}" not found. Available environments: ${available}`
    )
  }

  if (!env.isConfigured) {
    throw new Error(`Environment "${selectedEnv}" is not configured`)
  }

  return env
}
