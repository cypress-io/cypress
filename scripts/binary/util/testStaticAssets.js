/* eslint-disable arrow-body-style */

const la = require('lazy-ass')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const glob = require('glob')
const chalk = require('chalk').default
const Promise = require('bluebird')
const { stripIndent } = require('common-tags')

const globAsync = Promise.promisify(glob)

// The binary redistributes GPL/LGPL ffmpeg and ffprobe builds, and on macOS also Electron's
// own notices, so those files have to be present in every built app. Assert they are, so a
// change to the packaging step cannot silently ship a binary with the notices stripped.
const testLicenseFiles = async (buildResourcePath) => {
  const requiredFiles = [
    'LICENSE',
    'licenses/THIRD-PARTY-NOTICES.txt',
    'licenses/GPL-3.0.txt',
    'licenses/LGPL-2.1.txt',
  ]

  requiredFiles.forEach((file) => {
    const filePath = path.join(buildResourcePath, file)

    la(fs.existsSync(filePath), `Expected license file to be bundled in the binary: ${filePath}`)
  })
}

const testStaticAssets = async (buildResourcePath) => {
  await testLicenseFiles(buildResourcePath)

  await Promise.all([
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/runner/dist/cypress_runner.js`,
      badStrings: [
        // should only exist during development
        'webpack-livereload-plugin',
        // indicates eval source maps were included, which cause cross-origin errors
        '//# sourceURL=cypress://',
        // make sure webpack is not run with NODE_ENV=development
        'react.development.js',
      ],
      goodStrings: [
        // make sure webpack is run with NODE_ENV=production
        'react.production.min.js',
      ],
      testAssetStrings: [
        [
          (str) => !str.split('\n').slice(-1)[0].includes('//# sourceMappingURL'),
          'sourcemaps were detected, ensure `web-config/webpack.base.config.ts` does not have sourcemaps enabled in production',
        ],
      ],
      minLineCount: 5000,
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/runner/dist/injection.js`,
      goodStrings: [
        'action("app:window:before:load",window)',
      ],
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/runner/dist/*.css`,
      goodStrings: [
        // indicates css autoprefixer is correctly appending vendor prefixes (e.g -moz-touch)
        ['-ms-', 20],
      ],
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/socket/node_modules/socket.io-parser/build/cjs/binary.js`,
      badStrings: [
        'pack.data = _deconstructPacket(packetData, buffers);',
      ],
      goodStrings: [
        'pack.data = _deconstructPacket(packetData, buffers, [], new WeakMap());',
      ],
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/socket/node_modules/engine.io-parser/build/cjs/encodePacket.browser.js`,
      badStrings: [
        '(data instanceof ArrayBuffer || isView(data))',
      ],
      goodStrings: [
        'This extra check is made because the "instanceof ArrayBuffer" check does not work',
        '(data instanceof ArrayBuffer || isArrayBuffer(data) || isView(data))',
      ],
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/server/node_modules/geckodriver/dist/install.js`,
      badStrings: [
        'await download()',
      ],
      goodStrings: [
        'download()',
      ],
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/server/node_modules/edgedriver/dist/install.js`,
      badStrings: [
        'await download()',
      ],
      goodStrings: [
        'download()',
      ],
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/server/node_modules/@wdio/protocols/build/index.js`,
      badStrings: [
        'name: "addon"',
        'description: "base64 string of the add on file"',
      ],
      goodStrings: [
        'name: "path"',
        'description: "path to the extension"',
      ],
    }),
    testPackageStaticAssets({
      assetGlob: `${buildResourcePath}/packages/server/node_modules/@wdio/utils/build/node.js`,
      badStrings: [],
      goodStrings: [
        `log.setLevel(debugModule.enabled('cypress-verbose:server:browsers:webdriver') ? 'info' : 'silent')`,
        `log2.setLevel(debugModule.enabled('cypress-verbose:server:browsers:webdriver') ? 'info' : 'silent')`,
      ],
    }),
  ])
}

const testPackageStaticAssets = async (options = {}) => {
  la(options.assetGlob, 'missing resourcePath')
  const opts = _.defaults(options, {
    assetGlob: '',
    goodStrings: [],
    badStrings: [],
    testAssetStrings: [],
    minLineCount: 0,
  })

  const foundAssets = await globAsync(opts.assetGlob)
  .map(async (path) => {
    const fileStr = (await fs.readFile(path)).toString()

    opts.goodStrings.forEach((str) => {
      const [passed, count, atLeast] = includesString(fileStr, str)

      la(passed, stripIndent`
      Error in ${path}: expected to find at least ${atLeast} strings of ${chalk.bold(str)}
      contained: ${count}
    `)
    })

    opts.badStrings.forEach((str) => {
      const [passed, count, atLeast] = includesString(fileStr, str)

      la(!passed, stripIndent`
        Error in ${path}: expected ${chalk.bold('not')} to find more than ${atLeast - 1} strings of ${chalk.bold(str)}
        contained: ${count}
      `)
    })

    opts.testAssetStrings.forEach(([testFn, errorMsg]) => {
      la(testFn(fileStr), `Error in ${path}: ${errorMsg}`)
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
  testLicenseFiles,
  testPackageStaticAssets,
}

function includesCount (string, subString) {
  string += ''
  subString += ''
  if (subString.length <= 0) return (string.length + 1)

  let n = 0
  let pos = 0
  let step = subString.length

  // eslint-disable-next-line
  while (true) {
    pos = string.indexOf(subString, pos)
    if (pos >= 0) {
      ++n
      pos += step
    } else {
      break
    }
  }

  return n
}

const includesString = (fileStr, options) => {
  const opts = _.isArray(options) ? options : [options, 1]

  const [substr, atLeast] = opts

  const count = includesCount(fileStr, substr)

  const passed = count >= atLeast

  return [passed, count, atLeast]
}
