const fs = require('fs-extra')
const { join } = require('path')
const glob = require('glob')
const os = require('os')
const path = require('path')
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')
const { buildEntryPointAndCleanup, cleanupUnneededDependencies } = require('./binary/binary-cleanup')
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
} = require('./binary/binary-sources')
const { needsSandbox } = require('../cli/lib/tasks/verify')
const xvfb = require('../cli/lib/exec/xvfb').default
const execa = require('execa')
const meta = require('./binary/meta')

// Run the app once so the start bundle's code cache includes the functions that compile during startup
const createStartBundleCodeCache = async () => {
  const args = ['--smoke-test', '--ping=1']

  if (needsSandbox()) {
    args.push('--no-sandbox')
  }

  const usingXvfb = xvfb.isNeeded()

  try {
    if (usingXvfb) {
      await xvfb.start()
    }

    const env = { ...process.env, CYPRESS_INTERNAL_WRITE_START_BUNDLE_CACHE: '1' }

    // V8 rejects a code cache made under different flags, so NODE_OPTIONS must not leak into the app
    delete env.NODE_OPTIONS
    delete env.ELECTRON_RUN_AS_NODE

    await execa(`${meta.buildAppExecutable()}`, args, { env, extendEnv: false })
  } finally {
    if (usingXvfb) {
      await xvfb.stop()
    }
  }
}

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

    if (!['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE)) {
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

      await buildEntryPointAndCleanup(outputFolder)
      await cleanupUnneededDependencies(outputFolder)

      await createStartBundleCodeCache()
    } else {
      console.log(`value of DISABLE_SNAPSHOT_REQUIRE was ${process.env.DISABLE_SNAPSHOT_REQUIRE}. Skipping the main process bundle...`)
      await cleanupUnneededDependencies(outputFolder)
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}
