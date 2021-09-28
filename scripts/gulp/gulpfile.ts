import gulp from 'gulp'
import { autobarrelWatcher } from './tasks/gulpAutobarrel'
import { startCypressWatch } from './tasks/gulpCypress'
import { graphqlCodegen, graphqlCodegenWatch, nexusCodegen, nexusCodegenWatch, generateFrontendSchema, syncRemoteGraphQL } from './tasks/gulpGraphql'
import { checkTs } from './tasks/gulpTsc'
import { viteApp, viteCleanApp, viteCleanLaunchpad, viteLaunchpad } from './tasks/gulpVite'
import { makePathMap } from './utils/makePathMap'
import { setGulpGlobal } from './gulpConstants'
import { makePackage } from './tasks/gulpMakePackage'

gulp.task(
  'codegen',
  gulp.series(
    // Autobarrel watcher
    autobarrelWatcher,

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

    gulp.parallel(
      // Clean the vite apps
      viteCleanApp,
      viteCleanLaunchpad,
    ),

    // Now that we have the codegen, we can start the frontend(s)
    gulp.parallel(
      viteApp,
      viteLaunchpad,
    ),

    // And we're finally ready for electron, watching for changes in /graphql to auto-restart the server
    startCypressWatch,
  ),
)

gulp.task(
  'devNoWatch',
  gulp.series(
    async function setupDevNoWatch () {
      setGulpGlobal('shouldWatch', false)
    },
    'dev',
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

gulp.task('buildProd', gulp.series(
  syncRemoteGraphQL,
  nexusCodegen,
  graphqlCodegen,
))

gulp.task(
  'postinstall',
  gulp.series(
    gulp.parallel(
      // Clean the vite apps
      viteCleanApp,
      viteCleanLaunchpad,
    ),
    'buildProd',
  ),
)

// gulp.task(
//   'devLegacy', // Tim: TODO
// )

// gulp.task(
//   'debug', // Tim: TODO
// )

gulp.task(makePackage)
gulp.task(checkTs)
gulp.task(syncRemoteGraphQL)
gulp.task(generateFrontendSchema)
gulp.task(makePathMap)
gulp.task(nexusCodegen)
gulp.task(nexusCodegenWatch)
gulp.task(graphqlCodegen)
gulp.task(graphqlCodegenWatch)
