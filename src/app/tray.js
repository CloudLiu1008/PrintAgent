const path = require("path")
const { BrowserWindow, Menu, Tray, dialog, nativeImage, shell } = require("electron")
const { APP_NAME } = require("./constants")
const { getAppDataDir, getConfigPath } = require("./config")

function createPrintTray({ app, config, logger, printerService, server }) {
  const tray = new Tray(createTrayIcon())
  tray.setToolTip(APP_NAME)

  const buildMenu = () => Menu.buildFromTemplate([
    { label: APP_NAME, enabled: false },
    { label: `服务状态：运行中 :${config.port}`, enabled: false },
    { type: "separator" },
    {
      label: "打印机设置",
      click: () => openSettingsWindow(config)
    },
    {
      label: "测试打印",
      click: async () => {
        try {
          const currentConfig = server.getConfig()
          await printerService.printTest({}, currentConfig)
          dialog.showMessageBox({ type: "info", message: "测试打印任务已发送" })
        } catch (error) {
          logger.error("tray test print failed", { message: error.message })
          dialog.showErrorBox("测试打印失败", error.message)
        }
      }
    },
    {
      label: "打开配置文件",
      click: () => shell.openPath(getConfigPath())
    },
    {
      label: "打开日志",
      click: () => shell.openPath(path.join(getAppDataDir(), "logs"))
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(buildMenu())
  return tray
}

function openSettingsWindow(config) {
  const win = new BrowserWindow({
    width: 560,
    height: 520,
    resizable: false,
    title: "ERP PrintAgent Settings",
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  const url = `http://127.0.0.1:${config.port}/settings/settings.html?token=${encodeURIComponent(config.token)}`
  win.loadURL(url)
}

function createTrayIcon() {
  const image = nativeImage.createFromPath(getIconPath())
  if (!image.isEmpty()) {
    return image.resize({ width: 16, height: 16 })
  }
  return nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAMxJREFUOE+lk7ENwjAQRO9GIiRoGgYmYAJGYAQmYAIWYAImYAQmYAQmYAQmYAIWUAkUKgGJkHh2PLKF5CqSsn3f+9333u4sz/MwDMPgU+WcWmsQERG+Lw8DgFJK4dbaW2vtBOZ5vh0zMzNYluVoGIa9wDRN5iAiuq5r1e12x3Ecx8PhsKIo+pZl2bJpmu7xeKzrum+gqqrLsixrGIbRNE0X8DzvAAAgIrLdbn3f9z08z7tt25vLsoQIIfq+PxRFMeH7/g+SJKmRZZmWZbXdf0KAKAsy5rxeOwDgJzzN8/zpq7r/g4Atm3bJqIoihWgLMt2kiRJLoAvPQHo9Xr9aQAAAABJRU5ErkJggg=="
  )
}

function getIconPath() {
  return path.join(__dirname, "..", "assets", "icon.png")
}

module.exports = { createPrintTray }
