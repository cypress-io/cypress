const execa = require('execa')
const fs = require('fs')
const path = require('path')
const { groupBy } = require('lodash')
const debug = require('debug')('cypress-build:semantic-release')
const info = require('debug')('cypress-build:semantic-release:info')

// updates a public package's package.json
// replaces any local dependencies that have a * version
// with the actual version of that dependency
// if that dependency is also going to be released from this commit
// it updates with the new version

/* eslint-disable no-console */

const getPackages = async () => {
  const { stdout: packages } = await execa('npx', ['lerna', 'la', '--json'])

  return JSON.parse(packages)
}

const getBinaryVersion = async () => {
  const { stdout: root } = await execa('git', ['rev-parse', '--show-toplevel'])
  const rootPath = path.join(root, 'package.json')
  const rootPackage = JSON.parse(fs.readFileSync(rootPath))

  return rootPackage.version
}

const parseSemanticReleaseOutput = (output) => {
  const currentVersion = (output.match(/associated with version (\d+\.\d+\.\d+-?\S*)/) || [])[1]
  const nextVersion = (output.match(/The next release version is (\d+\.\d+\.\d+-?\S*)/) || [])[1]

  return nextVersion || currentVersion
}

const getPackageVersion = async (pack) => {
  debug(`package`, pack)
  const { stdout: semrel } = await execa('npx', ['lerna', 'exec', '--scope', pack, '--', 'npx', '--no-install', 'semantic-release', '--dry-run'])

  const version = parseSemanticReleaseOutput(semrel)

  if (!version) {
    console.log(`ERROR`)
    console.log(`Couldn't find a current or next version for ${pack}`)

    process.exit(1)
  }

  return version
}

const main = async (name) => {
  if (!name) return

  debug(`Setting local npm packages to the correct version in package.json`)

  const packages = await getPackages()
  const packagesByPrivacy = groupBy(packages, 'private')

  info(`Found these packages...`)
  info(`Packages that can be independently released:`)
  packagesByPrivacy.false && packagesByPrivacy.false.forEach((p) => info(`- ${p.name}`))
  info(`Packages that cannot be released:`)
  packagesByPrivacy.true && packagesByPrivacy.true.forEach((p) => info(`- ${p.name}`))

  const packageNames = packages.map((p) => p.name)

  const pack = packages.find((p) => p.name === name)

  if (!pack) {
    console.log(`Couldn't find package ${name}`)
    process.exit(1)
  }

  const packagePath = path.join(pack.location, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath))

  if (!packageJson.dependencies) {
    console.log(`No dependencies so we're done here`)
    process.exit(0)
  }

  // filter dependencies to only include local packages
  const dependencies = Object.keys(packageJson.dependencies).filter((d) => packageNames.includes(d))

  for (let dep of dependencies) {
    process.stdout.write(`${dep}: `)

    let version

    if (dep === 'cypress') {
      // Cypress binary gets handled differently than everything else
      version = await getBinaryVersion()
    } else {
      if (packages.find((p) => p.name === dep).private) {
        console.log(`ERROR`)
        console.log(`Cannot add ${dep} as a dependency since it is private`)
        process.exit(1)
      }

      version = await getPackageVersion(dep)
    }

    debug(version)

    packageJson.dependencies[dep] = version
  }

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))

  debug(`package.json updated!`)
}

// execute main function if called from command line
if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2))
  const name = argv._[0]

  main(name)
}

module.exports = {
  parseSemanticReleaseOutput,
  main,
}
