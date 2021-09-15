import gulp from 'gulp'
import { autobarrelWatcher } from './tasks/gulpAutobarrel'
import { startElectronWatch } from './tasks/gulpElectron'
import { graphqlCodegen, graphqlCodegenWatch, nexusCodegen, nexusCodegenWatch } from './tasks/gulpGraphql'
import { viteApp, viteCleanApp, viteCleanLaunchpad, viteLaunchpad } from './tasks/gulpVite'
import { makePathMap } from './utils/makePathMap'

gulp.task(
  'dev',
  gulp.series(
    // Autobarrel watcher
    autobarrelWatcher,

    // Fetch the latest "remote" schema from the Cypress cloud
    // TODO: with stitching bracnh
    // fetchCloudSchema,

    gulp.parallel(
      // Clean the vite apps
      viteCleanApp,
      viteCleanLaunchpad,
    ),
    // Codegen for our GraphQL Server so we have the latest schema to build the frontend codegen correctly
    nexusCodegenWatch,

    // ... and generate the correct GraphQL types for the frontend
    graphqlCodegenWatch,

    // Now that we have the codegen, we can start the frontend(s)
    gulp.parallel(
      viteApp,
      viteLaunchpad,
    ),

    // And we're finally ready for electron, watching for changes in /graphql to auto-restart the server
    startElectronWatch,
  ),
)

gulp.task(
  'postinstall',
  gulp.series(
    gulp.parallel(
      // Clean the vite apps
      viteCleanApp,
      viteCleanLaunchpad,
    ),
    nexusCodegen,
    graphqlCodegen,
  ),
)

// gulp.task(
//   'devLegacy', // Tim: TODO
// )

// gulp.task(
//   'debug', // Tim: TODO
// )

gulp.task(makePathMap)
gulp.task(nexusCodegen)
gulp.task(nexusCodegenWatch)
gulp.task(graphqlCodegen)
gulp.task(graphqlCodegenWatch)
