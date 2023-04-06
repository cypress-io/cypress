import { getSystemPath, JsonObject, JsonValue, normalize, strings } from '@angular-devkit/core'
import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  applyTemplates,
  Tree,
  url,
} from '@angular-devkit/schematics'
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks'
import { of } from 'rxjs'
import { concatMap, map } from 'rxjs/operators'

import { addPackageJsonDependency, NodeDependencyType } from '../utils/dependencies'
import {
  getAngularJsonValue,
  getAngularVersion,
  getLatestNodeVersion,
  NodePackage,
  getDirectoriesAndCreateSpecs,
} from '../utils'
import { relative, resolve } from 'path'
import { JSONFile, JSONPath } from '../utils/jsonFile'

type HandleFilesType = {
  projects: any
  options: any
  applyPath: string
  movePath?: string
  relativeToWorkspacePath: string
}

export default function (_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _options = { ..._options, __version__: getAngularVersion(tree) }

    return chain([
      updateDependencies(),
      addCypressCoreFiles(_options),
      addCypressComponentTestingFiles(_options),
      addCtSpecs(_options),
      addCypressTestScriptsToPackageJson(),
      modifyAngularJson(_options),
      addDefaultSchematic(),
    ])(tree, _context)
  }
}

function addPropertyToPackageJson (tree: Tree, path: JSONPath, value: JsonValue) {
  const json = new JSONFile(tree, '/package.json')

  json.modify(path, value)
}

function updateDependencies (): Rule {
  return (tree: Tree, context: SchematicContext): any => {
    context.logger.debug('Updating dependencies...')
    context.addTask(new NodePackageInstallTask({ allowScripts: true }))

    const addDependencies = of('cypress').pipe(
      concatMap((packageName: string) => getLatestNodeVersion(packageName)),
      map((packageFromRegistry: NodePackage) => {
        const { name, version } = packageFromRegistry

        context.logger.debug(`Adding ${name}:${version} to ${NodeDependencyType.Dev}`)

        addPackageJsonDependency(tree, {
          type: NodeDependencyType.Dev,
          name,
          version,
        })

        return tree
      }),
    )

    return addDependencies
  }
}

function addCypressTestScriptsToPackageJson (): Rule {
  return (tree: Tree) => {
    addPropertyToPackageJson(tree, ['scripts'], {
      'e2e': 'ng e2e',
      'cypress:open': 'cypress open',
      'cypress:run': 'cypress run',
    })
  }
}

function handleFiles (tree: Tree, context: SchematicContext, { projects, options, applyPath, movePath, relativeToWorkspacePath }: HandleFilesType): any {
  return chain(
    Object.keys(projects).map((name) => {
      const project = projects[name]
      const projectPath = resolve(getSystemPath(normalize(project.root)))
      const workspacePath = resolve(getSystemPath(normalize('')))

      const relativeToWorkspace = relative(`${projectPath}${relativeToWorkspacePath}`, workspacePath)

      const baseUrl = getBaseUrl(project)

      return mergeWith(
        apply(url(applyPath), [
          move(movePath ? `${project.root}${movePath}` : project.root),
          applyTemplates({
            ...options,
            ...strings,
            root: project.root ? `${project.root}/` : project.root,
            baseUrl,
            relativeToWorkspace,
          }),
        ]),
      )
    }),
  )(tree, context)
}

function addCypressCoreFiles (options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding cypress files')
    const angularJsonValue = getAngularJsonValue(tree)
    const { projects } = angularJsonValue

    return handleFiles(tree, context, {
      projects,
      options,
      applyPath: './files-core',
      relativeToWorkspacePath: `/`,
    })
  }
}

function addCypressComponentTestingFiles (options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.component) {
      context.logger.debug('Adding cypress component testing files')
      const angularJsonValue = getAngularJsonValue(tree)
      const { projects } = angularJsonValue

      return handleFiles(tree, context, {
        projects,
        options,
        applyPath: './files-ct',
        movePath: '/cypress/support',
        relativeToWorkspacePath: `/cypress`,
      })
    }
  }
}

function addCtSpecs (options: any): Rule {
  return (tree: Tree) => {
    if (options.addCtSpecs) {
      const angularJsonValue = getAngularJsonValue(tree)
      const { projects } = angularJsonValue

      Object.keys(projects).map((name) => {
        const project = projects[name]
        const appPath = `${project.root}/${project.sourceRoot}/${project.prefix}`

        return getDirectoriesAndCreateSpecs({ tree, appPath })
      })
    }
  }
}

function getBaseUrl (project: { architect: { serve: { options: any } } }): string {
  let options = { protocol: 'http', port: 4200, host: 'localhost' }

  if (project.architect?.serve?.options) {
    const projectOptions = project.architect?.serve?.options

    options = { ...options, ...projectOptions }
    options.protocol = projectOptions.ssl ? 'https' : 'http'
  }

  return `${options.protocol}://${options.host}:${options.port}`
}

