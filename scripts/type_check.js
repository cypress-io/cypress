const fs = require('fs')
const path = require('path')
const execa = require('execa')
const { Listr } = require('listr2')
const commander = require('commander')

const program = new commander.Command()

program.usage('[options]')

program
.option('-p, --project <projects>', 'projects to check types (separated by commas)')
.option('--skip-lib-check', 'skip type checking of all declaration files (*.d.ts)')
.option('--ignore-progress', 'do not show progress')
.action((...args) => {
  const projects = []
  const packageRoot = path.join(__dirname, '../packages')
  const getPackagePath = (name) => {
    if (name !== 'cli') {
      return path.join(packageRoot, name)
    }

    throw new Error(`type-check command doesn't check cli types. Use "npm run dtslint" in "cli" directory instead.`)
  }
  const addProject = (name) => {
    return projects.push({
      name,
      path: getPackagePath(name),
    })
  }

  if (program.project) {
    program.project.split(',').forEach((p) => addProject(p))
  } else {
    fs.readdirSync(packageRoot).forEach((file) => {
      const packagePath = getPackagePath(file)

      if (fs.lstatSync(packagePath).isDirectory() && fs.existsSync(path.join(packagePath, 'tsconfig.json'))) {
        addProject(file)
      }
    })
  }

  const tsc = require.resolve('typescript/bin/tsc')
  const options = ['--noEmit', '--pretty']

  if (program.skipLibCheck) {
    options.push('--skipLibCheck')
  }

  const tasks = new Listr(projects.map((proj) => {
    return {
      title: proj.name,
      task: () => {
        return execa(tsc, options, { cwd: proj.path })
      },
    }
  }), {
    concurrent: process.env.CI ? 4 : 1,
    renderer: process.env.CI ? 'verbose' : 'default',
    exitOnError: false,
  })

  tasks.run()
  .then(() => {
    if (tasks.err[0] && tasks.err[0].errors.length > 0) {
      process.exitCode = 1

      log('')
      log('Type check failed.')
    } else {
      log('')
      log('Type check passed successfully.')
    }
  })
})

const log = (msg) => {
  console.log(msg)
}

program.parse(process.argv)
