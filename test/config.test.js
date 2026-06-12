const test = require("node:test")
const assert = require("node:assert/strict")
const { normalizeConfig } = require("../src/app/config")

test("normalizeConfig forces localhost and numeric label sizes", () => {
  const config = normalizeConfig({
    host: "0.0.0.0",
    port: "17688",
    defaultLabelWidthMm: "50",
    defaultLabelHeightMm: "30",
    allowedOrigins: "bad"
  })

  assert.equal(config.host, "127.0.0.1")
  assert.equal(config.port, 17688)
  assert.equal(config.defaultLabelWidthMm, 50)
  assert.equal(config.defaultLabelHeightMm, 30)
  assert.deepEqual(config.allowedOrigins, [])
})
