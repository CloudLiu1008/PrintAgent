const { BrowserWindow } = require("electron")
const { generateTestLabelHtml, normalizePrintHtmlRequest } = require("./label-html")

function createPrinterService({ logger }) {
  async function getPrinters() {
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })
    try {
      const printers = await win.webContents.getPrintersAsync()
      return printers.map(printer => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        description: printer.description || "",
        isDefault: Boolean(printer.isDefault),
        status: printer.status || "unknown"
      }))
    } finally {
      win.close()
    }
  }

  async function printHtml(options) {
    if (!options.html) {
      throw new Error("html cannot be empty")
    }
    const win = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    const encodedHtml = encodeURIComponent(options.html)
    await win.loadURL(`data:text/html;charset=utf-8,${encodedHtml}`)

    return new Promise((resolve, reject) => {
      win.webContents.print(
        {
          silent: options.silent !== false,
          deviceName: options.printerName,
          copies: Number(options.copies || 1),
          printBackground: true,
          pageSize: {
            width: mmToMicrons(options.widthMm),
            height: mmToMicrons(options.heightMm)
          },
          margins: {
            marginType: "none"
          },
          landscape: false
        },
        (success, failureReason) => {
          win.close()
          if (success) {
            logger.info("print task sent", {
              printerName: options.printerName,
              copies: options.copies,
              widthMm: options.widthMm,
              heightMm: options.heightMm
            })
            resolve({ success: true, message: "print task sent" })
          } else {
            const message = failureReason || "print failed"
            logger.error("print task failed", { message })
            reject(new Error(message))
          }
        }
      )
    })
  }

  async function printTest(body, config) {
    const request = normalizePrintHtmlRequest(
      {
        ...body,
        html: generateTestLabelHtml({
          widthMm: body.widthMm || config.defaultLabelWidthMm,
          heightMm: body.heightMm || config.defaultLabelHeightMm,
          printerName: body.printerName || config.defaultPrinter
        })
      },
      config
    )
    return printHtml(request)
  }

  return {
    getPrinters,
    printHtml,
    printTest
  }
}

function mmToMicrons(value) {
  return Math.round(Number(value || 0) * 1000)
}

module.exports = {
  createPrinterService,
  mmToMicrons
}
