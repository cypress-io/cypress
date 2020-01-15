import _ from 'lodash'
import prompts from 'prompts'
import path from 'path'

import { optionInfo } from './options'
import fs from '../../util/fs'
import { Config } from './config'

export const prompt = async (options: any) => {
  const { customize } = await prompts({
    type: 'confirm',
    name: 'customize',
    message: 'Customize settings?',
  })

  let config: Config = {}

  if (customize) {
    config = await configPrompts(optionInfo)
  }

  const { useTypeScript } = await prompts({
    type: 'confirm',
    name: 'useTypeScript',
    message: 'Use TypeScript?',
  })

  const { generateExamples } = await prompts({
    type: 'confirm',
    name: 'generateExamples',
    message: 'Generate examples?',
  })

  const eslintChoices = [
    { title: 'Default', value: 'default' },
    { title: 'No', value: 'no' },
    { title: 'Chai friendly', value: 'chai-friendly' },
  ]

  const { installEslint } = await prompts({
    type: 'select',
    name: 'installEslint',
    message: 'Install Eslint rules for Cypress?',
    choices: eslintChoices,
  })

  const configStr = JSON.stringify(config, null, 2)
  const configPath = `${options.cwd}/cypress.json`

  log('')
  log('About to do these things:')
  log(`* Write to ${configPath}`)
  log(configStr)
  log(`* Use TypeScript: ${useTypeScript ? 'yes' : 'no'}`)
  log(`* Generate Examples: ${generateExamples ? 'yes' : 'no'}`)
  log(`* Install Eslint Rules for Cypress: ${_.find(eslintChoices, { value: installEslint })!.title}`)

  const { proceed } = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Is it OK?',
  })

  if (proceed) {
    await fs.writeFile(configPath, configStr)
    log(`cypress.json generated at ${configPath}`)

    await generateDirsAndFiles(options.cwd, config)
  }
}

const configPrompts = async (optionInfo) => {
  const config = {}

  for (let i = 0; i < optionInfo.length; i++) {
    const option = optionInfo[i]
    const { customizeCategory } = await prompts({
      type: 'confirm',
      name: 'customizeCategory',
      message: ``, // required
      // @ts-ignore
      onRender ({ yellow }) {
        this.msg = `  Customize ${yellow(`${option.name}`)}?`
      },
    })

    if (customizeCategory) {
      for (let j = 0; j < option.options.length; j++) {
        const { name, type, default: defaultVal, description } = option.options[j]

        if (type === 'text' || type === 'number') {
          const result = await prompts({
            type,
            name,
            initial: defaultVal,
            message: '', // required
            // @ts-ignore
            onRender ({ underline, reset }) {
              this.msg = `  - ${underline().yellow(`${name}:`)} ${reset().dim(`${description}`)}\n      Your value:`
            },
          })

          if (result[name] !== defaultVal) {
            Object.assign(config, result)
          }
        }

        if (type === 'object') {
          const obj = objectPrompt(option)

          if (obj) {
            Object.assign(config, obj)
          }
        }
      }
    }
  }

  return config
}

const objectPrompt = async (option) => {
  const { name, description } = option

  const { addObject } = await prompts({
    type: 'confirm',
    name: 'addObject',
    message: '', // required
    // @ts-ignore
    onRender ({ underline, reset }) {
      this.msg = `  - ${underline().yellow(`${name}`)} object: ${reset().dim(`${description}`)}\n      Add this object?:`
    },
  })

  if (addObject) {
    let showInitialMessage = true
    let obj = {}

    for (;;) {
      const { key } = await prompts({
        type: 'text',
        name: 'key',
        message: '', // required
        // @ts-ignore
        onRender ({ reset }) {
          if (showInitialMessage) {
            this.msg = `    ${showInitialMessage ? reset().dim('Leave key field empty to exit') : ''}\n      - KEY:`
          } else {
            this.msg = `    - KEY:`
          }

          showInitialMessage = false
        },
      })

      if (!key || (key && key.trim() === '')) {
        break
      }

      const { value } = await prompts({
        type: 'text',
        name: 'value',
        message: '    - VALUE: ',
      })

      Object.assign(obj, {
        [key]: value,
      })
    }

    if (Object.keys(obj).length > 1) {
      return {
        [name]: obj,
      }
    }
  }

  return null
}

const log = (text: string) => {
  // eslint-disable-next-line no-console
  console.log(text)
}

const generateDirsAndFiles = async (projectDir: string, config: Config) => {
  const {
    fixturesFolder,
    integrationFolder,
    pluginsFile,
    screenshotsFolder,
    supportFile,
    video,
    videosFolder,
  } = config

  // fixturesFolder
  if (fixturesFolder !== false) {
    const dir = path.join(
      projectDir,
      fixturesFolder ||
        _.find(optionInfo[2].options, { name: 'fixturesFolder' })!.default
    )

    await fs.ensureDir(dir)
    log(`fixtures folder generated at ${dir}`)
  }

  // integrationFolder
  const integrationDir = path.join(
    projectDir,
    integrationFolder ||
      _.find(optionInfo[2].options, { name: 'integrationFolder' })!.default
  )

  await fs.ensureDir(integrationDir)
  log(`integration folder generated at ${integrationDir}`)

  // pluginsFile
  if (pluginsFile !== false) {
    const file = path.join(
      projectDir,
      pluginsFile ||
        _.find(optionInfo[2].options, { name: 'pluginsFile' })!.default
    )

    await fs.ensureFile(file) // change it to scaffold.js
    log(`plugins file generated at ${file}`)
  }

  // screenshotsDir
  const screenshotsDir = path.join(
    projectDir,
    screenshotsFolder ||
      _.find(optionInfo[2].options, { name: 'screenshotsFolder' })!.default
  )

  await fs.ensureDir(screenshotsDir)
  log(`screenshots folder generated at ${screenshotsDir}`)

  // supportFile
  if (supportFile !== false) {
    const file = path.join(
      projectDir,
      supportFile ||
        _.find(optionInfo[2].options, { name: 'supportFile' })!.default
    )

    await fs.ensureFile(file) // change it to scaffold.js
    log(`support file generated at ${file}`)
  }

  // videosFolder
  if (video !== false) {
    const dir = path.join(
      projectDir,
      videosFolder ||
        _.find(optionInfo[2].options, { name: 'videosFolder' })!.default
    )

    await fs.ensureDir(dir)
    log(`videos folder generated at ${dir}`)
  }
}
