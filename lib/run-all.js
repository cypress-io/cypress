/* eslint-disable no-console */

const _ = require('lodash')
const path = require('path')
const AsciiTable = require('ascii-table')
const glob = require('glob')
const chalk = require('chalk')
const Promise = require('bluebird')
const runAll = require('@cypress/npm-run-all')
const through = require('through')

const globAsync = Promise.promisify(glob)

const setTerminalTitle = (title) => {
  process.stdout.write(
    `${String.fromCharCode(27)}]0${title}${String.fromCharCode(7)}`
  )
}

const packageNameFromPath = (fullPath) => {
  return fullPath.replace(`${path.resolve('packages')}/`, '')
}

const getDirs = () => {
  const packagesDir = path.resolve('packages', '*')
  return globAsync(packagesDir)
}

const filterDirsByPackage = (dirs, packages) => {
  if (!packages) return dirs

  return dirs.filter((dir) => {
    const packageName = packageNameFromPath(dir)
    return _.includes(packages, packageName)
  })
}

const filterDirsByCmd = (dirs, cmd) => {
  switch (cmd) {
    case 'install': case 'i':
      return dirs
    default:
      return dirs.filter((dir) => {
        const packageJson = require(path.resolve(dir, 'package'))
        return !!packageJson.scripts[cmd]
      })
  }
}

const checkDirsLength = (dirs, errMessage) => {
  if (dirs.length) { return dirs }

  const err = new Error(errMessage)
  err.noPackages = true
  throw err
}

const mapTasks = (cmd, packages) => {
  const colors = 'green yellow blue magenta cyan white gray bgGreen bgYellow bgBlue bgMagenta bgCyan bgWhite'.split(' ')

  let runCommand

  switch (cmd) {
    case 'install':
    case 'i':
    case 'test':
    case 't':
      runCommand = cmd
      break
    default:
      runCommand = `run ${cmd}`
  }

  return packages.map((dir, index) => {
    const packageName = packageNameFromPath(dir)
    return {
      command: runCommand,
      options: {
        cwd: dir,
        label: {
          name: `${packageName}:${cmd}`,
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

const noPackagesError = (err) => err.noPackages
const resultsError = (err) => !!err.results

module.exports = (cmd, options) => {
  setTerminalTitle(`run:all:${cmd}`)

  const packagesFilter = options.package || options.packages

  return getDirs()
  .then((dirs) => filterDirsByPackage(dirs, packagesFilter))
  .then((dirs) => checkDirsLength(dirs, `No packages were found with the filter '${packagesFilter}'`))
  .then((dirs) => filterDirsByCmd(dirs, cmd))
  .then((dirs) => {
    let errMessage = `No packages were found with the task '${cmd}'`
    if (packagesFilter) {
      errMessage += ` and the filter '${packagesFilter}'`
    }
    return checkDirsLength(dirs, errMessage)
  })
  .then((dirs) => mapTasks(cmd, dirs))
  .then((tasks) => {
    return runAll(tasks, {
      parallel: options.serial ? false : true,
      printLabel: tasks.length > 1,
      stdout: process.stdout,
      stderr: collectStderr,
    })
  })
  .then(() => {
    console.log(chalk.green('\nAll tasks compconsted successfully'))
  })
  .catch(noPackagesError, (err) => {
    console.error(chalk.red(`\n${err.message}`))
    return process.exit(1)
  })
  .catch(resultsError, (err) => {
    const results = AsciiTable.factory({
      heading: ['package', 'exit code'],
      rows: err.results.map((result) => [result.name.replace(`:${cmd}`, ''), result.code]),
    }).toString()

    console.error(chalk.red(`\nOne or more tasks failed running 'npm run all ${cmd}'.`))
    console.error('\nResults:\n')
    console.error(results)

    console.error('\nstderr:\n')
    console.error(stderrOutput)

    return process.exit(1)
  })
}
