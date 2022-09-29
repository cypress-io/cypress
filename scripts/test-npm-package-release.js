/* eslint-disable no-console */
const execa = require('execa')

const getNpmPackages = async () => {
  const { stdout } = await execa('npx', ['lerna', 'la', '--json'])

  const lernaPackages = JSON.parse(stdout)

  // filter out private and binary packages
  return lernaPackages.filter((pkg) => {
    return !pkg.private && !pkg.name.includes('@packages')
  })
}

const main = async () => {
  const packages = await getNpmPackages()

  for (const { name } of packages) {
    console.log()
    console.log('semantic-release dry run for:', name)

    await execa(
      'npx',
      ['lerna', 'exec', '--scope', name, '--', 'npx', '--no-install', 'semantic-release', '--dry-run'],
      { stdout: 'inherit', stderr: 'inherit' },
    )
  }
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
