const execa = require('execa')
const { readdirSync } = require('fs')
const { chdir, cwd } = require('process')

const root = cwd()

// We do not run these on CI as they require specific tokens and/or API keys.
const SKIP_ON_CI = ['visual-sudoku', 'visual-testing-with-applitools', 'visual-testing-with-happo', 'visual-testing-with-percy']

const runAllExamples = async () => {
  const examples = readdirSync(`./examples`).filter((x) => !SKIP_ON_CI.includes(x))

  for (const example of examples) {
    await runTests(`./examples/${example}`)
    chdir(root)
  }
}

const runTests = async (dir) => {
  try {
    chdir(dir)

    console.log(`Running yarn install in project ${dir}`)
    const install = await execa('yarn', ['install'])

    console.log(install.stdout)

    console.log(`Running yarn test in project ${dir}`)
    const test = await execa('yarn', ['test'])

    console.log(test.stdout)
  } catch (e) {
    if (!e.stdout) {
      // for unexpected errors, just log the entire thing.
      console.error(e)
    } else {
      console.error(e.stdout)
      console.error(`Exiting with exit code ${e.exitCode}`)
      process.exit(e.exitCode)
    }
  }
}

const main = async () => {
  // initial working directory is npm/react
  await runTests('.')
  chdir(root)
  await runAllExamples()
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
