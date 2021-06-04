// Adapted from https://github.com/egoist/detect-package-manager
import path from 'path'
import execa from 'execa'
import fs from 'fs'

const cache = new Map<'hasGlobalYarn' | 'typeofLockFile', boolean | string | null>()

async function hasGlobalYarn () {
  if (cache.has('hasGlobalYarn')) {
    return cache.get('hasGlobalYarn')
  }

  return execa('yarn', ['--version']).then((res) => {
    return /^\d+.\d+.\d+$/.test(res.stdout)
  }).then((value) => {
    cache.set('hasGlobalYarn', value)

    return value
  })
}

function getTypeofLockFile (cwd = '.') {
  if (cache.has('typeofLockFile')) {
    return cache.get('typeofLockFile')
  }

  const isYarn = fs.existsSync(path.resolve(cwd, 'yarn.lock'))
  const isNpm = fs.existsSync(path.resolve(cwd, 'package-lock.json'))
  const value = isYarn ? 'yarn' : isNpm ? 'npm' : null

  cache.set('typeofLockFile', value)

  return value
}

export async function getPackageManager ({ cwd }: { cwd?: string } = {}): Promise<'yarn' | 'npm'> {
  const typeofLockFile = getTypeofLockFile(cwd)

  if (typeofLockFile === 'npm' || typeofLockFile === 'yarn') {
    return typeofLockFile
  }

  const has = await hasGlobalYarn()

  return has ? 'yarn' : 'npm'
}

export async function npmVersion () {
  const res = await execa('npm', ['--version'])

  return res.stdout
}

export function clearCache () {
  cache.clear()
}
