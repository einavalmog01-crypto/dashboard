import type { EnvironmentConfig } from "@/lib/environment-config"

/**
 * Execute a command via SSH dynamically.
 * ✅ No top-level import of `ssh2` (Turbopack safe)
 */
export async function runSshCommand(
  env: EnvironmentConfig,
  command: string
): Promise<string> {
  const { Client } = await import("ssh2")

  return new Promise((resolve, reject) => {
    const conn = new Client()
    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) return reject(err)

          let output = ""
          stream
            .on("data", (data) => (output += data.toString()))
            .on("close", () => {
              conn.end()
              resolve(output)
            })
        })
      })
      .on("error", reject)
      .connect({
        host: env.unix.hostName,
        port: Number(env.unix.port),
        username: env.unix.userName,
        password: env.unix.password,
      })
  })
}
