let sequence = 0

function createTaskId(prefix = "PRINT") {
  sequence += 1
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const serial = String(sequence).padStart(6, "0")
  return `${prefix}_${year}${month}${day}_${serial}`
}

module.exports = { createTaskId }
