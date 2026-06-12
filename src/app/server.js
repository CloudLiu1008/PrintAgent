const express = require("express")
const cors = require("cors")
const path = require("path")
const { APP_NAME, VERSION } = require("./constants")
const { normalizeConfig } = require("./config")
const { createTaskId } = require("./task-id")
const { generateTestLabelHtml, normalizePrintHtmlRequest } = require("./label-html")
const { buildLabelDocument } = require("./label-renderer")

async function createPrintServer({ config, logger, printerService, saveConfig }) {
  const app = express()
  let currentConfig = normalizeConfig(config)

  app.use(cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin, currentConfig.allowedOrigins)) {
        callback(null, true)
        return
      }
      callback(new Error("Origin not allowed by PrintAgent"))
    }
  }))
  app.use(express.json({ limit: "10mb" }))
  app.use("/settings", express.static(path.join(__dirname, "..", "renderer")))

  app.get("/health", (req, res) => {
    res.json({
      success: true,
      name: APP_NAME,
      version: VERSION,
      status: "running"
    })
  })

  app.get("/", (req, res) => {
    res.type("html").send(renderHomePage(currentConfig))
  })

  app.get("/favicon.ico", (req, res) => {
    res.status(204).end()
  })

  app.use(auth(() => currentConfig.token))

  app.get("/config", (req, res) => {
    res.json({ success: true, config: publicConfig(currentConfig) })
  })

  app.post("/config", (req, res) => {
    currentConfig = saveConfig({ ...currentConfig, ...req.body })
    logger.info("config updated", publicConfig(currentConfig))
    res.json({ success: true, config: publicConfig(currentConfig) })
  })

  app.get("/printers", async (req, res) => {
    try {
      const printers = await printerService.getPrinters()
      res.json({ success: true, printers })
    } catch (error) {
      logger.error("get printers failed", { message: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  })

  app.post("/print/html", async (req, res) => {
    try {
      const request = normalizePrintHtmlRequest(req.body, currentConfig)
      const taskId = createTaskId()
      await printerService.printHtml(request)
      res.json({ success: true, taskId, message: "打印任务已发送" })
    } catch (error) {
      logger.error("print html failed", { message: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  })

  app.post("/render/label", async (req, res) => {
    try {
      const html = await buildLabelDocument(req.body || {})
      res.json({ success: true, html })
    } catch (error) {
      logger.error("render label failed", { message: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  })

  app.post("/print/label", async (req, res) => {
    try {
      const html = await buildLabelDocument(req.body || {})
      const request = normalizePrintHtmlRequest({
        ...req.body,
        html
      }, currentConfig)
      const taskId = createTaskId()
      await printerService.printHtml(request)
      res.json({ success: true, taskId, message: "标签打印任务已发送" })
    } catch (error) {
      logger.error("print label failed", { message: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  })

  app.post("/print/test", async (req, res) => {
    try {
      const taskId = createTaskId("TEST")
      const request = normalizePrintHtmlRequest({
        ...req.body,
        html: generateTestLabelHtml({
          printerName: req.body.printerName || currentConfig.defaultPrinter,
          widthMm: req.body.widthMm || currentConfig.defaultLabelWidthMm,
          heightMm: req.body.heightMm || currentConfig.defaultLabelHeightMm
        })
      }, currentConfig)
      await printerService.printHtml(request)
      res.json({ success: true, taskId, message: "测试打印任务已发送" })
    } catch (error) {
      logger.error("print test failed", { message: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  })

  return new Promise((resolve, reject) => {
    const server = app.listen(currentConfig.port, "127.0.0.1", () => {
      resolve({
        app,
        close: () => server.close(),
        getConfig: () => currentConfig,
        setConfig: nextConfig => {
          currentConfig = saveConfig({ ...currentConfig, ...nextConfig })
          return currentConfig
        }
      })
    })
    server.on("error", reject)
  })
}

function isAllowedOrigin(origin, allowedOrigins = []) {
  if (allowedOrigins.includes(origin)) {
    return true
  }
  try {
    const url = new URL(origin)
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
  } catch (error) {
    return false
  }
}

function auth(getToken) {
  return (req, res, next) => {
    const expected = getToken()
    if (!expected) {
      next()
      return
    }
    const actual = req.headers["x-printagent-token"] || req.query.token
    if (actual !== expected) {
      res.status(401).json({ success: false, message: "Unauthorized" })
      return
    }
    next()
  }
}

function renderHomePage(config) {
  const token = encodeURIComponent(config.token || "")
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>ERP PrintAgent</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      font-family: Arial, "Microsoft YaHei", sans-serif;
      color: #2c2418;
      background: #fbf7ef;
    }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { line-height: 1.7; }
    code {
      padding: 2px 6px;
      border-radius: 4px;
      background: #fff4dc;
      color: #6d4f16;
    }
    a {
      color: #9b7624;
      font-weight: 700;
      text-decoration: none;
    }
    .card {
      max-width: 720px;
      padding: 22px;
      border: 1px solid #e4cf9d;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 8px 24px rgba(93, 74, 46, 0.08);
    }
    .links {
      display: grid;
      gap: 10px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>ERP PrintAgent 正在运行</h1>
    <p>本地服务地址：<code>http://127.0.0.1:${config.port}</code></p>
    <p>除 <code>/health</code> 外，接口默认需要 token。浏览器临时调试可以使用下面的链接，ERP 正式调用应使用请求头 <code>X-PrintAgent-Token</code>。</p>
    <div class="links">
      <a href="/health">健康检查</a>
      <a href="/printers?token=${token}">查看打印机列表</a>
      <a href="/settings/settings.html?token=${token}">打开打印设置</a>
    </div>
  </div>
</body>
</html>`
}

function publicConfig(config) {
  const { token, ...rest } = config
  return {
    ...rest,
    tokenMasked: token ? "******" : ""
  }
}

module.exports = {
  auth,
  createPrintServer,
  isAllowedOrigin,
  publicConfig
}
