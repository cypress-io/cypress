const execa = require('execa')
const { readdirSync } = require('fs')
const { chdir, cwd } = require('process')

const root = cwd()

// We do not run these on CI as they require specific tokens and/or API keys.
// const SKIP_ON_CI = ['visual-sudoku', 'visual-testing-with-applitools', 'visual-testing-with-happo', 'visual-testing-with-percy']
const EXAMPLE_PROJECTS_ON_CI = [
  'nextjs',
  'react-scripts',
  'using-babel'
]

// 'webpack-file'
// 'react-scripts-folder'		'using-babel-typescript'		'webpack-options'
// 'rollup'				
// 'sass-and-ts'
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
  const NODE_INDEX = process.env.CIRCLE_NODE_INDEX;

  if (!NODE_INDEX || NODE_INDEX === 0) { 
    return await runTests(__dirname)
  };
  
  // initial working directory is npm/react
  await runTests(`${__dirname}/examples/${EXAMPLE_PROJECTS_ON_CI[NODE_INDEX]}`)

}

// execute main function if called from command line
if (require.main === module) {
  main()
}
