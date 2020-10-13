/* eslint-disable no-console */
const execa = require('execa')
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

// gets all files that have changed since the current branch diverged from some base branch
const getChangedFiles = async (base = 'develop', output = false) => {
  const { stdout: diff } = await execa('git', ['merge-base', base, 'HEAD'])
  const { stdout: filesChanged } = await execa('git', ['diff', '--name-only', diff])

  if (output) {
    console.log(`Comparing against ${diff}`)
    console.log(`Found the following changed files:`)
    console.log(filesChanged)
  }

  return filesChanged.split('\n')
}

const getChangedPackages = async (base = 'develop', output = false) => {
  const { stdout: root } = await execa('git', ['rev-parse', '--show-toplevel'])
  const { stdout: depGraph } = await execa('npx', ['lerna', 'la', '--graph'])
  const { stdout: packs } = await execa('npx', ['lerna', 'la', '--json'])

  const files = await getChangedFiles(base, output)
  const packages = JSON.parse(packs)
  const dependencies = JSON.parse(depGraph)

  // return array of packages that depend on the inputted packages
  // includes the inputted packages in the result
  const findDependents = (packs) => {
    const output = [...packs]

    for (let d of Object.keys(dependencies)) {
      if (!packs.includes(d) && packs.some((p) => dependencies[d].includes(p))) {
        output.push(d)
      }
    }

    return output.length === packs.length ? output : findDependents(output)
  }

  // checks if a lerna package is changed
  const isChanged = ({ location }) => {
    const dir = path.relative(root, location)

    return !!files.find((f) => f.includes(dir))
  }

  let changed = []

  for (let pack of packages) {
    // dependents will contain pack
    const dependents = findDependents([pack.name])

    for (let dep of dependents) {
      if (!changed.includes(dep) && isChanged((packages.find((p) => p.name === dep)))) {
        changed.push(dep)
      }
    }
  }

  changed = convertPackagesToBinary(changed)

  if (!changed.includes('cypress') && containsBinaryOutsideLerna(files)) {
    changed.push('cypress')
  }

  if (output) {
    console.log()
    console.log(`The following packages were either directly changed or had a dependency changed:`)
    console.log(changed.join('\n'))
  }

  return changed
}

// execute main function if called from command line
if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2))
  const base = argv._[0]

  getChangedPackages(base, true)
}

module.exports = getChangedPackages
