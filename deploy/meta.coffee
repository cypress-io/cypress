path = require("path")

module.exports = {
  distDir:  path.join(process.cwd(), "dist")
  buildDir: path.join(process.cwd(), "build")
  cacheDir: path.join(process.cwd(), "cache")
}