import path from 'path'
import { pathToFileURL } from 'url'
import globby from 'globby'
import { z } from 'zod'
import Debug from 'debug'

const debug = Debug('cypress:scaffold-config:ct-detect-thrid-party')

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

const ThirdPartyComponentFrameworkSchema = z.object({
  type: z.string().startsWith('cypress-ct-'),
  configFramework: z.string().startsWith('cypress-ct-'),
  category: z.enum(['library', 'template']),
  name: z.string(),
  supportedBundlers: z.array(BundlerSchema),
  detectors: DependencyArraySchema,
  dependencies: z.function(),
  mountModule: z.function(),
  componentIndexHtml: z.optional(z.function()),
})

const CT_FRAMEWORK_GLOB = 'node_modules/cypress-ct-*/package.json'

// tsc will compile `import(...)` calls to require unless a different tsconfig.module value
// is used (e.g. module=node16). To change this, we would also have to change the ts-node behavior when requiring the
// Cypress config file. This hack for keeping dynamic imports from being converted works across all
// of our supported node versions
const _dynamicImport = new Function('specifier', 'return import(specifier)')

const dynamicImport = <T>(module: string) => {
  return _dynamicImport(module) as Promise<T>
}

const dynamicAbsoluteImport = (filePath: string) => {
  return dynamicImport(pathToFileURL(filePath).href) as Promise<any>
}

export async function detectThirdPartyCTFrameworks (
  projectRoot: string,
): Promise<any[]> {
  try {
    const fullPathGlob = path.join(projectRoot, CT_FRAMEWORK_GLOB)

    const packageJsonPaths = await globby(fullPathGlob)

    debug('Found packages matching "cypress-ct-*/package.json": %o', packageJsonPaths)

    const modules = await Promise.all(
      packageJsonPaths.map(async (packageJsonPath) => {
        try {
          const packageRoot = path.dirname(packageJsonPath)

          debug('Attempting to resolve third party module with require.resolve: %s', packageRoot)

          const modulePath = require.resolve(packageRoot)

          debug('Resolve successful: %s', path.dirname(packageJsonPath))

          const m = await dynamicAbsoluteImport(modulePath).then((m) => m.default || m)

          debug('Import successful: %o', m)

          return m
        } catch (e) {
          debug('Ignoring %s due to error resolving: %o', e)
        }
      }),
    ).then((modules) => {
      return modules.filter((m) => {
        if (!m) return false

        try {
          return !!ThirdPartyComponentFrameworkSchema.parse(m)
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
