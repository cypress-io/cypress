import prompts from 'prompts'
import { optionInfo } from './options'

export const prompt = async (options: any) => {
  const { customize } = await prompts({
    type: 'confirm',
    name: 'customize',
    message: 'Customize settings?',
  })

  let config = {}

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

  const { installEslint } = await prompts({
    type: 'select',
    name: 'installEslint',
    message: 'Install Eslint?',
    choices: [
      { title: 'Default', value: 'default' },
      { title: 'No', value: 'no' },
      { title: 'Chai friendly', value: 'chai-friendly' },
    ],
  })
}

const configPrompts = async (optionInfo) => {
  const config = {}

  for (let i = 0; i < optionInfo.length; i++) {
    const option = optionInfo[i]
    const { customizeCategory } = await prompts({
      type: 'confirm',
      name: 'customizeCategory',
      message: ``, // required
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