function addNewCypressCommands (
  tree: Tree,
  angularJsonVal: any,
  project: string,
  runJson: JsonObject,
  openJson: JsonObject,
  e2eJson: JsonObject,
  e2e: boolean,
  componentJson: JsonObject,
  component: boolean,
) {
  const projectArchitectJson = angularJsonVal['projects'][project]['architect']

  projectArchitectJson['cypress-run'] = runJson
  projectArchitectJson['cypress-open'] = openJson

  if (component) {
    projectArchitectJson['ct'] = componentJson
  }

  if (e2e || !projectArchitectJson['e2e']) {
    projectArchitectJson['e2e'] = e2eJson
  }

  return tree.overwrite('./angular.json', JSON.stringify(angularJsonVal, null, 2))
}

function modifyAngularJson (options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists('./angular.json')) {
      const angularJsonVal = getAngularJsonValue(tree)
      const { projects } = angularJsonVal

      if (!projects) {
        throw new SchematicsException('projects in angular.json is not defined')
      }

      Object.keys(projects).forEach((project) => {
        const builder = '@cypress/schematic:cypress'
        const runJson = {
          builder,
          options: {
            devServerTarget: `${project}:serve`,
          },
          configurations: {
            production: {
              devServerTarget: `${project}:serve:production`,
            },
          },
        }

        const openJson = {
          builder,
          options: {
            watch: true,
            headless: false,
          },
        }

        const e2eJson = {
          builder,
          options: {
            devServerTarget: `${project}:serve`,
            watch: true,
            headless: false,
          },
          configurations: {
            production: {
              devServerTarget: `${project}:serve:production`,
            },
          },
        }

        const componentJson = {
          builder,
          options: {
            devServerTarget: `${project}:serve`,
            watch: true,
            headless: false,
            testingType: 'component',
          },
          configurations: {
            development: {
              devServerTarget: `${project}:serve:development`,
            },
          },
        }

        const configFile = getCypressConfigFile(angularJsonVal, project)

        if (configFile) {
          Object.assign(runJson.options, { configFile })
          Object.assign(openJson.options, { configFile })
        }

        if (options.e2e) {
          context.logger.debug(`Replacing e2e command with cypress-run in angular.json`)
          removeE2ELinting(tree, angularJsonVal, project)
        }

        context.logger.debug(`Adding cypress/tsconfig.json to angular.json-tslint config`)

        addCypressTsConfig(tree, angularJsonVal, project)

        context.logger.debug(`Adding cypress-run and cypress-open commands in angular.json`)

        addNewCypressCommands(
          tree,
          angularJsonVal,
          project,
          runJson,
          openJson,
          e2eJson,
          options.e2e,
          componentJson,
          options.component,
        )
      })
    } else {
      throw new SchematicsException('angular.json not found')
    }

    return tree
  }
}

function addDefaultSchematic (): Rule {
  return (tree: Tree, _: SchematicContext) => {
    if (tree.exists('./angular.json')) {
      const angularJsonVal = getAngularJsonValue(tree)
      const angularSchematic = '@schematics/angular'
      const cli = {
        ...angularJsonVal.cli,
        schematicCollections: ['@cypress/schematic', ...angularJsonVal?.cli?.schematicCollections ?? []],
      }

      if (cli.schematicCollections.indexOf('@schematics/angular') === -1) {
        cli.schematicCollections.push(angularSchematic)
      }

      return tree.overwrite(
        './angular.json',
        JSON.stringify({
          ...angularJsonVal,
          cli,
        }, null, 2),
      )
    }

    throw new SchematicsException('angular.json not found')
  }
}

export const getCypressConfigFile = (angularJsonVal: any, projectName: string) => {
  const project = angularJsonVal.projects[projectName]
  const tsConfig = project?.architect?.lint?.options?.tsConfig

  if (project.root) {
    return `${project.root}/cypress.config.${tsConfig ? 'ts' : 'js'}`
  }

  return null
}

export const addCypressTsConfig = (tree: Tree, angularJsonVal: any, projectName: string) => {
  const project = angularJsonVal.projects[projectName]
  let tsConfig = project?.architect?.lint?.options?.tsConfig

  if (tsConfig) {
    let prefix = ''

    if (project.root) {
      prefix = `${project.root}/`
    }

    if (!Array.isArray(tsConfig)) {
      project.architect.lint.options.tsConfig = tsConfig = [tsConfig]
    }

    tsConfig.push(`${prefix}cypress/tsconfig.json`)
  }

  return tree.overwrite('./angular.json', JSON.stringify(angularJsonVal, null, 2))
}

export const removeE2ELinting = (tree: Tree, angularJsonVal: any, project: string) => {
  const projectLintOptionsJson = angularJsonVal.projects[project]?.architect?.lint?.options

  if (projectLintOptionsJson) {
    let filteredTsConfigPaths

    if (Array.isArray(projectLintOptionsJson['tsConfig'])) {
      filteredTsConfigPaths = projectLintOptionsJson?.tsConfig?.filter((path: string) => {
        const pathIncludesE2e = path.includes('e2e')

        return !pathIncludesE2e && path
      })
    } else {
      filteredTsConfigPaths = !projectLintOptionsJson?.tsConfig?.includes('e2e')
        ? projectLintOptionsJson?.tsConfig
        : ''
    }

    projectLintOptionsJson['tsConfig'] = filteredTsConfigPaths
  }

  return tree.overwrite('./angular.json', JSON.stringify(angularJsonVal, null, 2))
}
