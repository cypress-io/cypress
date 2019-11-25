const fs = require('fs')
const path = require('path')
const execa = require('execa')
const Listr = require('listr')
const commander = require('commander')

const program = new commander.Command()

program.usage('[options]')

program
.option('-p, --project <projects>', 'projects to check types (separated by commas)')
.option('--skip-lib-check', 'skip type checking of all declaration files (*.d.ts)')
.action((...args) => {
  const projects = []
  const packageRoot = path.join(__dirname, '../packages')
  const getPackagePath = (name) => {
    return name === 'cli'
      ? path.join(__dirname, '../cli/types')
      : path.join(packageRoot, name)
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
    addProject('cli')

    fs.readdirSync(packageRoot).forEach((file) => {
      const packagePath = getPackagePath(file)

      if (fs.lstatSync(packagePath).isDirectory() && fs.existsSync(path.join(packagePath, 'tsconfig.json'))) {
        addProject(file)
      }
    })
  }

  const options = ['--noEmit', '--pretty']

  if (program.skipLibCheck) {
    options.push('--skipLibCheck')
  }

  const tasks = new Listr(projects.map((proj) => {
    return {
      title: proj.name,
      task: () => {
        const cwd = proj.path
        const tsc = require.resolve('typescript/bin/tsc')

        return execa(tsc, options, {
          cwd,
        }).catch((err) => {
          throw {
            name: proj.name,
            err,
          }
        })
      },
    }
  }), {
    concurrent: 4,
    exitOnError: false,
  })

  tasks.run().catch((err) => {
    process.exitCode = 1

    err.errors.forEach((e) => {
      log('')
      log(`${e.name} failed\n${e.err.stdout}`)
    })
  })
})

const log = (msg) => {
  // eslint-disable-next-line no-console
  console.log(msg)
}

program.parse(process.argv)
