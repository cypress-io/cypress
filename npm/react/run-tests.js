const execa = require('execa')
const { chdir } = require('process')

const EXAMPLE_PROJECTS_ON_CI = [
  '',
  '/examples/nextjs',
  '/examples/react-scripts',
  '/examples/webpack-file',
  '/examples/react-scripts-folder',
  '/examples/using-babel-typescript',
  '/examples/webpack-options',
  '/examples/rollup',
  '/examples/sass-and-ts',
]
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
  const NODE_INDEX = process.env.CIRCLE_NODE_INDEX

  // initial working directory is npm/react
  const projectDir = `${__dirname}${EXAMPLE_PROJECTS_ON_CI[NODE_INDEX]}`

  console.log(`Running tests in ${projectDir}`)
  await runTests(projectDir)
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
