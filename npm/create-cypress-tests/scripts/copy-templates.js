const globby = require('globby')
const fs = require('fs-extra')
const chalk = require('chalk')
const path = require('path')
const program = require('commander')

program
.command('copy-to [destination]')
.description('copy ./src/**/*.template.js into destination')
.action(async (destination) => {
  const srcPath = path.resolve(__dirname, '..', 'src')
  const destinationPath = path.resolve(process.cwd(), destination)

  const templates = await globby('**/*.template.js', {
    cwd: srcPath,
    onlyFiles: true,
    unique: true,
  })

  const srcOuput = './src/'
  let destinationOuput = destination.replace('/\\/g', '/')

  if (!destinationOuput.endsWith('/')) {
    destinationOuput += '/'
  }

  const relOutput = (template, forSource) => {
    return `${forSource ? srcOuput : destinationOuput}${template}`
  }

  const result = await Promise.all(templates.map(async (template) => {
    await fs.copy(path.join(srcPath, template), path.join(destinationPath, template))

    return () => console.log(`✅ ${relOutput(template, true)} successfully copied to ${chalk.cyan(relOutput(template, false))}`)
  }))

  result.forEach((r) => r())
})

program.parse(process.argv)
