path = require("path")

## returns a path into the /build directory
## the output folder should look something like this
## build/
##   <platform>/ = linux or darwin
##     ... platform-specific files
buildDir = (platform, args...) ->
  path.resolve("build", platform, args...)

## returns a path into the /dist directory
distDir = (platform, args...) ->
  path.resolve("dist", platform, args...)

## returns a path into the /build/*/app directory
## specific to each platform
buildAppDir = (platform, args...) ->
  switch platform
    when "darwin"
      buildDir("Cypress.app", "Contents", "resources", "app", args...)
    when "linux"
      buildDir("resources", "app", args...)

module.exports = {
  buildDir
  distDir
  buildAppDir
  # distDir:  path.join(process.cwd(), "dist")
  # buildDir: path.join(process.cwd(), "build")
  cacheDir: path.join(process.cwd(), "cache")
}
