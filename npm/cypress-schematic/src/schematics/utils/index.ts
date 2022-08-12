import { readdirSync } from 'fs'
import { resolve } from 'path'
import { getSystemPath, normalize } from '@angular-devkit/core'
import { Tree } from '@angular-devkit/schematics'
import { get } from 'http'

import { getPackageJsonDependency } from './dependencies'
import { JSONFile } from './jsonFile'

export interface NodePackage {
  name: string
  version: string
}

const ctSpecContent = ({ component, file }: {component: string, file: string}): string => {
  return `import { ${component} } from './${file}.component'

  describe('${component}', () => {
    it('should mount', () => {
      cy.mount(${component})
    })
  })
  `
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

function generateCTSpecs ({ tree, appPath, components }: { tree: Tree, appPath: string, components: any[]}) {
  return components.map((component: any) => {
    const buffer = tree.read(`${appPath}/${component['name']}`)
    const componentString = buffer?.toString()
    const componentName = componentString?.match(/(?<=class )\S+/g)
    const componentFilename = component['name'].split('.')[0]

    if (!tree.exists(`${appPath}/${componentFilename}.component.cy.ts`)) {
      console.log(`Creating component test for: ${componentName ? componentName[0] : componentFilename}`)

      return tree.create(`${appPath}/${componentFilename}.component.cy.ts`, ctSpecContent({ component: componentName ? componentName[0] : componentFilename, file: componentFilename }))
    }
  })
}

export function getDirectoriesAndCreateSpecs ({ appPath, tree }: { appPath: string, tree: Tree}) {
  let components = []
  let directories = []

  const projectPath = resolve(getSystemPath(normalize('')))
  const contents = readdirSync(resolve(`${projectPath}/${appPath}`), { withFileTypes: true })

  if (contents) {
    components = contents.filter((file) => file['name'].endsWith(`component.ts`))
    directories = contents.filter((file) => file.isDirectory())

    if (components) {
      generateCTSpecs({ tree, appPath, components })
    }

    if (directories) {
      directories.forEach((directory: any) => {
        getDirectoriesAndCreateSpecs({ tree, appPath: `${appPath}/${directory['name']}` })
      })
    }
  }
}

export function getAngularJsonValue (tree: Tree) {
  const angularJson = new JSONFile(tree, './angular.json')

  return angularJson.get([]) as any
}
