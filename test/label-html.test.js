const test = require("node:test")
const assert = require("node:assert/strict")
const { escapeHtml, generateTestLabelHtml, normalizePrintHtmlRequest } = require("../src/app/label-html")

test("generateTestLabelHtml includes page size and escaped content", () => {
  const html = generateTestLabelHtml({
    widthMm: 40,
    heightMm: 30,
    title: "<寻玑>",
    sku: "es00001-01"
  })

  assert.match(html, /size: 40mm 30mm/)
  assert.match(html, /&lt;寻玑&gt;/)
  assert.match(html, /es00001-01/)
})

test("normalizePrintHtmlRequest applies defaults", () => {
  const request = normalizePrintHtmlRequest({ html: "<html></html>" }, {
    defaultPrinter: "HPRT D35BT",
    defaultLabelWidthMm: 50,
    defaultLabelHeightMm: 30
  })

  assert.equal(request.printerName, "HPRT D35BT")
  assert.equal(request.silent, true)
  assert.equal(request.copies, 1)
  assert.equal(request.widthMm, 50)
  assert.equal(request.heightMm, 30)
})

test("escapeHtml escapes dangerous characters", () => {
  assert.equal(escapeHtml(`"'<>&`), "&quot;&#39;&lt;&gt;&amp;")
})
