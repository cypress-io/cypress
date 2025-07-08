import debugFn from 'debug'
import module from 'module'
import path from 'path'
import os from 'os'
import type { ViteDevServerConfig } from './devServer.js'
import majorVersion from 'semver/functions/major.js'

const debug = debugFn('cypress:vite-dev-server:getVite')

export type Vite = typeof import('vite-7')

// "vite-dev-server" is bundled in the binary, so we need to require.resolve "vite"
// from root of the active project since we don't bundle vite internally but rather
// use the version the user has installed
export async function getVite (config: ViteDevServerConfig): Promise<Vite> {
  const filePrefix = os.platform() === 'win32' ? 'file://' : ''

  try {
    const require = module.createRequire(import.meta.url)
    const vitePackageJsonPath = require.resolve('vite/package.json', { paths: [config.cypressConfig.projectRoot] })
    const vitePackageJson = (await import(`${filePrefix}${vitePackageJsonPath}`, {
      with: {
        type: 'json',
      },
    })).default

    const viteExports = vitePackageJson.exports['.']
    let esmPath = null
    let cjsPath = null

    // In Node 20, require.resolve in the ESM context returns the CJS path as if we were in a CJS context.
    // In Node 22, this is not the case and the ESM context is returned correctly.
    // In order to work around this, we need to check where the ESM path is so we can import the correct path.
    // In Vite 7, the CJS build was removed so there is only a single string entry in the export.
    // Otherwise, both builds exists in Vite 6 and under and we only want to get the ESM path.

    const majorVersionNumber = majorVersion(vitePackageJson.version)

    if (majorVersionNumber >= 7) {
      esmPath = viteExports
    } else if (majorVersionNumber === 5) {
      esmPath = viteExports.import.default
      cjsPath = viteExports.require.default
    } else {
      esmPath = viteExports.import
      cjsPath = viteExports.require
    }

    debug('vite ESM build path: %s', esmPath)
    debug('vite CJS build path: %s', cjsPath)

    try {
      // try to import the ESM build of Vite
      const esmViteImportPath = path.resolve(vitePackageJsonPath, '../', esmPath)

      debug('resolved esmViteImportPath as %s', esmViteImportPath)

      const viteImport = await import(`${filePrefix}${esmViteImportPath}`)

      return viteImport
    } catch (err) {
      // if the ESM build import fails, try to import the CJS build
      debug('importing vite as ESM failed:', err)
      debug('importing vite as CJS')
      // Vite 4-6 both include the CJS distribution of Vite
      const cjsViteImportPath = path.resolve(vitePackageJsonPath, '../', cjsPath)

      debug('resolved cjsViteImportPath as %s', cjsViteImportPath)

      const viteImport = await import(`${filePrefix}${cjsViteImportPath}`)

      return viteImport.default
    }
  } catch (err) {
    throw new Error(`Could not find "vite" in your project's dependencies. Please install "vite" to fix this error.\n\n${err}`)
  }
}
