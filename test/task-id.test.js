const test = require("node:test")
const assert = require("node:assert/strict")
const { createTaskId } = require("../src/app/task-id")

test("createTaskId returns prefixed unique task ids", () => {
  const first = createTaskId("TEST")
  const second = createTaskId("TEST")

  assert.match(first, /^TEST_\d{8}_\d{6}$/)
  assert.match(second, /^TEST_\d{8}_\d{6}$/)
  assert.notEqual(first, second)
})
