/* global hexo */

// only run the filter_cleanup if we are in
// production mode -- deploying static asset
if (process.env.NODE_ENV !== "production") {
  hexo.config.filter_cleanup = false
}
