import cp = require('child_process')
import Promise = require('bluebird')

const execAsync = Promise.promisify(cp.exec)

const notInstalledErr = (name: string) => {
  const err: NotInstalledError = new Error(`Browser not installed: ${name}`) as NotInstalledError
  err.notInstalled = true
  throw err
}

export const linuxBrowser = {
  get: (binary, re): Promise<any> => {
    return execAsync(`${binary} --version`)
      .call('trim')
      .then (stdout => {
        const m = re.exec(stdout)
        if (m) {
          return {
            path: binary,
            version: m[1]
          }
        } else {
          notInstalledErr(binary)
        }
      })
      .catch(e => notInstalledErr(binary))
  }
}
