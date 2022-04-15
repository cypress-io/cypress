require('@packages/ts/register')
const path = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const Fixtures = require('../lib/fixtures')
const { scaffoldProjectNodeModules } = require('../lib/dep-installer')

const logTag = '[update-cache.js]'
const log = (...args) => console.log(logTag, ...args)

;(async () => {
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
    const timeTag = `${logTag} ${project} node_modules install`

    console.time(timeTag)
    log('Scaffolding node_modules for', project)

    Fixtures.scaffoldProject(project)
    await scaffoldProjectNodeModules(project)
    console.timeEnd(timeTag)
  }

  log('Updated node_modules for', packageJsons.length, 'projects.')
})()
