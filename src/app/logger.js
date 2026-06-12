const fs = require("fs")
const path = require("path")
const { getAppDataDir } = require("./config")

function createLogger() {
  const logDir = path.join(getAppDataDir(), "logs")
  fs.mkdirSync(logDir, { recursive: true })
  const logFile = path.join(logDir, `${today()}.log`)

  function write(level, message, meta) {
    const line = JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      meta: meta || undefined
    })
    fs.appendFileSync(logFile, `${line}\n`, "utf8")
    if (level === "error") {
      console.error(message, meta || "")
    } else {
      console.log(message, meta || "")
    }
  }

  return {
    logDir,
    logFile,
    info: (message, meta) => write("info", message, meta),
    warn: (message, meta) => write("warn", message, meta),
    error: (message, meta) => write("error", message, meta)
  }
}

function today() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

module.exports = { createLogger, today }
