const test = require("node:test")
const assert = require("node:assert/strict")
const { createPrintServer, isAllowedOrigin } = require("../src/app/server")

test("isAllowedOrigin allows localhost origins for ERP pages", () => {
  assert.equal(isAllowedOrigin("http://localhost:80"), true)
  assert.equal(isAllowedOrigin("http://127.0.0.1:5173"), true)
  assert.equal(isAllowedOrigin("https://example.com"), false)
})

test("print label endpoint renders template and sends html to printer service", async () => {
  let printed
  const server = await createPrintServer({
    config: {
      port: 17689,
      token: "test-token",
      defaultPrinter: "TestPrinter",
      defaultLabelWidthMm: 50,
      defaultLabelHeightMm: 30,
      allowedOrigins: []
    },
    logger: { info() {}, warn() {}, error() {} },
    saveConfig: config => config,
    printerService: {
      getPrinters: async () => [],
      printHtml: async request => {
        printed = request
      }
    }
  })

  try {
    const response = await fetch("http://127.0.0.1:17689/print/label", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PrintAgent-Token": "test-token"
      },
      body: JSON.stringify({
        template: {
          templateName: "SKU标签",
          templateJson: JSON.stringify({
            widthMm: 50,
            heightMm: 30,
            elements: [{ type: "text", x: 1, y: 1, width: 20, height: 6, text: "{{skuNo}}" }]
          })
        },
        rows: [{ skuNo: "es00001-01" }],
        printerName: "TestPrinter"
      })
    })
    const data = await response.json()

    assert.equal(response.status, 200)
    assert.equal(data.success, true)
    assert.equal(printed.printerName, "TestPrinter")
    assert.match(printed.html, /es00001-01/)
  } finally {
    server.close()
  }
})
