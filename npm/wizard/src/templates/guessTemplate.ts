import chalk from 'chalk'
import inquirer from 'inquirer'
import { Template } from './Template'
import { scanFSForAvailableDependency } from '../findPackageJson'
import { reactTemplates } from './react'

async function guessOrAskForFramework (cwd: string) {
  // please sort this alphabetically
  const frameworks = {
    react: () => scanFSForAvailableDependency(cwd, ['react', 'react-dom']),
    vue: () => scanFSForAvailableDependency(cwd, ['vue']),
  }

  const guesses = Object.keys(frameworks).filter((framework) => {
    return frameworks[framework as keyof typeof frameworks]()
  })

  // found 1 precise guess. Continue
  if (guesses.length === 1) {
    return guesses[0]
  }

  if (guesses.length === 0) {
    console.log(`We were unable to automatically determine your framework 😿. ${chalk.grey('Make sure to run this command from the directory where your components located in order to make smart detection works. Or continue with manual setup:')}`)
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

const allTemplates = {
  react: reactTemplates,
  vue: { },
}

export async function guessTemplate<T> (cwd: string) {
  let framework: keyof typeof allTemplates = await guessOrAskForFramework(cwd)
  const templates = allTemplates[framework]

  // babel config can also be declared in package.json with `babel` key https://babeljs.io/docs/en/configuration#packagejson
  for (const [name, template] of Object.entries(templates)) {
    const typedTemplate = template as Template<T>
    const { success, payload } = typedTemplate.test(process.cwd())

    if (success) {
      return {
        defaultTemplate: typedTemplate,
        defaultTemplateName: name,
        templatePayload: payload ?? null,
      }
    }
  }

  return {
    templatePayload: null,
    defaultTemplate: null,
    defaultTemplateName: null,
  }
}
