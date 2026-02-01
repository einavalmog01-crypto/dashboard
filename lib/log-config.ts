// lib/log-config.ts

// Configuration for simulated log servers
export const logServersConfig = [
  {
    name: "WF1",
    label: "Web Front 1",
    basePath: "/var/logs",
    logFiles: ["catalina.out", "Online.log"],
  },
  {
    name: "WF2",
    label: "Web Front 2",
    basePath: "/var/logs",
    logFiles: ["catalina.out", "Online.log"],
  },
  {
    name: "WS",
    label: "Web Front 1",
    basePath: "/var/logs",
    logFiles: ["catalina.out", "Online.log"],
  },
  {
    name: "o2auws",
    label: "Web Front 1",
    basePath: "/var/logs",
    logFiles: ["catalina.out", "Online.log"],
  },
  {
    name: "OGEG",
    label: "Web Front 1",
    basePath: "/var/logs",
    logFiles: ["catalina.out", "Online.log"],
  },
  {
    name: "ogsearch",
    label: "Web Front 1",
    basePath: "/var/logs",
    logFiles: ["catalina.out", "Online.log"],
  },
] as const // important for type inference

// Function to generate simulated log content
export const generateSimulatedLog = (
  serverName: LogServer,
  fileName: LogFile,
  environment: string
) => {
  const now = new Date().toISOString()
  return `[${now}] [${serverName}] [${environment}] Simulated log entry for ${fileName}\n`.repeat(20)
}

// Dynamic types derived from the config
export type LogServer = (typeof logServersConfig)[number]["name"]
export type LogFile = (typeof logServersConfig)[number]["logFiles"][number]
