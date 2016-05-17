spawn = require("child_process").spawn

module.exports = {
  run: (projectRoot, options) ->
    new Promise (resolve, reject) ->
      ## this probably won't work on Windows
      ## need to use something different than `sh -c` for Windows
      child = spawn("sh", ["-c", options.cmd], { cwd: projectRoot })
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

      child.on 'close', (code, signal) ->
        if code is 0
          resolve(output)
        else
          reject(new Error("Process exited with code #{code}"))
}
