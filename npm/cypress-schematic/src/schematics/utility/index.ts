import { Tree } from '@angular-devkit/schematics'
import { get } from 'http'

import { getPackageJsonDependency } from './dependencies'

export interface NodePackage {
  name: string
  version: string
}

export function getAngularVersion (tree: Tree): number {
  const packageNode = getPackageJsonDependency(tree, '@angular/core')

  const version = packageNode && packageNode.version.split('').find((char) => !!parseInt(char, 10))

  return version ? +version : 0
}

/**
   * Attempt to retrieve the latest package version from NPM
   * Return an optional "latest" version in case of error
   * @param packageName
   */
export function getLatestNodeVersion (packageName: string): Promise<NodePackage> {
  const DEFAULT_VERSION = 'latest'

  return new Promise((resolve) => {
    return get(`http://registry.npmjs.org/${packageName}`, (res) => {
      let rawData = ''

      res.on('data', (chunk) => (rawData += chunk))
      res.on('end', () => {
        try {
          const response = JSON.parse(rawData)
          const version = (response && response['dist-tags']) || {}

          resolve(buildPackage(packageName, version.latest))
        } catch (e) {
          resolve(buildPackage(packageName))
        }
      })
    }).on('error', () => resolve(buildPackage(packageName)))
  })

  function buildPackage (name: string, version: string = DEFAULT_VERSION): NodePackage {
    return { name, version }
  }
}
