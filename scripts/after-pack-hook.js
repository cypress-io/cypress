const fs = require('fs-extra')
const { join } = require('path')
const glob = require('glob')
const os = require('os')
const path = require('path')
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')
const { consolidateDuplicateDependencies, removeBundledDependencies, cleanupUnneededDependencies } = require('./binary/binary-cleanup')
const { createStartCypressBundle, createServerEntryPointBundle, createStartBundleCodeCache } = require('./binary/start-bundle')
const {
  getEncryptionFileSource,
  getCloudEnvironmentFileSource,
  validateEncryptionFile,
  getProtocolFileSource,
  validateCloudEnvironmentFile,
  validateProtocolFile,
  getStudioFileSource,
  validateStudioFile,
  getCyPromptFileSource,
  validateCyPromptFile,
  validateShippedServerCode,
} = require('./binary/binary-sources')

// Strip test keys and local development overrides from the server code that the binary ships
const appFileRewrites = [
  ['packages/server/lib/cloud/encryption.js', getEncryptionFileSource, validateEncryptionFile],
  ['packages/server/lib/cloud/environment.js', getCloudEnvironmentFileSource, validateCloudEnvironmentFile],
  ['packages/server/lib/cloud/api/index.js', getProtocolFileSource, validateProtocolFile],
  ['packages/server/lib/cloud/protocol.js', getProtocolFileSource, validateProtocolFile],
  ['packages/server/lib/cloud/protocol.js', getStudioFileSource, validateStudioFile],
  ['packages/server/lib/cloud/api/studio/report_studio_error.js', getStudioFileSource, validateStudioFile],
  ['packages/server/lib/cloud/studio/StudioLifecycleManager.js', getStudioFileSource, validateStudioFile],
  ['packages/server/lib/cloud/studio/studio.js', getStudioFileSource, validateStudioFile],
  ['packages/server/lib/cloud/cy-prompt/CyPromptLifecycleManager.js', getCyPromptFileSource, validateCyPromptFile],
  ['packages/server/lib/cloud/cy-prompt/CyPromptManager.js', getCyPromptFileSource, validateCyPromptFile],
  ['packages/server/lib/cloud/api/cy-prompt/report_cy_prompt_error.js', getCyPromptFileSource, validateCyPromptFile],
  ['packages/server/lib/project-base.js', getCyPromptFileSource, validateCyPromptFile],
]

module.exports = async function (params) {
  try {
    console.log('****************************')
    console.log('After pack hook')
    console.log(params.appOutDir)
    console.log(params.outDir)
    console.log(params.electronPlatformName)
    console.log('****************************')

    const packages = glob.sync('packages/*/node_modules', {
      cwd: params.packager.info._appDir,
    })

    const buildSubfoldersPerPlatform = {
      darwin: join('Cypress.app', 'Contents', 'Resources', 'app'),
      linux: join('resources', 'app'),
      win32: join('resources', 'app'), // TODO check this path
    }
    const buildSubfolder = buildSubfoldersPerPlatform[os.platform()]
    const outputFolder = join(params.appOutDir, buildSubfolder)

    console.log('copying node_modules to', outputFolder)

    for await (const packageNodeModules of packages) {
      console.log('copying', packageNodeModules)

      const sourceFolder = join(params.packager.info._appDir, packageNodeModules)
      const destinationFolder = join(outputFolder, packageNodeModules)

      await fs.copy(sourceFolder, destinationFolder)
    }

    const distNodeModules = path.join(params.packager.info._appDir, 'node_modules')
    const appNodeModules = path.join(outputFolder, 'node_modules')

    console.log('copying ', distNodeModules, ' to', appNodeModules)

    await fs.copy(distNodeModules, appNodeModules)

    console.log('all node_modules subfolders copied to', outputFolder)

    const exePathPerPlatform = {
      darwin: join(params.appOutDir, 'Cypress.app', 'Contents', 'MacOS', 'Cypress'),
      linux: join(params.appOutDir, 'Cypress'),
      win32: join(params.appOutDir, 'Cypress.exe'),
    }

    // rewrites of the same file must run in order
    for (const [file, getSource, validate] of appFileRewrites) {
      const filePath = path.join(outputFolder, file)

      await fs.writeFile(filePath, await getSource(filePath))
      await validate(filePath)
    }

    await flipFuses(
      exePathPerPlatform[os.platform()],
      {
        version: FuseVersion.V1,
        resetAdHocDarwinSignature: os.platform() === 'darwin' && os.arch() === 'arm64',
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
      },
    )

    // esbuild reports real paths, so a symlink in the build path (macOS's /var) would put every module outside the app
    const appDir = await fs.realpath(outputFolder)

    // Consolidate first so that the bundles and the files kept on disk resolve the copies that ship
    await consolidateDuplicateDependencies(appDir)

    const [startBundle, serverEntryPointBundledDependencies] = await Promise.all([
      createStartCypressBundle(appDir),
      createServerEntryPointBundle(appDir),
    ])

    await removeBundledDependencies(appDir, {
      bundledDependencies: [...startBundle.bundledDependencies, ...serverEntryPointBundledDependencies],
      loadedFromDisk: startBundle.loadedFromDisk,
    })

    await cleanupUnneededDependencies(outputFolder)

    await validateShippedServerCode(path.join(appDir, 'packages', 'server'))

    await createStartBundleCodeCache()
  } catch (error) {
    console.log(error)
    throw error
  }
}
