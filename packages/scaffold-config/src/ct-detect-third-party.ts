import path from 'path'
import globby from 'globby'
import { z } from 'zod'
import fs from 'fs-extra'
import Debug from 'debug'

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

export function isThirdPartyDefinition (definition: Cypress.ComponentFrameworkDefinition | Cypress.ThirdPartyComponentFrameworkDefinition): definition is Cypress.ThirdPartyComponentFrameworkDefinition {
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

export async function detectThirdPartyCTFrameworks (
  projectRoot: string,
): Promise<Cypress.ThirdPartyComponentFrameworkDefinition[]> {
  try {
    const fullPathGlobs = [
      path.join(projectRoot, CT_FRAMEWORK_GLOBAL_GLOB),
      path.join(projectRoot, CT_FRAMEWORK_NAMESPACED_GLOB),
    ].map((x) => x.replaceAll('\\', '/'))

    const packageJsonPaths = await globby(fullPathGlobs)

    debug('Found packages matching %s glob: %o', fullPathGlobs, packageJsonPaths)

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

          debug('`name` in package.json', pkgJson.name)

          debug('Attempting to resolve third party module with require.resolve: %s', pkgJson.name)

          const modulePath = require.resolve(pkgJson.name, { paths: [projectRoot] })

          debug('Resolve successful: %s', modulePath)

          debug('require(%s)', modulePath)

          const mod = require(modulePath)

          debug('Module is %o', mod)

          debug('Import successful: %o', mod)

          return mod
        } catch (e) {
          debug('Ignoring %s due to error resolving: %o', e)
        }
      }),
    ).then((modules) => {
      return modules.filter((m) => {
        if (!m) return false

        try {
          return !!validateThirdPartyModule(m)
        } catch (e) {
          debug('Failed to parse third party module with validation error: %o', e)

          return false
        }
      })
    })

    return modules
  } catch (e) {
    debug('Error occurred while looking for 3rd party CT plugins: %o', e)

    return []
  }
}

export function validateThirdPartyModule (m: Cypress.ThirdPartyComponentFrameworkDefinition) {
  return ThirdPartyComponentFrameworkSchema.parse(m)
}
