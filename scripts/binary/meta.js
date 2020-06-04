path = require("path")
la = require("lazy-ass")
check = require("check-more-types")
R = require("ramda")
os = require("os")

# canonical platform names
platforms = {
  darwin: "darwin"
  linux: "linux",
  windows: "win32"
}

isValidPlatform = check.oneOf(R.values(platforms))

checkPlatform = (platform) ->
  la(isValidPlatform(platform),
    "invalid build platform", platform, "valid choices", R.values(platforms))

buildRootDir = () ->
  path.resolve("build")

## returns a path into the /build directory
## the output folder should look something like this
## build/
##   <platform>/ = linux or darwin
##     ... platform-specific files
buildDir = (platform, args...) ->
  checkPlatform(platform)
  root = buildRootDir()
  switch platform
    when "darwin"
      # the new electron-builder for some reason adds its own platform
      # subfolder and it is NOT "darwin" but "mac"
      path.resolve(root, "mac", args...)
    when "linux"
      path.resolve(root, "linux-unpacked", args...)
    when "win32"
      if os.arch() == "x64"
        path.resolve(root, "win-unpacked", args...)
      else
        # x86 32bit architecture
        path.resolve(root, "win-ia32-unpacked", args...)

## returns a path into the /dist directory
distDir = (platform, args...) ->
  checkPlatform(platform)
  path.resolve("dist", platform, args...)

## returns folder to zip before uploading
zipDir = (platform) ->
  checkPlatform(platform)
  switch platform
    when "darwin"
      buildDir(platform, "Cypress.app")
    when "linux"
      buildDir(platform)
    when "win32"
      buildDir(platform)

## returns a path into the /build/*/app directory
## specific to each platform
buildAppDir = (platform, args...) ->
  checkPlatform(platform)
  switch platform
    when "darwin"
      buildDir(platform, "Cypress.app", "Contents", "resources", "app", args...)
    when "linux"
      buildDir(platform, "resources", "app", args...)
    when "win32"
      buildDir(platform, "resources", "app", args...)

buildAppExecutable = (platform) ->
  checkPlatform(platform)
  switch platform
    when "darwin"
      buildDir(platform, "Cypress.app", "Contents", "MacOS", "Cypress")
    when "linux"
      buildDir(platform, "Cypress")
    when "win32"
      buildDir(platform, "Cypress")

module.exports = {
  isValidPlatform
  buildRootDir
  buildDir
  distDir
  zipDir
  buildAppDir
  buildAppExecutable
  cacheDir: path.join(process.cwd(), "cache"),
  platforms
}
