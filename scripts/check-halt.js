/* eslint-disable no-console */
const { getCurrentBranch, readPackageJson } = require('./utils')
const { getChangedPackagesAndDependents, getLernaPackages } = require('./changed-packages')

const runTestsAndExit = () => {
  process.exit(0)
}

const skipTestsAndExit = () => {
  process.exit(1)
}

const main = async (ciJob) => {
  if (!ciJob) {
    console.log(`Could not get current CI job`)

    return skipTestsAndExit()
  }

  const currentBranch = await getCurrentBranch()

  if (currentBranch === 'develop' || currentBranch === 'master') {
    console.log(`Currently on ${currentBranch} - all tests run`)

    return runTestsAndExit()
  }

  const packages = await getLernaPackages()
  const changed = await getChangedPackagesAndDependents()

  const packageInfo = packages
  .filter((pack) => !pack.private && !pack.name.includes('@packages'))
  .find((p) => {
    const packageJson = readPackageJson(p)

    return packageJson.ciJobs && packageJson.ciJobs.includes(ciJob)
  })

  // default to binary if we don't find an independent package
  const pack = packageInfo ? packageInfo.name : 'cypress'

  console.log(`Found package ${pack} that corresponds to current job ${ciJob}.`)

  if (Object.keys(changed).includes(pack)) {
    console.log(`${pack} was directly changed, so tests run.`)

    return runTestsAndExit()
  }

  const dependenciesChanged = []

  for (const c in changed) {
    if (changed[c].includes(pack)) {
      dependenciesChanged.push(c)
    }
  }

  if (dependenciesChanged.length) {
    console.log(`${pack} is listed as a dependant of ${dependenciesChanged.join(', ')}, so tests run.`)

    return runTestsAndExit()
  }

  console.log(`${pack} is unchanged and not dependent on any changed packages, so tests do not run.`)

  return skipTestsAndExit()
}

main(process.env.CIRCLE_JOB)
