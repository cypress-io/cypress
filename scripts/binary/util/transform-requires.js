const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const chalk = require('chalk').default
const Promise = require('bluebird')
const Debug = require('debug')

const debug = Debug('cypress:scripts:util:transform-requires')

const globAsync = Promise.promisify(glob)

const transformRequires = async function (buildResourcePath) {
  const buildRoot = buildResourcePath

  const globPattern = `${buildRoot}/packages/**/*.js`

  debug({ globPattern })

  let replaceCount = 0

  // Statically transform all requires of @packages/* to direct relative paths
  // e.g. @packages/server/lib -> ../../../server/lib
  // This prevents us having to ship symlinks in the final binary, because some OS's (Windows)
  // do not have relative symlinks/junctions or bad symlink support
  await globAsync(globPattern, { ignore: ['**/node_modules/**', '**/packages/**/dist/**'] })
  .map(async (item) => {
    debug('glob found:', item)
    const buff = await fs.readFile(item)

    const fileStr = buff.toString()
    const requireRE = /(require\(["'])@packages\/(\w+)/g

    let shouldWriteFile = false

    // const matches = requireRE.exec(fileStr)
    const newFile = fileStr.replace(requireRE, (...match) => {
      debug(match.slice(0, -1))
      const pkg = match[2]

      const pkgPath = path.join(buildRoot, `packages/${pkg}`)
      const replaceWith = path.relative(path.dirname(item), pkgPath).replace(/\\/g, '/')

      // eslint-disable-next-line no-console
      console.log()
      // eslint-disable-next-line no-console
      console.log('resolve:', chalk.grey(pkgPath), '\nfrom:', chalk.grey(item))
      // eslint-disable-next-line no-console
      console.log(chalk.yellow(`@packages/${pkg}`), '->', chalk.green(replaceWith))

      const replaceString = `${match[1]}${replaceWith}`

      debug(replaceString)

      replaceCount++
      shouldWriteFile = true

      return replaceString
    })

    if (shouldWriteFile) {
      debug('writing to file:', chalk.red(item))
      await fs.writeFile(item, newFile)
    }
  })

  return replaceCount
}

module.exports = { transformRequires }
