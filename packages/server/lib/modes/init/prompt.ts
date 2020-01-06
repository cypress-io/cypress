import prompts from 'prompts'

export const prompt = async (options: any) => {
  const { customize } = await prompts({
    type: 'confirm',
    name: 'customize',
    message: 'Customize settings?',
  })

  if (customize) {

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
      { title: 'No', value: 'no' },
      { title: 'Default', value: 'default' },
      { title: 'Chai friendly', value: 'chai-friendly' },
    ],
  })
}
