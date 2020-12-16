const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk').default
const Promise = require('bluebird')
const debug = require('debug')('cypress:scripts:util:transform-requires')
const { getLocalPublicPackages } = require('./packages')
const externalUtils = require('./3rd-party')

const transformRequires = async function (buildResourcePath) {
  const buildRoot = buildResourcePath

  const localPublicPackages = await getLocalPublicPackages(buildRoot)

  const globs = [
    `${buildRoot}/packages/**/*.js`,
    `${buildRoot}/npm/**/*.js`,
  ]

  debug({ localPublicPackages })
  debug({ globs })

  let replaceCount = 0

  // Statically transform all requires of @packages/* to direct relative paths
  // e.g. @packages/server/lib -> ../../../server/lib
  // This prevents us having to ship symlinks in the final binary, because some OS's (Windows)
  // do not have relative symlinks/junctions or bad symlink support
  await Promise.resolve(externalUtils.globby(globs, { ignore: ['**/node_modules/**', '**/packages/**/dist/**'] }))
  .map(async (item) => {
    debug('glob found:', item)
    const buff = await fs.readFile(item)

    let fileStr = buff.toString()

    let shouldWriteFile = false

    const replace = function (requireRE, pathPrefix, pkgPrefix = pathPrefix) {
      debug(requireRE)

      fileStr = fileStr.replace(requireRE, (...match) => {
        debug(match.slice(0, -1))
        const pkg = match[2]

        const pkgPath = path.join(buildRoot, `${pathPrefix}/${pkg}`)
        const replaceWith = path.relative(path.dirname(item), pkgPath).replace(/\\/g, '/')

        // eslint-disable-next-line no-console
        console.log()
        // eslint-disable-next-line no-console
        console.log('resolve:', chalk.grey(pkgPath), '\nfrom:', chalk.grey(item))
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(`@${pkgPrefix}/${pkg}`), '->', chalk.green(replaceWith))

        const replaceString = `${match[1]}${replaceWith}`

        debug(replaceString)

        replaceCount++
        shouldWriteFile = true

        return replaceString
      })
    }

    replace(
      /(require\(["'])@packages\/(\w+)/g,
      'packages',
    )

    for (const pkg of localPublicPackages) {
      replace(
        new RegExp(`(require\\(["'])@cypress\/(${pkg})`, 'g'),
        'npm',
        'cypress',
      )
    }

    if (shouldWriteFile) {
      debug('writing to file:', chalk.red(item))
      await fs.writeFile(item, fileStr)
    }
  })

  return replaceCount
}

module.exports = { transformRequires }
