/* eslint-disable no-console */
const execa = require('execa')
const fs = require('fs')
const path = require('path')
const semverSortNewestFirst = require('semver/functions/rcompare')

const { getCurrentBranch, getPackagePath, readPackageJson, minutes, independentTagRegex } = require('./utils')
const { getLernaPackages, getPackageDependents } = require('./changed-packages')
const { waitForJobToPass } = require('./wait-on-circle-jobs')

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

const getBinaryVersion = async () => {
  const { stdout: root } = await execa('git', ['rev-parse', '--show-toplevel'])
  const rootPath = path.join(root, 'package.json')
  const rootPackage = JSON.parse(fs.readFileSync(rootPath))

  return rootPackage.version
}

const parseSemanticReleaseOutput = (output) => {
  const currentVersion = (output.match(/associated with version (\d+\.\d+\.\d+-?\S*)/) || [])[1]
  const nextVersion = (output.match(/The next release version is (\d+\.\d+\.\d+-?\S*)/) || [])[1]

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

  const binaryVersion = await getBinaryVersion()

  console.log(`Cypress binary: ${binaryVersion}`)

  const versions = {
    cypress: {
      currentVersion: binaryVersion,
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
        if (packageJson.dependencies[dependency] === '*') {
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

// we want to wait on all tests to pass for the packages that we want to release
// even if they aren't related to a specific package
// since releasing some but not all could break the package numbers we injected
// failing/passing all also ensures that stuff doesn't get out of sync if the job is rerun
const waitOnTests = async (names, packageInfo) => {
  const packages = names.concat(...await Promise.all(names.map(getPackageDependents)))

  const jobs = [...new Set([].concat(...packages.map((name) => {
    const pkg = packageInfo.find((p) => p.name === name)

    return readPackageJson(pkg).ciJobs || []
  })))]

  console.log(`\nWaiting on the following CI jobs: ${jobs.join(', ')}`)

  return Promise.all(jobs.map((job) => {
    return waitForJobToPass(job)
    .timeout(minutes(60))
    .then(() => {
      console.log(`${job} passed`)
    }).catch(() => {
      error(`${job} failed - cannot release`)
    })
  })).then(() => {
    console.log(`\nAll CI jobs passed`)
  })
}

const releasePackages = async (packages) => {
  console.log(`\nReleasing packages`)

  // it would make sense to run each release simultaneously with something like Promise.all()
  // however this can cause a race condition within git (git lock throws an error)
  // so we run them one by one to avoid this
  for (const name of packages) {
    console.log(`\nReleasing ${name}...`)
    const { stdout } = await execa('npx', ['lerna', 'exec', '--scope', name, '--', 'npx', '--no-install', 'semantic-release'])

    console.log(`Released ${name} successfully:`)
    console.log(stdout)
  }

  console.log(`\nAll packages released successfully`)
}

// goes through the release process for all of our independent npm projects
const main = async () => {
  if (!process.env.CIRCLECI) {
    return error(`Cannot run release process outside of Circle CI`)
  }

  if (process.env.CIRCLE_PULL_REQUEST) {
    return console.log(`Release process cannot be run on a PR`)
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

  await waitOnTests(packagesToRelease, packages)

  await releasePackages(packagesToRelease)

  console.log(`\n\nRelease process completed successfully!`)
}

// execute main function if called from command line
if (require.main === module) {
  main()
}

module.exports = {
  parseSemanticReleaseOutput,
  readPackageJson,
}
