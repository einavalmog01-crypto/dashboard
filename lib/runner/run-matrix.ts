export async function runAcrossEnvs(
  envs: EnvironmentConfig[],
  runFn: (env) => Promise<any>
) {
  return Promise.allSettled(
    envs.map(env => runFn(env))
  )
}
