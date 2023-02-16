// Importing global styles fails with Next.js due to restrictions on style imports.
// We modify the Next Webpack config to allow importing global styles.
import '../../styles/globals.css'
import '../../styles/Home.module.css'
