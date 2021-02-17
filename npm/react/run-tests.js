const execa = require('execa')
const { readdirSync } = require('fs')
const { chdir, cwd } = require('process')

const root = cwd()

const runAllExamples = async () => {
  const examples = readdirSync(`./examples`)

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

main()
