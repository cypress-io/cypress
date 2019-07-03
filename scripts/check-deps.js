/* eslint-disable no-console */

const chalk = require('chalk')
const check = require('check-dependencies')
const fs = require('fs')
const path = require('path')
const stripAnsi = require('strip-ansi')

if (process.env.NO_CHECK_DEPS) {
  process.exit(0)
}

const args = require('minimist')(process.argv.slice(2))
const cwd = args.cwd || process.cwd()

const isDirectory = (source) => {
  return fs.lstatSync(source).isDirectory()
}

const getDirectories = (source) => {
  return fs.readdirSync(source)
  .map((name) => {
    return path.join(source, name)
  })
  .filter(isDirectory)
}

const isCypressRepo = () => {
  if (path.basename(cwd) !== 'cypress') return false

  const directories = getDirectories(cwd).map((fullPath) => {
    return path.basename(fullPath)
  })

  return (
    directories.includes('packages') &&
    directories.includes('cli')
  )
}

const invokeNpmInstallRegex = /Invoke.*packages/

const logErrors = (errors) => {
  if (!args.verbose || !errors.length) return

  errors
  .filter((error) => {
    return !invokeNpmInstallRegex.test(error)
  })
  .forEach((error) => {
    console.log(error)
  })
  console.log()
}

const logInBox = (boxColor, message) => {
  if (!args.verbose) return

  const messageLength = stripAnsi(message).length

  console.log(` ${boxColor('-'.repeat(messageLength + 2))}`)
  console.log(boxColor('|'), message, boxColor('|'))
  console.log(` ${boxColor('-'.repeat(messageLength + 2))}`)
  console.log()
}

const preamble = 'This script failed to run because certain dependencies are missing or outdated'
const epilogue = `Run ${chalk.green('npm install')} to install/update the missing/outdated dependencies`

if (!isCypressRepo()) {
  const result = check.sync()

  if (args.prescript && result.error.length) {
    logInBox(chalk.red, chalk.yellow(preamble))
  }

  logErrors(result.error)

  if (result.status) {
    logInBox(chalk.yellow, epilogue)
  } else if (!args.prescript) {
    logInBox(chalk.green, 'Deps are all good!')
  }

  process.exit(result.status)
}

// the following only applies to checking deps for the root + cli + packages

const logErrorsForResult = (result) => {
  if (!args.verbose || !result.error.length) return

  console.log(chalk.blue(result.name))
  console.log(chalk.blue('-'.repeat(result.name.length)))
  logErrors(result.error)
}

const logResults = (results) => {
  if (!args.verbose) return

  results.forEach((result) => {
    logErrorsForResult(result)
  })
}

const getPackages = () => {
  return getDirectories(path.join(cwd, 'packages')).map((dir) => {
    return {
      path: dir,
      name: `packages/${path.basename(dir)}`,
    }
  })
}

const getResults = () => {
  const packages = [
    { path: cwd, name: 'root' },
    { path: path.join(cwd, 'cli'), name: 'cli' },
  ].concat(getPackages())

  return packages.map((package) => {
    return Object.assign(check.sync({ packageDir: package.path }) || {}, {
      name: package.name,
    })
  })
  .filter(({ error }) => {
    return !!error.length
  })
}

const getResultsList = (results) => {
  if (!results.length) return 'none'

  return results.map(({ name }) => {
    return path.basename(name)
  }).join(',')
}

const results = getResults()

if (args.prescript && results.length) {
  logInBox(chalk.red, chalk.yellow(`${preamble} in one or more packages`))
}

logResults(results)
if (results.length) {
  logInBox(chalk.yellow, `${epilogue} in the above package(s)`)
}

if (args.list) {
  process.stdout.write(getResultsList(results))
} else {
  const allGood = results.every(({ depsWereOk }) => {
    return depsWereOk
  })

  if (allGood && !args.prescript) {
    logInBox(chalk.green, 'Deps are all good!')
  }

  process.exit(allGood ? 0 : 1)
}
