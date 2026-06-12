const { DEFAULT_LABEL_HEIGHT_MM, DEFAULT_LABEL_WIDTH_MM } = require("./constants")

function generateTestLabelHtml(options = {}) {
  const widthMm = Number(options.widthMm || DEFAULT_LABEL_WIDTH_MM)
  const heightMm = Number(options.heightMm || DEFAULT_LABEL_HEIGHT_MM)
  const title = escapeHtml(options.title || "作者：kiwi")
  const sku = escapeHtml(options.sku || "kiwi1008@foxmail.com")
  const printer = escapeHtml(options.printerName || "这是一个测试打印页")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    html, body {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: Arial, "Microsoft YaHei", sans-serif;
    }
    .label {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      box-sizing: border-box;
      padding: 2mm;
      position: relative;
      border: 0.2mm solid #111;
      color: #111;
    }
    .title {
      font-size: 11pt;
      font-weight: bold;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sku {
      margin-top: 2mm;
      font-size: 9pt;
      font-weight: bold;
    }
    .printer {
      position: absolute;
      left: 2mm;
      bottom: 2mm;
      font-size: 7pt;
    }
    .mark {
      position: absolute;
      right: 2mm;
      bottom: 2mm;
      width: 10mm;
      height: 10mm;
      border: 0.3mm solid #111;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6pt;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="title">${title}</div>
    <div class="sku">${sku}</div>
    <div class="printer">${printer}</div>
    <div class="mark">TEST</div>
  </div>
</body>
</html>`
}

function normalizePrintHtmlRequest(body = {}, config = {}) {
  const widthMm = Number(body.widthMm || config.defaultLabelWidthMm || DEFAULT_LABEL_WIDTH_MM)
  const heightMm = Number(body.heightMm || config.defaultLabelHeightMm || DEFAULT_LABEL_HEIGHT_MM)
  const copies = Math.max(1, Number(body.copies || 1))
  return {
    printerName: body.printerName || config.defaultPrinter,
    silent: body.silent !== false,
    copies,
    widthMm,
    heightMm,
    html: String(body.html || "")
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

module.exports = {
  escapeHtml,
  generateTestLabelHtml,
  normalizePrintHtmlRequest
}
