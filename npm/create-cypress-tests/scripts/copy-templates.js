const fg = require('fast-glob')
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

  const templates = await fg('**/*.template.js', {
    cwd: srcPath,
    onlyFiles: true,
    unique: true,
  })

  const relativizeOutput = (template, dir) => {
    dir = dir.replace('/\\/g', '/')
    if (!dir.endsWith('/')) {
      dir += '/'
    }

    return `${dir}${template}`
  }

  const result = await Promise.all(templates.map(async (template) => {
    await fs.copy(path.join(srcPath, template), path.join(destinationPath, template))

    return () => console.log(`✅ ${relativizeOutput(template, './src/')} successfully copied to ${chalk.cyan(relativizeOutput(template, destination))}`)
  }))

  result.forEach((r) => r())
})

program.parse(process.argv)
