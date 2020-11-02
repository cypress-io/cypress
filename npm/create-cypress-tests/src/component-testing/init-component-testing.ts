import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inqueier from 'inquirer'
import highlight from 'cli-highlight'
import { Template } from './templates/Template'
import { guessTemplate } from './templates/guessTemplate'
import { installAdapter } from './installAdapter'
import { autoInjectPluginsCode, getPluginsSourceExample } from './babel/babelTransform'

function printCypressJsonHelp (
  cypressJsonPath: string,
  componentFolder: string,
) {
  const resultObject = {
    experimentalComponentTesting: true,
    componentFolder,
    testFiles: '**/*.spec.{js,ts,jsx,tsx}',
  }

  const relativeCypressJsonPath = path.relative(process.cwd(), cypressJsonPath)
  const highlightedCode = highlight(JSON.stringify(resultObject, null, 2), {
    language: 'json',
  })

  console.log(
    `\n${chalk.bold('1.')} Add this to the ${chalk.green(
      relativeCypressJsonPath,
    )}:`,
  )

  console.log(`\n${highlightedCode}\n`)
}

function injectAndShowSupportConfig (supportFilePath: string, framework: string) {
  const stepNumber = chalk.bold('2.')
  const importCode = `import \'@cypress/${framework}/support\'`
  const requireCode = `require(\'@cypress/${framework}/support\')`

  if (fs.existsSync(supportFilePath)) {
    const fileContent = fs.readFileSync(supportFilePath, { encoding: 'utf-8' })
    const relativeSupportPath = path.relative(process.cwd(), supportFilePath)

    const importCodeWithPreferredStyle = fileContent.includes('import ')
      ? importCode
      : requireCode

    console.log(
      `\n${stepNumber} This to the ${chalk.green(relativeSupportPath)}:`,
    )

    console.log(
      `\n${highlight(importCodeWithPreferredStyle, { language: 'js' })}\n`,
    )
  } else {
    console.log(
      `\n${stepNumber} This to the support file https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests.html#Support-file`,
    )

    console.log(`\n${highlight(requireCode, { language: 'js' })}\n`)
  }
}

async function injectAndShowPluginConfig<T> (template: Template<T>, pluginsFilePath: string, emptyProject: boolean) {
  const ast = template.getPluginsCodeAst?.()

  if (!ast) {
    return
  }

  const injected = await autoInjectPluginsCode(pluginsFilePath, ast)

  if (injected && emptyProject) {
    return
  }

  const pluginsCode = await getPluginsSourceExample(ast)
  const highlightedPluginCode = highlight(pluginsCode, { language: 'js' })
  const relativePluginsFilePath = fs.existsSync(pluginsFilePath)
    ? path.relative(process.cwd(), pluginsFilePath)
    : 'plugins file (https://docs.cypress.io/guides/tooling/plugins-guide.html)`'

  const stepTitle = injected
    ? `✅ Injected into ${chalk.green(relativePluginsFilePath)}`
    : `❌ ${chalk.red(`We were not able to modify your ${relativePluginsFilePath}`)}. Add this manually:`

  console.log(stepTitle)
  console.log(`\n${highlightedPluginCode}\n`)
}

type InitComponentTestingOptions = {
  config: Record<string, string>
  cypressConfigPath: string
  useYarn: boolean
}

export async function initComponentTesting<T> ({ config, useYarn, cypressConfigPath }: InitComponentTestingOptions) {
  const cypressProjectRoot = path.resolve(cypressConfigPath, '..')

  const framework = await installAdapter(cypressProjectRoot, { useYarn })
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

  const supportFilePath = path.resolve(
    cypressProjectRoot,
    config.supportFile ?? './cypress/support/index.js',
  )

  const templateChoices = Object.keys(possibleTemplates).sort((key) => {
    return key === defaultTemplateName ? -1 : 0
  })

  const {
    chosenTemplateName,
    componentFolder,
  }: Record<string, string> = await inqueier.prompt([
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
  console.log(`Here are instructions of how to get started with component testing for ${chalk.cyan(chosenTemplateName)}:`)

  printCypressJsonHelp(cypressConfigPath, componentFolder)
  injectAndShowSupportConfig(supportFilePath, framework)

  await injectAndShowPluginConfig(chosenTemplate, pluginsFilePath, false)

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
}
