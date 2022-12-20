const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const chalk = require('chalk').default
const Promise = require('bluebird')
const Debug = require('debug')

const debug = Debug('cypress:scripts:util:transform-requires')

const requireRE = /(require\(["'`])@packages\/(.+?)([\/"'`])/g
const globAsync = Promise.promisify(glob)

const rewritePackageNames = (fileStr, buildRoot, filePath, onFound) => {
  // const matches = requireRE.exec(fileStr)
  return fileStr.replace(requireRE, (...match) => {
    debug(match.slice(0, -1))
    const pkg = match[2]
    const afterPkg = match[3]

    const pkgPath = path.join(buildRoot, `packages/${pkg}`)
    const replaceWith = path.relative(path.dirname(filePath), pkgPath).replace(/\\/g, '/')

    const replaceString = `${match[1]}${replaceWith}${afterPkg}`

    console.log()
    console.log('resolve:', chalk.grey(pkgPath), '\nfrom:', chalk.grey(filePath))
    console.log(chalk.yellow(`@packages/${pkg}`), '->', chalk.green(replaceWith))

    onFound && onFound(replaceString)

    return replaceString
  })
}

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
  .map(async (filePath) => {
    debug('glob found:', filePath)
    const buff = await fs.readFile(filePath)

    const fileStr = buff.toString()

    let shouldWriteFile = false

    const newFile = rewritePackageNames(fileStr, buildRoot, filePath, (replaceString) => {
      debug(replaceString)

      replaceCount++
      shouldWriteFile = true
    })

    if (shouldWriteFile) {
      debug('writing to file:', chalk.red(filePath))

      await fs.writeFile(filePath, newFile)
    }
  })

  return replaceCount
}

module.exports = {
  transformRequires,

  rewritePackageNames,
}
