interface GetCode {
  lang: 'js' | 'ts'
  framework: {
    name: string
    configFile: string
  }
  bundler: {
    name: string
    package: string
  }
}

export const getCode = ({ lang, framework, bundler }: GetCode) => {
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
