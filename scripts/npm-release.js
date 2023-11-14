/**
 * To easily test if your release will apply locally, you can run:
 * yarn test-npm-package-release-script
 */
const execa = require('execa')
const fs = require('fs')
const semverSortNewestFirst = require('semver/functions/rcompare')
const checkedInBinaryVersion = require('../package.json').version

const { getCurrentBranch, getPackagePath, readPackageJson, independentTagRegex } = require('./utils')

const error = (message) => {
  if (require.main === module) {
    console.error(`\nERROR!`)
    console.error(message)

    process.exit(1)
  } else {
    throw new Error(message)
  }
}

const getTags = async () => {
  const { stdout } = await execa('git', ['tag', '--merged', await getCurrentBranch()])

  return stdout.split('\n')
}

const parseSemanticReleaseOutput = (output) => {
  const currentVersion = (output.match(/associated with version (\d+\.\d+\.\d+-?\S*)/) || [])[1]
  const nextVersion = (output.match(/next release version is (\d+\.\d+\.\d+-?\S*)/) || [])[1]

  return {
    currentVersion,
    nextVersion,
  }
}

// in addition to getting the next version that's going to be released
// this serves as a good double check that the release will work before we actually do it
const getNextVersion = async (name) => {
  // we cannot use the semantic-release javascript api
  // since it will break semantic-release-monorepo plugin
  const { stdout } = await execa('npx', ['lerna', 'exec', '--scope', name, '--', 'npx', '--no-install', 'semantic-release', '--dry-run'])

  return parseSemanticReleaseOutput(stdout).nextVersion
}

// we manually check the last version on this branch as opposed to what semantic-release says
// since semantic-release may be not be configured on the current branch for a package
const getCurrentVersion = async (name) => {
  const tags = await getTags()

  const versions = tags
  .map((tag) => (tag.match(independentTagRegex(name)) || [])[1])
  .filter((tag) => tag)
  .sort(semverSortNewestFirst)

  return versions[0]
}

const getPackageVersions = async (packages) => {
  console.log(`Finding package versions...\n`)

  console.log(`Cypress binary: ${checkedInBinaryVersion}`)

  const versions = {
    cypress: {
      currentVersion: checkedInBinaryVersion,
      nextVersion: undefined,
    },
  }

  for (const name of packages) {
    console.log(`\n${name}`)

    const currentVersion = await getCurrentVersion(name)
    const nextVersion = await getNextVersion(name)

    console.log(`Current version: ${currentVersion || 'N/A'}`)
    console.log(`Next version: ${nextVersion || 'N/A'}`)

    versions[name] = {
      currentVersion,
      nextVersion,
    }
  }

  return versions
}

// updates a public package's package.json
// replaces any local dependencies that have a * version
// with the actual numbered version of that dependency
// if that dependency is also going to be released from this run
// it updates with the new version
const injectVersions = (packagesToRelease, versions, packages) => {
  console.log('\nInjecting versions into package.json files...')

  for (const name of packagesToRelease) {
    console.log(`\nUpdating package.json of ${name}`)

    const info = packages.find((p) => p.name === name)
    const packageJson = readPackageJson(info)

    if (packageJson.dependencies) {
      for (const dependency in packageJson.dependencies) {
        if (packageJson.dependencies[dependency] === '0.0.0-development' || packageJson.dependencies[dependency] === '*') {
          const version = versions[dependency].nextVersion || versions[dependency].currentVersion

          if (!version) {
            return error(`Could not inject a version for ${dependency} since it has no current or next version`)
          }

          packageJson.dependencies[dependency] = version

          console.log(`\t${dependency}: ${version}`)
        }
      }

      fs.writeFileSync(getPackagePath(info), JSON.stringify(packageJson, null, 2))
    }
  }
}

const releasePackages = async (packages) => {
  console.log(`\nReleasing packages`)

  let failures = []

  // it would make sense to run each release simultaneously with something like Promise.all()
  // however this can cause a race condition within git (git lock throws an error)
  // so we run them one by one to avoid this
  for (const name of packages) {
    console.log(`\nReleasing ${name}...`)
    // semantic-release v19 upgraded to npm v8 which supports workspaces. When
    // running semantic-release, npm thinks that our lerna workspace is an npm
    // workspace. When npm executes commands that modify the workspace, it will
    // check the validity of the workspace. We don't want this to happen since
    // since we don't use npm and our links/peerDependencies make npm unhappy.
    // We disable the workspace update via the NPM_CONFIG_WORKSPACES_UPDATE=false
    // env variable.
    try {
      const { stdout } = await execa(
        'npx',
        ['lerna', 'exec', '--scope', name, '--', 'npx', '--no-install', 'semantic-release'],
        { env: { NPM_CONFIG_WORKSPACES_UPDATE: false } },
      )

      console.log(`Released ${name} successfully:`)
      console.log(stdout)
    } catch (err) {
      failures.push(name)

      console.log(`Releasing ${name} failed:`)
      console.log(err.stack)
    }
  }

  if (failures.length) {
    console.log(`\nThe following packages failed to release:\n- ${failures.join('\n- ')}`)
  } else {
    console.log(`\nAll packages released successfully`)
  }

  return failures.length
}

const getLernaPackages = async () => {
  const { stdout } = await execa('npx', ['lerna', 'la', '--json'])

  return JSON.parse(stdout)
}

// goes through the release process for all of our independent npm projects
const main = async () => {
  // in case no NPM_TOKEN is provided (running a simulation locally),
  // make up a fake one to avoid semantic-release breaking
  if (!process.env.CIRCLECI && !process.env.NPM_TOKEN) {
    process.env.NPM_TOKEN = 1
  }

  const packages = await getLernaPackages()
  const publicPackages = packages
  .filter((pkg) => !pkg.private && !pkg.name.includes('@packages'))
  .map((pkg) => pkg.name)

  console.log(`Found the following public packages: ${publicPackages.join(', ')}\n`)

  const versions = await getPackageVersions(publicPackages)
  const packagesToRelease = Object.keys(versions).filter((key) => versions[key].nextVersion)

  console.log(`\nFound a new release for the following packages: ${packagesToRelease.join(', ')}`)

  if (!packagesToRelease.length) {
    return console.log(`\nThere are no packages to release!`)
  }

  injectVersions(packagesToRelease, versions, packages)

  if (!process.env.CIRCLECI) {
    return error(`Cannot run release process outside of Circle CI`)
  }

  if (process.env.CIRCLE_PULL_REQUEST) {
    return console.log(`Release process cannot be run on a PR`)
  }

  const numFailures = await releasePackages(packagesToRelease)

  if (numFailures) {
    process.exit(numFailures)
  } else {
    console.log(`\n\nRelease process completed successfully!`)
  }
}

// execute main function if called from command line
if (require.main === module) {
  main()
}

module.exports = {
  parseSemanticReleaseOutput,
  readPackageJson,
  releasePackages,
}
