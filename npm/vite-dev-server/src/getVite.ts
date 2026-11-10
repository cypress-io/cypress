import debugFn from 'debug'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'
import majorVersion from 'semver/functions/major.js'
import type { ViteDevServerConfig } from './devServer.js'

const debug = debugFn('cypress:vite-dev-server:getVite')

export type Vite = typeof import('vite-8')

export class ViteVersionNotSupportedError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'ViteVersionNotSupportedError'
  }
}

export class ViteNotInstalledError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'ViteNotInstalledError'
  }
}

// "vite-dev-server" is bundled in the binary, so we need to require.resolve "vite"
// from root of the active project since we don't bundle vite internally but rather
// use the version the user has installed
export async function getVite (config: ViteDevServerConfig): Promise<Vite> {
  try {
    const require = createRequire(import.meta.url)
    const vitePackageJsonPath = require.resolve('vite/package.json', { paths: [config.cypressConfig.projectRoot] })

    const vitePackageJsonUrl = pathToFileURL(vitePackageJsonPath).href
    const vitePackageJson = (await import(vitePackageJsonUrl, {
      with: {
        type: 'json',
      },
    })).default

    const majorVersionNumber = majorVersion(vitePackageJson.version)

    debug(`Found vite version v${majorVersionNumber}`)

    if (majorVersionNumber < 8) {
      // We know that vite < 8 will NOT work with the vite-dev-server.
      // However, versions 8 or greater MAY work, but we are unsure of the future
      // The cypress application will attempt to run versions of vite greater than 8, but will warn the user that this version is not expected
      throw new ViteVersionNotSupportedError(`Vite 8 is the required version to use cypress/vite-dev-server. Found Vite version v${vitePackageJson.version}`)
    }

    const viteExports = vitePackageJson.exports['.']

    // Only attempt to import the ESM build of Vite.
    // In Vite 7, the CJS build was removed so there is only a single string entry in the export.
    // At time of writing, Vite 8 is our minimum supported version, so we can assume the ESM build is the only one we need to support.

    // try to import the ESM build of Vite
    const esmViteImportPath = path.resolve(vitePackageJsonPath, '../', viteExports)

    debug('resolved esmViteImportPath as %s', esmViteImportPath)

    const viteImportUrl = pathToFileURL(esmViteImportPath).href
    const viteImport = await import(viteImportUrl)

    return viteImport
  } catch (err) {
    if (err instanceof ViteVersionNotSupportedError) {
      throw err
    }

    debug(`vite version not found`)

    throw new ViteNotInstalledError(`Could not find "vite" in your project's dependencies. Please install "vite" to fix this error.\n\n${err}`)
  }
}
