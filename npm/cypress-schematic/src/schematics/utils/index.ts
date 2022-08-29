import { readdirSync } from 'fs'
import { resolve } from 'path'
import { getSystemPath, normalize, strings } from '@angular-devkit/core'
import { Tree, apply, url, applyTemplates, move, Rule } from '@angular-devkit/schematics'
import { get } from 'http'
import { Schema } from '../ng-generate/cypress-test/schema'

import { getPackageJsonDependency } from './dependencies'
import { JSONFile } from './jsonFile'

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

const ctSpecContent = ({ componentName, componentFilename }: {componentName: string, componentFilename: string}): string => {
  return `import { ${componentName} } from './${componentFilename}.component'\n
  describe('${componentName}', () => {
    it('should mount', () => {
      cy.mount(${componentName})
    })
  })
  `
}

function generateCTSpec ({ tree, appPath, component }: { tree: Tree, appPath: string, component: any}): Rule | void {
  const buffer = tree.read(`${appPath}/${component['name']}`)
  const componentString = buffer?.toString()
  const componentMatch = componentString?.match(/(?<=class )\S+/g)
  const componentFilename = component['name'].split('.')[0]
  const componentName = componentMatch ? componentMatch[0] : componentFilename

  console.log(`Creating new component spec for: ${componentName}\n`)

  return tree.create(`${appPath}/${componentFilename}.component.cy.ts`, ctSpecContent({ componentName, componentFilename }))
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
      components.map((component) => {
        return generateCTSpec({ tree, appPath, component })
      })
    }

    if (directories) {
      directories.forEach((directory: any) => {
        return getDirectoriesAndCreateSpecs({ tree, appPath: `${appPath}/${directory['name']}` })
      })
    }
  }
}

export function createTemplate ({ templatePath, options }: {templatePath: string, options: Schema}): any {
  return apply(url(templatePath), [
    applyTemplates({
      classify: strings.classify,
      dasherize: strings.dasherize,
      name: options.component ? `${options.name}Component` : options.name,
      fileName: options.filename || options.name,
    }),
    move(normalize(options.path as string)),
  ])
}

export function getAngularJsonValue (tree: Tree) {
  const angularJson = new JSONFile(tree, './angular.json')

  return angularJson.get([]) as any
}
