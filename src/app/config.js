const fs = require("fs")
const path = require("path")
const {
  APP_DIR_NAME,
  DEFAULT_LABEL_HEIGHT_MM,
  DEFAULT_LABEL_WIDTH_MM,
  DEFAULT_PORT,
  DEFAULT_TOKEN
} = require("./constants")

function getAppDataDir() {
  if (process.env.PRINT_AGENT_HOME) {
    return process.env.PRINT_AGENT_HOME
  }
  if (process.defaultApp || process.env.NODE_ENV === "development") {
    return path.join(__dirname, "..", "..", ".runtime", "app-data")
  }
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || "", "AppData", "Roaming")
  return path.join(appData, APP_DIR_NAME)
}

function getConfigPath() {
  return path.join(getAppDataDir(), "config.json")
}

function defaultConfig() {
  return {
    port: DEFAULT_PORT,
    host: "127.0.0.1",
    defaultPrinter: "HPRT D35BT",
    token: DEFAULT_TOKEN,
    autoStart: true,
    defaultLabelWidthMm: DEFAULT_LABEL_WIDTH_MM,
    defaultLabelHeightMm: DEFAULT_LABEL_HEIGHT_MM,
    allowedOrigins: ["http://localhost:80", "http://localhost:5173", "http://127.0.0.1:5173"]
  }
}

function ensureAppDataDir() {
  fs.mkdirSync(getAppDataDir(), { recursive: true })
}

function loadConfig() {
  ensureAppDataDir()
  const file = getConfigPath()
  if (!fs.existsSync(file)) {
    const config = defaultConfig()
    saveConfig(config)
    return config
  }
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"))
  return normalizeConfig({ ...defaultConfig(), ...parsed })
}

function saveConfig(config) {
  ensureAppDataDir()
  const normalized = normalizeConfig(config)
  fs.writeFileSync(getConfigPath(), `${JSON.stringify(normalized, null, 2)}\n`, "utf8")
  return normalized
}

function normalizeConfig(config) {
  const normalized = { ...defaultConfig(), ...config }
  normalized.port = Number(normalized.port || DEFAULT_PORT)
  normalized.host = "127.0.0.1"
  normalized.defaultLabelWidthMm = Number(normalized.defaultLabelWidthMm || DEFAULT_LABEL_WIDTH_MM)
  normalized.defaultLabelHeightMm = Number(normalized.defaultLabelHeightMm || DEFAULT_LABEL_HEIGHT_MM)
  normalized.autoStart = normalized.autoStart !== false
  normalized.allowedOrigins = Array.isArray(normalized.allowedOrigins) ? normalized.allowedOrigins : []
  return normalized
}

module.exports = {
  defaultConfig,
  ensureAppDataDir,
  getAppDataDir,
  getConfigPath,
  loadConfig,
  normalizeConfig,
  saveConfig
}
