_       = require("underscore")
cp      = require("child_process")
Promise = require("bluebird")

module.exports = {
  run: (projectRoot, options) ->
    child = null

    run = ->
      new Promise (resolve, reject) ->
        ## this probably won't work on Windows
        ## need to use something different than `sh -c` for Windows
        spawnOpts = {
          cwd: projectRoot
          env: _.extend({}, process.env, options.env)
        }
        child = cp.spawn("sh", ["-c", options.cmd], spawnOpts)
        output = {
          stdout: []
          stderr: []
        }

        child.stdout.on 'data', (data) ->
          output.stdout.push(data.toString())

        child.stderr.on 'data', (data) ->
          output.stderr.push(data.toString())

        child.on 'error', (err) ->
          reject(err)

        child.on 'close', (code) ->
          if code is 0
            resolve(output)
          else
            reject(new Error("Process exited with code #{code}"))

    Promise
    .try(run)
    .timeout(options.timeout)
    .catch Promise.TimeoutError, ->
      child.kill() if child
      err = new Error("Process timed out")
      err.timedout = true
      throw err
}
