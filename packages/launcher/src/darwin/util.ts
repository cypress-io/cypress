import fs = require('fs-extra')
import cp = require('child_process')
import path = require('path')
import plist = require('plist')
import Promise = require('bluebird')

const execAsync = Promise.promisify(cp.exec)

// TODO remove this duplicate definition
type NotInstalledError = Error & {notInstalled: boolean}

export function parse (p, prop) {
  const pl = path.join(p, 'Contents', 'Info.plist')
  return fs.readFile(pl, 'utf8')
    .then(str =>
      plist.parse(str).get(prop)
    ).catch(() => {
      const err = new Error('Info.plist not found: #{pl}') as NotInstalledError
      err.notInstalled = true
      throw err
    })
}

export function find (id) {
  const cmd = `mdfind 'kMDItemCFBundleIdentifier=='${id}'' | head -1`
  return execAsync(cmd)
    .call('trim')
    .then(str => {
      if (str === '') {
        const err = new Error(`Browser not installed: ${id}`) as NotInstalledError
        err.notInstalled = true
        throw err
      }
      return str
    })
}
