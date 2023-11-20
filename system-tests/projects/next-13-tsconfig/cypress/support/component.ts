// Importing global styles fails with Next.js due to restrictions on style imports.
// We modify the Next Webpack config to allow importing global styles.
// We are not using a relative path here because baseUrl is configured in tsconfig.json
import 'globals.css'
import 'Home.module.css'
