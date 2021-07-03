import { useStore } from '../store'

export const getCode = (lang: 'js' | 'ts') => {
  const component = useStore().getState().component

  if (!component) {
    return ''
  }

  const framework = component.framework
  const bundler = component.bundler

  const language = languages.find((lg) => lg.id === lang)

  const comments = `Component testing, ${language?.name}, ${framework.name}, ${bundler.name}`

  if (framework.configFile) {
    return `// ${comments}
    
${framework.configFile[lang]}`
  }

  const exportStatement =
    lang === 'js' ? 'module.exports = {' : 'export default {'

  const importStatements =
    lang === 'js'
      ? ''
      : [
          `import { startdevServer } from \'${bundler.package}\'`,
          `import webpackConfig from './webpack.config'`,
          '',
      ].join('\n')

  const requireStatements =
    lang === 'ts'
      ? ''
      : [
          `const { startDevServer } = require('${bundler.package}')`,
          `const webpackConfig = require('./webpack.config')`,
          '',
      ].join('\n  ')

  const startServerReturn = `return startDevServer({ options, webpackConfig })`

  return `// ${comments}
${importStatements}
${exportStatement}
  ${requireStatements}component(on, config) {
    on('dev-server:start', (options) => {
      ${startServerReturn}
    })
  }
}`
}

export const languages: Array<{ id: 'js' | 'ts', name: string }> = [
  {
    id: 'ts',
    name: 'TypeScript',
  },
  {
    id: 'js',
    name: 'JavaScript',
  },
]
