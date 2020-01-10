_ = require("lodash")
fse = require("fs-extra")
cp = require("child_process")
execa = require('execa')
path = require("path")
Promise = require("bluebird")
os = require("os")
verify = require("../../cli/lib/tasks/verify")
Fixtures = require("../../packages/server/test/support/helpers/fixtures")

fs = Promise.promisifyAll(fse)

canRecordVideo = () ->
  os.platform() != "win32"

shouldSkipProjectTest = () ->
  os.platform() == "win32"

runSmokeTest = (buildAppExecutable) ->
  rand = String(_.random(0, 1000))
  console.log("executable path #{buildAppExecutable}")

  hasRightResponse = (stdout) ->
    # there could be more debug lines in the output, so find 1 line with
    # expected random value
    lines = stdout.split('\n').map((s) -> s.trim())
    return lines.includes(rand)

  args = ["--smoke-test", "--ping=#{rand}"]
  if verify.needsSandbox()
    args.push("--no-sandbox")

  execa "#{buildAppExecutable}", args, {timeout: 10000}
  .catch (err) ->
    console.error("smoke test failed with error %s", err.message)
    throw err
  .then ({stdout}) ->
    stdout = stdout.replace(/\s/, "")
    if !hasRightResponse(stdout)
      throw new Error("Stdout: '#{stdout}' did not match the random number: '#{rand}'")
    console.log("smokeTest passes")

runProjectTest = (buildAppExecutable, e2e) ->
  if shouldSkipProjectTest()
    console.log("skipping project test")
    return Promise.resolve()

  console.log("running project test")

  new Promise (resolve, reject) ->
    env = _.omit(process.env, "CYPRESS_ENV")

    if !canRecordVideo()
      console.log("cannot record video on this platform yet, disabling")
      env.CYPRESS_VIDEO_RECORDING = "false"

    args = [
      "--run-project=#{e2e}",
      "--spec=#{e2e}/cypress/integration/simple_passing_spec.coffee"
    ]
    if verify.needsSandbox()
      args.push("--no-sandbox")
    options = {
      stdio: "inherit", env: env
    }
    console.log("running project test")
    console.log(buildAppExecutable, args.join(" "))

    cp.spawn(buildAppExecutable, args, options)
    .on "exit", (code) ->
      if code is 0
        resolve()
      else
        reject(new Error("running project tests failed with: '#{code}' errors."))

runFailingProjectTest = (buildAppExecutable, e2e) ->
  if shouldSkipProjectTest()
    console.log("skipping failing project test")
    return Promise.resolve()

  console.log("running failing project test")

  verifyScreenshots = ->
    screenshot1 = path.join(e2e, "cypress", "screenshots", "simple_failing_spec.coffee", "simple failing spec -- fails1 (failed).png")
    screenshot2 = path.join(e2e, "cypress", "screenshots", "simple_failing_spec.coffee", "simple failing spec -- fails2 (failed).png")

    Promise.all([
      fs.statAsync(screenshot1)
      fs.statAsync(screenshot2)
    ])

  spawn = ->
    new Promise (resolve, reject) ->
      env = _.omit(process.env, "CYPRESS_ENV")

      args = [
        "--run-project=#{e2e}",
        "--spec=#{e2e}/cypress/integration/simple_failing_spec.coffee"
      ]
      if verify.needsSandbox()
        args.push("--no-sandbox")

      options = {
        stdio: "inherit",
        env
      }
      cp.spawn(buildAppExecutable, args, options)
      .on "exit", (code) ->
        if code is 2
          resolve()
        else
          reject(new Error("running project tests failed with: '#{code}' errors."))

  spawn()
  .then(verifyScreenshots)

test = (buildAppExecutable) ->
  Fixtures.scaffold()

  e2e = Fixtures.projectPath("e2e")

  runSmokeTest(buildAppExecutable)
  .then ->
    runProjectTest(buildAppExecutable, e2e)
  .then ->
    runFailingProjectTest(buildAppExecutable, e2e)
  .then ->
    Fixtures.remove()

module.exports = {
  test
}
