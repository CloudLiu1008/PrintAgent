const test = require("node:test")
const assert = require("node:assert/strict")
const { buildLabelDocument, getLabelPrintPageSize, replaceFields } = require("../src/app/label-renderer")

test("replaceFields replaces nested values and missing fields with empty string", () => {
  assert.equal(replaceFields("{{skuNo}}/{{product.code}}/{{missing}}", {
    skuNo: "es00001-01",
    product: { code: "es00001" }
  }), "es00001-01/es00001/")
})

test("buildLabelDocument renders text, barcode and qrcode", async () => {
  const html = await buildLabelDocument({
    template: {
      templateName: "SKU Label",
      templateJson: JSON.stringify({
        widthMm: 50,
        heightMm: 30,
        elements: [
          { type: "text", x: 3, y: 3, width: 30, height: 6, text: "kiwi", fontSize: 9 },
          { type: "barcode", x: 3, y: 11, width: 36, height: 10, value: "{{skuNo}}", barcodeType: "128Auto" },
          { type: "qrcode", x: 40, y: 3, width: 12, height: 12, value: "{{skuNo}}" }
        ]
      })
    },
    rows: [{ skuNo: "es00001-01" }]
  })

  assert.match(html, /@page/)
  assert.match(html, /kiwi/)
  assert.match(html, /svg/)
  assert.match(html, /label-page/)
})

test("buildLabelDocument rejects empty qrcode value", async () => {
  await assert.rejects(() => buildLabelDocument({
    template: {
      templateJson: JSON.stringify({
        widthMm: 50,
        heightMm: 30,
        elements: [{ type: "qrcode", x: 1, y: 1, width: 10, height: 10, value: "{{skuNo}}" }]
      })
    },
    rows: [{}]
  }), /二维码内容为空/)
})

test("buildLabelDocument rotates vertical labels only for print mode", async () => {
  const request = {
    template: {
      templateName: "Vertical",
      templateJson: JSON.stringify({
        direction: "vertical",
        widthMm: 30,
        heightMm: 50,
        elements: [{ type: "text", x: 2, y: 2, width: 20, height: 6, text: "kiwi" }]
      })
    },
    rows: [{}]
  }

  const previewHtml = await buildLabelDocument(request)
  const printHtml = await buildLabelDocument({ ...request, renderMode: "print" })

  assert.match(previewHtml, /@page \{ size: 30mm 50mm; margin: 0; \}/)
  assert.doesNotMatch(previewHtml, /rotate\(90deg\)/)
  assert.match(printHtml, /@page \{ size: 50mm 30mm; margin: 0; \}/)
  assert.match(printHtml, /translateX\(50mm\) rotate\(90deg\)/)
  assert.deepEqual(getLabelPrintPageSize(request), { widthMm: 50, heightMm: 30 })
})
