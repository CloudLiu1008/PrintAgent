const path = require("path")
const { rcedit } = require("rcedit")

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") {
    return
  }

  const executablePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`)
  const iconPath = path.join(context.packager.projectDir, "build", "icon.ico")

  await rcedit(executablePath, {
    icon: iconPath
  })
}
