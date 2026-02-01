import { resolveEnvironment } from "@/lib/environment-resolver"
import { runTests } from "./run-tests"
import type { RunOptions } from "./types"
export async function executeForEnv(
  envName: string,
  options: RunOptions
) {
  const env = resolveEnvironment(envName)
return runTests(env, options)
}
