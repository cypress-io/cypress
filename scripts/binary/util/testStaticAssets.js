const la = require('lazy-ass')
const fs = require('fs-extra')
const _ = require('lodash')
const glob = require('glob')
const chalk = require('chalk').default
const Promise = require('bluebird')
const { stripIndent } = require('common-tags')

const globAsync = Promise.promisify(glob)

const testStaticAssets = async (buildResourcePath) => {
  await Promise.all([
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/runner/dist/*.js`,
      badStrings: ['webpack-livereload-plugin'],
      minLineCount: 5000,
    }),

    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/desktop-gui/dist/index.html`,
      goodStrings: ['window.env = \'development\''],
    }),
  ])
}

const testPackageStaticAssets = async (options = {}) => {
  la(options.assetGlob, 'missing resourcePath')
  const opts = _.defaults(options, {
    assetGlob: '',
    goodStrings: [],
    badStrings: [],
    minLineCount: 0,
  })

  const foundAssets = await globAsync(opts.assetGlob)
  .map(async (path) => {
    const fileStr = (await fs.readFile(path)).toString()

    opts.goodStrings.forEach((str) => {
      la(fileStr.includes(str), stripIndent`
        Error in ${path}: expected to find string ${chalk.bold(str)}
      `)
    })
    opts.badStrings.forEach((str) => {
      la(!fileStr.includes(str), stripIndent`
        Error in ${path}: expected ${chalk.bold('not')} to find string ${chalk.bold(str)}
      `)
    })

    if (opts.minLineCount) {
      const lineCount = (fileStr.match(/\n/g) || '').length + 1

      la(lineCount > opts.minLineCount, stripIndent`
      Error in ${chalk.red(path)}: Detected this file was minified, having fewer than ${opts.minLineCount} lines of code.
      Minified code takes longer to inspect in browser Devtools, so we should leave it un-minified.
      `)
    }

    return path
  })

  la(!!foundAssets.length, stripIndent`
  expected assets to be found in ${chalk.green(opts.assetGlob)}
  `)

}

module.exports = {
  testStaticAssets,
}
