require('@packages/ts/register')
const path = require('path')
const fs = require('fs-extra')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const Fixtures = require('../lib/fixtures')
const { scaffoldProjectNodeModules } = require('../lib/dep-installer')
const { isWorkspacePackage } = require('../lib/is-workspace-package')

const logTag = '[update-cache.js]'
const log = (...args) => console.log(logTag, ...args)

async function main () {
  /**
   * For all system test projects that have a package.json, check and update
   * the node_modules cache using `yarn`.
   */
  Fixtures.remove()

  const projectsDir = path.join(__dirname, '../projects')
  const packageJsons = await glob('**/package.json', {
    cwd: projectsDir,
  })

  log('Found', packageJsons.length, '`package.json` files in `projects`:', packageJsons)

  for (const packageJsonPath of packageJsons) {
    const project = path.dirname(packageJsonPath)
    const projectDir = path.join(projectsDir, project)

    if (project.includes('yarn-v4.3.1-pnp-dep-resolution')) {
      log('found project yarn-v4.3.1-pnp-dep-resolution, skipping dependency install as this requires corepack for yarn 4')
      log('this project is an exception and tested inside a docker container with corepack and yarn 4 installed against the built cypress binary')
      continue
    }

    // Skip workspace packages - if there's a lockfile in a parent directory, this is a workspace package
    // and should be handled by the workspace root, not processed individually
    if (await isWorkspacePackage(projectDir, projectsDir)) {
      log(`found workspace package ${project}, skipping as it will be handled by workspace root`)
      continue
    }

    // Skip bun projects during cache update as bun is not installed in CI
    // Bun projects will be installed at test runtime when needed
    const hasBunLock = await fs.stat(path.join(projectDir, 'bun.lock')).catch(() => false)
    const hasBunLockb = await fs.stat(path.join(projectDir, 'bun.lockb')).catch(() => false)

    if (hasBunLock || hasBunLockb) {
      log(`found project ${project} with a Bun lockfile (bun.lock / bun.lockb), skipping dependency install as bun is not available in CI cache step`)
      log('bun projects will be installed at test runtime when needed')
      continue
    }

    const timeTag = `${logTag} ${project} node_modules install`

    console.time(timeTag)
    log('Scaffolding node_modules for', project)

    await Fixtures.scaffoldProject(project)
    await scaffoldProjectNodeModules({ project })
    console.timeEnd(timeTag)
  }

  log('Updated node_modules for', packageJsons.length, 'projects.')
}

if (require.main === module) {
  main()
}
