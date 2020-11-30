import chalk from 'chalk'
import inquirer from 'inquirer'
import { scanFSForAvailableDependency } from '../findPackageJson'
import { installDependency } from '../utils'

async function guessOrAskForFramework (cwd: string): Promise<'react' | 'vue'> {
  // please sort this alphabetically
  const frameworks = {
    react: () => scanFSForAvailableDependency(cwd, ['react', 'react-dom']),
    vue: () => scanFSForAvailableDependency(cwd, ['vue']),
  }

  const guesses = Object.keys(frameworks).filter((framework) => {
    return frameworks[framework as keyof typeof frameworks]()
  }) as Array<'react' | 'vue'>

  // found 1 precise guess. Continue
  if (guesses.length === 1) {
    const framework = guesses[0]

    console.log(`\nThis project is using ${chalk.bold.cyan(framework)}. Let's install the right adapter:`)

    return framework
  }

  if (guesses.length === 0) {
    console.log(`We were unable to automatically determine your framework 😿. ${chalk.grey('Make sure to run this command from the directory where your components located in order to make smart detection works. Or continue with manual setup:')}`)
  }

  if (guesses.length > 0) {
    console.log(`It looks like all these frameworks: ${chalk.yellow(guesses.join(', '))} are available from this directory. ${chalk.grey('Make sure to run this command from the directory where your components located in order to make smart detection works. Or continue with manual setup:')}`)
  }

  const { framework } = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      choices: Object.keys(frameworks),
      message: `Which framework do you use?`,
    },
  ])

  return framework
}

type InstallAdapterOptions = {
  useYarn: boolean
}

export async function installFrameworkAdapter (cwd: string, options: InstallAdapterOptions) {
  const framework = await guessOrAskForFramework(cwd)

  await installDependency(`@cypress/${framework}`, options)

  return framework
}
