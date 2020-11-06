/* eslint-disable no-console */
const execa = require('execa')
const fs = require('fs')
const path = require('path')

// lists all packages that have changed from develop
// and all packages that depend on those

// some files that are intimately related to the binary exist outside of lerna packages
// so we want to make sure they're considered to be part of the binary
const containsBinaryOutsideLerna = (changedFiles) => {
  const binaryFiles = [
    '.node-version',
    'circle.yml',
    'electron-builder.json',
    'package.json',
    'yarn.lock',
  ]

  return !!changedFiles.find((f) => f.includes('scripts/') || binaryFiles.includes(f))
}

// merges `cypress` and all binary packages prefixed with `@packages/`
// into a single `cypress` output
const convertPackagesToBinary = (packages) => {
  let output = [...packages]
  let includeBinary = false

  output = output.filter((name) => {
    const packageInBinary = name === 'cypress' || name.includes('@packages')

    includeBinary = includeBinary || packageInBinary

    return !packageInBinary
  })

  if (includeBinary) {
    output.unshift('cypress')
  }

  return output
}

const getLernaPackages = async () => {
  const { stdout } = await execa('npx', ['lerna', 'la', '--json'])

  return JSON.parse(stdout)
}

// gets all files that have changed since the current branch diverged from some base branch
const getChangedFiles = async (base = 'origin/develop', output = false) => {
  const { stdout: diff } = await execa('git', ['merge-base', base, 'HEAD'])
  const { stdout: filesChanged } = await execa('git', ['diff', '--name-only', diff])

  if (output) {
    console.log(`Comparing against ${diff}`)
    console.log(`Found the following changed files:`)
    console.log(filesChanged)
  }

  return filesChanged.split('\n')
}

const getChangedPackages = async (base = 'origin/develop', output = false) => {
  const { stdout: root } = await execa('git', ['rev-parse', '--show-toplevel'])

  const packages = await getLernaPackages()
  const files = await getChangedFiles(base, output)

  // checks if a lerna package is changed
  const isChanged = ({ location }) => {
    const dir = path.relative(root, location)

    return !!files.find((f) => f.includes(dir))
  }

  let changed = packages.filter(isChanged).map((p) => p.name)

  changed = convertPackagesToBinary(changed)

  if (!changed.includes('cypress') && containsBinaryOutsideLerna(files)) {
    changed.unshift('cypress')
  }

  if (output) {
    console.log()
    console.log(`The following packages were changed:`)
    console.log(changed.join('\n'))
  }

  return changed
}

// finds dependents as defined in the `ciDependents` field
// within the package.json of the package - see CONTRIBUTING.md for docs
const getPackageDependents = async (name) => {
  const packages = await getLernaPackages()
  const pack = packages.find((p) => p.name === name)

  if (!pack) {
    throw new Error('Could not find that package!')
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(pack.location, 'package.json')))

  return packageJson['ciDependents'] || []
}

// gets all of the changed packages and their corresponding dependents
const getChangedPackagesAndDependents = async (base = 'origin/develop', output = false) => {
  const changedPackages = await getChangedPackages(base, output)

  const dependents = {}

  for (const pack of changedPackages) {
    dependents[pack] = await getPackageDependents(pack)
  }

  if (output) {
    console.log()
    console.log(`Changed packages and their dependents:`)
    for (const pack in dependents) {
      console.log(`${pack}: ${dependents[pack].join(', ') || 'none'}`)
    }
  }

  return dependents
}

// execute main function if called from command line
if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2))
  const base = argv._[0]

  getChangedPackagesAndDependents(base, true)
}

module.exports = {
  getLernaPackages,
  getChangedPackages,
  getPackageDependents,
  getChangedPackagesAndDependents,
}
