const fs = require('fs-extra')
const chalk = require('chalk')
const path = require('path')
const program = require('commander')

program
.command('copy-to [destination]')
.description('copy cypress/packages/example into destination')
.action(async (destination) => {
  const exampleFolder = path.resolve(__dirname, '..', '..', '..', 'packages', 'example', 'cypress')
  const destinationPath = path.resolve(process.cwd(), destination)

  await fs.remove(destinationPath)
  await fs.copy(exampleFolder, destinationPath, { recursive: true })

  console.log(`✅ Example was successfully created at ${chalk.cyan(destination)}`)

  await fs.copy(path.join(__dirname, 'example-tsconfig.json'), path.join(destination, 'tsconfig.json'))

  console.log(`✅ tsconfig.json was created for ${chalk.cyan(destination)}`)
})

program.parse(process.argv)
