import prompts from 'prompts'

import { optionInfo, defaultValues } from './option_info'
import { Args, InitConfig } from '../types'
import { log } from './fs/log'

/**
 * Generate config object from user-provided option arguments.
 * It doesn't ask questions when an option is given by the arguments.
 *
 * @param args option arguments passed by the user.
 */
export const fromInquiry = async (args: Args) => {
  const projRoot = args.cwd
  const { customize } = await prompts({
    type: 'confirm',
    name: 'customize',
    message: 'Customize settings?',
  })

  let init: Partial<InitConfig> = {}

  if (customize) {
    let obj = await configPrompts(args)

    init.config = obj
  } else {
    init.config = {}
  }

  if (args.typescript === undefined) {
    const { useTypeScript } = await prompts({
      type: 'confirm',
      name: 'useTypeScript',
      message: 'Use TypeScript?',
    })

    init.typescript = useTypeScript
  }

  if (args.example === undefined) {
    const { generateExamples } = await prompts({
      type: 'confirm',
      name: 'generateExamples',
      message: 'Generate examples?',
    })

    init.example = generateExamples
  }

  if (args.eslint === undefined) {
    const { installEslint } = await prompts({
      type: 'confirm',
      name: 'installEslint',
      message: 'Install Eslint rules for Cypress?',
    })

    init.eslint = installEslint
  }

  if (args.chaiFriendly === undefined) {
    const { installChaiFriendly } = await prompts({
      type: 'confirm',
      name: 'installChaiFriendly',
      message: 'Install chai friendly eslint plugin?',
    })

    init.chaiFriendly = installChaiFriendly
  }

  const configStr = JSON.stringify(init.config, null, 2)

  log('')
  log('About to do these things:')
  log(`* Write cypress.json at ${projRoot}`)
  log(configStr)
  log(`* Use TypeScript: ${init.typescript ? 'yes' : 'no'}`)
  log(`* Generate Examples: ${init.example ? 'yes' : 'no'}`)
  log(`* Install Eslint Rules for Cypress: ${init.eslint ? 'yes' : 'no'}`)
  log(`* Install chai friendly eslint plugin: ${init.chaiFriendly ? 'yes' : 'no'}`)

  const { proceed } = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Is it OK?',
  })

  if (!proceed) {
    process.exit(0)
  }

  return init as InitConfig
}

const configPrompts = async (args: Args) => {
  const config = {}

  for (let i = 0; i < optionInfo.length; i++) {
    const option = optionInfo[i]

    // Ask if the user wants to customize the config category.
    const { customizeCategory } = await prompts({
      type: 'confirm',
      name: 'customizeCategory',
      message: ``, // required
      // @ts-ignore
      onRender ({ yellow }) {
        // @ts-ignore
        this.msg = `  Customize ${yellow(`${option.name}`)}?`
      },
    })

    if (customizeCategory) {
      for (let j = 0; j < option.options.length; j++) {
        const { name, type, default: defaultVal, description } = option.options[j]

        if (skipPrompts(name, args)) {
          continue
        }

        if (type === 'text' || type === 'number') {
          const defaultValue = () => {
            if (defaultVal === null) {
              return 'null'
            }

            return defaultVal as string | number | boolean
          }

          const result = await prompts({
            type,
            name,
            initial: defaultValue(),
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

/**
 * Skip prompts when the value is set by arguments.
 */
const skipPrompts = (name: string, args: Args) => {
  return ((name === 'fixturesFolder') &&
    ((args.fixtures === false) ||
      (args.fixturesPath && args.fixturesPath !== defaultValues['fixturesFolder']))) ||
    ((name === 'supportFile') &&
      (args.support === false) ||
        (args.supportPath && args.supportPath !== defaultValues['supportFile'])) ||
    ((name === 'integrationFolder') &&
      args.integrationPath && args.integrationPath !== defaultValues['integrationFolder']) ||
    ((name === 'pluginsFile') &&
      (args.plugins === false) ||
        (args.pluginsPath && args.pluginsPath !== defaultValues['pluginsFile'])) ||
    ((name === 'video') && args.video === false)
}

const objectPrompt = async (option) => {
  const { name, description } = option

  const { addObject } = await prompts({
    type: 'confirm',
    name: 'addObject',
    message: '', // required
    // @ts-ignore
    onRender ({ underline, reset }) {
      // @ts-ignore
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
