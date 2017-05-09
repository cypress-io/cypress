import {log} from '../log'
import execa = require('execa')

import fs = require('fs-extra')
import path = require('path')
import plist = require('plist')

export function parse (p, prop) {
  const pl = path.join(p, 'Contents', 'Info.plist')
  return fs.readFile(pl, 'utf8')
    .then(str => plist.parse(str))
    .then(x => x[prop])
    .catch((e) => {
      const msg = `Info.plist not found: ${pl}
      ${e.message}`
      const err = new Error(msg) as NotInstalledError
      err.notInstalled = true
      throw err
    })
}

export function find (id) {
  const cmd = `mdfind 'kMDItemCFBundleIdentifier=="${id}"' | head -1`
  log('looking for bundle id %s using command: %s', id, cmd)
  return execa.shell(cmd)
    .then(result => result.stdout)
    .then(str => {
      log('found %s at %s', id, str)
      return str
    })
    .catch(() => {
      log('could not find %s', id)
      const err = new Error(`Browser not installed: ${id}`) as NotInstalledError
      err.notInstalled = true
      throw err
    })
}
