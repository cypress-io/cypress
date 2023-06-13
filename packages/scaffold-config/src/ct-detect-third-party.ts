import path from 'path'
import globby from 'globby'
import { z } from 'zod'
import fs from 'fs-extra'
import Debug from 'debug'
import findUp from 'find-up'

const debug = Debug('cypress:scaffold-config:ct-detect-third-party')

const DependencySchema = z.object({
  type: z.string(),
  name: z.string(),
  package: z.string(),
  installer: z.string(),
  description: z.string(),
  minVersion: z.string(),
})

const DependencyArraySchema = z.array(DependencySchema)

const BundlerSchema = z.enum(['webpack', 'vite'])

const thirdPartyDefinitionPrefixes = {
  // matches @org/cypress-ct-*
  namespacedPrefixRe: /^@.+?\/cypress-ct-.+/,
  globalPrefix: 'cypress-ct-',
}

const ROOT_PATHS = [
  '.git',

  // https://pnpm.io/workspaces
  'pnpm-workspace.yaml',

  // https://rushjs.io/pages/advanced/config_files/
  'rush.json',

  // https://nx.dev/deprecated/workspace-json#workspace.json
  // https://nx.dev/reference/nx-json#nx.json
  'workspace.json',
  'nx.json',

  // https://lerna.js.org/docs/api-reference/configuration
  'lerna.json',
]

async function hasWorkspacePackageJson (directory: string) {
  try {
    const pkg = await fs.readJson(path.join(directory, 'package.json'))

    debug('package file for %s: %o', directory, pkg)

    return !!pkg.workspaces
  } catch (e) {
    debug('error reading package.json in %s. this is not the repository root', directory)

    return false
  }
}

export async function isRepositoryRoot (directory: string) {
  if (ROOT_PATHS.some((rootPath) => fs.existsSync(path.join(directory, rootPath)))) {
    return true
  }

  return hasWorkspacePackageJson(directory)
}

export function isThirdPartyDefinition (definition: Cypress.ComponentFrameworkDefinition | Cypress.ThirdPartyComponentFrameworkDefinition): boolean {
  return definition.type.startsWith(thirdPartyDefinitionPrefixes.globalPrefix) ||
    thirdPartyDefinitionPrefixes.namespacedPrefixRe.test(definition.type)
}

const ThirdPartyComponentFrameworkSchema = z.object({
  type: z.string().startsWith(thirdPartyDefinitionPrefixes.globalPrefix).or(z.string().regex(thirdPartyDefinitionPrefixes.namespacedPrefixRe)),
  name: z.string(),
  supportedBundlers: z.array(BundlerSchema),
  detectors: DependencyArraySchema,
  dependencies: z.function(),
  componentIndexHtml: z.optional(z.function()),
})

const CT_FRAMEWORK_GLOBAL_GLOB = path.join('node_modules', 'cypress-ct-*', 'package.json')
const CT_FRAMEWORK_NAMESPACED_GLOB = path.join('node_modules', '@*?/cypress-ct-*?', 'package.json')

export interface ErroredFramework {
  path: string
  reason: string
}

export async function detectThirdPartyCTFrameworks (
  projectRoot: string,
): Promise<{ frameworks: Cypress.ThirdPartyComponentFrameworkDefinition[], erroredFrameworks: ErroredFramework[] }> {
  const erroredFrameworks: ErroredFramework[] = []

  try {
    let fullPathGlobs
    let packageJsonPaths: string[] = []

    // Start at the project root and check each directory above it until we see
    // an indication that the current directory is the root of the repository.
    await findUp(async (directory: string) => {
      fullPathGlobs = [
        path.join(directory, CT_FRAMEWORK_GLOBAL_GLOB),
        path.join(directory, CT_FRAMEWORK_NAMESPACED_GLOB),
      ].map((x) => x.replaceAll('\\', '/'))

      debug('searching for third-party dependencies with globs %o', fullPathGlobs)

      const newPackagePaths = await globby(fullPathGlobs)

      if (newPackagePaths.length > 0) {
        debug('found third-party dependencies %o', newPackagePaths)
      }

      packageJsonPaths = [...packageJsonPaths, ...newPackagePaths]

      const isCurrentRepositoryRoot = await isRepositoryRoot(directory)

      if (isCurrentRepositoryRoot) {
        debug('stopping search at %s because it is believed to be the repository root', directory)

        return findUp.stop
      }

      // Return undefined to keep searching
      return undefined
    }, { cwd: projectRoot })

    if (packageJsonPaths.length === 0) {
      debug('no third-party dependencies detected')

      return { frameworks: [], erroredFrameworks }
    }

    debug('found third-party dependencies %o', packageJsonPaths)

    const modules = await Promise.all(
      packageJsonPaths.map(async (packageJsonPath) => {
        try {
          /**
           * Node.js require.resolve resolves differently when given an absolute path vs package name e.g.
           * - require.resolve('/<project-root>/node_modules/cypress-ct-solidjs') => packageJson.main
           * - require.resolve('cypress-ct-solidjs', { paths: [projectRoot] }) => packageJson.exports
           * We need to respect packageJson.exports so as to resolve the node specifier so we find package.json,
           * get the packageRoot and then get the baseName giving us the module name
           *
           * Example package.json:
           * {
           *    "main": "index.mjs",
           *    "exports": {
           *      "node": "definition.mjs",
           *      "default": "index.mjs"
           *    }
           * }
          */
          const pkgJson = await fs.readJSON(packageJsonPath)

          const name = pkgJson.name

          debug('`name` in package.json', name)

          debug('Attempting to resolve third party module with require.resolve: %s', name)

          const modulePath = require.resolve(pkgJson.name, { paths: [projectRoot] })

          debug('Resolve successful: %s', modulePath)

          debug('require(%s)', modulePath)

          const mod = require(modulePath)

          debug('Module is %o', mod)

          let defaultEntry = mod?.default ?? mod

          debug('Import successful: %o', defaultEntry)

          // adding the path here for use in error messages if needed
          const defaultEntryWithPath = Object.assign(defaultEntry, { path: modulePath })

          return defaultEntryWithPath
        } catch (e) {
          erroredFrameworks.push({
            path: packageJsonPath,
            reason: 'error while resolving',
          })

          debug('Ignoring %s due to error resolving module', e)
        }
      }),
    ).then((modules) => {
      return modules.filter((m) => {
        if (!m) return false

        try {
          return !!validateThirdPartyModule(m)
        } catch (e) {
          debug('Failed to parse third party module with validation error: %o', e)
          erroredFrameworks.push({
            path: m.path,
            reason: 'error while parsing',
          })

          return false
        }
      })
    })

    return { frameworks: modules, erroredFrameworks }
  } catch (e) {
    debug('Error occurred while looking for 3rd party CT plugins: %o', e)

    return { frameworks: [], erroredFrameworks }
  }
}

export function validateThirdPartyModule (m: Cypress.ThirdPartyComponentFrameworkDefinition) {
  return ThirdPartyComponentFrameworkSchema.parse(m)
}
