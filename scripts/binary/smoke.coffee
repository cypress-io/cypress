_ = require("lodash")
fse = require("fs-extra")
cp = require("child_process")
path = require("path")
Promise = require("bluebird")
Fixtures = require("../../packages/server/test/support/helpers/fixtures")

fs = Promise.promisifyAll(fse)

runSmokeTest = (buildAppExecutable) ->
  new Promise (resolve, reject) ->
    rand = "" + Math.random()
    console.log("executable path #{buildAppExecutable}")

    cp.exec "#{buildAppExecutable} --smoke-test --ping=#{rand}", (err, stdout, stderr) ->
      stdout = stdout.replace(/\s/, "")

      if err
        console.error("smoke test failed with error %s", err.message)
        return reject(err)

      if stdout isnt rand
        throw new Error("Stdout: '#{stdout}' did not match the random number: '#{rand}'")
      else
        console.log("smokeTest passes")
        resolve()

runProjectTest = (buildAppExecutable, e2e) ->
  console.log("running project test")

  new Promise (resolve, reject) ->
    env = _.omit(process.env, "CYPRESS_ENV")

    cp.spawn(buildAppExecutable, [
      "--run-project=#{e2e}", "--spec=cypress/integration/simple_passing_spec.coffee"
    ], {
      stdio: "inherit", env: env
    })
    .on "exit", (code) ->
      if code is 0
        resolve()
      else
        reject(new Error("running project tests failed with: '#{code}' errors."))

runFailingProjectTest = (buildAppExecutable, e2e) ->
  console.log("running failing project test")

  verifyScreenshots = ->
    screenshot1 = path.join(e2e, "cypress", "screenshots", "simple failing spec -- fails1.png")
    screenshot2 = path.join(e2e, "cypress", "screenshots", "simple failing spec -- fails2.png")

    Promise.all([
      fs.statAsync(screenshot1)
      fs.statAsync(screenshot2)
    ])

  spawn = ->
    new Promise (resolve, reject) ->
      env = _.omit(process.env, "CYPRESS_ENV")

      cp.spawn(buildAppExecutable, [
        "--run-project=#{e2e}",
        "--spec=cypress/integration/simple_failing_spec.coffee"
      ], {
        stdio: "inherit", env: env
      })
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
