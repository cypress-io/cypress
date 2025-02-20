const fs = require('fs-extra')
const { join } = require('path')
const glob = require('glob')
const os = require('os')
const path = require('path')
const { setupV8Snapshots } = require('@tooling/v8-snapshot')
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')
const { buildEntryPointAndCleanup, cleanupUnneededDependencies } = require('./binary/binary-cleanup')
const {
  getIntegrityCheckSource,
  getBinaryEntryPointSource,
  getBinaryByteNodeEntryPointSource,
  getEncryptionFileSource,
  getCloudEnvironmentFileSource,
  validateEncryptionFile,
  getProtocolFileSource,
  validateCloudEnvironmentFile,
  validateProtocolFile,
  getStudioFileSource,
  validateStudioFile,
  getIndexJscHash,
  DUMMY_INDEX_JSC_HASH,
} = require('./binary/binary-sources')
const verify = require('../cli/lib/tasks/verify')
const execa = require('execa')
const meta = require('./binary/meta')

const CY_ROOT_DIR = path.join(__dirname, '..')

const createJscFromCypress = async () => {
  const args = []

  if (verify.needsSandbox()) {
    args.push('--no-sandbox')
  }

  await execa(`${meta.buildAppExecutable()}`, args)
}

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
      const binaryByteNodeEntryPointSource = await getBinaryByteNodeEntryPointSource()
      const binaryEntryPointSource = await getBinaryEntryPointSource()
      const encryptionFilePath = path.join(CY_ROOT_DIR, 'packages/server/lib/cloud/encryption.ts')
      const encryptionFileSource = await getEncryptionFileSource(encryptionFilePath)
      const cloudEnvironmentFilePath = path.join(CY_ROOT_DIR, 'packages/server/lib/cloud/environment.ts')
      const cloudEnvironmentFileSource = await getCloudEnvironmentFileSource(cloudEnvironmentFilePath)
      const cloudApiFilePath = path.join(CY_ROOT_DIR, 'packages/server/lib/cloud/api/index.ts')
      const cloudApiFileSource = await getProtocolFileSource(cloudApiFilePath)
      const cloudProtocolFilePath = path.join(CY_ROOT_DIR, 'packages/server/lib/cloud/protocol.ts')
      const cloudProtocolFileSource = await getProtocolFileSource(cloudProtocolFilePath)
      const projectBaseFilePath = path.join(CY_ROOT_DIR, 'packages/server/lib/project-base.ts')
      const projectBaseFileSource = await getStudioFileSource(projectBaseFilePath)
      const getAppStudioFilePath = path.join(CY_ROOT_DIR, 'packages/server/lib/cloud/api/get_app_studio.ts')
      const getAppStudioFileSource = await getStudioFileSource(getAppStudioFilePath)

      await Promise.all([
        fs.writeFile(encryptionFilePath, encryptionFileSource),
        fs.writeFile(cloudEnvironmentFilePath, cloudEnvironmentFileSource),
        fs.writeFile(cloudApiFilePath, cloudApiFileSource),
        fs.writeFile(cloudProtocolFilePath, cloudProtocolFileSource),
        fs.writeFile(projectBaseFilePath, projectBaseFileSource),
        fs.writeFile(getAppStudioFilePath, getAppStudioFileSource),
        fs.writeFile(path.join(outputFolder, 'index.js'), binaryEntryPointSource),
      ])

      const integrityCheckSource = getIntegrityCheckSource(outputFolder)

      await fs.writeFile(path.join(outputFolder, 'index.js'), binaryByteNodeEntryPointSource)

      await Promise.all([
        validateEncryptionFile(encryptionFilePath),
        validateCloudEnvironmentFile(cloudEnvironmentFilePath),
        validateProtocolFile(cloudApiFilePath),
        validateProtocolFile(cloudProtocolFilePath),
        validateStudioFile(projectBaseFilePath),
        validateStudioFile(getAppStudioFilePath),
      ])

      await flipFuses(
        exePathPerPlatform[os.platform()],
        {
          version: FuseVersion.V1,
          resetAdHocDarwinSignature: os.platform() === 'darwin' && os.arch() === 'arm64',
          [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: true,
          [FuseV1Options.EnableNodeCliInspectArguments]: false,
        },
      )

      process.env.V8_UPDATE_METAFILE = '1'

      // Build out the entry point and clean up prior to setting up v8 snapshots so that the state of the binary is correct
      await buildEntryPointAndCleanup(outputFolder)
      await cleanupUnneededDependencies(outputFolder)
      await setupV8Snapshots({
        cypressAppPath: params.appOutDir,
        integrityCheckSource,
      })

      // Use Cypress to create the JSC entry point file
      await createJscFromCypress()

      const indexJscHash = await getIndexJscHash(outputFolder)

      // This file is not needed at this point since it's been replaced by the jsc. So we remove it.
      await fs.remove(path.join(outputFolder, 'packages/server/index.js'))
      await fs.writeFile(path.join(outputFolder, 'index.js'), binaryEntryPointSource)

      await flipFuses(
        exePathPerPlatform[os.platform()],
        {
          version: FuseVersion.V1,
          [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: true,
          [FuseV1Options.EnableNodeCliInspectArguments]: false,
        },
      )

      // Regenerate the v8 snapshots. This time, we replace the JSC hash with what we calculated earlier. We use the existing snapshot script to avoid having to go through the entire v8 snapshot process
      await setupV8Snapshots({
        cypressAppPath: params.appOutDir,
        useExistingSnapshotScript: true,
        updateSnapshotScriptContents: (contents) => {
          return contents.replace(DUMMY_INDEX_JSC_HASH, indexJscHash)
        },
      })
    } else {
      console.log(`value of DISABLE_SNAPSHOT_REQUIRE was ${process.env.DISABLE_SNAPSHOT_REQUIRE}. Skipping snapshot require...`)
      await cleanupUnneededDependencies(outputFolder)
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}
