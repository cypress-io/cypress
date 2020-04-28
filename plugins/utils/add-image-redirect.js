// @ts-check
const debug = require('debug')('cypress-react-unit-test')

/**
 * Note: modifies the input options object
 */
function addImageRedirect(webpackOptions) {
  if (!webpackOptions.module) {
    debug('webpack options has no "module"')
    return
  }

  if (!Array.isArray(webpackOptions.module.rules)) {
    debug('webpack module rules is not an array')
    return
  }

  // we need to handle static images and redirect them to
  // the existing files. Cypress has fallthrough static server
  // for anything like "/_root/<path>" which is perfect - because
  // importing a static image gives us that <path>!
  // insert our loader first before any built-in loaders kick in
  const loaderRules = webpackOptions.module.rules.find(rule =>
    Array.isArray(rule.oneOf),
  )

  const imageRedirectLoaderRule = {
    test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
    loader: require.resolve('./redirect-resource'),
  }

  if (loaderRules) {
    debug('found oneOf rule %o', loaderRules.oneOf)
    debug('adding our static image loader')
    loaderRules.oneOf.unshift(imageRedirectLoaderRule)
  } else {
    debug('could not find oneOf rules, inserting directly into rules')
    webpackOptions.module.rules.unshift(imageRedirectLoaderRule)
  }
}

module.exports = { addImageRedirect }
