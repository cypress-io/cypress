import {log} from '../log'
import {NotInstalledError} from '../types'
import {prop, tap} from 'ramda'
import execa = require('execa')

import fs = require('fs-extra')
import path = require('path')
import plist = require('plist')

export function parse (p: string, property: string) {
  const pl = path.join(p, 'Contents', 'Info.plist')
  log('reading property file "%s"', pl)

  const failed = (e: Error) => {
    const msg = `Info.plist not found: ${pl}
    ${e.message}`
    const err = new Error(msg) as NotInstalledError
    err.notInstalled = true
    log('could not read Info.plist for %s', pl)
    throw err
  }

  return fs.readFile(pl, 'utf8')
    .then(plist.parse)
    .then(prop(property))
    .catch(failed)
}

export function find (id: string): Promise<string> {
  const cmd = `mdfind 'kMDItemCFBundleIdentifier=="${id}"' | head -1`
  log('looking for bundle id %s using command: %s', id, cmd)

  const logFound = (str: string) => {
    log('found %s at %s', id, str)
    return str
  }

  const failedToFind = () => {
    log('could not find %s', id)
    const err = new Error(`Browser not installed: ${id}`) as NotInstalledError
    err.notInstalled = true
    throw err
  }

  return execa.shell(cmd)
    .then(prop('stdout'))
    .then(tap(logFound))
    .catch(failedToFind)
}
