const path = require("path")
const { spawnSync } = require("child_process")

const rootDir = path.resolve(__dirname, "..")
const runtimeDir = path.join(rootDir, ".runtime")

process.env.ELECTRON_CACHE = process.env.ELECTRON_CACHE || path.join(runtimeDir, "electron-cache")
process.env.ELECTRON_BUILDER_CACHE = process.env.ELECTRON_BUILDER_CACHE || path.join(runtimeDir, "electron-builder-cache")
process.env.ELECTRON_BUILDER_BINARIES_MIRROR = process.env.ELECTRON_BUILDER_BINARIES_MIRROR || "https://npmmirror.com/mirrors/electron-builder-binaries/"

const defaultProxy = "http://127.0.0.1:7897"
process.env.HTTP_PROXY = process.env.HTTP_PROXY || defaultProxy
process.env.HTTPS_PROXY = process.env.HTTPS_PROXY || defaultProxy
process.env.NO_PROXY = process.env.NO_PROXY || "localhost,127.0.0.1,::1"

const builderCli = path.join(rootDir, "node_modules", "electron-builder", "out", "cli", "cli.js")

const result = spawnSync(process.execPath, [builderCli, ...process.argv.slice(2)], {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit"
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status === null ? 1 : result.status)
