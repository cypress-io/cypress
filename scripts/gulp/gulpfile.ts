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
import { startCypress, startCypressWatch, startCypressForTest, runCypressAgainstDist } from './tasks/gulpCypress'
import { graphqlCodegen, graphqlCodegenWatch, nexusCodegen, nexusCodegenWatch, generateFrontendSchema, syncRemoteGraphQL } from './tasks/gulpGraphql'
import { viteApp, viteBuildApp, viteBuildLaunchpad, viteWatchBuildLaunchpadForTest, viteBuildLaunchpadForTest, viteServeLaunchpadForTest, viteCleanApp, viteCleanLaunchpad, viteLaunchpad } from './tasks/gulpVite'
import { checkTs } from './tasks/gulpTsc'
import { makePathMap } from './utils/makePathMap'
// import { setGulpGlobal } from './gulpConstants'
import { makePackage } from './tasks/gulpMakePackage'

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

/**------------------------------------------------------------------------
 *                            Static Builds
 *  Tasks that aren't watched. Usually composed together with other tasks.
 *------------------------------------------------------------------------**/

gulp.task('buildProd', gulp.series(
  syncRemoteGraphQL,
  gulp.parallel(
    viteCleanApp,
    viteCleanLaunchpad,
  ),

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

gulp.task('cypressRunLaunchpad', gulp.series(
  // 1. Build the Cypress App itself
  'buildProd',

  // 2. Build the Launchpad under test.
  viteBuildLaunchpadForTest,

  // 3. Host the Launchpad on a static server for cy.visit.
  gulp.parallel(viteServeLaunchpadForTest),

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

// Open Cypress in production mode.
// Rebuild the Launchpad app between changes.
gulp.task('cypressOpenLaunchpad', gulp.series(
  // 1. Build the Cypress App itself
  'buildProd',

  // 2. Build + watch Launchpad under test.
  //    This watches for changes and is not the same things as statically
  //    building the app for production.
  viteWatchBuildLaunchpadForTest,

  // 3. Host the Launchpad on a static server for cy.visit.
  gulp.parallel(viteServeLaunchpadForTest),

  // 4. Start the TEST Cypress App, such that its ports and other globals
  //    don't conflict with the real Cypress App.
  startCypressForTest,

  // 5. Start the REAL Cypress App, which will launch in open mode.
  async () => {
    process.argv.push('--project', monorepoPaths.pkgLaunchpad)
    process.env.CYPRESS_INTERNAL_ENV = 'production'

    return await startCypress()
  },
))

/**------------------------------------------------------------------------
 *                             Graphql Workflow
 * Graphql tasks that are generally composed and not run on their own
 * during development.
 *------------------------------------------------------------------------**/

gulp.task(makePackage)
gulp.task(checkTs)
gulp.task(syncRemoteGraphQL)
gulp.task(generateFrontendSchema)
gulp.task(makePathMap)
gulp.task(nexusCodegen)
gulp.task(nexusCodegenWatch)
gulp.task(graphqlCodegen)
gulp.task(graphqlCodegenWatch)
