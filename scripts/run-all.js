/* eslint-disable no-console */

const log = require('debug')('cypress:run')
const _ = require('lodash')
const path = require('path')
const AsciiTable = require('ascii-table')
const glob = require('glob')
const chalk = require('chalk')
const Promise = require('bluebird')
const runAll = require('@cypress/npm-run-all')
const through = require('through')
const fs = require('fs')
const prefixedList = require('prefixed-list')

const globAsync = Promise.promisify(glob)

const packageNameFromPath = (fullPath) => {
  return fullPath
  .replace(`${process.cwd()}${path.sep}`, '')
  .replace(`packages${path.sep}`, '')
}

const nonPackageDirs = ['cli/']

const getDirs = () => {
  const logDirs = (dirs) => {
    log('found packages\n%s', dirs.join('\n'))

    return dirs
  }

  return globAsync('packages/*/')
  .then(logDirs)
  .then((dirs) => {
    return dirs.concat(nonPackageDirs)
  })
  .map((dir) => {
    return path.join(process.cwd(), dir).replace(/\/$/, '')
  })
}

const packageNameInArray = (dir, packages) => {
  const packageName = packageNameFromPath(dir)

  return _.includes(packages, packageName)
}

const filterDirsByPackage = (dirs, filter) => {
  if (!filter) return dirs

  return dirs.filter((dir) => {
    return packageNameInArray(dir, filter)
  })
}

const rejectDirsByPackage = (dirs, rejected) => {
  if (!rejected) return dirs

  if (rejected && rejected.length) {
    return _.reject(dirs, (dir) => {
      return packageNameInArray(dir, rejected)
    })
  }
}

const filterDirsByCmd = (dirs, cmd) => {
  switch (cmd) {
    case 'install': case 'i': case 'prune':
      return dirs
    default:
      return dirs.filter((dir) => {
        const packageJson = require(path.resolve(dir, 'package'))

        return !!packageJson.scripts && !!packageJson.scripts[cmd]
      })
  }
}

const checkDirsLength = (dirs, errMessage) => {
  if (dirs.length) {
    return dirs
  }

  const err = new Error(errMessage)

  err.noPackages = true
  throw err
}

const mapTasks = (cmd, packages) => {
  const colors = 'green yellow blue magenta cyan white gray bgGreen bgBlue bgMagenta bgCyan bgYellow bgWhite'.split(' ')

  let runCommand

  switch (cmd) {
    case 'install':
    case 'i':
    case 'test':
    case 't':
    case 'prune':
      runCommand = cmd
      break
    default:
      runCommand = `run ${cmd}`
  }

  console.log('filtered packages:', prefixedList(packages))

  return packages.map((dir, index) => {
    const packageName = packageNameFromPath(dir)

    return {
      command: runCommand,
      options: {
        cwd: dir,
        label: {
          name: `${packageName.replace(/\/$/, '')}:${cmd}`,
          color: colors[index],
        },
      },
    }
  })
}

let stderrOutput = ''
const collectStderr = through(function (data) {
  stderrOutput += data.toString()

  return this.queue(data)
})

collectStderr.pipe(process.stderr)

const noPackagesError = (err) => {
  return err.noPackages
}
// only consider printing a list of errors
const resultsError = (err) => {
  return Array.isArray(err.results)
}
const failProcess = () => {
  return process.exit(1)
}

const printOtherErrors = (err) => {
  console.error(err.message)
  console.error('run with DEBUG=cypress:run ... to see more details')
  log(err.stack)
  throw err
}

function hasPackageJson (dir) {
  const packagePath = path.join(dir, 'package.json')

  return fs.existsSync(packagePath)
}

function keepDirsWithPackageJson (dirs) {
  return dirs.filter(hasPackageJson)
}

module.exports = (cmd, options) => {
  const packagesFilter = options.package || options.packages
  const packagesReject = options['skip-package'] || options['skip-packages']

  if (packagesFilter === 'none') return

  return getDirs()
  .then(keepDirsWithPackageJson)
  .then((dirs) => {
    return filterDirsByPackage(dirs, packagesFilter)
  })
  .then((dirs) => {
    return rejectDirsByPackage(dirs, packagesReject)
  })
  .then((dirs) => {
    return checkDirsLength(dirs, `No packages were found with the filter '${packagesFilter}'`)
  })
  .then((dirs) => {
    return filterDirsByCmd(dirs, cmd)
  })
  .then((dirs) => {
    let errMessage = `No packages were found with the task '${cmd}'`

    if (packagesFilter) {
      errMessage += ` and the filter '${packagesFilter}'`
    }

    return checkDirsLength(dirs, errMessage)
  })
  .then((dirs) => {
    return mapTasks(cmd, dirs)
  })
  .then((tasks) => {
    const runSerially = Boolean(options.serial)

    if (runSerially) {
      console.log('⚠️ running jobs serially')
    }

    const parallel = !runSerially

    return runAll(tasks, {
      parallel,
      printLabel: tasks.length > 1,
      stdout: process.stdout,
      stderr: collectStderr,
    })
  })
  .then(() => {
    console.log(chalk.green('\nAll tasks completed successfully'))
  })
  // using Bluebird filtered catch
  // http://bluebirdjs.com/docs/api/catch.html#filtered-catch
  .catch(noPackagesError, (err) => {
    console.error(chalk.red(`\n${err.message}`))

    return failProcess()
  })
  .catch(resultsError, (err) => {
    const results = AsciiTable.factory({
      heading: ['package', 'exit code'],
      rows: err.results.map((result) => {
        return [result.name.replace(`:${cmd}`, ''), result.code]
      }),
    }).toString()

    console.error(chalk.red(`\nOne or more tasks failed running 'npm run all ${cmd}'.`))
    console.error('\nResults:\n')
    console.error(results)

    console.error('\nstderr:\n')
    console.error(stderrOutput)

    return failProcess()
  })
  .catch(printOtherErrors)
  .catch(failProcess)
}
