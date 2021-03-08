import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import highlight from 'cli-highlight'
import { Template } from './templates/Template'
import { guessTemplate } from './templates/guessTemplate'
import { installFrameworkAdapter } from './installFrameworkAdapter'
import { injectPluginsCode, getPluginsSourceExample } from './babel/babelTransform'
import { installDependency } from '../utils'

async function injectOrShowConfigCode (injectFn: () => Promise<boolean>, {
  code,
  filePath,
  fallbackFileMessage,
  language,
}: {
  code: string
  filePath: string
  language: string
  fallbackFileMessage: string
}) {
  const fileExists = fs.existsSync(filePath)
  const readableFilePath = fileExists ? path.relative(process.cwd(), filePath) : fallbackFileMessage

  const printCode = () => {
    console.log()
    console.log(highlight(code, { language }))
    console.log()
  }

  const printSuccess = () => {
    console.log(`✅  ${chalk.bold.green(readableFilePath)} was updated with the following config:`)
    printCode()
  }

  const printFailure = () => {
    console.log(`❌  ${chalk.bold.red(readableFilePath)} was not updated automatically. Please add the following config manually: `)
    printCode()
  }

  if (!fileExists) {
    printFailure()

    return
  }

  // something get completely wrong when using babel or something. Print error message.
  const injected = await injectFn().catch(() => false)

  injected ? printSuccess() : printFailure()
}

async function injectAndShowCypressJsonConfig (
  cypressJsonPath: string,
  componentFolder: string,
) {
  const configToInject = {
    experimentalComponentTesting: true,
    componentFolder,
    testFiles: '**/*.spec.{js,ts,jsx,tsx}',
  }

  async function autoInjectCypressJson () {
    const currentConfig = JSON.parse(await fs.readFile(cypressJsonPath, { encoding: 'utf-8' }))

    await fs.writeFile(cypressJsonPath, JSON.stringify({
      ...currentConfig,
      ...configToInject,
    }, null, 2))

    return true
  }

  await injectOrShowConfigCode(autoInjectCypressJson, {
    code: JSON.stringify(configToInject, null, 2),
    language: 'js',
    filePath: cypressJsonPath,
    fallbackFileMessage: 'cypress.json config file',
  })
}

async function injectAndShowPluginConfig<T> (template: Template<T>, {
  templatePayload,
  pluginsFilePath,
  cypressProjectRoot,
}: {
  templatePayload: T | null
  pluginsFilePath: string
  cypressProjectRoot: string
}) {
  const ast = template.getPluginsCodeAst(templatePayload, { cypressProjectRoot })

  await injectOrShowConfigCode(() => injectPluginsCode(pluginsFilePath, ast), {
    code: await getPluginsSourceExample(ast),
    language: 'js',
    filePath: pluginsFilePath,
    fallbackFileMessage: 'plugins file (https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests.html#Plugin-files)',
  })
}

type InitComponentTestingOptions = {
  config: Record<string, string>
  cypressConfigPath: string
  useYarn: boolean
}

export async function initComponentTesting<T> ({ config, useYarn, cypressConfigPath }: InitComponentTestingOptions) {
  const cypressProjectRoot = path.resolve(cypressConfigPath, '..')

  const framework = await installFrameworkAdapter(cypressProjectRoot, { useYarn })
  const {
    possibleTemplates,
    defaultTemplate,
    defaultTemplateName,
    templatePayload,
  } = await guessTemplate<T>(framework, cypressProjectRoot)

  const pluginsFilePath = path.resolve(
    cypressProjectRoot,
    config.pluginsFile ?? './cypress/plugins/index.js',
  )

  const templateChoices = Object.keys(possibleTemplates).sort((key) => {
    return key === defaultTemplateName ? -1 : 0
  })

  const {
    chosenTemplateName,
    componentFolder,
  }: Record<string, string> = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenTemplateName',
      choices: templateChoices,
      default: defaultTemplate ? 0 : undefined,
      message: defaultTemplate?.message
        ? `${defaultTemplate?.message}\n\n Press ${chalk.inverse(
          ' Enter ',
        )} to continue with ${chalk.green(
          defaultTemplateName,
        )} configuration or select another template from the list:`
        : 'We were not able to automatically determine which framework or bundling tool you are using. Please choose one from the list:',
    },
    {
      type: 'input',
      name: 'componentFolder',
      filter: (input) => input.trim(),
      validate: (input) => {
        return input === '' || !/^[a-zA-Z].*/.test(input)
          ? `Directory "${input}" is invalid`
          : true
      },
      message: 'Which folder would you like to use for your component tests?',
      default: (answers: { chosenTemplateName: keyof typeof possibleTemplates }) => {
        return possibleTemplates[answers.chosenTemplateName].recommendedComponentFolder
      },
    },
  ])

  const chosenTemplate = possibleTemplates[chosenTemplateName] as Template<T>

  console.log()
  console.log(`Installing required dependencies`)
  console.log()

  for (const dependency of chosenTemplate.dependencies) {
    await installDependency(dependency, { useYarn })
  }

  console.log()
  console.log(`Let's setup everything for component testing with ${chalk.cyan(chosenTemplateName)}:`)
  console.log()

  await injectAndShowCypressJsonConfig(cypressConfigPath, componentFolder)
  await injectAndShowPluginConfig(chosenTemplate, {
    templatePayload,
    pluginsFilePath,
    cypressProjectRoot,
  })

  if (chosenTemplate.printHelper) {
    chosenTemplate.printHelper()
  }

  console.log(
    `Find examples of component tests for ${chalk.green(
      chosenTemplateName,
    )} in ${chalk.underline(chosenTemplate.getExampleUrl({ componentFolder }))}.`,
  )

  if (framework === 'react') {
    console.log()

    console.log(
      `Docs for different recipes of bundling tools: ${chalk.bold.underline(
        'https://github.com/cypress-io/cypress/tree/develop/npm/react/docs/recipes.md',
      )}`,
    )
  }

  // render delimiter
  console.log()
  console.log(new Array(process.stdout.columns).fill('═').join(''))
  console.log()
}
