const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const chalk = require('chalk')
const Promise = require('bluebird')
const Debug = require('debug')

const debug = Debug('cypress:scripts:util:transform-requires')

const transformRequires = async function (buildResourcePath) {
  const buildRoot = buildResourcePath

  const globPattern = `${buildRoot}/packages/**/*.js`

  debug({ globPattern })

  const globAsync = await Promise.promisify(glob)

  await globAsync(globPattern, { ignore: ['**/node_modules/**', '**/packages/**/dist/**'] })
  .map(async (item) => {
    debug('glob found:', item)
    const buff = await fs.readFile(item)

    const fileStr = buff.toString()
    const requireRE = /(require\(["'])@packages\/(\w+)/g

    let shouldWriteFile = false

    // const matches = requireRE.exec(fileStr)
    const newFile = fileStr.replace(requireRE, (...match) => {
      console.log()
      debug(match.slice(0, -1))
      const pkg = match[2]

      const pkgPath = path.join(buildRoot, `packages/${pkg}`)
      const replaceWith = path.relative(path.dirname(item), pkgPath)

      console.log('resolve:', chalk.grey(pkgPath), '\nfrom:', chalk.grey(item))
      console.log(chalk.yellow(`@packages/${pkg}`), '->', chalk.green(replaceWith))

      const replaceString = `${match[1]}${replaceWith}`

      debug(replaceString)

      shouldWriteFile = true

      return replaceString

    })

    if (shouldWriteFile) {
      debug('writing to file:', chalk.red(item))
      await fs.writeFile(item, newFile)

    }

  })
}

module.exports = { transformRequires }
