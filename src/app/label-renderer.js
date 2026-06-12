const bwipjs = require("bwip-js")
const QRCode = require("qrcode")

async function buildLabelDocument({ template, rows }) {
  const templateJson = parseTemplateJson(template)
  const widthMm = numberValue(templateJson.widthMm || template.widthMm, 50)
  const heightMm = numberValue(templateJson.heightMm || template.heightMm, 30)
  const offsetXMm = numberValue(template.offsetXMm, 0)
  const offsetYMm = numberValue(template.offsetYMm, 0)
  const dataRows = Array.isArray(rows) && rows.length ? rows : [{}]
  const pages = []

  for (const row of dataRows) {
    pages.push(`<section class="label-page">${await renderElements(templateJson.elements || [], row)}</section>`)
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(template.templateName || "标签打印")}</title>
  <style>
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${widthMm}mm;
      min-height: ${heightMm}mm;
      background: #fff;
      color: #000;
      font-family: Arial, "Microsoft YaHei", sans-serif;
    }
    .label-page {
      position: relative;
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      overflow: hidden;
      page-break-after: always;
      box-sizing: border-box;
      transform: translate(${offsetXMm}mm, ${offsetYMm}mm);
      transform-origin: left top;
    }
    .label-page:last-child { page-break-after: auto; }
    .label-item {
      position: absolute;
      box-sizing: border-box;
      overflow: hidden;
      line-height: 1.15;
      white-space: pre-wrap;
      color: #000;
    }
    .label-barcode svg,
    .label-qrcode svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
${pages.join("\n")}
</body>
</html>`
}

async function renderElements(elements, data) {
  const rendered = []
  for (const item of elements) {
    rendered.push(await renderElement(item, data))
  }
  return rendered.join("\n")
}

async function renderElement(item, data) {
  const x = numberValue(item.x, 0)
  const y = numberValue(item.y, 0)
  const width = numberValue(item.width, 20)
  const height = numberValue(item.height, 6)
  const baseStyle = `left:${x}mm;top:${y}mm;width:${width}mm;height:${height}mm;`

  if (item.type === "barcode") {
    const value = replaceFields(item.value || item.text || "", data)
    if (!value) throw new Error("条码内容为空，请检查模板字段或打印数据")
    const svg = renderBarcodeSvg(value, item.barcodeType)
    return `<div class="label-item label-barcode" style="${baseStyle}">${svg}</div>`
  }

  if (item.type === "qrcode") {
    const value = replaceFields(item.value || item.text || "", data)
    if (!value) throw new Error("二维码内容为空，请检查模板字段或打印数据")
    const svg = await QRCode.toString(value, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: item.errorLevel || "M"
    })
    return `<div class="label-item label-qrcode" style="${baseStyle}">${svg}</div>`
  }

  if (item.type === "image") {
    const value = replaceFields(item.value || item.src || "", data)
    if (!value) return ""
    return `<img class="label-item" src="${escapeAttribute(value)}" style="${baseStyle}object-fit:contain;" />`
  }

  if (item.type === "line") {
    const lineWidth = numberValue(item.lineWidth, 0.2)
    return `<div class="label-item" style="${baseStyle}height:${lineWidth}mm;border-top:${lineWidth}mm solid #000;"></div>`
  }

  if (item.type === "rect") {
    const lineWidth = numberValue(item.lineWidth, 0.2)
    return `<div class="label-item" style="${baseStyle}border:${lineWidth}mm solid #000;"></div>`
  }

  const text = replaceFields(item.text || item.value || "", data)
  const fontSize = numberValue(item.fontSize, 9)
  const fontName = item.fontName || "Microsoft YaHei"
  const fontWeight = item.bold ? "700" : "400"
  return `<div class="label-item" style="${baseStyle}font-size:${fontSize}pt;font-family:${escapeAttribute(fontName)};font-weight:${fontWeight};">${escapeHtml(text)}</div>`
}

function renderBarcodeSvg(value, barcodeType) {
  const bcid = barcodeTypeMap(barcodeType)
  return bwipjs.toSVG({
    bcid,
    text: value,
    scale: 2,
    height: 10,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0
  })
}

function barcodeTypeMap(value) {
  const normalized = String(value || "").toLowerCase()
  if (normalized.includes("ean13")) return "ean13"
  if (normalized === "39" || normalized.includes("code39")) return "code39"
  return "code128"
}

function parseTemplateJson(template) {
  const templateJson = template.templateJson
  if (!templateJson) return { elements: [] }
  if (typeof templateJson === "object") return templateJson
  return JSON.parse(templateJson)
}

function replaceFields(text, data) {
  return String(text || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => getFieldValue(data, key))
}

function getFieldValue(data, key) {
  return key.split(".").reduce((obj, name) => obj?.[name], data) ?? ""
}

function numberValue(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;")
}

module.exports = {
  buildLabelDocument,
  replaceFields
}
