/**
 * More information about our build process lives inside of the
 * CONTRIBUTING.md
 *
 * @summary Build pipeline for all new commands
 * @docs https://gulpjs.com
 * @usage `yarn gulp myTaskName` from the workspace root directory
 */

import gulp from 'gulp'
import { monorepoPaths } from './monorepoPaths'
import { autobarrelWatcher } from './tasks/gulpAutobarrel'
import { startCypressWatch, startCypressForTest, runCypressAgainstDist, openCypressLaunchpad } from './tasks/gulpCypress'
import { graphqlCodegen, graphqlCodegenWatch, nexusCodegen, nexusCodegenWatch, generateFrontendSchema, syncRemoteGraphQL } from './tasks/gulpGraphql'
import { viteApp, viteBuildApp, viteBuildLaunchpad, viteBuildAndWatchLaunchpadForTest, viteBuildLaunchpadForTest, serveBuiltLaunchpadForTest, viteCleanApp, viteCleanLaunchpad, viteLaunchpad, serveBuiltAppForTest, viteBuildAppForTest, viteBuildAndWatchAppForTest } from './tasks/gulpVite'
import { checkTs } from './tasks/gulpTsc'
import { makePathMap } from './utils/makePathMap'
import { makePackage } from './tasks/gulpMakePackage'
import { setGulpGlobal } from './gulpConstants'

/**------------------------------------------------------------------------
 *                      Local Development Workflow
 *  * `yarn dev` is your primary command for getting work done
 *------------------------------------------------------------------------**/

gulp.task(
  'codegen',
  gulp.series(
    // Autobarrel watcher
    autobarrelWatcher,

    // Clean any vite assets
    gulp.parallel(
      viteCleanApp,
      viteCleanLaunchpad,
    ),
    // Codegen for our GraphQL Server so we have the latest schema to build
    // the frontend codegen correctly
    // Fetch the latest "remote" schema from the Cypress cloud
    syncRemoteGraphQL,

    // Codegen for our GraphQL Server so we have the latest schema to build the frontend codegen correctly
    nexusCodegenWatch,

    // ... and generate the correct GraphQL types for the frontend
    graphqlCodegenWatch,
  ),
)

gulp.task(
  'dev',
  gulp.series(
    'codegen',

    // Now that we have the codegen, we can start the frontend(s)
    gulp.parallel(
      viteApp,
      viteLaunchpad,
    ),

    // And we're finally ready for electron, watching for changes in
    // /graphql to auto-restart the server
    startCypressWatch,
  ),
)

gulp.task(
  'debug',
  gulp.series(
    async function setupDebug () {
      setGulpGlobal('debug', '--inspect')
    },
    'dev',
  ),
)

gulp.task(
  'debugBrk',
  gulp.series(
    async function setupDebugBrk () {
      setGulpGlobal('debug', '--inspect-brk')
    },
    'dev',
  ),
)

/**------------------------------------------------------------------------
 *                            Static Builds
 *  Tasks that aren't watched. Usually composed together with other tasks.
 *------------------------------------------------------------------------**/

gulp.task('buildProd',
  gulp.series(
    gulp.parallel(
      viteCleanApp,
      viteCleanLaunchpad,
    ),

    syncRemoteGraphQL,
    nexusCodegen,
    graphqlCodegen,

    // Build the frontend(s) for production.
    gulp.parallel(
      viteBuildApp,
      viteBuildLaunchpad,
    ),
  ))

gulp.task(
  'postinstall',
  gulp.series(
    'buildProd',
  ),
)

/**------------------------------------------------------------------------
 *                         Launchpad Testing
 * This task builds and hosts the launchpad as if it was a static website.
 * In production, this app would be served over the file:// protocol via
 * the Electron app. However, when e2e testing the launchpad, we'll want to
 * visit it using cy.visit within our integration suites.
 *
 * * cypressOpenLaunchpad is for local dev and watches.
 * * cypressRunLaunchpad is meant to be run in CI and does not watch.
 *------------------------------------------------------------------------**/

gulp.task('cyRunLaunchpadE2E', gulp.series(
  // 1. Build the Cypress App itself
  'buildProd',

  // 2. Build the Launchpad under test.
  viteBuildLaunchpadForTest,

  // 3. Host the Launchpad on a static server for cy.visit.
  serveBuiltLaunchpadForTest,

  // 4. Start the TEST Cypress App, such that its ports and other globals
  //    don't conflict with the real Cypress App.
  startCypressForTest,

  // 5. Start the REAL Cypress App, which will execute the integration specs.
  async function cypressRunReal () {
    process.argv.push('--project', monorepoPaths.pkgLaunchpad)
    // return runCypressAgainstDist()
    const child = await runCypressAgainstDist()

    child.on('exit', (code) => {
      console.log({ code })
    })

    child.on('error', (err) => {
      console.error({ err })
    })

    child.on('disconnect', () => {
      console.error('disconnect')
    })
  },
))

const cyOpenLaunchpad = gulp.series(
  // 2. Build + watch Launchpad under test.
  //    This watches for changes and is not the same things as statically
  //    building the app for production.
  viteBuildAndWatchLaunchpadForTest,

  // 4. Start the TEST Cypress App, such that its ports and other globals
  //    don't conflict with the real Cypress App.
  startCypressForTest,

  // 3. Host the Launchpad on a static server for cy.visit.
  serveBuiltLaunchpadForTest,

  // 5. Start the REAL (dev) Cypress App, which will launch in open mode.
  openCypressLaunchpad,
)

// Open Cypress in production mode.
// Rebuild the Launchpad app between changes.
gulp.task('cyOpenLaunchpadE2E', gulp.series(
  // 1. Build the Cypress App itself
  'buildProd',

  // 2. Open the launchpad app
  cyOpenLaunchpad,
))

/**------------------------------------------------------------------------
 *                             Utilities
 * checkTs: Runs `check-ts` in each of the packages & prints errors when
 *          all are completed
 *
 * makePackage: Scaffolds a new package in the packages/ directory
 *------------------------------------------------------------------------**/

gulp.task(checkTs)
gulp.task(makePackage)

/**------------------------------------------------------------------------
 *                             Internal / Test / Debug
 *
 * Tasks that are typically composed into other workflows, but are exposed
 * here for debugging, e.g. `yarn gulp syncRemoteGraphQL`
 *------------------------------------------------------------------------**/

gulp.task(syncRemoteGraphQL)
gulp.task(generateFrontendSchema)
gulp.task(makePathMap)
gulp.task(nexusCodegen)
gulp.task(nexusCodegenWatch)
gulp.task(graphqlCodegen)
gulp.task(graphqlCodegenWatch)
gulp.task(startCypressForTest)

gulp.task(viteCleanApp)
gulp.task(viteCleanLaunchpad)

gulp.task(viteBuildLaunchpadForTest)
gulp.task(viteBuildAppForTest)

gulp.task(serveBuiltAppForTest)
gulp.task(serveBuiltLaunchpadForTest)

gulp.task(viteBuildAndWatchLaunchpadForTest)
gulp.task(viteBuildAndWatchAppForTest)

gulp.task(viteBuildApp)
gulp.task(viteBuildLaunchpad)

gulp.task('debugCypressLaunchpad', gulp.series(
  async function setupDebugBrk () {
    setGulpGlobal('debug', '--inspect-brk')
  },
  openCypressLaunchpad,
))

gulp.task(openCypressLaunchpad)

// If we want to run individually, for debugging/testing
gulp.task('cyOpenLaunchpadOnly', cyOpenLaunchpad)
