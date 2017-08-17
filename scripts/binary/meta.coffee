path = require("path")
la = require("lazy-ass")
check = require("check-more-types")
R = require("ramda")

# canonical platform names
platforms = {
  darwin: "darwin"
  linux: "linux"
}

isValidPlatform = check.oneOf(R.values(platforms))

## returns a path into the /build directory
## the output folder should look something like this
## build/
##   <platform>/ = linux or darwin
##     ... platform-specific files
buildDir = (platform, args...) ->
  la(isValidPlatform(platform), "invalid platform", platform)
  switch platform
    when "darwin"
      path.resolve("build", platform, args...)
    when "linux"
      path.resolve("build", platform, "Cypress", args...)

## returns a path into the /dist directory
distDir = (platform, args...) ->
  path.resolve("dist", platform, args...)

## returns folder to zip before uploading
zipDir = (platform) ->
  switch platform
    when "darwin"
      buildDir(platform, "Cypress.app")
    when "linux"
      buildDir(platform)

## returns a path into the /build/*/app directory
## specific to each platform
buildAppDir = (platform, args...) ->
  switch platform
    when "darwin"
      buildDir(platform, "Cypress.app", "Contents", "resources", "app", args...)
    when "linux"
      buildDir(platform, "resources", "app", args...)

module.exports = {
  isValidPlatform
  buildDir
  distDir
  zipDir
  buildAppDir
  cacheDir: path.join(process.cwd(), "cache"),
  platforms
}
