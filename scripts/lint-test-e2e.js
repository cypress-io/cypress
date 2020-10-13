/* eslint-disable no-console */
const execa = require('execa')
const path = require('path')
const fs = require('fs')

// packages to exclude, must be manually added
// should only contain packages that do not depend on the binary
const exclude = [
  '@cypress/eslint-plugin-dev',
]

const main = async () => {
  console.log('Making sure that all public packages have a `yarn test-e2e` command.')
  console.log()
  console.log('Excluding the following packages:')
  console.log(exclude.join('\n'))
  console.log()

  const { stdout: packs } = await execa('npx', ['lerna', 'la', '--json'])
  const filteredPackages = JSON.parse(packs).filter((p) => {
    return !p.private &&
      p.name !== 'cypress' &&
      !p.name.includes('@packages/') &&
      !exclude.includes(p.name)
  })

  console.log('Checking the following packages:')
  console.log(filteredPackages.map((p) => p.name).join('\n'))
  console.log()

  const missing = []

  for (let pack of filteredPackages) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(pack.location, 'package.json')))

    if (!('scripts' in packageJson) || !('test-e2e' in packageJson['scripts'])) {
      missing.push(pack.name)
    }
  }

  if (missing.length > 0) {
    console.log('The following packages are missing a `yarn test-e2e` command:')
    console.log(missing.join('\n'))
    process.exit(1)
  }

  process.exit(0)
}

main()
