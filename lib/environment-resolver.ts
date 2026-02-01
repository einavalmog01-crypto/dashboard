import { loadEnvironments } from "./environment-store"
import type { EnvironmentConfig } from "./environment-config"
export function resolveEnvironment(name: string): EnvironmentConfig {
  const envs = loadEnvironments()
  const env = envs.find(e => e.name === name)
if (!env) {
    throw new Error(`Environment ${name} not found`)
  }
return env
}
