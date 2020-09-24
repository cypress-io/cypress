const execa = require('execa')
const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))

// updates a public package's package.json
// replaces any local dependencies that have a * version
// with the actual version of that dependency
// if that dependency is also going to be released from this commit
// it updates with the new version

/* eslint-disable no-console */

const name = argv._[0]

const main = async () => {
  console.log(`Setting local npm packages to the correct version in package.json`)

  const { stdout: packs } = await execa('npx', ['lerna', 'la', '--json'])

  const packages = JSON.parse(packs)
  const localPackages = packages.map((p) => p.name)

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

  const dependencies = Object.keys(packageJson.dependencies).filter((d) => localPackages.includes(d))

  for (let dep of dependencies) {
    process.stdout.write(`${dep}: `)

    if (dep === 'cypress') {
      const { stdout: root } = await execa('git', ['rev-parse', '--show-toplevel'])
      const rootPath = path.join(root, 'package.json')
      const rootPackage = JSON.parse(fs.readFileSync(rootPath))

      packageJson.dependencies[dep] = rootPackage.version

      break
    }

    if (packages.find((p) => p.name === dep).private) {
      console.log(`ERROR`)
      console.log(`Cannot add ${dep} as a dependency since it is private`)
      process.exit(1)
    }

    const { stdout: semrel } = await execa('npx', ['lerna', 'exec', '--scope', dep, '--', 'npx', '--no-install', 'semantic-release', '--dry-run'])
    const currentVersion = (semrel.match(/associated with version (\d+\.\d+\.\d+)/) || [])[1]
    const nextVersion = (semrel.match(/The next release version is (\d+\.\d+\.\d+)/) || [])[1]

    const version = nextVersion || currentVersion

    if (!version) {
      console.log(`ERROR`)
      console.log(`Couldn't find a current or next version for ${dep}`)

      process.exit(1)
    }

    console.log(version)

    packageJson.dependencies[dep] = version
  }

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))

  console.log(`package.json updated!`)
}

main()
