import { EnvironmentConfig, isEnvironmentConfigured } from "@/lib/environment-config"
import { logAudit } from "@/lib/audit-log"
export function validateEnvironment(
  env: EnvironmentConfig,
  options: { dryRun: boolean; userId: string }
) {
  const valid = isEnvironmentConfigured(env)
logAudit({
    env: env.name,
    action: "ENV_VALIDATED",
    userId: options.userId,
    dryRun: options.dryRun,
    success: valid,
  })
if (!valid) {
    throw new Error(`Environment ${env.name} is not fully configured`)
  }
}
