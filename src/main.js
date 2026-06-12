const path = require("path")
const { app } = require("electron")
const { createLogger } = require("./app/logger")
const { loadConfig, saveConfig } = require("./app/config")
const { createPrinterService } = require("./app/printer")
const { createPrintServer } = require("./app/server")
const { createPrintTray } = require("./app/tray")

let server
let tray

app.commandLine.appendSwitch("disable-gpu")
app.commandLine.appendSwitch("disable-gpu-compositing")
app.disableHardwareAcceleration()

const userDataPath = app.isPackaged
  ? path.join(app.getPath("appData"), "ERP-PrintAgent")
  : path.join(__dirname, "..", ".runtime", "user-data")
app.setPath("userData", userDataPath)

async function bootstrap() {
  const config = loadConfig()
  const logger = createLogger(config)
  const printerService = createPrinterService({ logger })

  if (app.isPackaged && config.autoStart) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath
    })
  }

  server = await createPrintServer({ config, logger, printerService, saveConfig })
  tray = createPrintTray({ app, config, logger, printerService, server, saveConfig })
  logger.info(`ERP PrintAgent started at http://127.0.0.1:${config.port}`)
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (tray) {
      tray.displayBalloon({
        title: "ERP PrintAgent",
        content: "打印服务已在运行"
      })
    }
  })

  app.whenReady().then(bootstrap).catch(error => {
    console.error(error)
    app.quit()
  })
}

app.on("window-all-closed", event => {
  event.preventDefault()
})

app.on("before-quit", () => {
  if (tray) {
    tray.destroy()
  }
  if (server) {
    server.close()
  }
})
